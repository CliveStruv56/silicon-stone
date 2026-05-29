import Link from "next/link";
import { getICP, getBusinessProfile, getVoiceDNA } from "@/lib/api";
import {
  Terminal,
  Globe,
  Users,
  Zap,
  FileText,
  Search
} from "lucide-react";

export default async function Home() {
  const [icp, profile, voice] = await Promise.all([
    getICP(),
    getBusinessProfile(),
    getVoiceDNA()
  ]);

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <header className="flex justify-between items-center border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
            <Terminal className="w-8 h-8" />
            Silicon & Stone
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            {profile.positioning.unique_angle || "The Long View from the Edge"}
          </p>
        </div>
        <div className="flex gap-4">
          {/* Placeholder for future auth/settings */}
          <div className="bg-card px-4 py-2 rounded-full border border-border text-sm font-mono text-muted-foreground">
            v1.0.0 • Local
          </div>
        </div>
      </header>

      {/* Quick Actions Grid */}
      <section className="grid md:grid-cols-3 gap-6">
        <Link
          href="/create"
          className="p-6 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer group block"
        >
          <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20">
            <Zap className="w-6 h-6 text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">New Signal</h3>
          <p className="text-muted-foreground text-sm">Rapid response analysis (24-72h). 800 words.</p>
        </Link>

        <Link
          href="/create"
          className="p-6 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer group block"
        >
          <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20">
            <FileText className="w-6 h-6 text-emerald-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">New Deep Dive</h3>
          <p className="text-muted-foreground text-sm">Comprehensive forensic report. 3000+ words.</p>
        </Link>

        <Link
          href="/research"
          className="p-6 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer group relative block"
        >
          {/* <div className="absolute top-4 right-4 text-[10px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">NEW</div> */}
          <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500/20">
            <Search className="w-6 h-6 text-purple-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Research Topic</h3>
          <p className="text-muted-foreground text-sm">Launch agent to gather fresh context.</p>
        </Link>
      </section>

      {/* Mission Status */}
      <section className="bg-card border border-border rounded-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="w-6 h-6 text-secondary-foreground" />
          <h2 className="text-2xl font-bold">Mission Status: Forensic Technopolitics</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-4 font-semibold">Active Pillars</h3>
            <div className="space-y-3">
              {Object.entries(profile.content_focus.content_pillars).map(([key]) => (
                <div key={key} className="p-3 bg-muted/30 rounded border border-border/50">
                  <span className="font-mono text-blue-400 capitalize">{key.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-4 font-semibold">Voice DNA</h3>
            <div className="flex flex-wrap gap-2">
              {voice.personality.traits.map((adj) => (
                <span key={adj} className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-sm border border-slate-700">
                  {adj}
                </span>
              ))}
            </div>
            <div className="mt-4">
              <h4 className="text-xs text-muted-foreground mb-2">KEYWORDS 2026</h4>
              <p className="font-mono text-sm text-green-500">
                {voice.vocabulary?.keywords_2026?.join(' • ') || "No keywords loaded"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Target Personas */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-6 h-6 text-secondary-foreground" />
          <h2 className="text-2xl font-bold">Target Personas</h2>
        </div>
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(icp.personas)
            .filter(([key]) => !key.startsWith('_'))
            .map(([key, persona]) => (
              <div key={key} className="bg-card border border-border p-4 rounded-lg hover:border-blue-500/50 transition-colors">
                <div className="h-8 w-8 rounded bg-slate-800 flex items-center justify-center mb-3">
                  <span className="text-xs font-bold text-slate-300">{key[0].toUpperCase()}</span>
                </div>
                <h3 className="font-semibold text-foreground">{persona.role}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                  {persona.pain_point}
                </p>
              </div>
            ))}
        </div>
      </section>
    </main>
  );
}
