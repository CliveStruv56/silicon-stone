import { listSanityPersonas } from "@/lib/sanity";
import { ImportForm } from "./import-form";

// Force dynamic so we always get fresh persona data
export const dynamic = "force-dynamic";

export const metadata = {
    title: "Import Article | Silicon & Stone",
    description: "Rework an externally-written article into the Silicon & Stone format.",
};

export default async function ImportPage() {
    const personas = await listSanityPersonas();

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">
                    Import Article
                </h1>
                <p className="text-muted-foreground">
                    Paste an article written outside the system. It is reworked end-to-end into
                    the Silicon &amp; Stone voice and saved as a draft — never auto-published.
                    The original text is kept on the article for reference.
                </p>
            </div>

            <ImportForm personas={personas} />
        </div>
    );
}
