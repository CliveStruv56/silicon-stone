import { listSanityPersonas } from "@/lib/sanity";
import { CreateForm, type FormatType } from "./create-form";

const VALID_FORMATS: FormatType[] = ["pulse", "signal", "deep_dive", "guide", "youtube", "research"];

export const metadata = {
    title: "Create Content | Silicon & Stone",
    description: "Unified research and generation pipeline.",
};

// Draft generation runs five sequential network round-trips from a single server
// action (OpenAI embedding → Pinecone query → Claude draft → Claude voice-edit →
// Claude metadata → Sanity write), which routinely exceeds Vercel's low default
// timeout — especially on a cold start. Without this ceiling the first attempt
// 504s and the client shows "the request didn't reach the server". Server
// actions inherit the maxDuration of the page that invokes them. Matches the
// 300s ceiling already used by /api/fact-check.
export const maxDuration = 300;

export default async function CreatePage({
    searchParams,
}: {
    searchParams: Promise<{ format?: string }>;
}) {
    const [personas, { format }] = await Promise.all([
        listSanityPersonas(),
        searchParams,
    ]);

    // Carry the format chosen on the dashboard (?format=…) through to the form.
    const initialFormat: FormatType =
        format && VALID_FORMATS.includes(format as FormatType)
            ? (format as FormatType)
            : "signal";

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">Initialize Mission</h1>
                <p className="text-muted-foreground">Select a format and persona to begin the forensic research pipeline.</p>
            </div>

            <CreateForm initialPersonas={personas} initialFormat={initialFormat} />
        </div>
    );
}
