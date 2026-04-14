'use client';

import { useState, useActionState } from 'react';
import { generateContent } from '../../actions';
import {
    Users,
    FileText,
    Sparkles,
    ArrowRight,
    CheckCircle,
    Loader2,
    AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper to assign colors based on role/index as fallback
function getPersonaColor(index: number) {
    const colors = [
        'bg-red-500/10 text-red-500 border-red-500/20',
        'bg-blue-500/10 text-blue-500 border-blue-500/20',
        'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        'bg-orange-500/10 text-orange-500 border-orange-500/20',
        'bg-purple-500/10 text-purple-500 border-purple-500/20',
    ];
    return colors[index % colors.length];
}

const TYPES = [
    { id: 'signal', name: 'Signal', desc: 'Rapid response (800 words)', icon: Sparkles },
    { id: 'deepdive', name: 'Deep Dive', desc: 'Forensic report (3000w)', icon: FileText },
    { id: 'guide', name: 'LinkedIn Post', desc: 'Executive summary', icon: Users },
];

const INITIAL_STATE = { success: false, message: '', path: '', id: '' };

interface Persona {
    _id: string;
    name: string;
    role: string;
    slug: { current: string };
}

export default function GeneratorForm({ personas }: { personas: Persona[] }) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ persona: '', type: '', topic: '' });
    const [state, formAction, isPending] = useActionState(generateContent, INITIAL_STATE);

    const handleNext = () => setStep(s => s + 1);

    return (
        <main className="p-8 max-w-3xl mx-auto min-h-screen flex flex-col justify-center">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">New Operational Draft</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className={cn(step >= 1 ? "text-primary font-bold" : "")}>1. Persona</span>
                    <ArrowRight className="w-4 h-4" />
                    <span className={cn(step >= 2 ? "text-primary font-bold" : "")}>2. Format</span>
                    <ArrowRight className="w-4 h-4" />
                    <span className={cn(step >= 3 ? "text-primary font-bold" : "")}>3. Topic</span>
                </div>
            </div>

            <form action={formAction}>
                <input type="hidden" name="persona" value={formData.persona} />
                <input type="hidden" name="type" value={formData.type} />

                {/* STEP 1: SELECT PERSONA */}
                {step === 1 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                        <h2 className="text-xl font-semibold">Who is the primary target?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {personas.map((p, i) => (
                                <button
                                    key={p.slug?.current || i}
                                    type="button"
                                    onClick={() => {
                                        setFormData({ ...formData, persona: p.slug?.current });
                                        handleNext();
                                    }}
                                    className={cn(
                                        "p-4 border rounded-xl text-left transition-all hover:scale-[1.02]",
                                        getPersonaColor(i),
                                        formData.persona === p.slug?.current ? "ring-2 ring-primary border-transparent" : "hover:border-primary/50"
                                    )}
                                >
                                    <div className="font-bold">{p.name}</div>
                                    <div className="text-sm opacity-80">{p.role}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 2: SELECT TYPE */}
                {step === 2 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                        <h2 className="text-xl font-semibold">What is the format?</h2>
                        <div className="grid grid-cols-1 gap-4">
                            {TYPES.map(t => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => {
                                        setFormData({ ...formData, type: t.id });
                                        handleNext();
                                    }}
                                    className={cn(
                                        "p-6 border border-border bg-card rounded-xl text-left flex items-center gap-4 transition-all hover:bg-muted/50",
                                        formData.type === t.id ? "ring-2 ring-primary border-transparent" : ""
                                    )}
                                >
                                    <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center">
                                        <t.icon className="w-6 h-6 text-slate-300" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-lg">{t.name}</div>
                                        <div className="text-muted-foreground">{t.desc}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <button type="button" onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground">Back</button>
                    </div>
                )}

                {/* STEP 3: TOPIC INPUT */}
                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-blue-500" />
                            What are we analyzing?
                        </h2>

                        <div className="bg-muted/20 p-6 rounded-xl border border-border">
                            <div className="flex gap-2 text-xs font-mono mb-4 text-muted-foreground uppercase tracking-widest">
                                <span>{personas.find(p => p.slug?.current === formData.persona)?.name}</span>
                                <span>/</span>
                                <span>{TYPES.find(t => t.id === formData.type)?.name}</span>
                            </div>

                            <textarea
                                name="topic"
                                rows={4}
                                className="w-full bg-transparent text-xl font-medium outline-none placeholder:text-muted-foreground/50 resize-none"
                                placeholder="e.g. The impact of 2nm fab delays on Stuttgart automotive supply chains..."
                                value={formData.topic}
                                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                autoFocus
                                required
                            />
                        </div>

                        <div className="flex justify-between items-center">
                            <button type="button" onClick={() => setStep(2)} className="text-sm text-muted-foreground hover:text-foreground">Back</button>
                            <button
                                type="submit"
                                disabled={isPending || !formData.topic}
                                className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isPending ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Generating Draft...</>
                                ) : (
                                    <><Sparkles className="w-4 h-4" /> Generate Draft</>
                                )}
                            </button>
                        </div>

                        {state?.success && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-4 rounded-lg flex items-center gap-3">
                                <CheckCircle className="w-5 h-5" />
                                <div>
                                    <div className="font-bold">Mission Complete</div>
                                    <div className="text-sm opacity-90">{state.message}</div>
                                    <a
                                        href={`/studio/intent/edit/id=${state.id};type=article`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 mt-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2 rounded-full font-bold transition-colors"
                                    >
                                        <FileText className="w-3 h-3" />
                                        Open in Sanity Studio
                                    </a>
                                </div>
                            </div>
                        )}

                        {state && !state.success && state.message && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                                <div>
                                    <div className="font-bold">Generation Failed</div>
                                    <div className="text-sm opacity-90 break-words">{state.message}</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </form>
        </main>
    );
}
