import 'server-only';
import crypto from 'crypto';
import { callClaude, CLAUDE_MODEL } from './anthropic';
import { searchExa } from './exa';
import { extractArticleText } from './embeddings';
import { writeClient } from './sanity';
import { buildCitationMembers, type CitationMember } from './citations';
import { verdictFor, type FactCheckVerdict } from './fact-check-verdict';

/**
 * On-demand fact-check pipeline, triggered from the Studio "Run fact-check"
 * document action via /api/fact-check.
 *
 * Extracts discrete checkable claims from an article with Claude, verifies
 * each against fresh Exa web searches of primary sources, and patches a
 * structured report onto the document's `factCheck` field. Advisory only —
 * it never edits the body. As a side effect it appends any newly discovered
 * primary-source citations to `citations[]` (deduplicated by URL).
 */

const VERDICTS = ['accurate', 'inaccurate', 'outdated', 'needs-context', 'unverifiable'] as const;
type Verdict = (typeof VERDICTS)[number];

const CONFIDENCES = ['high', 'medium', 'low'] as const;
type Confidence = (typeof CONFIDENCES)[number];

/** Claim caps per intelligence tier — bounds both runtime and Exa spend. */
const CLAIM_CAPS: Record<string, number> = {
  pulse: 8,
  briefing: 12,
  audit: 18,
};
const DEFAULT_CLAIM_CAP = 12;

/** Verification batching: 5 claims per Claude call, 2 calls in flight. */
const VERIFY_BATCH_SIZE = 5;
const VERIFY_CONCURRENCY = 2;
const EXA_CONCURRENCY = 4;
const EXA_RESULTS_PER_CLAIM = 5;
const EVIDENCE_TEXT_CHARS = 1500;
const ARTICLE_TEXT_CHARS = 30_000;

interface ExtractedClaim {
  claim: string;
  locationHint: string;
  originalText: string;
  searchQuery: string;
}

interface EvidenceItem {
  title: string;
  url: string;
  publishedDate?: string;
  snippet: string;
}

interface SuggestedCitation {
  title: string;
  url: string;
  publisher?: string;
}

interface ClaimResult {
  claim: string;
  locationHint: string;
  originalText: string;
  verdict: Verdict;
  confidence: Confidence;
  evidence: string;
  sourceUrls: string[];
  suggestedRevision?: string;
  suggestedCitations: SuggestedCitation[];
}

interface FactCheckArticle {
  _id: string;
  _type: string;
  title?: string;
  stoneTruth?: string;
  excerpt?: string;
  body?: Parameters<typeof extractArticleText>[0]['body'];
  actionableInsights?: string[];
  methodologyPillars?: string[];
  contentType?: string;
  intelligenceTier?: string;
  citations?: { url?: string }[];
  factCheck?: { status?: string; requestedAt?: string };
}

const ARTICLE_PROJECTION = `{
  _id, _type, title, stoneTruth, excerpt, body,
  actionableInsights, methodologyPillars,
  contentType, intelligenceTier, citations, factCheck
}`;

/**
 * Resolve which document variant a fact-check should run against. If a draft
 * exists we check and patch the draft (the editor sees it where they work);
 * otherwise we patch the published doc directly — the report and citations
 * are metadata, so this never republishes prose.
 */
export async function resolveFactCheckTarget(
  documentId: string,
): Promise<{ targetId: string; article: FactCheckArticle } | null> {
  const baseId = documentId.replace(/^drafts\./, '');
  const draftId = `drafts.${baseId}`;
  // perspective: 'raw' — on recent apiVersions the client defaults to the
  // 'published' perspective, which would hide the drafts.* variant entirely.
  const docs: FactCheckArticle[] = await writeClient.fetch(
    `*[_id in [$draftId, $baseId] && _type == "article"] ${ARTICLE_PROJECTION}`,
    { draftId, baseId },
    { perspective: 'raw' },
  );
  const article = docs.find((d) => d._id === draftId) ?? docs.find((d) => d._id === baseId);
  return article ? { targetId: article._id, article } : null;
}

function newKey(): string {
  return crypto.randomUUID().slice(0, 8);
}

// normalizeUrl and the citation-member shaping moved to src/lib/citations.ts.
// Three writers now touch the Sources list at different times and they must
// agree on when two URLs are the same source, or this pass will duplicate a
// source an editor already promoted from the research snapshots.

/** Small concurrency pool — keeps Exa/Claude fan-out bounded without a dependency. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) || 1 }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

function asVerdict(value: unknown): Verdict {
  return VERDICTS.includes(value as Verdict) ? (value as Verdict) : 'unverifiable';
}

function asConfidence(value: unknown): Confidence {
  return CONFIDENCES.includes(value as Confidence) ? (value as Confidence) : 'low';
}

/**
 * Split one `===MARKER===` block into its `KEY: value` fields.
 *
 * A key may repeat (several CITATION lines) and a value may wrap across lines
 * (a verbatim sentence), so each occurrence starts a new entry and any
 * unprefixed line continues the entry it follows.
 */
function parseFields(chunk: string, field: RegExp): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  let current: string | null = null;

  for (const line of chunk.split('\n')) {
    const match = field.exec(line);
    if (match) {
      current = match[1];
      (out[current] ??= []).push(line.slice(match[0].length));
    } else if (current && out[current]?.length) {
      out[current][out[current].length - 1] += `\n${line}`;
    }
  }
  return out;
}

/** Blocks introduced by `marker`, each parsed into its fields. */
function parseBlocks(raw: string, marker: RegExp, field: RegExp): Record<string, string[]>[] {
  return raw.split(marker).slice(1).map((chunk) => parseFields(chunk, field));
}

const CLAIM_BLOCK = /^===CLAIM===\s*$/m;
const CLAIM_FIELD = /^(CLAIM|LOCATION|ORIGINAL|QUERY):\s?/;

/**
 * Delimiter-based claim extraction (NOT JSON), for the reason
 * `buildVoiceEditPrompt` already documents about the voice pass.
 *
 * The prompt asks for `originalText` copied EXACTLY verbatim, because it is
 * used for find-and-replace. On this publication the copied sentence routinely
 * quotes statute, so it contains its own double quotation marks — which the
 * model then emitted unescaped inside a JSON string value:
 *
 *   "locationHint": "Under Article 26(7), deployers who are employers "shall
 *    inform workers' representatives…
 *
 * The string terminates at that inner quote and `JSON.parse` dies on the next
 * word. Observed three times on one article at three different offsets (3184,
 * 2892, 3157), so it is content-dependent rather than truncation, and a retry
 * does not fix it. There is no escaping problem in a line-prefixed format, so
 * this asks for one. Keep it that way: the articles most likely to break JSON
 * are the statute-quoting ones that most need checking.
 */
export function parseExtractedClaims(raw: string, cap: number): ExtractedClaim[] {
  return parseBlocks(raw, CLAIM_BLOCK, CLAIM_FIELD)
    .map((fields) => {
      const read = (key: string) => (fields[key]?.[0] ?? '').trim();
      return {
        claim: read('CLAIM'),
        locationHint: read('LOCATION'),
        originalText: read('ORIGINAL'),
        searchQuery: read('QUERY'),
      };
    })
    .filter((c) => c.claim && c.searchQuery)
    .slice(0, cap);
}

async function extractClaims(article: FactCheckArticle, today: string): Promise<ExtractedClaim[]> {
  const cap = CLAIM_CAPS[article.intelligenceTier ?? '']
    ?? (article.contentType === 'deepdive' ? CLAIM_CAPS.audit : DEFAULT_CLAIM_CAP);
  const text = extractArticleText(article).slice(0, ARTICLE_TEXT_CHARS);

  const system = `You are a forensic fact-check assistant for Silicon & Stone, an intelligence publication whose brand depends on absolute factual accuracy. You extract discrete, externally verifiable factual claims from articles so each can be independently checked against primary sources on the web.

Extract ONLY claims that are checkable against external sources: statistics and figures, dates and time scales, direct quotes, named events, regulatory or legal facts, and concrete attributions ("X said/announced/fined Y"). Skip opinion, analysis, predictions, and the publication's own framing.

Return plain text only — no JSON, no code fences. Repeat this block once per claim, with the marker line verbatim on its own line:

===CLAIM===
CLAIM: the factual claim, self-contained, on one line
LOCATION: a short verbatim fragment copied from the article where the claim appears
ORIGINAL: the COMPLETE sentence(s) containing this claim, copied EXACTLY verbatim from the article text — this is used for find-and-replace, so it must match character-for-character. Quotation marks, em-dashes and apostrophes are copied as they appear; nothing needs escaping.
QUERY: the best web search query to find a PRIMARY source for this claim

Order claims by how damaging they would be if wrong. Return at most ${cap} blocks. If the article contains no checkable claims, return nothing at all.`;

  const user = `Today's date is ${today}. Extract the checkable factual claims from this article:\n\n---\n${text}\n---`;

  const raw = await callClaude(system, user, 0.2, 4096);

  // No ===CLAIM=== marker at all is ambiguous between "nothing checkable here"
  // and "the model ignored the contract". Treat a substantial response with no
  // markers as the latter, so a broken extraction never reads as a clean article.
  if (!raw.includes('===CLAIM===')) {
    if (raw.trim().length > 200) {
      throw new Error(
        'The fact-checker could not read its own output — it did not use the expected format. Run the fact-check again.',
      );
    }
    return [];
  }

  return parseExtractedClaims(raw, cap);
}

async function gatherEvidence(claims: ExtractedClaim[]): Promise<(EvidenceItem[] | null)[]> {
  return mapWithConcurrency(claims, EXA_CONCURRENCY, async (claim) => {
    // recencyDays: null — primary sources (filings, regulations, original
    // reports) are routinely older than the default 90-day search window.
    const results = await searchExa(claim.searchQuery, {
      recencyDays: null,
      numResults: EXA_RESULTS_PER_CLAIM,
    });
    if (!results) return null;
    return results.slice(0, EXA_RESULTS_PER_CLAIM).map((r) => ({
      title: r.title ?? '',
      url: r.url ?? '',
      publishedDate: (r as { publishedDate?: string }).publishedDate,
      snippet: [
        ...((r as { highlights?: string[] }).highlights ?? []),
        ((r as { text?: string }).text ?? '').slice(0, EVIDENCE_TEXT_CHARS),
      ]
        .filter(Boolean)
        .join('\n')
        .slice(0, EVIDENCE_TEXT_CHARS),
    }));
  });
}

function unverifiableResult(claim: ExtractedClaim, reason: string): ClaimResult {
  return {
    claim: claim.claim,
    locationHint: claim.locationHint,
    originalText: claim.originalText,
    verdict: 'unverifiable',
    confidence: 'low',
    evidence: reason,
    sourceUrls: [],
    suggestedCitations: [],
  };
}

async function verifyBatch(
  batch: { claim: ExtractedClaim; evidence: EvidenceItem[] }[],
  today: string,
): Promise<ClaimResult[]> {
  const system = `You are a forensic fact-check verifier for Silicon & Stone. For each claim you receive the original claim plus fresh web search results. Judge each claim ONLY on the supplied evidence — do not rely on your own memory of facts. Today's date is ${today}; use it to judge whether figures or time scales are outdated.

Verdicts: "accurate" (evidence confirms it), "inaccurate" (evidence contradicts it), "outdated" (was true, evidence shows newer figures/events supersede it), "needs-context" (true but misleading as stated — could be better explained), "unverifiable" (evidence neither confirms nor refutes).

Return plain text only — no JSON, no code fences. Repeat this block once per claim, in order, with the marker line verbatim on its own line:

===RESULT===
INDEX: the claim number you were given
VERDICT: one of accurate | inaccurate | outdated | needs-context | unverifiable
CONFIDENCE: high | medium | low
EVIDENCE: 1-3 sentence justification citing the specific evidence
SOURCE: url of an evidence item you relied on (repeat this line per url, or omit)
REVISION: corrected or better-explained wording — ONLY when the verdict is not accurate, otherwise omit the line
CITATION: title | url | publisher (repeat per citation, or omit)

Quotation marks, em-dashes and apostrophes are written as they appear; nothing needs escaping.

CITATION: ONLY when the verdict is "accurate", and only PRIMARY sources (official filings, regulators, institutional publications, original named reporting — never blogs, vendor content, or aggregators) that genuinely support the claim — usually 0 or 1 per claim. Claims that are not accurate must have no CITATION line.`;

  const user = batch
    .map(({ claim, evidence }, i) => {
      const evidenceBlock = evidence.length
        ? evidence
            .map(
              (e, j) =>
                `  [${j + 1}] ${e.title}\n      URL: ${e.url}\n      Published: ${e.publishedDate ?? 'unknown'}\n      ${e.snippet.replace(/\n/g, '\n      ')}`,
            )
            .join('\n')
        : '  (no search results found)';
      return `CLAIM ${i}: ${claim.claim}\nEVIDENCE:\n${evidenceBlock}`;
    })
    .join('\n\n');

  const raw = await callClaude(system, user, 0.2, 4096);
  const rows = parseVerificationResults(raw);
  if (rows.length === 0) {
    throw new Error('Verification returned no readable results.');
  }

  return batch.map(({ claim }, i) => {
    const row = rows.find((r) => r.index === i);
    if (!row) return unverifiableResult(claim, 'The verifier returned no result for this claim.');
    return {
      claim: claim.claim,
      locationHint: claim.locationHint,
      originalText: claim.originalText,
      verdict: asVerdict(row.verdict),
      confidence: asConfidence(row.confidence),
      evidence: row.evidence,
      sourceUrls: row.sourceUrls.slice(0, 5),
      suggestedRevision: row.suggestedRevision,
      suggestedCitations: row.suggestedCitations,
    };
  });
}

const RESULT_BLOCK = /^===RESULT===\s*$/m;
const RESULT_FIELD = /^(INDEX|VERDICT|CONFIDENCE|EVIDENCE|SOURCE|REVISION|CITATION):\s?/;

export type ParsedVerification = {
  index: number;
  verdict: string;
  confidence: string;
  evidence: string;
  sourceUrls: string[];
  suggestedRevision?: string;
  suggestedCitations: { title: string; url: string; publisher?: string }[];
};

/** See `parseExtractedClaims` for why this is not JSON. */
export function parseVerificationResults(raw: string): ParsedVerification[] {
  const out: ParsedVerification[] = [];

  for (const fields of parseBlocks(raw, RESULT_BLOCK, RESULT_FIELD)) {
    const first = (key: string) => (fields[key]?.[0] ?? '').trim();
    const index = Number.parseInt(first('INDEX'), 10);
    if (!Number.isInteger(index)) continue;

    const revision = first('REVISION');
    out.push({
      index,
      verdict: first('VERDICT').toLowerCase(),
      confidence: first('CONFIDENCE').toLowerCase(),
      evidence: first('EVIDENCE'),
      sourceUrls: (fields.SOURCE ?? []).map((u) => u.trim()).filter(Boolean),
      suggestedRevision: revision || undefined,
      // `title | url | publisher`; the url is the only part worth failing over.
      suggestedCitations: (fields.CITATION ?? [])
        .map((line) => line.split('|').map((part) => part.trim()))
        .filter((parts) => parts.length >= 2 && parts[0] && parts[1])
        .map(([title, url, publisher]) => ({ title, url, publisher: publisher || undefined })),
    });
  }

  return out;
}

/**
 * Precedence lives in `fact-check-verdict.ts`, which the Studio badge and the
 * publish dialog also read — a fresh run and a re-read of the same claims must
 * not be able to disagree.
 */
function overallVerdict(results: ClaimResult[]): FactCheckVerdict {
  return verdictFor(results);
}

function buildSummary(results: ClaimResult[], verdict: string): string {
  if (!results.length) return 'No externally checkable claims were found in this article.';
  const count = (v: Verdict) => results.filter((r) => r.verdict === v).length;
  const parts = [
    `${results.length} claims checked`,
    `${count('accurate')} accurate`,
    count('inaccurate') ? `${count('inaccurate')} inaccurate` : null,
    count('outdated') ? `${count('outdated')} outdated` : null,
    count('needs-context') ? `${count('needs-context')} need context` : null,
    count('unverifiable') ? `${count('unverifiable')} unverifiable` : null,
  ].filter(Boolean);
  const action =
    verdict === 'clean'
      ? 'No action needed.'
      : 'Review the flagged claims below and apply suggested revisions manually before publishing.';
  return `${parts.join(', ')}. ${action}`;
}

/**
 * Collect citation suggestions across claims, dedupe by normalized URL —
 * internally and against the document's current citations — and shape them
 * as `citation` array members ready to append. Only claims that verified
 * ACCURATE contribute: appending sources that refuted a claim would put the
 * refuting evidence on the live Sources list while the wrong claim still
 * stands in the body. Editors can pull URLs for flagged claims from each
 * claim's sourceUrls when applying the suggested revision.
 */
function buildNewCitations(
  results: ClaimResult[],
  existing: { url?: string }[],
): CitationMember[] {
  const candidates = results
    .filter((r) => r.verdict === 'accurate')
    .flatMap((r) => r.suggestedCitations);
  return buildCitationMembers(candidates, existing, newKey);
}

/**
 * Run the full fact-check against an already-resolved target document id.
 * Never throws: any failure patches `factCheck.status = 'failed'` so the
 * document is never stuck on 'running'.
 */
export async function runFactCheck(targetId: string, requestedAt: string): Promise<void> {
  try {
    const article: FactCheckArticle | null = await writeClient.fetch(
      `*[_id == $id][0] ${ARTICLE_PROJECTION}`,
      { id: targetId },
      { perspective: 'raw' },
    );
    if (!article) throw new Error(`Document ${targetId} disappeared before fact-check ran.`);

    const today = new Date().toISOString().slice(0, 10);
    const claims = await extractClaims(article, today);

    let results: ClaimResult[] = [];
    if (claims.length) {
      const evidence = await gatherEvidence(claims);

      // Claims with no evidence (Exa down or keyless) degrade to unverifiable
      // instead of failing the run; the rest proceed to verification.
      const verifiable: { claim: ExtractedClaim; evidence: EvidenceItem[]; index: number }[] = [];
      const placed: (ClaimResult | null)[] = claims.map((claim, i) => {
        if (!evidence[i]) {
          return unverifiableResult(claim, 'Web search was unavailable for this claim.');
        }
        verifiable.push({ claim, evidence: evidence[i]!, index: i });
        return null;
      });

      const batches: (typeof verifiable)[] = [];
      for (let i = 0; i < verifiable.length; i += VERIFY_BATCH_SIZE) {
        batches.push(verifiable.slice(i, i + VERIFY_BATCH_SIZE));
      }
      const batchResults = await mapWithConcurrency(batches, VERIFY_CONCURRENCY, async (batch) => {
        try {
          return await verifyBatch(batch, today);
        } catch (error) {
          // A single unparseable verification response downgrades its batch
          // rather than aborting the whole run.
          console.error('Fact-check verification batch failed:', error);
          return batch.map(({ claim }) =>
            unverifiableResult(claim, 'The verification response could not be parsed.'),
          );
        }
      });
      batches.forEach((batch, b) => {
        batch.forEach(({ index }, j) => {
          placed[index] = batchResults[b][j];
        });
      });
      results = placed.filter((r): r is ClaimResult => !!r);
    }

    const verdict = overallVerdict(results);
    const count = (v: Verdict) => results.filter((r) => r.verdict === v).length;
    const report = {
      status: 'completed',
      requestedAt,
      completedAt: new Date().toISOString(),
      model: CLAUDE_MODEL,
      overallVerdict: verdict,
      summary: buildSummary(results, verdict),
      counts: {
        total: results.length,
        accurate: count('accurate'),
        inaccurate: count('inaccurate'),
        outdated: count('outdated'),
        needsContext: count('needs-context'),
        unverifiable: count('unverifiable'),
      },
      claims: results.map((r) => ({
        _type: 'claimCheck',
        _key: newKey(),
        claim: r.claim,
        locationHint: r.locationHint,
        ...(r.originalText ? { originalText: r.originalText } : {}),
        verdict: r.verdict,
        confidence: r.confidence,
        evidence: r.evidence,
        sourceUrls: r.sourceUrls,
        ...(r.suggestedRevision ? { suggestedRevision: r.suggestedRevision } : {}),
      })),
    };

    // Re-fetch citations right before patching to shrink the window where a
    // concurrent manual citation edit could be double-added.
    const current: { citations?: { url?: string }[] } | null = await writeClient.fetch(
      `*[_id == $id][0]{ citations }`,
      { id: targetId },
      { perspective: 'raw' },
    );
    const newCitations = buildNewCitations(results, current?.citations ?? []);

    let patch = writeClient.patch(targetId).set({ factCheck: report });
    if (newCitations.length) {
      patch = patch.setIfMissing({ citations: [] }).append('citations', newCitations);
    }
    await patch.commit();
  } catch (error) {
    console.error('Fact-check run failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    try {
      await writeClient
        .patch(targetId)
        .set({
          factCheck: {
            status: 'failed',
            requestedAt,
            completedAt: new Date().toISOString(),
            error: message,
          },
        })
        .commit();
    } catch (patchError) {
      console.error('Fact-check failed and the failure could not be recorded:', patchError);
    }
  }
}
