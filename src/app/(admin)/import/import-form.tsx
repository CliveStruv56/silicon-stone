'use client';

import { useActionState } from 'react';
import { importArticle } from './actions';
import { IMPORT_INITIAL_STATE } from './types';
import {
    Sparkles,
    FileText,
    Loader2,
    CheckCircle,
    AlertCircle,
} from 'lucide-react';

interface Persona {
    _id: string;
    name: string;
    role: string;
    slug: { current: string };
}

const FORMATS = [
    {
        id: 'signal',
        name: 'Signal',
        desc: 'Rapid-response analysis (~800 words)',
        icon: Sparkles,
    },
    {
        id: 'deep_dive',
        name: 'Deep Dive',
        desc: 'Comprehensive forensic report (3000+ words)',
        icon: FileText,
    },
];

const cardClass =
    'flex items-start gap-3 p-4 border border-border bg-card rounded-xl cursor-pointer transition-all hover:bg-muted/50 has-[:checked]:ring-2 has-[:checked]:ring-primary has-[:checked]:border-transparent';

export function ImportForm({ personas }: { personas: Persona[] }) {
    const [state, formAction, isPending] = useActionState(
        importArticle,
        IMPORT_INITIAL_STATE,
    );

    return (
        <form action={formAction} className="space-y-8">
            {/* STEP 1 — PERSONA */}
            <fieldset className="space-y-3">
                <legend className="text-sm font-semibold mb-2">
                    1. Who is the primary target?
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {personas.map((p) => (
                        <label key={p._id} className={cardClass}>
                            <input
                                type="radio"
                                name="persona"
                                value={p.slug?.current}
                                required
                                className="mt-1 accent-primary"
                            />
                            <div>
                                <div className="font-bold">{p.name}</div>
                                <div className="text-sm text-muted-foreground">{p.role}</div>
                            </div>
                        </label>
                    ))}
                </div>
            </fieldset>

            {/* STEP 2 — FORMAT */}
            <fieldset className="space-y-3">
                <legend className="text-sm font-semibold mb-2">2. What format?</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {FORMATS.map((f) => (
                        <label key={f.id} className={cardClass}>
                            <input
                                type="radio"
                                name="format"
                                value={f.id}
                                required
                                className="mt-1 accent-primary"
                            />
                            <div>
                                <div className="font-bold flex items-center gap-2">
                                    <f.icon className="w-4 h-4" />
                                    {f.name}
                                </div>
                                <div className="text-sm text-muted-foreground">{f.desc}</div>
                            </div>
                        </label>
                    ))}
                </div>
            </fieldset>

            {/* STEP 3 — SOURCE TEXT */}
            <fieldset className="space-y-3">
                <legend className="text-sm font-semibold mb-2">3. The article</legend>
                <div className="space-y-2">
                    <label
                        htmlFor="originalTitle"
                        className="text-sm text-muted-foreground"
                    >
                        Original title <span className="opacity-60">(optional)</span>
                    </label>
                    <input
                        id="originalTitle"
                        name="originalTitle"
                        type="text"
                        placeholder="Title of the source article"
                        className="w-full px-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
                <div className="space-y-2">
                    <label htmlFor="text" className="text-sm text-muted-foreground">
                        Paste the full article (plain text or markdown)
                    </label>
                    <textarea
                        id="text"
                        name="text"
                        required
                        rows={16}
                        placeholder="Paste the externally-written article here…"
                        className="w-full px-4 py-3 bg-card border border-border rounded-lg text-sm font-mono leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
            </fieldset>

            {/* SUBMIT */}
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isPending}
                    className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Reworking…
                        </>
                    ) : (
                        <>
                            <FileText className="w-4 h-4" /> Rework &amp; Save Draft
                        </>
                    )}
                </button>
            </div>

            {/* SUCCESS */}
            {state.success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-4 rounded-lg flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
                    <div>
                        <div className="font-bold">Draft created</div>
                        <div className="text-sm opacity-90">{state.message}</div>
                        {state.articleId && (
                            <a
                                href={`/studio/intent/edit/id=${state.articleId};type=article`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 mt-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2 rounded-full font-bold transition-colors"
                            >
                                <FileText className="w-3 h-3" />
                                Open in Sanity Studio
                            </a>
                        )}
                    </div>
                </div>
            )}

            {/* ERROR */}
            {!state.success && state.message && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                    <div>
                        <div className="font-bold">Import failed</div>
                        <div className="text-sm opacity-90 break-words">{state.message}</div>
                    </div>
                </div>
            )}
        </form>
    );
}
