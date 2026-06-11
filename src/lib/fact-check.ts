import 'server-only';
import crypto from 'crypto';
import { callClaude, CLAUDE_MODEL } from './anthropic';
import { searchExa } from './exa';
import { extractArticleText } from './embeddings';
import { extractJsonObject } from './draft-pipeline';
import { writeClient } from './sanity';

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

/** Strip tracking noise so the same source under two URLs dedupes to one. */
function normalizeUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    url.hash = '';
    url.hostname = url.hostname.toLowerCase();
    for (const key of [...url.searchParams.keys()]) {
      if (key.startsWith('utm_')) url.searchParams.delete(key);
    }
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

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

async function extractClaims(article: FactCheckArticle, today: string): Promise<ExtractedClaim[]> {
  const cap = CLAIM_CAPS[article.intelligenceTier ?? '']
    ?? (article.contentType === 'deepdive' ? CLAIM_CAPS.audit : DEFAULT_CLAIM_CAP);
  const text = extractArticleText(article).slice(0, ARTICLE_TEXT_CHARS);

  const system = `You are a forensic fact-check assistant for Silicon & Stone, an intelligence publication whose brand depends on absolute factual accuracy. You extract discrete, externally verifiable factual claims from articles so each can be independently checked against primary sources on the web.

Extract ONLY claims that are checkable against external sources: statistics and figures, dates and time scales, direct quotes, named events, regulatory or legal facts, and concrete attributions ("X said/announced/fined Y"). Skip opinion, analysis, predictions, and the publication's own framing.

Respond with a single JSON object only — no prose, no code fences:
{"claims": [{"claim": "<the factual claim, self-contained>", "locationHint": "<short verbatim fragment copied from the article text where the claim appears>", "searchQuery": "<the best web search query to find a PRIMARY source for this claim>"}]}

Order claims by how damaging they would be if wrong. Return at most ${cap} claims. If the article contains no checkable claims, return {"claims": []}.`;

  const user = `Today's date is ${today}. Extract the checkable factual claims from this article:\n\n---\n${text}\n---`;

  const raw = await callClaude(system, user, 0.2, 4096);
  const parsed = JSON.parse(extractJsonObject(raw)) as { claims?: unknown };
  if (!Array.isArray(parsed.claims)) {
    throw new Error('Claim extraction returned an unexpected payload (missing claims array).');
  }
  return parsed.claims
    .filter((c): c is Record<string, unknown> => !!c && typeof c === 'object')
    .map((c) => ({
      claim: typeof c.claim === 'string' ? c.claim.trim() : '',
      locationHint: typeof c.locationHint === 'string' ? c.locationHint.trim() : '',
      searchQuery: typeof c.searchQuery === 'string' ? c.searchQuery.trim() : '',
    }))
    .filter((c) => c.claim && c.searchQuery)
    .slice(0, cap);
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

Respond with a single JSON object only — no prose, no code fences:
{"results": [{"claim_index": <number>, "verdict": "<verdict>", "confidence": "high"|"medium"|"low", "evidence": "<1-3 sentence justification citing the specific evidence>", "sourceUrls": ["<urls of the evidence items you relied on>"], "suggestedRevision": "<corrected or better-explained wording — ONLY when verdict is not accurate, otherwise omit>", "suggestedCitations": [{"title": "<source title>", "url": "<url>", "publisher": "<organisation>"}]}]}

suggestedCitations: include only PRIMARY sources (official filings, regulators, original reporting) that genuinely support the claim — usually 0 or 1 per claim. Return one result per claim, in order.`;

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
  const parsed = JSON.parse(extractJsonObject(raw)) as { results?: unknown };
  if (!Array.isArray(parsed.results)) {
    throw new Error('Verification returned an unexpected payload (missing results array).');
  }

  return batch.map(({ claim }, i) => {
    const row = (parsed.results as Record<string, unknown>[]).find(
      (r) => !!r && typeof r === 'object' && r.claim_index === i,
    );
    if (!row) return unverifiableResult(claim, 'The verifier returned no result for this claim.');
    const suggestedCitations = Array.isArray(row.suggestedCitations)
      ? (row.suggestedCitations as Record<string, unknown>[])
          .filter((c) => !!c && typeof c.url === 'string' && typeof c.title === 'string')
          .map((c) => ({
            title: (c.title as string).trim(),
            url: (c.url as string).trim(),
            publisher: typeof c.publisher === 'string' ? c.publisher.trim() : undefined,
          }))
      : [];
    return {
      claim: claim.claim,
      locationHint: claim.locationHint,
      verdict: asVerdict(row.verdict),
      confidence: asConfidence(row.confidence),
      evidence: typeof row.evidence === 'string' ? row.evidence.trim() : '',
      sourceUrls: Array.isArray(row.sourceUrls)
        ? (row.sourceUrls as unknown[]).filter((u): u is string => typeof u === 'string').slice(0, 5)
        : [],
      suggestedRevision:
        typeof row.suggestedRevision === 'string' && row.suggestedRevision.trim()
          ? row.suggestedRevision.trim()
          : undefined,
      suggestedCitations,
    };
  });
}

function overallVerdict(results: ClaimResult[]): 'clean' | 'minor-issues' | 'major-issues' | 'unverifiable' {
  if (results.some((r) => r.verdict === 'inaccurate')) return 'major-issues';
  if (results.some((r) => r.verdict === 'outdated' || r.verdict === 'needs-context')) return 'minor-issues';
  const unverifiable = results.filter((r) => r.verdict === 'unverifiable').length;
  if (results.length > 0 && unverifiable > results.length / 2) return 'unverifiable';
  return 'clean';
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
 * as `citation` array members ready to append.
 */
function buildNewCitations(
  results: ClaimResult[],
  existing: { url?: string }[],
): { _type: 'citation'; _key: string; title: string; url: string; publisher?: string }[] {
  const seen = new Set(
    existing.map((c) => (c.url ? normalizeUrl(c.url) : null)).filter((u): u is string => !!u),
  );
  const out: { _type: 'citation'; _key: string; title: string; url: string; publisher?: string }[] = [];
  for (const result of results) {
    for (const citation of result.suggestedCitations) {
      const normalized = normalizeUrl(citation.url);
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      out.push({
        _type: 'citation',
        _key: newKey(),
        title: citation.title,
        url: citation.url,
        ...(citation.publisher ? { publisher: citation.publisher } : {}),
      });
    }
  }
  return out;
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
