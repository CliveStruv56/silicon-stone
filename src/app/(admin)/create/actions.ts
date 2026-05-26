"use server";

import { redirect } from "next/navigation";
import { performResearch as researchPipeline } from "@/lib/research";
import { callClaude } from "@/lib/anthropic";
import { createArticleInSanity, listSanityCategories } from "@/lib/sanity";
import { extractArticleMetadata } from "@/lib/prompts";
import { requireAdmin } from "@/lib/auth";
import { ResearchResult } from "@/types/research";
import { generateEmbedding } from "@/lib/embeddings";
import { searchSimilar } from "@/lib/pinecone";

export async function performResearch(topic: string) {
    try {
        await requireAdmin();
        const result = await researchPipeline(topic);
        return result;
    } catch (error) {
        console.error("Error performing research:", error);
        throw new Error("Failed to gather intelligence.");
    }
}

function getArticleSystemPrompt(format: "pulse" | "signal" | "deep_dive", personaSlug: string): string {
    const isDeepDive = format === "deep_dive";
    const wordCount = isDeepDive ? "3000+" : format === "pulse" ? "100-140" : "800";
    const pulseConstraint = format === "pulse"
        ? "\nThis is a Pulse: the complete article must be a genuine 30-second scan of 100-140 words. State what shifted, why it matters, and one watchpoint only."
        : "";

    return `You are writing a ${format.replace('_', ' ')} (approx ${wordCount} words) for the brand "Silicon & Stone".
The target persona slug is: ${personaSlug}
Your task is to write the full article draft using the provided forensic research.${pulseConstraint}

Please output ONLY a JSON object with the following structure:
{
  "title": "A compelling, forensic title",
  "excerpt": "A short, punchy 2-sentence summary",
  "content": "The full article content in markdown format",
  "keywords": ["keyword1", "keyword2"]
}`;
}

function getYouTubeSystemPrompt(personaSlug: string): string {
    return `You are the Forensic Agent for Silicon and Stone, an intelligence platform specialising in forensic technopolitics, AI regulation, and digital sovereignty. Your task is to synthesize provided research into a highly structured YouTube Script Outline for a 12–18 minute video.

Voice DNA & Constraints:
- Tone: Sober, authoritative, weather-beaten, and clinical. You speak to senior professionals (operations directors, compliance officers, policy analysts).
- Zero Hype Rule: You must NEVER use words like "revolutionary," "game-changer," "disruptive," "magic," or "unprecedented."
- Style: No jargon. Deliver clear, actionable intelligence. Treat the viewer as an intelligent adult who lacks time, not intelligence.

Target Persona: ${personaSlug}

Persona Reference:
- clara: Compliance Clara — Legal/Compliance Officer focused on AI Act deadlines and risk frameworks
- ian: Industrial Ian — Supply Chain/Ops Manager focused on disruption, data sovereignty, and chip constraints
- sofia: Sovereign Sofia — Policy Analyst focused on tech sovereignty and regulatory arbitrage
- robert: Remote Robert — Regional Development Professional focused on local economic impacts
- citizen: Global Citizen — Informed general public interested in tech/society impacts

Required Output Structure (The "Tiered Intelligence" Format):

Generate the script outline strictly following this structure. Output as clean Markdown.

## 1. The Pulse (0:00 - 1:00)

**Standard Hook:** Write a variation of: "I'm Clive. After 30 years in the engine room of the technology industry, I now track the shifting fault lines of AI and semiconductor politics from the edge of Europe. Welcome to Silicon and Stone, where we cut through the tech noise to give decision-makers the actionable intelligence they need." — Vary the wording slightly to keep it fresh per episode while maintaining the core identity.

**Persona Tag:** Explicitly state who this briefing is for (e.g., "Today's briefing is for operations directors and 'Industrial Ians' managing company data.")

**Impact Score:** Assign a Systemic Friction or Risk score out of 10.

**The Stone Truth:** A 3-sentence, sober bottom-line summary of the core issue.

## 2. The Briefing (1:00 - 12:00)

Divide the main research into 3 to 4 distinct "Takeaways" or narrative blocks. For each block, provide:

**Visual Hook:** What should be shown on screen (e.g., "Supply chain map of Taiwan," "B-roll of the island landscape," "A simple text graphic showing the AI Act timeline").

**Talking Points:** 4-5 detailed bullet points of what Clive will say. Incorporate specific data, geographic realities, and regulatory deadlines from the research context.

**Methodology Application:** Explicitly tie the analysis back to one of the Silicon and Stone methodology pillars (Supply Chain Forensics, Policy Stress-Testing, Scenario Modeling, or Signal Filtering).

## 3. The Audit CTA (12:00 - End)

**The Transition:** Write a smooth transition from the final takeaway into the call to action.

**The Pitch:** Draft a low-pressure, professional pitch directing viewers to siliconandstone.com. Depending on the target persona, direct them to use one of the free interactive tools (Compliance Checker, Supply Chain Mapper), and mention that they can download the £24 AI Audit Checklist Pack or the £79 AI Act Compliance Toolkit for a step-by-step resolution to the problems discussed.

Please output ONLY a JSON object with the following structure:
{
  "title": "A compelling YouTube video title (under 70 characters)",
  "excerpt": "A 2-sentence video description for YouTube",
  "content": "The full script outline in clean Markdown format following the structure above",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`;
}

export async function createDraftFromResearch(
    researchResult: ResearchResult,
    format: "pulse" | "signal" | "deep_dive" | "youtube",
    personaSlug: string,
    topic: string = ""
) {
    try {
        await requireAdmin();
        const isYouTube = format === "youtube";
        const systemPrompt = isYouTube
            ? getYouTubeSystemPrompt(personaSlug)
            : getArticleSystemPrompt(format, personaSlug);

        // Retrieve semantically similar prior articles from Pinecone (RAG)
        let priorCoverageBlock = ''
        try {
            const topicVector = await generateEmbedding(topic)
            const similar = await searchSimilar(topicVector, 5)
            if (similar.length > 0) {
                const lines = similar.map(
                    (r) => `- "${r.metadata.title}": ${r.metadata.excerpt} (/analysis/${r.metadata.slug})`
                )
                priorCoverageBlock = `\n=== PRIOR COVERAGE IN YOUR KNOWLEDGE BASE ===\nYou have already written on related topics. Reference, extend, or differentiate from this prior work rather than repeating it:\n${lines.join('\n')}\n`
            }
        } catch {
            // Pinecone not configured — skip silently
        }

        const userMessage = `
=== TOPIC ===
${topic}

=== RESEARCH SUMMARY ===
${researchResult.summary}

=== SOURCES ===
${researchResult.sources.map(s => `- ${s.title}: ${s.snippet} (${s.url})`).join('\n')}

=== PAIN POINTS & KEYWORDS ===
${[...researchResult.suggestedContext.pain_points, ...researchResult.suggestedContext.keywords].join(', ')}
${priorCoverageBlock}`;

        // Temperature 0.4 for controlled, on-brand output
        const responseText = await callClaude(systemPrompt, userMessage, 0.4);

        // Extract JSON from response (handle markdown code blocks)
        let jsonText = responseText;
        const firstOpen = jsonText.indexOf('{');
        const lastClose = jsonText.lastIndexOf('}');
        if (firstOpen !== -1 && lastClose !== -1) {
            jsonText = jsonText.substring(firstOpen, lastClose + 1);
        }

        const parsedData = JSON.parse(jsonText);

        const contentType = isYouTube ? "youtube" : (format === "deep_dive" ? "deepdive" : "signal");

        // Pass-2: SEO/insights/taxonomy/tier/matrix-cells extraction.
        // Best-effort — if it fails the draft still saves, just without
        // the metadata fields. Same pattern as /generate.
        let metadata: Awaited<ReturnType<typeof extractArticleMetadata>> | undefined;
        try {
            const categoryOptions = await listSanityCategories();
            metadata = await extractArticleMetadata(
                parsedData.title,
                parsedData.content,
                personaSlug,
                categoryOptions,
                format === "pulse" ? "pulse" : undefined,
            );
        } catch (err) {
            console.error('[/create] Metadata extraction failed:', err);
        }

        const sanityArticle = {
            title: parsedData.title,
            slug: parsedData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
            excerpt: metadata?.metaDescription ?? parsedData.excerpt,
            body: parsedData.content,
            contentType: contentType as "signal" | "deepdive" | "guide" | "youtube",
            persona: personaSlug,
            seoTitle: metadata?.seoTitle,
            metaDescription: metadata?.metaDescription,
            stoneTruth: metadata?.stoneTruth,
            actionableInsights: metadata?.actionableInsights,
            categorySlugs: metadata?.categorySlugs,
            intelligenceTier: format === "pulse" ? "pulse" : metadata?.intelligenceTier,
            methodologyPillars: metadata?.methodologyPillars,
        };

        await createArticleInSanity(sanityArticle);

    } catch (error) {
        console.error("Error creating draft:", error);
        throw new Error("Failed to create draft.");
    }

    // Navigate to the embedded Sanity Studio to view the draft
    redirect("/studio/structure/article");
}
