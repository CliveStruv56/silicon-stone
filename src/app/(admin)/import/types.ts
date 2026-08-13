import type { DraftFormat } from "@/lib/prompts";

export interface ImportState {
    success: boolean;
    message: string;
    articleId: string;
}

export const IMPORT_INITIAL_STATE: ImportState = {
    success: false,
    message: "",
    articleId: "",
};

/**
 * The formats /import accepts — the full set `buildDraftPrompt` supports. Shared
 * by the form (to render the cards) and the server action (to validate), so the
 * two can never drift. Type-only import of DraftFormat keeps the server-only
 * prompt module out of the client bundle.
 */
export const IMPORT_FORMATS: { id: DraftFormat; name: string; desc: string }[] = [
    { id: "pulse", name: "Pulse", desc: "30-second intelligence scan (100-140 words)" },
    { id: "signal", name: "Signal", desc: "Rapid-response analysis (~800 words)" },
    { id: "deep_dive", name: "Deep Dive", desc: "Comprehensive forensic report (3000+ words)" },
    { id: "guide", name: "Guide", desc: "Practical step-by-step walkthrough (500-2000 words)" },
    { id: "youtube", name: "YouTube Script", desc: "Three-act script for a 12-18 minute video" },
];

export function isImportFormat(value: string): value is DraftFormat {
    return IMPORT_FORMATS.some((f) => f.id === value);
}

/** Matches BRIEF_MAX in create-form.tsx. */
export const BRIEF_MAX = 2000;
