import { listSanityPersonas } from "@/lib/sanity";
import GeneratorForm from "./generator-form";

// Force dynamic so we always get fresh persona data
export const dynamic = 'force-dynamic';

export default async function GeneratorPage() {
    const personas = await listSanityPersonas();
    return <GeneratorForm personas={personas} />;
}
