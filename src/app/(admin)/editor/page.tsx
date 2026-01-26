import { getContent } from "@/lib/api";
import { EditorForm } from "./editor-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

interface PageProps {
    searchParams: Promise<{ path?: string }>;
}

export default async function EditorPage({ searchParams }: PageProps) {
    // Await the searchParams promise (Next.js 15 requirement)
    const { path } = await searchParams;

    if (!path) {
        redirect('/content');
    }

    let content = "";
    try {
        content = await getContent(path);
    } catch {
        return (
            <div className="p-8 text-center text-red-500">
                <h1 className="text-xl font-bold">Error</h1>
                <p>Could not load file: {path}</p>
                <Link href="/content" className="underline mt-4 block">Back to Library</Link>
            </div>
        );
    }

    const fileName = path.split('/').pop();

    return (
        <main className="h-screen flex flex-col bg-background">
            <header className="h-14 border-b border-border flex items-center px-4 justify-between shrink-0 bg-card/50 backdrop-blur">
                <div className="flex items-center gap-4">
                    <Link href="/content" className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="font-mono text-sm opacity-70 truncate max-w-md">{path}</div>
                </div>
                <div className="text-sm font-bold">{fileName}</div>
                <div className="w-20" /> {/* Spacer for balance */}
            </header>

            <div className="flex-1 overflow-hidden relative">
                <EditorForm initialContent={content} path={path} />
            </div>
        </main>
    );
}
