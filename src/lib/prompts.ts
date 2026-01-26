import { getVoiceDNA, getBusinessProfile, getContentFocus } from "./api";
import { getSanityPersona } from "./sanity";

type ContentType = 'signal' | 'deepdive' | 'guide';

export async function buildPrompt(topic: string, personaKey: string, contentType: ContentType) {
    const [persona, voice, profile, contentFocus] = await Promise.all([
        getSanityPersona(personaKey),
        getVoiceDNA(),
        getBusinessProfile(),
        getContentFocus()
    ]);

    if (!persona) throw new Error(`Persona ${personaKey} not found in Sanity`);

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
