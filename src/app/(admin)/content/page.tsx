import {
    FileText,
    Pen,
    ExternalLink,
    Database,
    PlusCircle
} from "lucide-react";
import Link from "next/link";
import { listSanityArticles } from "@/lib/sanity";

// Force dynamic to always show fresh data
export const dynamic = 'force-dynamic';

export default async function ContentPage() {
    const sanityArticles = await listSanityArticles();

    return (
        <main className="p-8 max-w-5xl mx-auto min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                        <FileText className="w-8 h-8 text-blue-500" />
                        Content Library
                    </h1>
                    <p className="text-muted-foreground">
                        All your content lives in Sanity Studio. Create, edit, and publish from one place.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/create" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-600 transition-colors">
                        <PlusCircle className="w-4 h-4" /> New Article
                    </Link>
                </div>
            </div>

            {/* SANITY ARTICLES - Single Source of Truth */}
            <div className="mb-12">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary">
                    <Database className="w-5 h-5" />
                    All Articles
                </h2>
                <div className="grid gap-4">
                    {sanityArticles.length === 0 ? (
                        <div className="text-center py-20 bg-muted/20 border border-border rounded-xl border-dashed">
                            <p className="text-muted-foreground mb-4">No articles yet. Start creating!</p>
                            <Link href="/create" className="text-primary hover:underline font-medium">Generate your first article →</Link>
                        </div>
                    ) : (
                        sanityArticles.map(article => (
                            <div key={article._id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between hover:border-primary/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <div className="font-semibold flex items-center gap-2">
                                            {article.title}
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider ${article._id.startsWith('drafts.') ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                                                {article._id.startsWith('drafts.') ? 'Draft' : 'Published'}
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
                                            Slug: {article.slug?.current}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Link
                                        href={
                                            article._id.startsWith('drafts.')
                                                ? `/api/draft-mode/enable?slug=${encodeURIComponent(article.slug?.current ?? '')}`
                                                : `/analysis/${article.slug?.current}`
                                        }
                                        className="text-sm font-medium hover:text-primary flex items-center gap-1"
                                    >
                                        <ExternalLink className="w-3 h-3" /> Preview
                                    </Link>
                                    <a
                                        href={`/studio/intent/edit/id=${article._id};type=article`}
                                        className="text-sm font-medium hover:text-primary flex items-center gap-1 opacity-70 hover:opacity-100"
                                    >
                                        <Pen className="w-3 h-3" /> Edit in Studio
                                    </a>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Tip for migrating old local files */}
            <div className="bg-muted/30 border border-border rounded-lg p-4 text-sm text-muted-foreground">
                <strong className="text-foreground">Note:</strong> All new content is created directly in Sanity. If you have old local drafts in <code className="bg-muted px-1 rounded">content/drafts/</code>, you can import them using the Research → Create Draft flow.
            </div>
        </main>
    );
}
