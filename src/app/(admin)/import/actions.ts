"use server";

import { extractRawText } from "mammoth";
import { callClaude } from "@/lib/anthropic";
import { buildDraftPrompt, type DraftFormat } from "@/lib/prompts";
import { parseDraftPayload, finalizeDraft } from "@/lib/draft-pipeline";
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
        if (format !== "pulse" && format !== "signal" && format !== "deep_dive") {
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

        // Pass 1 — rework the supplied article into the S&S voice + structure via
        // the same unified prompt builder /create uses. Passing `sourceMaterial`
        // switches it into rework mode (preserve facts, rewrite prose) and carries
        // the brand voice DNA + persona context + format scaffold automatically.
        const { systemPrompt, userPrompt } = await buildDraftPrompt({
            topic: originalTitle || "Imported article",
            personaKey: personaSlug,
            format,
            sourceMaterial: text,
        });

        // Deep dives can exceed the 4096-token default — give them headroom.
        const maxTokens = format === "deep_dive" ? 8192 : 4096;
        const responseText = await callClaude(systemPrompt, userPrompt, 0.4, maxTokens);

        const draft = parseDraftPayload(responseText);

        // Pass-3 (voice edit) → Pass-2 (metadata) → Sanity write — shared with /create.
        const created = await finalizeDraft({
            draft,
            format: format as DraftFormat,
            personaSlug,
            source: "imported",
            sourceMaterial: text,
            logPrefix: "/import",
        });

        const articleId = String(created?._id ?? "").replace(/^drafts\./, "");

        return {
            success: true,
            message: `"${draft.title}" was reworked and saved as a draft.`,
            articleId,
        };
    } catch (error) {
        console.error("[/import] Import failed:", error);
        const message =
            error instanceof Error ? error.message : "Import failed. Please try again.";
        return { success: false, message, articleId: "" };
    }
}
