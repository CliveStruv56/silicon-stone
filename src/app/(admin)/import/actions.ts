"use server";

import { extractRawText } from "mammoth";
import { callClaude } from "@/lib/anthropic";
import { buildPrompt, extractArticleMetadata } from "@/lib/prompts";
import { createArticleInSanity, listSanityCategories } from "@/lib/sanity";
import { requireAdmin } from "@/lib/auth";
import type { ImportState } from "./types";

/**
 * Takes an externally-written article (pasted plain text / markdown), reworks it
 * end-to-end into the Silicon & Stone voice and format via the existing two-pass
 * pipeline, and saves it as a DRAFT. The verbatim original is kept on the article
 * in `sourceMaterial`. Imported drafts never auto-publish — they have no
 * `publishedAt`, exactly like generated drafts.
 */
export async function importArticle(
    _prev: ImportState,
    formData: FormData,
): Promise<ImportState> {
    try {
        await requireAdmin();

        const format = (formData.get("format") as string) || "";
        const personaSlug = (formData.get("persona") as string) || "";
        const originalTitle = ((formData.get("originalTitle") as string) || "").trim();

        // Source text comes from an uploaded file (.docx / .md / .markdown / .txt)
        // if one was provided, otherwise from the pasted textarea.
        let text = ((formData.get("text") as string) || "").trim();
        const fileEntry = formData.get("file");
        const file =
            fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null;
        if (file) {
            const name = (file.name || "").toLowerCase();
            if (name.endsWith(".docx")) {
                const buffer = Buffer.from(await file.arrayBuffer());
                const { value } = await extractRawText({ buffer });
                text = (value || "").trim();
            } else if (
                name.endsWith(".md") ||
                name.endsWith(".markdown") ||
                name.endsWith(".txt")
            ) {
                text = (await file.text()).trim();
            } else {
                return {
                    success: false,
                    message:
                        "Unsupported file type. Upload a .docx, .md, .markdown, or .txt file.",
                    articleId: "",
                };
            }
        }

        if (!personaSlug) {
            return { success: false, message: "Select a target persona.", articleId: "" };
        }
        if (format !== "signal" && format !== "deep_dive") {
            return { success: false, message: "Select a format.", articleId: "" };
        }
        if (text.length < 200) {
            return {
                success: false,
                message:
                    "Provide the article — upload a file or paste at least a couple of paragraphs.",
                articleId: "",
            };
        }

        const contentType = format === "deep_dive" ? "deepdive" : "signal";

        // Pass 1 — rework the supplied article into the S&S voice + structure.
        // buildPrompt() carries the full brand voice DNA + persona context and the
        // format scaffold; we swap in a rework instruction and the source text.
        const { systemPrompt, userPrompt } = await buildPrompt(
            originalTitle || "Imported article",
            personaSlug,
            contentType,
        );

        const reworkMessage = `${userPrompt}

=== SOURCE ARTICLE TO REWORK ===
The article below was written outside the system. Rework it COMPLETELY into the
Silicon & Stone voice and the structure described above. Preserve every fact, figure,
and the analytical substance, but rewrite the prose entirely — do not keep the original
author's phrasing. Do not invent claims the source does not support.

${text}
=== END SOURCE ARTICLE ===

Output ONLY a JSON object with this exact shape (no markdown fences, no commentary):
{
  "title": "A compelling, forensic title",
  "excerpt": "A punchy 2-sentence summary",
  "content": "The full reworked article in markdown",
  "keywords": ["keyword1", "keyword2"]
}`;

        // Deep dives can exceed the 4096-token default — give them headroom.
        const maxTokens = format === "deep_dive" ? 8192 : 4096;
        const responseText = await callClaude(systemPrompt, reworkMessage, 0.4, maxTokens);

        // Extract the JSON object (tolerate stray prose / code fences).
        let jsonText = responseText;
        const firstOpen = jsonText.indexOf("{");
        const lastClose = jsonText.lastIndexOf("}");
        if (firstOpen !== -1 && lastClose !== -1) {
            jsonText = jsonText.substring(firstOpen, lastClose + 1);
        }

        const parsed = JSON.parse(jsonText);
        if (!parsed?.title || !parsed?.content) {
            return {
                success: false,
                message: "The rework step returned an unexpected response. Try again.",
                articleId: "",
            };
        }

        // Pass 2 — SEO / taxonomy / tier metadata. Best-effort: if it fails the
        // draft still saves, just without the extra fields (same as /create).
        let metadata: Awaited<ReturnType<typeof extractArticleMetadata>> | undefined;
        try {
            const categoryOptions = await listSanityCategories();
            metadata = await extractArticleMetadata(
                parsed.title,
                parsed.content,
                personaSlug,
                categoryOptions,
            );
        } catch (err) {
            console.error("[/import] Metadata extraction failed:", err);
        }

        const slug = parsed.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "");

        const created = await createArticleInSanity({
            title: parsed.title,
            slug,
            excerpt: metadata?.metaDescription ?? parsed.excerpt ?? "",
            body: parsed.content,
            contentType,
            persona: personaSlug,
            seoTitle: metadata?.seoTitle,
            metaDescription: metadata?.metaDescription,
            stoneTruth: metadata?.stoneTruth,
            actionableInsights: metadata?.actionableInsights,
            categorySlugs: metadata?.categorySlugs,
            intelligenceTier: metadata?.intelligenceTier,
            methodologyPillars: metadata?.methodologyPillars,
            source: "imported",
            sourceMaterial: text,
        });

        const articleId = String(created?._id ?? "").replace(/^drafts\./, "");

        return {
            success: true,
            message: `"${parsed.title}" was reworked and saved as a draft.`,
            articleId,
        };
    } catch (error) {
        console.error("[/import] Import failed:", error);
        const message =
            error instanceof Error ? error.message : "Import failed. Please try again.";
        return { success: false, message, articleId: "" };
    }
}
