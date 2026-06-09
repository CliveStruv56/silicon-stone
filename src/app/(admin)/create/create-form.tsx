"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Zap, FileText, Search, BrainCircuit, ExternalLink, Activity, Video, BookOpen } from "lucide-react";
import { startResearch, pollResearchJob, createDraftFromResearch } from "./actions";
import type { PersonaData } from "@/lib/sanity";

import { ResearchResult, ResearchSource } from "@/types/research";

export type FormatType = "pulse" | "signal" | "deep_dive" | "guide" | "youtube" | "research";

interface CreateFormProps {
    initialPersonas: PersonaData[];
}

export function CreateForm({ initialPersonas }: CreateFormProps) {
    const router = useRouter();
    const [format, setFormat] = useState<FormatType>("signal");
    const [personaSlug, setPersonaSlug] = useState<string>(initialPersonas[0]?.slug.current || "");
    const [topic, setTopic] = useState("");

    const [isResearching, setIsResearching] = useState(false);
    const [researchResult, setResearchResult] = useState<ResearchResult | null>(null);

    const [isGenerating, setIsGenerating] = useState(false);

    async function pollDeepJob(jobId: string): Promise<ResearchResult> {
        // Deep research runs as a Railway background job. Poll from the browser
        // via a short server action so no single request hits a serverless timeout.
        const startedAt = Date.now();
        const TIMEOUT_MS = 12 * 60 * 1000;
        const INTERVAL_MS = 4000;
        while (Date.now() - startedAt < TIMEOUT_MS) {
            await new Promise((r) => setTimeout(r, INTERVAL_MS));
            const res = await pollResearchJob(jobId, topic);
            if (res.status === "completed" && res.result) return res.result;
            if (res.status === "failed") throw new Error(res.error || "Deep research failed");
        }
        throw new Error("Deep research timed out");
    }

    async function handleLaunchResearch() {
        if (!topic.trim() || !personaSlug) return;

        setIsResearching(true);
        setResearchResult(null);
        try {
            // Deep Dive uses Exa's agentic Research API (slower, multi-step) and runs
            // as a Railway background job when configured; every other format uses the
            // fast recency-biased web search and returns inline.
            const started = await startResearch(topic, format === "deep_dive");
            const result = started.mode === "job"
                ? await pollDeepJob(started.jobId)
                : started.result;
            setResearchResult(result);
        } catch (error) {
            console.error("Research failed:", error);
            alert("Failed to gather intelligence. Please check the logs.");
        } finally {
            setIsResearching(false);
        }
    }

    async function handleGenerateDraft() {
        if (!researchResult) return;

        setIsGenerating(true);
        try {
            // On success the action returns { ok: true } and we navigate to Studio.
            // On failure it returns { error } — a specific message naming the
            // API/credential at fault. (The action intentionally does not
            // redirect() itself; that threw a spurious error on the client.)
            const result = await createDraftFromResearch(researchResult, format as "pulse" | "signal" | "deep_dive" | "guide" | "youtube", personaSlug, topic);
            if ("error" in result) {
                alert(result.error);
                setIsGenerating(false);
                return;
            }
            router.push("/studio/structure/article");
        } catch (error) {
            console.error("Generation failed:", error);
            alert("Failed to generate draft — the request didn't reach the server (network or session issue). Please try again.");
            setIsGenerating(false);
        }
    }

    return (
        <div className="space-y-8">
            {/* Configuration Panel */}
            <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur">
                <CardHeader className="pb-4">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        Mission Parameters
                    </CardTitle>
                    <CardDescription>Configure the format, target persona, and primary topic.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Step 1: Format */}
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs">1</span>
                            Format
                        </Label>
                        <RadioGroup defaultValue={format} onValueChange={(v: string) => setFormat(v as FormatType)} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            <div>
                                <RadioGroupItem value="pulse" id="format-pulse" className="peer sr-only" />
                                <Label
                                    htmlFor="format-pulse"
                                    className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-cyan-500 [&:has([data-state=checked])]:border-cyan-500 cursor-pointer"
                                >
                                    <Zap className="mb-3 h-6 w-6 text-cyan-500" />
                                    <div className="font-semibold mb-1">Pulse</div>
                                    <div className="text-xs text-muted-foreground text-center">30-second scan</div>
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem value="signal" id="format-signal" className="peer sr-only" />
                                <Label
                                    htmlFor="format-signal"
                                    className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-blue-500 [&:has([data-state=checked])]:border-blue-500 cursor-pointer"
                                >
                                    <Zap className="mb-3 h-6 w-6 text-blue-500" />
                                    <div className="font-semibold mb-1">Signal</div>
                                    <div className="text-xs text-muted-foreground text-center">Rapid 800-word analysis</div>
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem value="deep_dive" id="format-deep" className="peer sr-only" />
                                <Label
                                    htmlFor="format-deep"
                                    className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-emerald-500 [&:has([data-state=checked])]:border-emerald-500 cursor-pointer"
                                >
                                    <FileText className="mb-3 h-6 w-6 text-emerald-500" />
                                    <div className="font-semibold mb-1">Deep Dive</div>
                                    <div className="text-xs text-muted-foreground text-center">3000+ word forensic report</div>
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem value="guide" id="format-guide" className="peer sr-only" />
                                <Label
                                    htmlFor="format-guide"
                                    className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-amber-500 [&:has([data-state=checked])]:border-amber-500 cursor-pointer"
                                >
                                    <BookOpen className="mb-3 h-6 w-6 text-amber-500" />
                                    <div className="font-semibold mb-1">Guide</div>
                                    <div className="text-xs text-muted-foreground text-center">How-to for a tool or technique</div>
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem value="youtube" id="format-youtube" className="peer sr-only" />
                                <Label
                                    htmlFor="format-youtube"
                                    className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-red-500 [&:has([data-state=checked])]:border-red-500 cursor-pointer"
                                >
                                    <Video className="mb-3 h-6 w-6 text-red-500" />
                                    <div className="font-semibold mb-1">YouTube Script</div>
                                    <div className="text-xs text-muted-foreground text-center">12-18 min video outline</div>
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem value="research" id="format-research" className="peer sr-only" />
                                <Label
                                    htmlFor="format-research"
                                    className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-purple-500 [&:has([data-state=checked])]:border-purple-500 cursor-pointer"
                                >
                                    <Search className="mb-3 h-6 w-6 text-purple-500" />
                                    <div className="font-semibold mb-1">Research Only</div>
                                    <div className="text-xs text-muted-foreground text-center">Gather Intel without drafting</div>
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Step 2: Persona */}
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs">2</span>
                            Target Persona
                        </Label>
                        <Select value={personaSlug} onValueChange={setPersonaSlug}>
                            <SelectTrigger className="w-full h-12">
                                <SelectValue placeholder="Select a persona" />
                            </SelectTrigger>
                            <SelectContent>
                                {initialPersonas.map((persona) => (
                                    <SelectItem key={persona.slug.current} value={persona.slug.current} className="py-3">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{persona.role}</span>
                                            <span className="text-xs text-muted-foreground">{persona.painPoints}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Step 3: Topic */}
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs">3</span>
                            Primary Topic
                        </Label>
                        <div className="flex gap-3">
                            <Input
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g. EU AI Act implications for open source models"
                                className="flex-1 h-12 text-lg"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && topic.trim() && !isResearching) {
                                        handleLaunchResearch();
                                    }
                                }}
                            />
                            <Button
                                onClick={handleLaunchResearch}
                                disabled={!topic.trim() || isResearching || !personaSlug}
                                className="h-12 px-8 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                            >
                                {isResearching ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        {format === "deep_dive" ? "Researching (a few min)..." : "Gathering Intel..."}
                                    </>
                                ) : (
                                    <>
                                        <BrainCircuit className="mr-2 h-5 w-5" />
                                        Launch Agent
                                    </>
                                )}
                            </Button>
                        </div>
                        {format === "deep_dive" && (
                            <p className="text-xs text-muted-foreground">
                                Deep Dive runs an agentic, multi-step research pass (Exa Research Pro). Expect a few minutes and a higher per-run cost than other formats.
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Results Panel */}
            {researchResult && (
                <Card className="border-border/50 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <CardHeader className="bg-muted/30 border-b border-border/50">
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Activity className="w-5 h-5 text-emerald-500" />
                            Intelligence Gathered
                        </CardTitle>
                        <CardDescription>
                            {researchResult.sources.length} sources analysed.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-6 space-y-6">

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/20 rounded-xl border border-border/50">
                            <div className="flex-1">
                                <h4 className="font-semibold mb-1">Ready for Action</h4>
                                <p className="text-sm text-muted-foreground">The context is ready. You can generate a full draft or ask the AI Assistant to manually save this to your NotebookLM memory.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {format !== "research" && (
                                    <Button
                                        onClick={handleGenerateDraft}
                                        disabled={isGenerating}
                                        size="lg"
                                        className="font-bold shadow-md bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        {isGenerating ? (
                                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Writing Draft...</>
                                        ) : (
                                            <>{format === 'youtube' ? <Video className="mr-2 h-4 w-4" /> : format === 'guide' ? <BookOpen className="mr-2 h-4 w-4" /> : <FileText className="mr-2 h-4 w-4" />} Generate {format === 'pulse' ? 'Pulse' : format === 'signal' ? 'Signal' : format === 'youtube' ? 'YouTube Script' : format === 'guide' ? 'Guide' : 'Deep Dive'}</>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Forensic Summary */}
                        <div className="space-y-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <BrainCircuit className="w-4 h-4 text-purple-500" />
                                Forensic Summary
                            </h3>
                            <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/10 p-6 rounded-xl border border-border">
                                {researchResult.summary.split('\n').map((line: string, i: number) => (
                                    <p key={i} className="mb-2 last:mb-0">{line}</p>
                                ))}
                            </div>
                        </div>

                        {/* Identified Pain Points */}
                        <div className="space-y-3">
                            <h3 className="font-semibold">Contextual Hooks</h3>
                            <div className="flex flex-wrap gap-2">
                                {researchResult.suggestedContext.pain_points.map((point: string, i: number) => (
                                    <span key={i} className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs font-medium border border-blue-500/20">
                                        {point}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Source Index */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Source Index</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {researchResult.sources.map((source: ResearchSource, i: number) => (
                                    <a
                                        key={i}
                                        href={source.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex flex-col gap-1 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors group"
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">{source.title}</span>
                                            <ExternalLink className="w-3 h-3 text-muted-foreground opacity-50 group-hover:opacity-100 flex-shrink-0 mt-1" />
                                        </div>
                                        {source.snippet && <p className="text-xs text-muted-foreground line-clamp-2">{source.snippet}</p>}
                                        <span className="text-[10px] text-muted-foreground/70 uppercase tracking-widest mt-2">source</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
