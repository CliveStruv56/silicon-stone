'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Header, Footer } from '@/components/layout'
import { submitWithOfflineQueue } from '@/lib/offline/submit'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ArrowRight,
  CheckCircle,
  Mail,
  User,
  Building2,
  MessageSquare,
  Shield,
  Clock,
  Scale,
} from 'lucide-react'

const briefingIncludes = [
  'AI Act scope classification — which of your systems are in scope, at which risk tier',
  'The August 2026 reality — what the deadline genuinely requires versus what can follow',
  'Sovereignty-package exposure — where procurement preferences threaten your market access',
  'Durable-obligation map — what becomes an ongoing operating requirement',
  'Prioritised first actions, and a clear view of what needs a standing relationship',
]

export default function EuExposurePage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    interest: 'EU Exposure Briefing',
    message: '',
  })
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [formQueued, setFormQueued] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')

    try {
      const result = await submitWithOfflineQueue('/api/contact', formData)
      if (result.queued) {
        setFormQueued(true)
        setFormSubmitted(true)
        return
      }
      const res = result.response

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to send enquiry')
      }

      setFormSubmitted(true)
      window.plausible?.('EU Exposure Form Submit')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setFormLoading(false)
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
                  For US companies operating in — or entering — Europe
                </Badge>
                <h1 className="text-4xl font-bold text-text-primary sm:text-5xl mb-6">
                  The deadline is the easy part. The requirement is permanent.
                </h1>
                <p className="text-xl text-text-muted leading-relaxed mb-6">
                  The AI Act’s reach is extraterritorial: if your AI touches the EU market or
                  affects EU residents, you are likely in scope — wherever you are
                  headquartered. From 2 August 2026 the transparency duties and the penalty
                  regime apply, and a national authority can act against systems placed on the
                  EU market. The heavier high-risk obligations arrive in stages after that —
                  standalone high-risk from 2 December 2027, embedded high-risk from 2 August
                  2028 — which is precisely why this is a maintained state, not a one-time fix:
                  the obligations keep arriving, and the documentation behind them has to keep
                  pace.
                </p>
                <p className="text-text-muted leading-relaxed">
                  The deadline is the easy part to understand. The harder truth is in the
                  upkeep: high-risk systems carry ongoing monitoring and documentation duties,
                  and the EU’s 2026 Tech Sovereignty Package is already reshaping market access
                  for US providers. A project ends; this does not.
                </p>
                <p className="mt-5 font-mono text-xs uppercase tracking-wider text-text-muted">
                  Regulatory copy last reviewed: 25 June 2026
                </p>
              </div>

              <div className="relative">
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border-subtle lg:aspect-square">
                  <Image
                    src="/intelligence-stream-bg.png"
                    alt="A Forensic Technopolitics global risk map — the AI Act's extraterritorial reach traced across transatlantic data flows"
                    fill
                    priority
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover object-center"
                  />
                  {/* Gradient scrim for caption legibility. Caption text is
                      FIXED light (it always sits on the dark scrim over the
                      image) — it must not follow the theme tokens, which flip to
                      dark ink in light mode and vanish against the scrim. */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-deep via-slate-deep/70 to-transparent p-5 pt-16">
                    <p className="text-sm italic text-white/90 [text-shadow:0_1px_8px_rgba(0,0,0,0.7)]">
                      The fault line itself, read independently — neither pro-US nor pro-Europe.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Shadow-AI opener — the inventory comes first (B1) */}
        <section className="mx-auto max-w-7xl px-6 pt-10 lg:px-8 lg:pt-12">
          <div className="max-w-3xl border-l-2 border-silicon-amber/50 pl-5">
            <p className="text-lg leading-relaxed text-text-primary/90">
              You cannot govern — or vouch for — what you cannot see. Most organisations
              cannot produce a straight list of the AI systems already in use across their
              teams, let alone the vendors behind them. That is the first exposure: you
              cannot meet an Article 26 deployer duty, or answer a buyer’s questionnaire, on
              a system nobody logged. We start by making the inventory real.
            </p>
          </div>
        </section>

        {/* What I do — neutral interpreter stance */}
        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <div className="max-w-3xl">
            <h2 className="mb-4 text-2xl font-semibold text-text-primary">What I do</h2>
            <p className="leading-relaxed text-text-muted">
              I am not here to sell you European software, and I am not here to coach you past
              the regulator. I read the fault line itself — independently — and tell you what
              the European posture actually means for your business: what is genuinely required
              by the deadline, what is durable obligation, and where your real exposure sits
              versus the noise.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm text-text-muted">
              <span className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-stone-teal" /> Neutral interpreter — not pro-US, not pro-Europe
              </span>
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-stone-teal" /> No vendor affiliations
              </span>
            </div>
          </div>
        </section>

        {/* The EU Exposure Briefing — the offer */}
        <section className="border-y border-silicon-amber/30 bg-silicon-amber/5">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[3fr_2fr] lg:items-start">
              <div>
                <Badge className="mb-4 bg-silicon-amber text-ink-on-accent">Fixed scope</Badge>
                <h2 className="mb-3 text-3xl font-bold text-text-primary sm:text-4xl">
                  The EU Exposure Briefing
                </h2>
                <p className="mb-6 max-w-2xl text-lg text-text-primary/90">
                  A fixed-scope diagnostic for US firms with EU customers, operations, or
                  ambitions.
                </p>
                <p className="max-w-2xl leading-relaxed text-text-muted">
                  The deadline opens the door; the ongoing requirement keeps it open. This
                  briefing separates what the August 2026 date genuinely requires from what
                  becomes a durable operating obligation — and shows where a standing
                  relationship earns its place.
                </p>
              </div>

              <Card className="bg-stone-charcoal border-silicon-amber/40">
                <CardHeader>
                  <div className="text-xs font-mono uppercase tracking-wider text-text-muted">
                    What it covers
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <ul className="space-y-3">
                    {briefingIncludes.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-text-primary">
                        <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-silicon-amber" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-border-subtle pt-4 text-sm text-text-muted">
                    Written briefing (15–25 pages) · executive summary · one interpretation call.
                  </div>
                  <div className="border-t border-border-subtle pt-4">
                    <div className="text-lg font-semibold text-text-primary">
                      From £3,500<span className="text-text-muted">, fixed</span>
                    </div>
                    <div className="text-sm text-text-muted">
                      Fee credited toward the first quarter of a Drift Retainer.
                    </div>
                  </div>
                  <a href="#contact" className="block">
                    <Button size="lg" className="w-full bg-silicon-amber text-ink-on-accent hover:bg-silicon-amber/90">
                      Request the EU Exposure Briefing
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </div>

            <p className="mt-8 max-w-2xl text-sm italic text-text-muted">
              No vendor affiliations. No axe to grind. Independent interpretation, published
              from the Atlantic edge.
            </p>
          </div>
        </section>

        {/* Procurement Exposure — add-on to the briefing (A3) */}
        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <Card className="bg-stone-charcoal border-border-subtle">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-stone-teal text-stone-teal">
                  Add-on
                </Badge>
                <span className="font-mono text-xs uppercase tracking-wider text-text-muted">
                  To the EU Exposure Briefing
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-text-primary">
                Procurement Exposure
              </h2>
              <p className="mt-2 max-w-2xl text-text-muted">
                See which missing evidence will actually stall your European deals — and
                which is just box-ticking.
              </p>
            </CardHeader>
            <CardContent>
              <div className="mb-3 font-mono text-xs uppercase tracking-wider text-text-muted">
                Deliverables
              </div>
              <ul className="space-y-2">
                {[
                  'Your AI systems mapped against the governance questionnaires European buyers now send',
                  'A required-versus-theatre triage: the evidence that genuinely gates procurement, separated from the noise',
                  'A review of the AI indemnification clauses appearing in EU enterprise contracts — what you’d be signing',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-primary">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-stone-teal" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm font-semibold text-text-primary">
                Add-on from £1,500.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Contact — self-contained */}
        <section id="contact" className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-semibold text-text-primary mb-4">
                Request the EU Exposure Briefing
              </h2>
              <p className="text-text-muted mb-6">
                Tell me where your AI touches Europe and what you are trying to protect. I will
                respond with initial thoughts and a scoped next step.
              </p>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-stone-teal flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-text-primary font-medium">Confidentiality first</div>
                    <p className="text-text-muted">All enquiries are treated with strict confidentiality.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-stone-teal flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-text-primary font-medium">Rapid response</div>
                    <p className="text-text-muted">Initial response within 48 hours on business days.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Scale className="w-5 h-5 text-stone-teal flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-text-primary font-medium">Independent reading</div>
                    <p className="text-text-muted">No vendor affiliations; interpretation, not sales-enablement.</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              {formSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-stone-teal/10 border border-stone-teal/30 rounded-lg p-8 text-center"
                >
                  <CheckCircle className="w-12 h-12 text-stone-teal mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-text-primary mb-2">
                    {formQueued ? 'Enquiry queued' : 'Enquiry received'}
                  </h3>
                  <p className="text-text-muted">
                    {formQueued
                      ? 'You’re offline — your enquiry will send automatically when the connection returns.'
                      : 'Thank you for reaching out. I will review your enquiry and respond within 48 hours.'}
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-text-muted mb-1.5">
                        <User className="w-3 h-3 inline mr-1" />
                        Name
                      </label>
                      <Input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="bg-stone-charcoal border-border-subtle text-text-primary placeholder:text-text-muted/50 focus:border-stone-teal"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-text-muted mb-1.5">
                        <Mail className="w-3 h-3 inline mr-1" />
                        Email
                      </label>
                      <Input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="bg-stone-charcoal border-border-subtle text-text-primary placeholder:text-text-muted/50 focus:border-stone-teal"
                        placeholder="you@company.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-text-muted mb-1.5">
                      <Building2 className="w-3 h-3 inline mr-1" />
                      Company
                    </label>
                    <Input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="bg-stone-charcoal border-border-subtle text-text-primary placeholder:text-text-muted/50 focus:border-stone-teal"
                      placeholder="Your organisation"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-text-muted mb-1.5">
                      <MessageSquare className="w-3 h-3 inline mr-1" />
                      Where does your AI touch Europe?
                    </label>
                    <textarea
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full rounded-md border border-border-subtle bg-stone-charcoal px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/50 focus:border-stone-teal focus:outline-none focus:ring-1 focus:ring-stone-teal"
                      placeholder="EU customers, operations, data, or market ambitions — and what you are trying to protect."
                    />
                  </div>

                  {formError && (
                    <p className="text-sm text-alert-red text-center">
                      {formError}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={formLoading}
                    className="w-full bg-silicon-amber text-ink-on-accent hover:bg-silicon-amber/90"
                  >
                    {formLoading ? 'Sending...' : 'Request the EU Exposure Briefing'}
                    {!formLoading && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>

                  <p className="text-xs text-text-muted text-center">
                    By submitting, you agree to our handling of your information in accordance with GDPR.
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
