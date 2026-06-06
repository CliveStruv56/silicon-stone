import { getVoiceDNA, getBusinessProfile, getContentFocus } from "./api";
import { getSanityPersona } from "./sanity";
import { callClaude } from "./anthropic";
import { logErrorToFile } from "./debug";
import type { VoiceDNA } from "@/types/context";

/**
 * The five canonical Silicon & Stone draft formats. `research` is a separate
 * mode in the UI (gather intel without drafting) so it never reaches here.
 */
export type DraftFormat = 'pulse' | 'signal' | 'deep_dive' | 'guide' | 'youtube';

export interface DraftResearch {
    summary: string;
    sources: { title: string; url: string; snippet: string }[];
    painPoints: string[];
    keywords: string[];
}

export interface DraftPromptInput {
    topic: string;
    personaKey: string;
    format: DraftFormat;
    /** Forensic research synthesised upstream (Exa / Inoreader via /research). */
    research?: DraftResearch;
    /** Pre-formatted "prior coverage" lines from the Pinecone article index. */
    priorCoverage?: string;
    /** Full Exa Research Pro report, for Deep Dives — handed to the writer verbatim. */
    deepReport?: string;
    /**
     * Externally-written article to rework into the S&S voice + format (the
     * `/import` flow). When set, the prompt switches from "draft on research"
     * to "rework this source" — preserve its facts, rewrite the prose.
     */
    sourceMaterial?: string;
}

/**
 * Unified draft prompt builder for every authoring route. Produces the
 * data-driven brand/voice/persona system prompt (shared by all formats) plus a
 * format-specific user prompt that carries whatever inputs the route provides:
 * forensic research, prior coverage and the full forensic report (/create), or
 * a source article to rework (/import). Replaces the old direct-prompt
 * `buildPrompt()` and the inline prompts that used to live in /create.
 */
export async function buildDraftPrompt(
    input: DraftPromptInput,
): Promise<{ systemPrompt: string; userPrompt: string }> {
    const { topic, personaKey, format, research, priorCoverage, deepReport, sourceMaterial } = input;

    const [persona, voice, profile, contentFocus] = await Promise.all([
        getSanityPersona(personaKey),
        getVoiceDNA(),
        getBusinessProfile(),
        getContentFocus(),
    ]);

    if (!persona) throw new Error(`Persona ${personaKey} not found in Sanity`);

    const currentYear = new Date().getFullYear();

    const systemPrompt = `You are "Silicon & Stone", a forensic technopolitical analyst.
Your mission: ${profile.positioning.unique_angle}.
Your voice: ${voice.personality.traits.join(", ")}.
Keywords: ${voice.vocabulary.keywords_2026.join(", ")}.

NEVER use hype words: ${voice.voice_boundaries.never_uses_phrases.join(", ")}.
ALWAYS be: ${voice.emotional_range.primary_emotions.join(", ")}.

You are writing for: ${persona.role} (${persona.name}).
Their pain point: ${persona.painPoints}.
They need: ${persona.contentNeeds.join(", ")}.

Current Content Focus Areas:
${contentFocus}

IMPORTANT: The current year is ${currentYear}. Always use ${currentYear} for any date references or copyright notices.

${sourceMaterial
    ? `You will be given a source article written outside the system. Rework it COMPLETELY into the Silicon & Stone voice and the structure below: preserve every fact, figure, date and the analytical substance, but rewrite the prose entirely — do not keep the original author's phrasing. Do not invent claims the source does not support.`
    : `You will be given forensic research (and possibly prior coverage from your own knowledge base). Build the piece on that research: preserve its specific figures, dates, named entities and source URLs. Do not invent facts beyond what the research supports; where it is thin, say so rather than guessing.`}

Output ONLY a single valid JSON object and NOTHING ELSE — no markdown fences, no preamble:
{
  "title": "A compelling, forensic title",
  "excerpt": "A short, punchy 2-sentence summary",
  "content": "The full piece in markdown, following the structure in the task",
  "keywords": ["keyword1", "keyword2"]
}`;

    const researchBlock = research
        ? `
=== RESEARCH SUMMARY ===
${research.summary}

=== SOURCES ===
${research.sources.map((s) => `- ${s.title}: ${s.snippet} (${s.url})`).join('\n')}

=== PAIN POINTS & KEYWORDS ===
${[...research.painPoints, ...research.keywords].join(', ')}
`
        : '';

    const deepReportBlock = (format === 'deep_dive' && deepReport)
        ? `
=== FULL FORENSIC RESEARCH REPORT (primary material — build the Deep Dive on this; preserve its figures, dates and sources) ===
${deepReport}
`
        : '';

    const priorCoverageBlock = priorCoverage ? `\n${priorCoverage}\n` : '';

    const sourceBlock = sourceMaterial
        ? `
=== SOURCE ARTICLE TO REWORK ===
${sourceMaterial}
=== END SOURCE ARTICLE ===
`
        : '';

    const task = getFormatTask(format, persona, voice);

    const userPrompt = `=== TOPIC ===
${topic}
${researchBlock}${deepReportBlock}${priorCoverageBlock}${sourceBlock}
=== YOUR TASK ===
${task}`;

    return { systemPrompt, userPrompt };
}

type SanityPersona = NonNullable<Awaited<ReturnType<typeof getSanityPersona>>>;

/** Format-specific structure templates for the "content" field of the draft. */
function getFormatTask(format: DraftFormat, persona: SanityPersona, voice: VoiceDNA): string {
    switch (format) {
        case 'pulse':
            return `Write a "Pulse" intelligence scan (100–140 words) for ${persona.role}.
The "content" must be a genuine 30-second scan — state what shifted, why it matters, and one watchpoint only. Do not expand it into a briefing.

Markdown structure for "content":
# [Headline: Specific and factual]

**Stone Truth:** [One sentence stating the structural implication.]

## What Shifted
[Two short sentences stating the verified development.]

## Why It Matters
[Two short sentences directed to ${persona.role}s.]

## Watch Next
[One precise indicator or deadline to monitor.]

Tone: Clinical, concise, actionable.`;

        case 'signal':
            return `Write a "Signal" analysis piece (800–1,200 words) for ${persona.role}.
Goal: "What just happened and what does it actually mean?"

Markdown structure for "content":
# [Headline: Specific & Urgent]

**Executive Summary**: 3 bullet points on why this matters to ${persona.role}s.

## The Signal
What actually happened? (Facts, not hype).

## The Noise
What is the mainstream getting wrong? (Cut through the hype).

## Forensic Analysis
Apply the "Silicon vs Stone" lens.
- Silicon aspect: (Tech/Code speed)
- Stone aspect: (Regulation/Geography/Sovereignty friction)

## Strategic Implication
Three specific impacts on ${persona.organizationTypes?.[0] || 'their industry'}:
1. [Impact 1]
2. [Impact 2]
3. [Impact 3]

## The Long View
Conclusion. Use a closer like: ${voice.signature_phrases.closer_phrases.join(" | ")}.

Tone: Clinical, urgent, actionable.`;

        case 'deep_dive':
            return `Write a "Deep Dive" forensic report (3,000+ words) — the definitive reference on this topic for ${persona.role}.
When a full forensic research report is provided above, build on it verbatim: preserve its figures, dates and sources.

Markdown structure for "content":
# [Headline: Comprehensive & Authoritative]

> **Forensic Summary**: A 150-word abstract of the analysis.

## 1. The Context
Set the geopolitical and technological stage. Mention "Atlantic Drift" if relevant.

## 2. The Mechanics (Silicon)
How the technology actually works (no fluff).

## 3. The Constraints (Stone)
The regulatory, physical, or geopolitical limits.

## 4. Scenario Analysis
Run 3 scenarios for the next 24 months:
- Best Case
- Base Case (Most likely)
- Risk Case (Black Swan)

## 5. Action Plan for ${persona.role}
Specific, operational steps they should take now.

## References
Cite key regulations (e.g. AI Act Articles), the sources above, or specific technologies.

Tone: Academic but accessible. "The Adult in the Room".`;

        case 'guide':
            return `Write a "Guide" (500–2,000 words) that teaches ${persona.role} how to apply a specific tool or technique relevant to this topic. Practical and operational, not theoretical.

Markdown structure for "content":
# [Headline: A clear, outcome-oriented "how to" title]

> **What you'll get:** One sentence on the concrete outcome of following this guide.

## Why This Matters
Two or three sentences connecting the technique to ${persona.role}'s pain point.

## Before You Start
Prerequisites, data, or access needed.

## Step-by-Step
Numbered, concrete steps. Each step states the action and the expected result.

## Common Pitfalls
2–4 mistakes to avoid, drawn from the research.

## Next Steps
Where to go deeper, or how this links to a Silicon & Stone interactive tool.

Tone: Clinical, practical, no hype.`;

        case 'youtube':
            return `Write a YouTube Script Outline for a 12–18 minute video, synthesising the research into the "Tiered Intelligence" format. The presenter is "Clive". Treat the viewer as an intelligent adult who lacks time, not intelligence.
Use a YouTube title (under 70 characters) as "title" and a 2-sentence video description as "excerpt".

Markdown structure for "content":

## 1. The Pulse (0:00 - 1:00)
**Standard Hook:** A variation of: "I'm Clive. After 30 years in the engine room of the technology industry, I now track the shifting fault lines of AI and semiconductor politics from the edge of Europe. Welcome to Silicon and Stone, where we cut through the tech noise to give decision-makers the actionable intelligence they need." — vary the wording slightly per episode.
**Persona Tag:** State explicitly who this briefing is for (tie it to ${persona.role}).
**Impact Score:** Assign a Systemic Friction or Risk score out of 10.
**The Stone Truth:** A 3-sentence, sober bottom-line summary.

## 2. The Briefing (1:00 - 12:00)
Divide the research into 3–4 distinct "Takeaways". For each:
**Visual Hook:** what to show on screen.
**Talking Points:** 4–5 detailed bullets incorporating specific data, geography and regulatory deadlines from the research.
**Methodology Application:** tie the analysis to one Silicon & Stone pillar (Supply Chain Forensics, Policy Stress-Testing, Scenario Modeling, or Signal Filtering).

## 3. The Audit CTA (12:00 - End)
**The Transition:** a smooth move from the final takeaway into the call to action.
**The Pitch:** a low-pressure pitch to siliconandstone.com — direct ${persona.role} to a free interactive tool (Compliance Checker, Supply Chain Mapper), and mention the £24 AI Audit Checklist Pack or the £79 AI Act Compliance Toolkit.

Tone: Sober, authoritative, clinical. Zero hype.`;
    }
}

export interface CategoryChoice {
    slug: string;
    title: string;
    description?: string;
}

export async function buildMetadataPrompt(
    title: string,
    body: string,
    personaKey: string,
    categories: CategoryChoice[],
    voice?: VoiceDNA,
    requiredTier?: ArticleMetadata['intelligenceTier'],
) {
    const [persona, voiceDNA] = await Promise.all([
        getSanityPersona(personaKey),
        voice ? Promise.resolve(voice) : getVoiceDNA(),
    ]);

    if (!persona) throw new Error(`Persona ${personaKey} not found in Sanity`);

    const categoryList = categories
        .map(c => `- "${c.slug}" — ${c.title}${c.description ? `: ${c.description}` : ''}`)
        .join('\n');

    const slugEnum = categories.map(c => `"${c.slug}"`).join(' | ');

    const systemPrompt = `You are an SEO editor for "Silicon & Stone", a forensic technopolitical intelligence brand.
Voice traits: ${voiceDNA.personality.traits.join(", ")}.
Never use these hype phrases: ${voiceDNA.voice_boundaries.never_uses_phrases.join(", ")}.
Primary tone: ${voiceDNA.tone.primary_tone}.

Your job is to read a finished draft article and produce structured SEO metadata, actionable insights, and taxonomy.
You MUST output a single valid JSON object and NOTHING ELSE — no markdown fences, no prose, no preamble.

Available categories (choose 1–2 whose descriptions best match the draft's primary subject):
${categoryList}

Schema (all fields required):
{
  "seoTitle": string,           // 50–60 chars. Front-load the primary keyword. No brand suffix.
  "metaDescription": string,    // 150–160 chars. Specific, compelling, includes primary keyword. No clickbait.
  "stoneTruth": string,         // <160 chars. One-sentence bottom line in the brand voice. The "if you read nothing else, read this" line.
  "actionableInsights": string[],  // 3–5 items. Each a complete imperative sentence aimed at ${persona.role}. No filler, no restating the body.
  "categorySlugs": string[],    // 1–2 slugs from this exact set: ${slugEnum}. Pick the single best match first; only add a second if the draft spans two categories roughly equally.
  "intelligenceTier": "pulse" | "briefing" | "audit",
  "methodologyPillars": string[]
}

Hard constraints:
- seoTitle MUST be <= 60 characters.
- metaDescription MUST be <= 160 characters.
- stoneTruth MUST be <= 160 characters.
- actionableInsights MUST contain between 3 and 5 items.
- categorySlugs MUST contain 1 or 2 items, each from the exact list above. Do not invent slugs.
- intelligenceTier MUST be exactly one of: "pulse", "briefing", "audit".
  - "pulse"    = 30-second scan; bite-sized signal under ~600 words.
  - "briefing" = 5-minute read; standard analysis, 800–2000 words.
  - "audit"    = forensic long-form deep analysis, 2000+ words.
  Choose based on the actual depth and rigour of the body, not on the
  contentType requested by the writer.
${requiredTier ? `- This draft was deliberately commissioned as a "${requiredTier}" item. intelligenceTier MUST be "${requiredTier}".` : ''}
- methodologyPillars MUST contain values drawn ONLY from this exact list
  of slugs (no other strings allowed):
    supply-chain-scenario-modelling
    supply-chain-long-memory-filter
    policy-scenario-modelling
    policy-long-memory-filter
    talent-scenario-modelling
    talent-long-memory-filter

  These are cells of the 3×2 Forensic Technopolitics matrix —
  the rows are Scenario Modelling and Long-Memory Filter, the
  columns are Supply Chain, Policy, and Talent. A cell applies
  if the body genuinely uses that analytical move (forward-looking
  scenario in the supply-chain domain, historical-pattern read in
  the policy domain, etc.).

  PER-CELL EVALUATION (this is the primary test — apply it to every
  one of the six cells before settling on a final list):

    For each candidate cell, ask: "Does the body actually use this
    analytical move? Is there a paragraph or argument in the body
    that visibly applies the [Supply Chain | Policy | Talent] lens
    using [forward-looking Scenario Modelling | historical Long-
    Memory Filter] reasoning?"

    If yes — include the cell.
    If no — exclude it. Do not include a cell because the topic
    "involves" that domain in passing; the analytical MOVE has to
    be visible.

  Cell-count guardrails by intelligenceTier (sanity ranges, not
  mandates — the per-cell test above is the actual selector):
    - pulse:    exactly 1 cell.
    - briefing: 2–4 cells.
    - audit:    eligible for all 6 cells. Audits are wider in scope so may
                touch more lenses, but never auto-select all 6 —
                drop any lens the body does not actually use.

  Do not pad. An audit on, say, semiconductor supply-chain capacity
  allocation should NOT include the Talent cells unless the body
  genuinely analyses talent dynamics through that lens. A piece
  that mentions a topic in passing without applying the lens does
  not justify the cell.
- Return JSON only. No \`\`\`json fences.`;

    const userPrompt = `Extract SEO metadata, actionable insights, and taxonomy for this draft.

TITLE:
${title}

BODY:
${body}

Return the JSON object now.`;

    return { systemPrompt, userPrompt };
}

export interface ArticleMetadata {
    seoTitle?: string;
    metaDescription?: string;
    stoneTruth?: string;
    actionableInsights?: string[];
    categorySlugs?: string[];
    intelligenceTier?: 'pulse' | 'briefing' | 'audit';
    methodologyPillars?: string[];
}

/**
 * Pass-2 of the article generator: read a finished draft and produce
 * structured SEO metadata, actionable insights, taxonomy, intelligence tier,
 * and methodology-matrix cells. Best-effort — returns null if the metadata
 * call fails so the upstream pipeline can still save the draft.
 */
export async function extractArticleMetadata(
    title: string,
    body: string,
    personaKey: string,
    categories: CategoryChoice[],
    requiredTier?: ArticleMetadata['intelligenceTier'],
): Promise<ArticleMetadata | null> {
    let raw = "";
    try {
        const { systemPrompt, userPrompt } = await buildMetadataPrompt(title, body, personaKey, categories, undefined, requiredTier);
        raw = await callClaude(systemPrompt, userPrompt);

        const firstOpen = raw.indexOf('{');
        const lastClose = raw.lastIndexOf('}');
        if (firstOpen === -1 || lastClose === -1) throw new Error("No JSON object in metadata response");

        const parsed = JSON.parse(raw.substring(firstOpen, lastClose + 1));

        const clamp = (s: unknown, max: number): string | undefined => {
            if (typeof s !== 'string') return undefined;
            const trimmed = s.trim();
            if (!trimmed) return undefined;
            return trimmed.length > max ? trimmed.slice(0, max).trimEnd() : trimmed;
        };

        const insights = Array.isArray(parsed.actionableInsights)
            ? parsed.actionableInsights
                .map((i: unknown) => (typeof i === 'string' ? i.trim() : ''))
                .filter((i: string) => i.length > 0)
                .slice(0, 5)
            : [];

        const allowedSlugs = new Set(categories.map(c => c.slug));
        const rawSlugs = Array.isArray(parsed.categorySlugs)
            ? parsed.categorySlugs
                .map((s: unknown) => (typeof s === 'string' ? s.trim() : ''))
                .filter((s: string) => allowedSlugs.has(s))
                .slice(0, 2)
            : [];

        const VALID_TIERS = ['pulse', 'briefing', 'audit'] as const;
        type IntelligenceTier = typeof VALID_TIERS[number];
        const intelligenceTier: IntelligenceTier | undefined =
            (VALID_TIERS as readonly string[]).includes(parsed.intelligenceTier)
                ? (parsed.intelligenceTier as IntelligenceTier)
                : undefined;

        const VALID_CELLS = [
            'supply-chain-scenario-modelling',
            'supply-chain-long-memory-filter',
            'policy-scenario-modelling',
            'policy-long-memory-filter',
            'talent-scenario-modelling',
            'talent-long-memory-filter',
        ];
        const methodologyPillars: string[] | undefined = (() => {
            if (!Array.isArray(parsed.methodologyPillars)) return undefined;
            const filtered = (parsed.methodologyPillars as unknown[]).filter(
                (p: unknown): p is string =>
                    typeof p === 'string' && VALID_CELLS.includes(p)
            );
            const cells = Array.from(new Set<string>(filtered)).slice(0, 6);
            return cells.length > 0 ? cells : undefined;
        })();

        return {
            seoTitle: clamp(parsed.seoTitle, 60),
            metaDescription: clamp(parsed.metaDescription, 160),
            stoneTruth: clamp(parsed.stoneTruth, 160),
            actionableInsights: insights.length >= 3 ? insights : undefined,
            categorySlugs: rawSlugs.length > 0 ? rawSlugs : undefined,
            intelligenceTier: requiredTier ?? intelligenceTier,
            methodologyPillars,
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        logErrorToFile(`METADATA EXTRACTION FAILED: ${message}\n\nRAW:\n${raw}`);
        return null;
    }
}
