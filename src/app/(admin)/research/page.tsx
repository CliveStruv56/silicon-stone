'use client';

import { useState, useActionState } from 'react';
import { researchTopic } from './actions';
import {
    Search,
    ArrowRight,
    Globe,
    Database,
    Loader2,
    AlertCircle
} from 'lucide-react';
import { InoreaderStatus } from "./inoreader-status";
import { ContextItemButton } from "./context-item";
import { DraftButton } from "./draft-button";
import { ResearchResult, ResearchSource } from '@/types/research';

// Define the exact state shape returned by the action that matches researchTopic signature
// researchTopic returns: Promise< { success: boolean; data: ...; error?: string } >
type ActionState =
    | { success: false; data: null; error?: string }
    | { success: true; data: ResearchResult; error?: undefined };

// Initial state MUST match one of the union members
const INITIAL_STATE: ActionState = { success: false, data: null, error: undefined };

export default function ResearchPage() {
    const [query, setQuery] = useState('');

    const [state, formAction, isPending] = useActionState(researchTopic, INITIAL_STATE);

    const result = state.data;

    return (
        <main className="p-8 max-w-4xl mx-auto min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                        <Search className="w-8 h-8 text-blue-500" />
                        Research Intelligence
                    </h1>
                    <p className="text-muted-foreground">
                        Deploy forensic agents to gather fresh context and update your knowledge base.
                    </p>
                </div>
                <InoreaderStatus />
            </div>

            {/* Search Input */}
            <form action={formAction} className="mb-12">
                <div className="relative">
                    <input
                        type="text"
                        name="query"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Enter a topic to investigate (e.g. 'Status of 2nm production in Dresden')"
                        className="w-full bg-card border border-border rounded-xl p-6 pl-14 text-xl outline-none focus:ring-2 focus:ring-purple-500/50 shadow-lg"
                        autoFocus
                    />
                    <Globe className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
                    <button
                        type="submit"
                        disabled={!query || isPending}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                    </button>
                </div>
            </form>

            {/* Error View */}
            {state.error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {state.error}
                </div>
            )}

            {/* Results View */}
            {result && (
                <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8">
                    {/* 1. Executive Summary */}
                    <section className="bg-card border border-border rounded-xl p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-lg font-semibold text-purple-400">Forensic Summary</h2>
                            <DraftButton summary={result.summary} topic={query} sources={result.sources} />
                        </div>
                        <p className="text-lg leading-relaxed">{result.summary}</p>
                    </section>

                    {/* 2. Sources */}
                    <section>
                        <h3 className="text-sm font-mono text-muted-foreground uppercase mb-3">Intelligence Sources</h3>
                        <div className="grid gap-3">
                            {result.sources.map((s: ResearchSource, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/20">
                                    <div className="overflow-hidden">
                                        <div className="font-medium truncate">{s.title}</div>
                                        <div className="text-xs text-muted-foreground truncate">{s.snippet}</div>
                                    </div>
                                    <span className="text-xs text-muted-foreground font-mono ml-4 shrink-0 whitespace-nowrap">
                                        {s.url.includes('//') ? new URL(s.url).hostname : s.url.substring(0, 20)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 3. Context Updates */}
                    <section className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Database className="w-5 h-5 text-blue-400" />
                            <h2 className="text-lg font-semibold text-blue-400">Proposed Context Updates</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <span className="text-xs font-mono text-muted-foreground uppercase">New Keywords</span>
                                <div className="flex gap-2 mt-2 flex-wrap">
                                    {result.suggestedContext.keywords.map((k: string) => (
                                        <div key={k} className="flex items-center px-2 py-1 bg-blue-500/10 text-blue-300 text-sm rounded border border-blue-500/20">
                                            {k}
                                            <ContextItemButton type="keyword" value={k} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <span className="text-xs font-mono text-muted-foreground uppercase">New Pain Points (for Personas)</span>
                                <ul className="mt-2 space-y-2">
                                    {result.suggestedContext.pain_points.map((p: string) => (
                                        <li key={p} className="flex items-center gap-2 text-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                            <span className="flex-1">{p}</span>
                                            <ContextItemButton type="pain_point" value={p} />
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </main>
    );
}
