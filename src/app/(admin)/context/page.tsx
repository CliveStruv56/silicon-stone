import { getICP } from "@/lib/api";
import { Users, Edit2, Award } from "lucide-react";
import Link from "next/link";

export default async function ContextPage() {
    const icp = await getICP();

    // Filter out metadata keys like _meta if they existed, though schema seems clean
    const personas = Object.entries(icp.personas);

    return (
        <main className="p-8 max-w-5xl mx-auto min-h-screen">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                    <Users className="w-8 h-8 text-indigo-500" />
                    Context Manager
                </h1>
                <p className="text-muted-foreground">
                    Tune the cognitive models and target personas.
                </p>
            </div>

            <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-400" />
                    Active Personas
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                    {personas.map(([key, persona]) => (
                        <div key={key} className="bg-card border border-border rounded-xl p-6 relative group">
                            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Link
                                    href={`/context/edit?key=${key}`}
                                    className="p-2 bg-muted hover:bg-primary hover:text-white rounded-lg flex items-center gap-2 text-xs font-bold transition-colors"
                                >
                                    <Edit2 className="w-3 h-3" /> Edit
                                </Link>
                            </div>

                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-12 w-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-lg">
                                    {key.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{persona.role}</h3>
                                    <div className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded inline-block">
                                        Key: {key}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                                    <span className="text-xs font-bold text-muted-foreground uppercase block mb-1">Pain Point</span>
                                    <p className="text-sm leading-relaxed">{persona.pain_point}</p>
                                </div>

                                <div>
                                    <span className="text-xs font-bold text-muted-foreground uppercase block mb-1">Example</span>
                                    <p className="text-sm text-muted-foreground italic">&ldquo;{persona.example}&rdquo;</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}
