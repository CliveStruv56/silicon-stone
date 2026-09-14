import type { Metadata } from 'next'
import Link from 'next/link'
import { Header, Footer } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AdvisoryNextStep } from '@/components/products/AdvisoryNextStep'
import { EarlyAccessCTA } from '@/components/products/EarlyAccessCTA'
import { isConfiguredCheckout } from '@/lib/checkout'
import { PRE_LAUNCH } from '@/lib/flags'
import { AMOUNTS, DERIVED, gbp } from '@/lib/offering'
import { PROFESSIONAL_STEPS, TOOLKIT_FEATURES, TOOLKIT_WORKFLOW } from '@/lib/toolkit'
import { CheckCircle, FileSpreadsheet, FileText, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'AI Act Compliance Toolkit | Silicon and Stone',
  description: 'Assess AI gaps, catalogue systems, score supplier dependencies and build an action plan. Standard toolkit or Professional with a live implementation review.',
  alternates: { canonical: '/products/ai-act-toolkit' },
}

function PurchaseCTA({ professional = false }: { professional?: boolean }) {
  const url = professional
    ? process.env.NEXT_PUBLIC_LEMONSQUEEZY_TOOLKIT_PROFESSIONAL_URL
    : process.env.NEXT_PUBLIC_LEMONSQUEEZY_TOOLKIT_STANDARD_URL
  const tier = professional ? 'Professional' : 'Standard'
  const amount = professional ? AMOUNTS.toolkitProfessional : AMOUNTS.toolkitStandard
  const className = professional
    ? 'border-stone-teal text-stone-teal hover:bg-stone-teal/10'
    : 'bg-accent-fill text-ink-on-accent hover:bg-accent-fill/90 font-semibold'
  const variant = professional ? 'outline' : 'default'
  return !PRE_LAUNCH && isConfiguredCheckout(url) ? (
    <Button size="lg" variant={variant} className={className} asChild>
      <a href={url} target="_blank" rel="noopener noreferrer" className={`plausible-event-name=Buy+Toolkit+${tier}`}>
        Buy {tier} — {gbp(amount)}
      </a>
    </Button>
  ) : (
    <EarlyAccessCTA
      tierTag={professional ? 'tier-toolkit-professional' : 'tier-toolkit-standard'}
      label={`Notify me — ${tier}`}
      submitLabel="Notify me at this address"
      variant={variant}
      buttonClassName={className}
    />
  )
}

export default function AIActToolkitPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-slate-deep border-b border-border-subtle">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-4 bg-accent-fill text-ink-on-accent">One complete toolkit</Badge>
                <h1 className="text-4xl font-bold text-text-primary sm:text-5xl mb-6">AI Act Compliance Toolkit</h1>
                <p className="text-xl text-text-muted leading-relaxed mb-6">
                  Find your AI systems, assess compliance gaps and supplier dependencies,
                  and build an evidence-backed action plan.
                </p>
                <p className="text-text-muted mb-8">
                  For internal teams responsible for AI governance, operations and procurement.
                  The audit checklist, vendor scorecard and board summary are all included.
                </p>
                <div className="flex flex-wrap gap-6 mb-6">
                  <div><div className="text-sm text-text-muted">Standard</div><div className="text-3xl font-mono font-bold text-silicon-amber-strong">{gbp(AMOUNTS.toolkitStandard)}</div></div>
                  <div><div className="text-sm text-text-muted">Professional</div><div className="text-3xl font-mono font-bold text-stone-teal">{gbp(AMOUNTS.toolkitProfessional)}</div></div>
                </div>
                <div className="flex flex-wrap gap-3"><PurchaseCTA /><PurchaseCTA professional /></div>
                <p className="text-sm text-text-muted mt-4">One-off purchase. Both editions include 12 months of updated files and quarterly update emails.</p>
              </div>
              <div className="bg-stone-charcoal border border-border-subtle rounded-xl p-8">
                <h2 className="text-lg font-semibold text-text-primary mb-5">Your working toolkit</h2>
                <ul className="space-y-4 text-text-primary">
                  <li className="flex gap-3"><FileText className="w-5 h-5 text-stone-teal shrink-0 mt-0.5" /><span>PDF handbook with a quick-start route, classification guidance, checklists and worked examples.</span></li>
                  <li className="flex gap-3"><FileSpreadsheet className="w-5 h-5 text-stone-teal shrink-0 mt-0.5" /><span>One Excel workbook for assessment, systems, suppliers, actions and progress.</span></li>
                  <li className="flex gap-3"><FileText className="w-5 h-5 text-stone-teal shrink-0 mt-0.5" /><span>Four editable templates, including a one-page board risk summary.</span></li>
                  <li className="flex gap-3"><Users className="w-5 h-5 text-stone-teal shrink-0 mt-0.5" /><span>Professional adds preparation, a 45-minute live review of up to three systems and a written action summary.</span></li>
                </ul>
                <Link href="#professional" className="inline-block mt-6 text-stone-teal hover:underline">How the Professional review works →</Link>
              </div>
            </div>
          </div>
        </section>

        <section id="included" className="mx-auto max-w-7xl px-6 py-12 lg:px-8 scroll-mt-24">
          <h2 className="text-2xl font-semibold text-text-primary mb-3">Everything included in Standard and Professional</h2>
          <p className="text-text-muted mb-8 max-w-3xl">Start with a quick assessment, then keep working in the same register and action plan as your evidence develops.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TOOLKIT_FEATURES.map((feature, index) => (
              <Card key={feature.title} className="bg-stone-charcoal border-border-subtle">
                <CardHeader className="pb-2">
                  <span className="text-sm font-mono text-silicon-amber-strong">0{index + 1}</span>
                  <CardTitle className="text-lg text-text-primary">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent><p className="text-sm text-text-muted">{feature.description}</p></CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-stone-charcoal/50 border-y border-border-subtle">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
            <h2 className="text-2xl font-semibold text-text-primary mb-6">From first assessment to a leadership briefing</h2>
            <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {TOOLKIT_WORKFLOW.map(([title, description], index) => (
                <li key={title} className="border-l-2 border-stone-teal pl-4">
                  <div className="font-semibold text-text-primary"><span className="font-mono text-stone-teal mr-2">{index + 1}.</span>{title}</div>
                  <p className="text-sm text-text-muted mt-2">{description}</p>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-sm text-text-muted">Use the <Link href="/digital-omnibus" className="text-stone-teal hover:underline">AI Act timeline and Digital Omnibus guide</Link> alongside the dated source references in your toolkit.</p>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-7xl px-6 py-12 lg:px-8 scroll-mt-24">
          <h2 className="text-2xl font-semibold text-text-primary mb-6">Two editions, one complete toolkit</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-border-subtle bg-stone-charcoal p-6 sm:p-8">
              <h3 className="text-xl font-semibold text-text-primary">Standard</h3>
              <p className="text-3xl font-mono text-silicon-amber-strong my-3">{gbp(AMOUNTS.toolkitStandard)}</p>
              <p className="text-text-muted mb-5">Run the assessment and build your organisation’s plan.</p>
              <ul className="space-y-3 text-sm text-text-primary mb-6">
                <li>Complete handbook, workbook and four editable templates</li>
                <li>Worked examples and a 90-day implementation plan</li>
                <li>12 months of updated files and quarterly update emails</li>
                <li>Internal use across your organisation</li>
              </ul>
              <PurchaseCTA />
            </div>
            <div className="rounded-xl border border-stone-teal bg-stone-charcoal p-6 sm:p-8">
              <h3 className="text-xl font-semibold text-text-primary">Professional</h3>
              <p className="text-3xl font-mono text-stone-teal my-3">{gbp(AMOUNTS.toolkitProfessional)}</p>
              <p className="text-text-muted mb-5">Work through your findings with Clive and agree your team’s next steps.</p>
              <ul className="space-y-3 text-sm text-text-primary mb-6">
                <li>Everything in Standard</li>
                <li>Secure advance workbook submission and preparation</li>
                <li>One 45-minute live Zoom review of up to three AI systems</li>
                <li>Personalised written priorities and action summary</li>
              </ul>
              <PurchaseCTA professional />
            </div>
          </div>
          <p className="text-text-muted mt-6">Start with Standard and upgrade to Professional for the {gbp(DERIVED.toolkitProfessionalUpgrade)} difference. <Link href="/products/ai-act-toolkit/review#upgrade" className="text-stone-teal hover:underline">How to upgrade →</Link></p>
        </section>

        <section id="professional" className="bg-stone-charcoal/50 border-y border-border-subtle scroll-mt-24">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
            <h2 className="text-2xl font-semibold text-text-primary mb-3">Your Professional implementation review</h2>
            <p className="text-text-muted mb-8 max-w-3xl">A focused discussion for the people leading AI governance internally. Bring the colleagues responsible for the systems you want to discuss.</p>
            <ol className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {PROFESSIONAL_STEPS.map((step, index) => (
                <li key={step.title} className="rounded-lg border border-border-subtle p-6">
                  <h3 className="font-semibold text-text-primary"><span className="text-stone-teal mr-2">{index + 1}.</span>{' '}{step.title}</h3>
                  <p className="text-sm text-text-muted mt-2">{step.description}</p>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-sm text-text-muted">The review covers one organisation and the selected systems. It helps you interpret and prioritise your work; it does not certify compliance. Further investigation or implementation is scoped separately.</p>
            <Link href="/products/ai-act-toolkit/review" className="inline-block mt-4 text-stone-teal hover:underline">Review preparation and secure submission details →</Link>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <h2 className="text-2xl font-semibold text-text-primary mb-4">Keep the files. Stay current for 12 months.</h2>
          <p className="text-text-muted max-w-3xl mb-4">Both editions include updated files and quarterly emails explaining changes for 12 months from purchase. Material corrections are shared when ready. You keep the files you receive; an optional renewal extends access to future updates. Professional includes one live review with the initial purchase.</p>
          <p className="text-sm text-text-muted max-w-3xl mb-8">The toolkit supports internal governance and evidence gathering. Use qualified legal counsel for decisions requiring legal advice. <Link href="/terms" className="text-stone-teal hover:underline">Read the product terms.</Link></p>
          <div className="flex flex-wrap gap-3"><PurchaseCTA /><PurchaseCTA professional /></div>
          <p className="flex items-center gap-2 mt-5 text-sm text-text-muted"><CheckCircle className="w-4 h-4 text-stone-teal" /> One product, from first assessment to a practical action plan.</p>
        </section>
        <AdvisoryNextStep />
      </main>
      <Footer />
    </div>
  )
}
