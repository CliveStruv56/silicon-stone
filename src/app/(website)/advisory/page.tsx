'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Header, Footer } from '@/components/layout'
import { LadderBox } from '@/components/products/LadderBox'
import { submitWithOfflineQueue } from '@/lib/offline/submit'
import { BOOKING_URL, FREE_INTRO_WINDOW } from '@/lib/flags'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Clock,
  CheckCircle,
  ArrowRight,
  Mail,
  Building2,
  User,
  MessageSquare,
  Shield,
} from 'lucide-react'
import {
  AMOUNTS,
  ENGAGEMENTS as CATALOGUE_ENGAGEMENTS,
  MODULES,
  gbp,
  type Offering,
} from '@/lib/offering'



/**
 * The contact form's two questions.
 *
 * These were one field. It listed "Drift Retainer" alongside "Vendor
 * Dependency" and "Scenario Planning" — one engagement mixed in with five
 * subject areas — so it could answer neither question properly: three priced
 * tiers whose CTAs land on this very form (Advisory Briefing £450, Exposure
 * Diagnostic from £2,500, Strategic Assessment from £8,000) had no value at
 * all, and those leads reached Kit indistinguishable from a topic enquiry.
 *
 * `ENGAGEMENTS` is the ladder, in ascending order, and is what gets segmented
 * on — so the strings are exact-match tags, not prose. "Drift Retainer" keeps
 * its historic wording rather than the page's "The Drift Retainer" so any
 * existing Kit segment still matches. European Procurement Readiness now
 * belongs within the diagnostic or assessment scope.
 */
const ENGAGEMENTS = [
  'Advisory Briefing',
  'Exposure Diagnostic',
  'Drift Retainer',
  'Strategic Assessment',
  'Board-level engagement',
] as const

/** Optional second question — the subject, independent of the commitment. */
const SUBJECT_AREAS = [
  'AI Governance',
  'Vendor Dependency',
  'Manufacturing Exposure',
  'Scenario Planning',
  'Policy Analysis',
] as const

/**
 * The four rungs, in ascending commitment, straight from the catalogue.
 *
 * This replaces a local `tiers` array and a `Tier` type that had grown four
 * optional bolt-on fields — `positioning`, `priceDetail`, `introDistinction`,
 * `pathNote` — each added to squeeze more copy into a four-across grid cell.
 * That is what a format looks like when it has run out; every one of those
 * fields is now a section on the engagement's own page.
 *
 * Reading the ids from `ENGAGEMENTS` means the chooser cannot disagree with
 * /pricing or the header nav about a price, a name or a URL.
 */
const LADDER_ENGAGEMENTS = [
  'advisory-briefing',
  'exposure-diagnostic',
  'drift-retainer',
  'strategic-assessment',
]
  .map((id) => CATALOGUE_ENGAGEMENTS.find((offering) => offering.id === id))
  .filter((offering): offering is Offering => Boolean(offering))

export default function ServicesPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    engagement: '',
    subject: '',
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
      // The form asks two questions; the wire contract carries one `interest`
      // field, and `/api/contact` proxies a fixed five-field body to the
      // Railway backend. So the engagement — the value Kit segments on — takes
      // `interest` alone and stays an exact-match string, and the optional
      // subject rides in as a labelled first line of the message rather than
      // being blended into the tag or posted as a field the backend would
      // silently drop.
      const result = await submitWithOfflineQueue('/api/contact', {
        name: formData.name,
        email: formData.email,
        company: formData.company,
        interest: formData.engagement,
        message: formData.subject
          ? `Subject area: ${formData.subject}\n\n${formData.message}`
          : formData.message,
      })
      if (result.queued) {
        setFormQueued(true)
        setFormSubmitted(true)
        return
      }
      const res = result.response

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to send inquiry')
      }

      setFormSubmitted(true)
      // The engagement rides as a prop. Without it this goal counted advisory
      // leads in one undifferentiated bucket, so there was no way to tell a
      // £450 briefing enquiry from a £25,000 board mandate in analytics.
      window.plausible?.('Contact Form Submit', {
        props: { engagement: formData.engagement || 'Unspecified' },
      })
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
        {/* Hero Section */}
        <section className="bg-slate-deep border-b border-border-subtle">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center lg:gap-12">
              <div>
                {/* "Advisory" not "Services": the nav, the URL and the page
                    metadata all say Advisory, and this badge was the only
                    surface calling it something else. */}
                <Badge variant="outline" className="mb-4 border-stone-teal text-stone-teal">
                  Advisory
                </Badge>
                <h1 className="text-4xl font-bold text-text-primary sm:text-5xl mb-6">
                  Our Advisory offerings in a nutshell
                </h1>
                <p className="text-xl text-text-muted leading-relaxed mb-6">
                  AI adoption creates a governance problem and a dependency problem at
                  the same time — and both keep moving. We help organisations map the
                  exposure, then stay ahead of it.
                </p>
                <p className="text-text-muted leading-relaxed">
                  Most engagements begin with a single diagnostic question and grow into a
                  standing relationship: the systems in use, the evidence missing from
                  vendors, the technology exposures that could become operating
                  constraints — read continuously, not once.
                </p>

                {/* The offer, named and priced, above the fold. The H1 is a
                    category; the page metadata leads with the Drift Retainer,
                    so a reader arriving from search was promised a product and
                    met a category. This is the reconciliation. */}
                <p className="mt-6 border-l-2 border-silicon-amber/60 pl-4 leading-relaxed text-text-muted">
                  <strong className="font-semibold text-text-primary">In short.</strong>{' '}
                  The Drift Retainer is a standing monthly read on how the drift moves
                  against your business, {gbp(AMOUNTS.driftRetainerMonthly)} a month.
                  If you would rather take one pass at it first, the Exposure Diagnostic
                  is from {gbp(AMOUNTS.exposureDiagnostic)}.
                </p>

                {/* The page had no CTA above the fold at all — the first
                    actionable element sat inside the Retainer card. */}
                <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                  <a
                    href="#contact"
                    onClick={() => setFormData((prev) => ({ ...prev, engagement: 'Drift Retainer' }))}
                  >
                    <Button size="lg" className="bg-accent-fill text-ink-on-accent hover:bg-accent-fill/90">
                      Book a 25-minute conversation
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                  <Link href="/methodology" className="text-sm text-stone-teal hover:underline">
                    How the method works →
                  </Link>
                </div>
                {FREE_INTRO_WINDOW && (
                  <p className="mt-2 text-xs italic text-text-muted">
                    Free during our launch window — the first ninety days.
                  </p>
                )}
              </div>

              <div className="relative">
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border-subtle lg:aspect-square">
                  <Image
                    src="/advisory/advisory-overview.webp"
                    alt="A coastal workspace with charts and a compass overlooking a working container port"
                    fill
                    priority
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover object-center"
                  />
                  {/* Gradient scrim for caption legibility */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-scrim-ink via-scrim-ink/70 to-transparent p-5 pt-16">
                    <p className="text-sm italic text-balance text-white/90 [text-shadow:0_1px_8px_rgba(0,0,0,0.7)]">
                      Read continuously, and pointed at your business rather than the market.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Drift Retainer — the spine */}
        {/* The Drift Retainer moved to /advisory/drift-retainer on 2026-09-04.
            This block stays, and keeps the id, because twelve places across the
            site pointed at `#retainer` — four tool pages, /methodology, the
            homepage band, the Start Here spine, AdvisoryNextStep and the
            catalogue among them — and an anchor that no longer exists does not
            404. It silently scrolls nowhere, which is the kind of breakage
            nobody reports. A hub should summarise its engagements anyway. */}
        <section id="retainer" className="scroll-mt-24 border-y border-silicon-amber/30 bg-silicon-amber/5">
          <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[3fr_2fr] lg:items-center">
              <div>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <Badge className="bg-accent-fill text-ink-on-accent">Most popular</Badge>
                  <Badge variant="outline" className="border-silicon-amber text-silicon-amber-strong">
                    Ongoing
                  </Badge>
                </div>
                <h2 className="mb-3 text-2xl font-semibold text-text-primary">
                  The Drift Retainer
                </h2>
                <p className="mb-4 max-w-2xl leading-relaxed text-text-muted">
                  The standing relationship, and the spine of everything here. A senior,
                  independent reading of how technopolitical movement affects your supply
                  chains, your procurement and your people — delivered every month, in
                  language a semi-technical leadership team can act on.
                </p>
                <p className="max-w-2xl leading-relaxed text-text-muted">
                  Every engagement opens with the Baseline Month, so you know within thirty
                  days whether the relationship earns its fee.
                </p>
              </div>
              <div className="lg:justify-self-end lg:text-right">
                <div className="font-mono text-2xl font-semibold text-text-primary">
                  {gbp(AMOUNTS.driftRetainerMonthly)}<span className="text-text-muted">/month</span>
                </div>
                <div className="mb-5 text-sm text-text-muted">
                  Rolling monthly, no minimum term
                </div>
                <Link href="/advisory/drift-retainer">
                  <Button size="lg" className="bg-accent-fill text-ink-on-accent hover:bg-accent-fill/90">
                    Read about the Drift Retainer
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>


        {/* The four engagements, as a chooser rather than four fat cards.

            The tier grid this replaces had stopped earning its height: two of
            its cards duplicated pages that now exist, a third duplicated the
            Retainer section directly above it, and the `Tier` type had grown
            four optional bolt-on fields to squeeze copy into a grid cell.

            Rows are keyed on the buyer's question rather than the product name,
            because "I do not know what we have actually got" sorts a reader
            faster than a name and a price do. Everything comes from the
            catalogue, so this cannot drift from /pricing or the nav. */}
        <section id="engagements" className="scroll-mt-24 bg-stone-charcoal/50">
          <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
            <div className="mb-8 max-w-3xl">
              <h2 className="mb-4 text-2xl font-semibold text-text-primary">
                Four ways to work together
              </h2>
              <p className="text-text-muted">
                Choose the engagement that fits your question, from a focused hour
                to a broader review or a standing relationship. Scope and fees are
                agreed before work begins; further work is optional.
              </p>
              <p className="mt-4 text-text-muted">
                Already know the issue?{' '}
                <a href="#modules" className="text-stone-teal underline underline-offset-4">
                  Explore specialist projects on supplier dependencies, scenario impact and transatlantic friction.
                </a>
              </p>
            </div>

            <ul className="divide-y divide-border-subtle overflow-hidden rounded-lg border border-border-subtle bg-stone-charcoal">
              {LADDER_ENGAGEMENTS.map((offering) => (
                <li key={offering.id}>
                  <Link
                    href={offering.href}
                    className="group flex flex-col gap-3 p-6 transition-colors hover:bg-surface-elevated/40 sm:flex-row sm:items-center sm:gap-6"
                  >
                    <div className="sm:w-2/5">
                      {offering.question && (
                        <p className="mb-1.5 font-serif text-base italic leading-snug text-text-primary">
                          &ldquo;{offering.question}&rdquo;
                        </p>
                      )}
                      <div className="text-lg font-semibold text-text-primary">
                        {offering.name}
                      </div>
                    </div>
                    <p className="flex-1 text-sm leading-relaxed text-text-muted">
                      {offering.summary}
                    </p>
                    <div className="flex flex-shrink-0 items-center gap-4 sm:w-40 sm:justify-end">
                      <div className="text-right">
                        <div className="font-mono text-sm font-semibold text-silicon-amber-strong">
                          {offering.price}
                        </div>
                        {offering.priceNote && (
                          <div className="text-xs text-text-muted">{offering.priceNote}</div>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 flex-shrink-0 text-stone-teal transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Bespoke / enterprise band — the top of the ladder above the
                Strategic Assessment, scoped one-to-one (A4). */}
            <div className="mt-8 rounded-lg border border-border-subtle bg-stone-charcoal p-6 lg:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <div className="mb-2 font-mono text-xs uppercase tracking-wider text-text-muted">
                    Bespoke · enterprise
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-text-primary">
                    Board-level and multi-entity engagements
                  </h3>
                  <p className="text-sm leading-relaxed text-text-muted">
                    For a group, multi-jurisdiction exposure, or a board-level mandate — a
                    bespoke engagement scoped to the question, which then settles into a
                    Drift Retainer for ongoing oversight.
                  </p>
                </div>
                <div className="flex flex-shrink-0 flex-col items-start gap-3 lg:items-end">
                  <div className="font-mono text-lg font-semibold text-text-primary">
                    {gbp(AMOUNTS.bespokeFloor)}–{gbp(AMOUNTS.bespokeCeiling)}
                  </div>
                  <a
                    href="#contact"
                    onClick={() => setFormData((prev) => ({ ...prev, engagement: 'Board-level engagement' }))}
                  >
                    <Button className="bg-surface-elevated text-text-primary hover:bg-surface-elevated/80">
                      Discuss an engagement
                    </Button>
                  </a>
                </div>
              </div>
            </div>

            {/* The Ladder — every paid step credits toward the next (§2.4) */}
            <div className="mt-8">
              <LadderBox />
            </div>
          </div>
        </section>


        {/* Follow-on modules — an index, not a catalogue.

            Each module has had a page of its own since 2026-09-09, and three of
            them are reached from the free tool they follow on from. Restating
            their deliverables here would put the same four bullets in two
            places and guarantee they drift; the index carries what a reader
            needs to choose, and the page carries the rest.

            Rendered from `MODULES` rather than retyped, for the reason the
            footer learned: the first hand-typed copy of a catalogue list
            duplicated an entry that was already in it. */}
        <section id="modules" className="scroll-mt-24 mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">
              Specialist advisory projects
            </h2>
            <p className="text-text-muted max-w-3xl">
              Commission a focused investigation into your own suppliers, business units
              or operations. Start with a free scoping conversation; no Briefing or
              Diagnostic is required first. Projects for retainer clients are separately
              scoped and charged in addition to the monthly fee.
            </p>
          </div>

          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {MODULES.map((offering) => (
              <li key={offering.id}>
                <Link
                  href={offering.href}
                  className="card-interactive flex h-full flex-col rounded-lg border border-border-subtle bg-stone-charcoal p-6 transition-colors hover:border-stone-teal"
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold text-text-primary">{offering.name}</h3>
                    <Badge variant="outline" className="flex-shrink-0 font-mono text-[12px] text-text-primary border-border-subtle">
                      {offering.price}
                    </Badge>
                  </div>
                  <p className="text-sm leading-relaxed text-text-muted">{offering.summary}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-stone-teal">
                    For more details
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Service Tiers */}
        {/* Contact Form */}
        <section id="contact" className="scroll-mt-24 mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-semibold text-text-primary mb-4">
                Start a Conversation
              </h2>
              <p className="text-text-muted mb-6">
                Tell us about your situation and what you&apos;re trying to achieve.
                We&apos;ll respond with initial thoughts and options for moving forward.
              </p>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-stone-teal flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-text-primary font-medium">Confidentiality First</div>
                    <p className="text-text-muted">All enquiries are treated with strict confidentiality.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-stone-teal flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-text-primary font-medium">Rapid Response</div>
                    <p className="text-text-muted">Initial response within 48 hours on business days.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-stone-teal flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-text-primary font-medium">No Obligation</div>
                    <p className="text-text-muted">Preliminary conversations are always complimentary.</p>
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
                    {formQueued ? 'Message Queued' : 'Message Received'}
                  </h3>
                  <p className="text-text-muted">
                    {formQueued
                      ? 'You’re offline — your message will send automatically when the connection returns.'
                      : "Thank you for reaching out. We'll review your inquiry and respond within 48 hours."}
                  </p>
                  {/* Cut the email round-trip: offer the 25-minute booking link
                      immediately on submit (§4.4). BOOKING_URL is env-driven;
                      until it's configured the 48-hour promise stands alone. */}
                  {!formQueued && BOOKING_URL && (
                    <div className="mt-6">
                      <p className="mb-3 text-sm text-text-muted">
                        Don&rsquo;t want to wait? Pick a time for your 25-minute
                        conversation now.
                        {FREE_INTRO_WINDOW &&
                          ' Free during our launch window — the first ninety days.'}
                      </p>
                      <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                        <Button className="bg-stone-teal text-ink-on-accent hover:bg-stone-teal/90">
                          Book your 25-minute call
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  )}
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
                      What are you interested in?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {ENGAGEMENTS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={formData.engagement === option}
                          onClick={() => setFormData({ ...formData, engagement: option })}
                          className={`px-3 py-2 text-sm rounded-md border transition-colors ${formData.engagement === option
                            ? 'border-stone-teal bg-stone-teal/10 text-stone-teal'
                            : 'border-border-subtle bg-stone-charcoal text-text-muted hover:border-stone-teal/50'
                            }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-text-muted">
                      Not sure yet? Leave it blank and describe the situation below.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm text-text-muted mb-1.5">
                      Subject area{' '}
                      <span className="text-text-muted/60">(optional)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {SUBJECT_AREAS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={formData.subject === option}
                          // Clicking the selected option clears it — the field
                          // is optional, so it has to be possible to un-answer.
                          onClick={() =>
                            setFormData({
                              ...formData,
                              subject: formData.subject === option ? '' : option,
                            })
                          }
                          className={`px-3 py-2 text-sm rounded-md border transition-colors ${formData.subject === option
                            ? 'border-stone-teal bg-stone-teal/10 text-stone-teal'
                            : 'border-border-subtle bg-stone-charcoal text-text-muted hover:border-stone-teal/50'
                            }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-text-muted mb-1.5">
                      <MessageSquare className="w-3 h-3 inline mr-1" />
                      Tell us about your situation
                    </label>
                    <textarea
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full rounded-md border border-border-subtle bg-stone-charcoal px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/50 focus:border-stone-teal focus:outline-none focus:ring-1 focus:ring-stone-teal"
                      placeholder="What challenges are you facing? What outcomes are you looking for?"
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
                    className="w-full bg-accent-fill text-ink-on-accent hover:bg-accent-fill/90"
                  >
                    {formLoading ? 'Sending...' : 'Send Inquiry'}
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
