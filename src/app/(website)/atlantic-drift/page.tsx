'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Header, Footer } from '@/components/layout'
import { submitWithOfflineQueue } from '@/lib/offline/submit'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  CheckCircle,
  Scale,
  Shield,
  Clock,
  Layers,
  KeyRound,
} from 'lucide-react'

const requiredNow = [
  'Transparency duties under Article 50 — disclosing AI interaction and labelling synthetic content',
  'A current inventory of the AI systems you place on, or operate into, the EU market',
  'Your role for each system — provider or deployer — because the duties differ sharply',
]

const mostlyNoise = [
  'Treating the date as a single “compliance cliff” to clear and forget',
  'Re-architecting onto an EU-only stack before a buyer has actually asked for it',
  'Box-ticking evidence that no European buyer’s questionnaire genuinely gates a deal on',
]

const selfCheck = [
  {
    icon: Layers,
    q: 'In-scope systems',
    body: 'Can you produce a straight list of the AI systems already in use across your teams — and say which touch the EU market or affect EU residents?',
  },
  {
    icon: Scale,
    q: 'Model provenance',
    body: 'For each system, do you know the model, the data behind it, and the vendors in the chain — with provenance and licence status you could evidence?',
  },
  {
    icon: KeyRound,
    q: 'Key custody',
    body: 'Where do inference, weights and keys sit, who can reach them, and where could a US administrative override still reach EU data?',
  },
]

export default function AtlanticDriftPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'queued' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      // Same site-wide Kit form; `atlantic-drift` is the source segment tag —
      // never a separate subscription (spec §1.2).
      const result = await submitWithOfflineQueue('/api/subscribe', {
        email,
        tags: ['atlantic-drift'],
      })
      if (result.queued) {
        setStatus('queued')
        setEmail('')
        return
      }
      const res = result.response

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to subscribe')
      }

      setStatus('success')
      setEmail('')
      window.plausible?.('Atlantic Drift Signup')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-slate-deep border-b border-border-subtle">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center lg:gap-12">
              <div>
                <Badge variant="outline" className="mb-4 border-stone-teal text-stone-teal">
                  For US executives operating in — or entering — Europe
                </Badge>
                <h1 className="text-4xl font-bold text-text-primary sm:text-5xl mb-6">
                  The US Executive’s Guide to European Digital Sovereignty
                </h1>
                <p className="text-xl text-text-muted leading-relaxed mb-6">
                  An independent reading of what Europe’s digital rules actually require of a
                  US company — what is genuine obligation, what is noise, and what is still
                  moving. No vendor affiliations; interpretation, not sales-enablement.
                </p>
                <p className="font-mono text-xs uppercase tracking-wider text-text-muted">
                  A free guide · delivered to your inbox
                </p>
              </div>

              <div className="relative">
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border-subtle lg:aspect-[3/2]">
                  <Image
                    src="/homepage-redesign-2026/the-watcher.png"
                    alt="A figure on a clifftop looking out across the North Atlantic toward Europe — the view from the edge"
                    fill
                    priority
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover object-[center_30%]"
                  />
                  {/* Gradient scrim for caption legibility. Caption text is
                      FIXED light (it always sits on the dark scrim over the
                      image) — it must not follow the theme tokens, which flip to
                      dark ink in light mode and vanish against the scrim. */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-deep via-slate-deep/70 to-transparent p-5 pt-16">
                    <p className="text-sm italic text-white/90 [text-shadow:0_1px_8px_rgba(0,0,0,0.7)]">
                      Published from the Atlantic edge — neutral ground between Washington and Brussels.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The problem */}
        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <div className="max-w-3xl">
            <h2 className="mb-4 text-2xl font-semibold text-text-primary">
              The problem: reach, then preference
            </h2>
            <p className="mb-4 leading-relaxed text-text-muted">
              The AI Act’s reach is extraterritorial. If your AI touches the EU market or
              affects EU residents, you are likely in scope — wherever you are
              headquartered. That is the first half of the exposure, and it is settled.
            </p>
            <p className="leading-relaxed text-text-muted">
              The second half is newer and softer. The EU’s 2026 Tech Sovereignty Package
              is reshaping procurement preference — where European buyers and public bodies
              would rather their data, models and keys sit. It is not a single statute with
              a single deadline; it is a direction of travel that is already showing up in
              enterprise questionnaires and contract clauses.
            </p>
          </div>
        </section>

        {/* Required vs noise */}
        <section className="border-y border-border-subtle bg-stone-charcoal/40">
          <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
            <h2 className="mb-8 text-2xl font-semibold text-text-primary">
              Genuinely required, versus the noise
            </h2>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="min-w-0 bg-stone-charcoal border-stone-teal/30">
                <CardHeader>
                  <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-stone-teal">
                    <CheckCircle className="h-4 w-4 flex-shrink-0" /> Genuinely required
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {requiredNow.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-text-primary">
                        <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-stone-teal" />
                        <span className="min-w-0 break-words">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card className="min-w-0 bg-stone-charcoal border-border-subtle">
                <CardHeader>
                  <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-text-muted">
                    <Scale className="h-4 w-4 flex-shrink-0" /> Mostly noise
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {mostlyNoise.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                        <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-text-muted/60" />
                        <span className="min-w-0 break-words">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* The moving timeline */}
        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <div className="max-w-3xl">
            <div className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-silicon-amber">
              <Clock className="h-4 w-4" /> The moving timeline
            </div>
            <h2 className="mb-4 text-2xl font-semibold text-text-primary">
              Operative now, versus adopted-but-pending
            </h2>
            <p className="mb-4 leading-relaxed text-text-muted">
              <strong className="text-text-primary">Operative from 2 August 2026:</strong>{' '}
              the Article 50 transparency duties and the penalty and governance regime that
              gives the Act teeth. This is the part that binds first.
            </p>
            <p className="leading-relaxed text-text-muted">
              <strong className="text-text-primary">Adopted but pending:</strong> the heavy
              high-risk obligations were re-timed, not removed — standalone high-risk
              (Annex III) on 2 December 2027, embedded high-risk (Annex I) on 2 August 2028.
              The re-timing is adopted, not yet settled law until publication, so treat the
              later dates as a planning horizon, not a reprieve. The work that actually takes
              time — the inventory, the vendor evidence — is not gated by any of these dates.
            </p>
          </div>
        </section>

        {/* Self-check */}
        <section className="border-y border-border-subtle bg-stone-charcoal/40">
          <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
            <h2 className="mb-2 text-2xl font-semibold text-text-primary">
              A two-minute self-check
            </h2>
            <p className="mb-8 max-w-2xl text-text-muted">
              Three questions that separate a real exposure picture from a comfortable one.
              If you cannot answer all three cleanly, the inventory is the place to start.
            </p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {selfCheck.map((item) => {
                const Icon = item.icon
                return (
                  <Card key={item.q} className="bg-stone-charcoal border-border-subtle">
                    <CardContent className="p-6">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-border-subtle bg-surface-elevated text-stone-teal">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mb-2 font-semibold text-text-primary">{item.q}</h3>
                      <p className="text-sm leading-relaxed text-text-muted">{item.body}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Email capture + next step */}
        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[3fr_2fr] lg:items-start">
            <div>
              <h2 className="mb-3 text-3xl font-bold text-text-primary sm:text-4xl">
                Get the guide
              </h2>
              <p className="mb-4 max-w-2xl leading-relaxed text-text-muted">
                Enter your email and the guide arrives in your inbox. You will also
                receive the Silicon &amp; Stone briefing — two editions a week, free,
                read from the US side.
              </p>
              <p className="mb-6 max-w-2xl leading-relaxed text-text-muted">
                Tuesday: the Stone Briefing — structural analysis of the AI power shift.
                Friday: the Practical Move — what to do about it. Unsubscribe at any
                time.
              </p>

              <div className="rounded-lg border border-silicon-amber/30 bg-silicon-amber/5 p-5">
                <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-silicon-amber">
                  <ArrowRight className="h-4 w-4" /> The next step
                </div>
                <p className="text-sm leading-relaxed text-text-muted">
                  When you want this read against your own systems rather than in general,
                  the{' '}
                  <Link href="/eu-exposure" className="text-silicon-amber hover:underline">
                    Post-Omnibus Briefing
                  </Link>{' '}
                  is the fixed-price, fixed-scope engagement — what the AI Act now requires of
                  your business, and the decisions to take this quarter.
                </p>
              </div>
            </div>

            <Card className="bg-stone-charcoal border-silicon-amber/40">
              <CardHeader>
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-text-muted">
                  <Shield className="h-4 w-4 text-stone-teal" /> Free guide
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {status === 'success' || status === 'queued' ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-lg border border-stone-teal/30 bg-stone-teal/10 p-6 text-center"
                  >
                    <CheckCircle className="mx-auto mb-3 h-10 w-10 text-stone-teal" />
                    <h3 className="mb-1 text-lg font-semibold text-text-primary">
                      {status === 'queued' ? 'Signup queued' : 'You’re in'}
                    </h3>
                    <p className="text-sm text-text-muted">
                      {status === 'queued'
                        ? 'You’re offline — your signup will send when the connection returns.'
                        : 'Check your inbox to confirm — the guide follows.'}
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      className="w-full rounded-md border border-border-subtle bg-slate-deep px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-silicon-amber"
                    />
                    <Button
                      type="submit"
                      disabled={status === 'loading'}
                      className="w-full bg-silicon-amber text-ink-on-accent hover:bg-silicon-amber/90"
                    >
                      {status === 'loading' ? 'Sending…' : 'Send me the guide'}
                      {status !== 'loading' && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                    {status === 'error' && (
                      <p className="text-sm text-alert-red">
                        {errorMsg || 'Something went wrong. Please try again.'}
                      </p>
                    )}
                    <p className="text-xs text-text-muted">
                      Free. Unsubscribe anytime. We handle your information in accordance
                      with GDPR.
                    </p>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
