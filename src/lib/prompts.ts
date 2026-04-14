import { getVoiceDNA, getBusinessProfile, getContentFocus } from "./api";
import { getSanityPersona } from "./sanity";
import type { VoiceDNA } from "@/types/context";

type ContentType = 'signal' | 'deepdive' | 'guide';

export async function buildPrompt(topic: string, personaKey: string, contentType: ContentType) {
    const [persona, voice, profile, contentFocus] = await Promise.all([
        getSanityPersona(personaKey),
        getVoiceDNA(),
        getBusinessProfile(),
        getContentFocus()
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
`;

    let userPrompt = "";

    if (contentType === 'guide') {
        userPrompt = `Write a LinkedIn post about: "${topic}".

STRICT FORMATTING RULES:
1. Hook (First 2 lines): Must stop the scroll. Under 140 chars. No questions. Start with a fact or bold claim.
   Example openers: ${voice.signature_phrases.opener_phrases.join(" | ")}
2. Body: Short, punchy lines. One idea per line. Use bullets for lists.
3. Tone: ${voice.tone.primary_tone}.
4. Ending: Clear CTA or thought-provoking question.
5. Hashtags: 3-5 relevant tags including #ForensicTechnopolitics.

Structure it for maximum engagement/comments.
`;
    } else if (contentType === 'signal') {
        userPrompt = `Write a "Signal" analysis piece (800-1200 words) about: "${topic}".

Format: Markdown.
Goal: "What just happened and what does it actually mean?" for ${persona.role}.

Structure:
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
Three specific impacts on ${persona.organizationTypes?.[0] || 'your industry'}:
1. [Impact 1]
2. [Impact 2]
3. [Impact 3]

## The Long View
Conclusion. Use a closer like: ${voice.signature_phrases.closer_phrases.join(" | ")}.

Tone: Clinical, urgent, actionable.
`;
    } else {
        // Deep Dive
        userPrompt = `Write a "Deep Dive" forensic report (2500+ words) about: "${topic}".

Format: Markdown.
Goal: The definitive reference on this topic for ${persona.role}.

Structure:
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
Cite key regulations (e.g. AI Act Articles) or specific technologies.

Tone: Academic but accessible. "The Adult in the Room".
`;
    }

    return { systemPrompt, userPrompt };
}

export async function buildMetadataPrompt(title: string, body: string, personaKey: string, voice?: VoiceDNA) {
    const [persona, voiceDNA] = await Promise.all([
        getSanityPersona(personaKey),
        voice ? Promise.resolve(voice) : getVoiceDNA(),
    ]);

    if (!persona) throw new Error(`Persona ${personaKey} not found in Sanity`);

    const systemPrompt = `You are an SEO editor for "Silicon & Stone", a forensic technopolitical intelligence brand.
Voice traits: ${voiceDNA.personality.traits.join(", ")}.
Never use these hype phrases: ${voiceDNA.voice_boundaries.never_uses_phrases.join(", ")}.
Primary tone: ${voiceDNA.tone.primary_tone}.

Your job is to read a finished draft article and produce structured SEO metadata and actionable insights.
You MUST output a single valid JSON object and NOTHING ELSE — no markdown fences, no prose, no preamble.

Schema (all fields required):
{
  "seoTitle": string,           // 50–60 chars. Front-load the primary keyword. No brand suffix.
  "metaDescription": string,    // 150–160 chars. Specific, compelling, includes primary keyword. No clickbait.
  "stoneTruth": string,         // <160 chars. One-sentence bottom line in the brand voice. The "if you read nothing else, read this" line.
  "actionableInsights": string[]  // 3–5 items. Each a complete imperative sentence aimed at ${persona.role}. No filler, no restating the body.
}

Hard constraints:
- seoTitle MUST be <= 60 characters.
- metaDescription MUST be <= 160 characters.
- stoneTruth MUST be <= 160 characters.
- actionableInsights MUST contain between 3 and 5 items.
- Return JSON only. No \`\`\`json fences.`;

    const userPrompt = `Extract SEO metadata and actionable insights for this draft.

TITLE:
${title}

BODY:
${body}

Return the JSON object now.`;

    return { systemPrompt, userPrompt };
}
