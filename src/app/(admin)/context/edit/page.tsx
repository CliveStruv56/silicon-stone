import { getICP } from "@/lib/api";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EditPersonaForm } from "./edit-form";

interface PageProps {
    searchParams: Promise<{ key?: string }>;
}

export default async function EditContextPage({ searchParams }: PageProps) {
    const { key } = await searchParams;

    if (!key) redirect('/context');

    const icp = await getICP();
    const persona = icp.personas[key];

    if (!persona) {
        return <div>Persona not found</div>;
    }

    return (
        <main className="p-8 max-w-2xl mx-auto min-h-screen">
            <Link href="/context" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Context
            </Link>

            <div className="mb-8">
                <h1 className="text-3xl font-bold">Edit Persona: {persona.role}</h1>
                <p className="text-muted-foreground font-mono text-sm mt-1">{key}</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-8">
                <EditPersonaForm originalKey={key} initialData={persona} />
            </div>
        </main>
    );
}
