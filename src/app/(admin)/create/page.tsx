import { listSanityPersonas } from "@/lib/sanity";
import { CreateForm } from "./create-form";

export const metadata = {
    title: "Create Content | Silicon & Stone",
    description: "Unified research and generation pipeline.",
};

export default async function CreatePage() {
    const personas = await listSanityPersonas();

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">Initialize Mission</h1>
                <p className="text-muted-foreground">Select a format and persona to begin the forensic research pipeline.</p>
            </div>

            <CreateForm initialPersonas={personas} />
        </div>
    );
}
