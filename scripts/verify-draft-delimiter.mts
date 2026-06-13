/**
 * One-shot live verification for the delimiter-format draft fix.
 * Runs the real round-trip: buildDraftPrompt -> callClaude -> parseDraftPayload.
 * Does NOT write to Sanity, so it leaves no stray draft to clean up.
 *
 *   node --env-file=.env.local --import tsx scripts/verify-draft-delimiter.mts
 */
import { buildDraftPrompt } from "../src/lib/prompts";
import { parseDraftPayload } from "../src/lib/draft-pipeline";
import { callClaude } from "../src/lib/anthropic";

const research = {
    summary:
        "The EU AI Act's high-risk obligations phase in through 2026-2027, but vendors are shipping conformity self-declarations with thin technical documentation, leaving compliance teams unable to verify claims.",
    sources: [
        {
            title: "AI Act implementation timeline",
            url: "https://example.com/ai-act-timeline",
            snippet: "Annex III high-risk systems face full obligations from August 2026.",
        },
    ],
    painPoints: ["Cannot verify vendor conformity claims", "Thin technical documentation"],
    keywords: ["EU AI Act", "conformity assessment", "vendor evidence"],
};

const main = async () => {
    console.log("Building prompt (persona=compliance-clara, format=pulse)...");
    const { systemPrompt, userPrompt } = await buildDraftPrompt({
        topic: "EU AI Act vendor evidence gaps in conformity self-declarations",
        personaKey: "compliance-clara",
        format: "pulse",
        research,
    });

    console.log("Calling Claude...");
    const responseText = await callClaude(systemPrompt, userPrompt, 0.4, 4096);

    console.log("\n=== RAW RESPONSE (first 400 chars) ===");
    console.log(responseText.slice(0, 400));

    const usedDelimiters = responseText.includes("===TITLE===") && responseText.includes("===CONTENT===");
    console.log(`\nDelimiter markers present in raw response: ${usedDelimiters ? "YES (delimiter path)" : "NO (would use JSON fallback)"}`);

    console.log("\n=== PARSED ===");
    const draft = parseDraftPayload(responseText);
    console.log("title   :", draft.title);
    console.log("excerpt :", draft.excerpt);
    console.log("keywords:", draft.keywords);
    console.log("content len:", draft.content.length);
    console.log("content head:", draft.content.slice(0, 160).replace(/\n/g, " "));

    if (!draft.title || !draft.content) throw new Error("FAIL: missing title or content after parse");
    console.log("\n✅ PASS — round-trip parsed a valid draft.");
};

main().catch((e) => {
    console.error("\n❌ FAIL:", e);
    process.exit(1);
});
