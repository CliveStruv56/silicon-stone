'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Header, Footer } from '@/components/layout'
import { FollowOnModule } from '@/components/advisory/FollowOnModule'
import { EmailGateOverlay } from '@/components/tools/EmailGateOverlay'
import { usePrintGate } from '@/components/tools/usePrintGate'
import { CopyMarkdownButton } from '@/components/tools/CopyMarkdownButton'
import { ToolSubscribeCard } from '@/components/tools/ToolSubscribeCard'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  POLICIES,
  INDUSTRIES,
  COMPANY_SIZES,
  getPolicyById,
  getIndustryImpact,
  calculateCombinedFriction,
  RELEVANCE_COLORS,
  PRIORITY_COLORS,
  JURISDICTION_COLORS,
} from '@/lib/policy-data'
import { policyStressTestMarkdown } from '@/lib/tools-markdown'
import { offeringById } from '@/lib/offering'
import type { Policy, Jurisdiction, IndustryImpact } from '@/types/policy'
import {
  Scale,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Building2,
  Globe,
  Gavel,
  ClipboardList,
  ExternalLink,
  Mail,
  Sparkles,
} from 'lucide-react'

// Friction modifier rises with organisational governance overhead
// (startup < SME < enterprise). Previously SME (0.2) sat below startup (0.4),
// which was non-monotonic; values reordered to match the resourceNotes.
const SIZE_CONTEXT = {
  startup: {
    label: 'Startup',
    modifier: 0.2,
    resourceNote: 'Keep the first pass narrow: one owner, one system inventory, counsel only for high-risk findings.',
  },
  sme: {
    label: 'SME',
    modifier: 0.4,
    resourceNote: 'Assign a named policy owner and one operational owner so the response does not sit only with legal.',
  },
  enterprise: {
    label: 'Enterprise',
    modifier: 0.7,
    resourceNote: 'Expect cross-functional governance: legal, product, security, procurement, and regional business owners.',
  },
} as const

const FOLLOW_ON_MODULE = offeringById('regulatory-friction')

/* Every hero number is read from the data. Coverage is stated honestly: the
   model maps a subset of the policy × industry grid, and a reader who picks an
   unmapped pair gets "No mapped exposure", so the size of that subset is said
   up front rather than discovered after the click. */
const EU_POLICIES = POLICIES.filter(p => p.jurisdiction === 'EU')
const US_POLICIES = POLICIES.filter(p => p.jurisdiction === 'US')
const MAPPED_PAIRINGS = POLICIES.reduce((sum, policy) => sum + Object.keys(policy.industryImpacts).length, 0)
const TOTAL_PAIRINGS = POLICIES.length * INDUSTRIES.length

/** `lastReviewed` is ISO — a full date where a person checked the entry against pinned text, year-month where it was not. */
function formatReviewed(iso: string | undefined): string {
  if (!iso) return 'not recorded'
  const full = /^\d{4}-\d{2}-\d{2}$/.test(iso)
  return new Date(`${full ? iso : `${iso}-01`}T00:00:00Z`).toLocaleDateString('en-GB', {
    ...(full ? { day: 'numeric' } : {}),
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

const HOW_IT_WORKS = [
  {
    title: 'Pick your industry',
    body: 'The policies that carry a mapping for it are marked before you choose, so you are not scored against a blank.',
  },
  {
    title: 'Pair an EU and a US policy',
    body: 'One from each side. Every pairing has a named pressure point: the sentence to take into the meeting.',
  },
  {
    title: 'Set your size',
    body: 'Startup, SME or enterprise. Governance overhead moves the score, and the brief says by how much.',
  },
  {
    title: 'Read the brief',
    body: 'Friction on both sides and combined, requirements, deadlines, an evidence checklist and a dated action plan.',
  },
]

/**
 * Worked pairs, one click each. The friction shown is the engine's own
 * reading for that pair at that size, never typed, so the card cannot promise
 * a score the tool would not give.
 */
const EXAMPLE_PAIRS: Array<{ title: string; industry: string; eu: string; us: string; size: keyof typeof SIZE_CONTEXT }> = [
  { title: 'AI product, EU and US markets', industry: 'AI/ML', eu: 'eu-ai-act', us: 'us-export-controls', size: 'sme' },
  { title: 'Connected vehicles, subsidised silicon', industry: 'Automotive', eu: 'eu-data-act', us: 'us-chips-act', size: 'enterprise' },
  { title: 'Bank data across the Atlantic', industry: 'Financial Services', eu: 'gdpr', us: 'us-export-controls', size: 'enterprise' },
]

function clampScore(score: number) {
  return Math.min(10, Math.max(0, Math.round(score * 10) / 10))
}

function getFrictionBand(score: number) {
  if (score >= 7.5) return { label: 'High friction', tone: 'text-alert-red', summary: 'Requires executive visibility and a dated remediation plan.' }
  if (score >= 4.5) return { label: 'Material friction', tone: 'text-silicon-amber-strong', summary: 'Needs a coordinated policy, product, and operations workstream.' }
  if (score > 0) return { label: 'Manageable friction', tone: 'text-stone-teal', summary: 'Useful for early triage, vendor review, and monitoring.' }
  return { label: 'No mapped exposure', tone: 'text-text-muted', summary: 'No industry-specific mapping is available for this policy pair.' }
}

// Named pressure-point for each EU x US policy pair. The point of the tool is
// that the user gets a sentence they can take into an internal meeting; if we
// fall back to generic text the whole feature undersells. Pairs are keyed by
// `${euId}:${usId}`.
const PRESSURE_POINTS: Record<string, { title: string; text: string }> = {
  'eu-ai-act:us-export-controls': {
    title: 'AI rollout meets compute controls',
    text: 'EU obligations push toward inventory, risk classification, documentation, and human oversight while US controls can constrain advanced-chip access, China-facing deployments, support activity, and customer screening.',
  },
  'eu-ai-act:us-chips-act': {
    title: 'Regulated AI on subsidised hardware',
    text: 'AI Act risk classification and post-market obligations must coexist with CHIPS Act funding terms, China guardrails, and reporting duties on any fab, packaging, or compute partner that touches the regulated AI system.',
  },
  'gdpr:us-export-controls': {
    title: 'Data governance meets national-security controls',
    text: 'The operating risk is not one rule contradicting the other; it is fragmented evidence. Data lineage, user access, model training, customer screening, and restricted-country exposure need to be visible in one control file.',
  },
  'gdpr:us-chips-act': {
    title: 'Personal-data architecture meets industrial-policy reporting',
    text: 'GDPR demands lawful basis, transfer mechanisms, and clear data flows; CHIPS Act funding adds workforce, supply chain, and project reporting that can pull HR, supplier, and R&D data into US-government touchpoints.',
  },
  'eu-chips-act:us-export-controls': {
    title: 'European fab access versus US controls reach',
    text: 'EU Chips Act incentives target capacity expansion inside Europe, but US export controls and Foreign Direct Product rules can reach tooling, IP, and customer relationships inside that capacity. Treat US compliance as a precondition, not a separate workstream.',
  },
  'eu-chips-act:us-chips-act': {
    title: 'Subsidy upside with guardrail risk',
    text: 'Both regimes can support investment, but the practical question is whether incentives, reporting, and foreign-country guardrails fit the same fab, packaging, R&D, and customer strategy.',
  },
  'dma:us-export-controls': {
    title: 'Gatekeeper obligations under national-security overlays',
    text: 'DMA interoperability, self-preferencing, and data-portability duties intersect with US controls on which counterparties, models, and infrastructure can be supplied. Compliance design must satisfy openness obligations without breaching control regimes.',
  },
  'dma:us-chips-act': {
    title: 'Open-by-default platform meets industrial-policy partner',
    text: 'DMA pushes gatekeepers toward openness, interoperability, and fairness for business users; CHIPS Act-funded partners and projects can carry security, reporting, and audit obligations that constrain which integrations and infrastructure choices are realistic.',
  },
  'eu-data-act:us-export-controls': {
    title: 'Data access obligation meets export-control gatekeeping',
    text: 'EU Data Act forces connected-product manufacturers to make user-generated data accessible to users, third parties, and aftermarket actors. US controls can restrict which of those recipients you can serve. Map third-party access requests against restricted-party screening before changing contracts.',
  },
  'eu-data-act:us-chips-act': {
    title: 'Industrial data sharing meets funded-project boundaries',
    text: 'EU Data Act pushes industrial and connected-product data outward to users and ecosystem partners; CHIPS Act-funded operations can have security, IP, and disclosure constraints. The architectural question is which datasets sit on which side of that line.',
  },
}

function getPressurePoint(euPolicy?: Policy, usPolicy?: Policy) {
  const pair = `${euPolicy?.id || ''}:${usPolicy?.id || ''}`
  return PRESSURE_POINTS[pair] ?? {
    title: 'Parallel compliance workstreams',
    text: 'The main value is sequencing: identify what evidence can satisfy both regimes, what requires jurisdiction-specific treatment, and which actions should be handled before product, customer, or supplier commitments harden.',
  }
}

function getEvidenceChecklist(euImpact?: IndustryImpact, usImpact?: IndustryImpact) {
  const requirements = [...(euImpact?.requirements || []), ...(usImpact?.requirements || [])]
  const defaults = [
    'Product and service inventory by market',
    'Customer, supplier, and restricted-country exposure',
    'Named owner for each high-friction requirement',
  ]

  return [...requirements.slice(0, 4), ...defaults].slice(0, 6)
}

// Friction gauge component
function FrictionGauge({ score, label }: { score: number; label: string }) {
  const percentage = (score / 10) * 100
  const color = score >= 7 ? '#ef4444' : score >= 4 ? '#f59e0b' : '#14b8a6'

  return (
    <div className="text-center">
      <div className="relative w-32 h-32 mx-auto mb-3">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="56"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-surface-elevated"
          />
          <motion.circle
            cx="64"
            cy="64"
            r="56"
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${percentage * 3.52} 352`}
            initial={{ strokeDasharray: '0 352' }}
            animate={{ strokeDasharray: `${percentage * 3.52} 352` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className="text-3xl font-bold"
            style={{ color }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {score.toFixed(1)}
          </motion.span>
        </div>
      </div>
      <span className="text-sm text-text-muted">{label}</span>
    </div>
  )
}

// Policy comparison card
function PolicyCard({
  policy,
  impact,
  jurisdiction,
}: {
  policy: Policy
  impact: IndustryImpact | undefined
  jurisdiction: Jurisdiction
}) {
  const colors = JURISDICTION_COLORS[jurisdiction]

  return (
    <Card className={`bg-stone-charcoal border-border-subtle h-full ${impact ? '' : 'opacity-50'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-2">
          <Badge className={`${colors.bg} ${colors.text} ${colors.border} border`}>
            {jurisdiction}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {policy.status}
          </Badge>
        </div>
        <CardTitle className="text-lg text-text-primary">{policy.name}</CardTitle>
        <CardDescription className="text-sm">{policy.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {impact ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-elevated rounded-lg p-3 border border-border-subtle">
                <div className="text-xs text-text-muted mb-1">Friction Score</div>
                <div
                  className="text-2xl font-bold"
                  style={{ color: RELEVANCE_COLORS[impact.relevance] }}
                >
                  {impact.frictionScore}/10
                </div>
              </div>
              <div className="bg-surface-elevated rounded-lg p-3 border border-border-subtle">
                <div className="text-xs text-text-muted mb-1">Est. Cost</div>
                <div className="text-lg font-semibold text-text-primary">
                  {impact.complianceCost}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-mono text-stone-teal uppercase mb-2">Key Requirements</h4>
              <ul className="space-y-2">
                {impact.requirements.slice(0, 3).map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-text-muted">
                    <div className="w-1.5 h-1.5 rounded-full bg-stone-teal mt-2 flex-shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>

            {impact.keyDeadlines && impact.keyDeadlines.length > 0 && (
              <div className="bg-silicon-amber/10 border border-silicon-amber/30 rounded-lg p-3">
                <h4 className="text-xs font-mono text-silicon-amber-strong uppercase mb-2">Key Deadlines</h4>
                <ul className="space-y-1">
                  {impact.keyDeadlines.map((deadline, idx) => (
                    <li key={idx} className="text-xs text-text-primary">{deadline}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-text-muted">
            <p>No specific requirements for selected industry</p>
          </div>
        )}

        <div className="pt-3 border-t border-border-subtle">
          <div className="flex items-center gap-2 text-xs text-text-muted mb-2">
            <Gavel className="w-3 h-3" />
            <span>Penalty: {policy.penaltyRange}</span>
          </div>
          {policy.sourceUrl && (
            <a
              href={policy.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-stone-teal hover:text-stone-teal/80"
            >
              {policy.sourceLabel || 'Official source'}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function PolicyStressTestPage() {
  const [selectedIndustry, setSelectedIndustry] = useState<string>('')
  const [selectedSize, setSelectedSize] = useState<string>('enterprise')
  const [selectedEuPolicy, setSelectedEuPolicy] = useState<string>('eu-ai-act')
  const [selectedUsPolicy, setSelectedUsPolicy] = useState<string>('us-export-controls')
  const [showResults, setShowResults] = useState(false)
  const { showGate, requestBrief, unlock, dismiss } = usePrintGate()

  const euPolicies = POLICIES.filter(p => p.jurisdiction === 'EU')
  const usPolicies = POLICIES.filter(p => p.jurisdiction === 'US')

  const euPolicy = useMemo(() => getPolicyById(selectedEuPolicy), [selectedEuPolicy])
  const usPolicy = useMemo(() => getPolicyById(selectedUsPolicy), [selectedUsPolicy])

  const euImpact = useMemo(
    () => (selectedIndustry && selectedEuPolicy ? getIndustryImpact(selectedEuPolicy, selectedIndustry) : undefined),
    [selectedEuPolicy, selectedIndustry]
  )

  const usImpact = useMemo(
    () => (selectedIndustry && selectedUsPolicy ? getIndustryImpact(selectedUsPolicy, selectedIndustry) : undefined),
    [selectedUsPolicy, selectedIndustry]
  )

  const combinedFriction = useMemo(
    () => calculateCombinedFriction(selectedEuPolicy, selectedUsPolicy, selectedIndustry),
    [selectedEuPolicy, selectedUsPolicy, selectedIndustry]
  )

  const adjustedFriction = useMemo(
    () => clampScore(combinedFriction + SIZE_CONTEXT[selectedSize as keyof typeof SIZE_CONTEXT].modifier),
    [combinedFriction, selectedSize]
  )

  const frictionBand = useMemo(() => getFrictionBand(adjustedFriction), [adjustedFriction])
  const pressurePoint = useMemo(() => getPressurePoint(euPolicy, usPolicy), [euPolicy, usPolicy])
  const evidenceChecklist = useMemo(() => getEvidenceChecklist(euImpact, usImpact), [euImpact, usImpact])

  // Combine and prioritise actions
  const allActions = useMemo(() => {
    const actions = [
      ...(euImpact?.actions || []).map(a => ({ ...a, source: 'EU' })),
      ...(usImpact?.actions || []).map(a => ({ ...a, source: 'US' })),
    ]
    return actions.sort((a, b) => {
      const order = { immediate: 0, '30-days': 1, '90-days': 2, '180-days': 3 }
      return order[a.priority] - order[b.priority]
    })
  }, [euImpact, usImpact])

  const exampleReadings = useMemo(
    () =>
      EXAMPLE_PAIRS.map(example => {
        const combined = calculateCombinedFriction(example.eu, example.us, example.industry)
        const adjusted = clampScore(combined + SIZE_CONTEXT[example.size].modifier)
        return { ...example, adjusted, band: getFrictionBand(adjusted) }
      }),
    [],
  )

  const loadExample = (example: (typeof EXAMPLE_PAIRS)[number]) => {
    setSelectedIndustry(example.industry)
    setSelectedEuPolicy(example.eu)
    setSelectedUsPolicy(example.us)
    setSelectedSize(example.size)
    setShowResults(true)
  }

  // The brief renders below the controls; on a laptop the click produced no
  // visible change. `nearest` scrolls only when it is actually out of view.
  const resultsRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (showResults) resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [showResults])

  const handleAnalyze = () => {
    if (selectedIndustry) {
      // Result is free to view. The gate now only protects the printable
      // brief / email export — see handleRequestEmailBrief.
      setShowResults(true)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-background">
        {/* Hero Section */}
        <section className="bg-slate-deep border-b border-border-subtle py-10 lg:py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="max-w-4xl">
              <Badge variant="outline" className="mb-4 border-stone-teal text-stone-teal">
                Interactive Tool
              </Badge>
              <h1 className="text-3xl font-bold text-text-primary sm:text-4xl mb-3">
                Where do EU and US rules pull your operation apart?
              </h1>
              <p className="text-lg text-text-muted max-w-3xl">
                Pair one EU policy with one US policy for your industry and get the friction between
                them scored, the pressure point named, and a dated action plan.
              </p>
              {/* Counts are read from the data, never typed. */}
              <p className="mt-4 max-w-3xl leading-relaxed text-text-muted">
                The tool holds {POLICIES.length} policies — {EU_POLICIES.length} EU ({EU_POLICIES.map(p => p.shortName).join(', ')}) and{' '}
                {US_POLICIES.length} US ({US_POLICIES.map(p => p.shortName).join(', ')}) — mapped against{' '}
                {INDUSTRIES.length} industries. Each mapping carries the requirements that reach that industry, a
                friction score on a ten-point scale, a cost range, the deadlines that apply, and actions sorted
                into immediate, 30, 90 and 180-day priorities. Every one of the {EU_POLICIES.length * US_POLICIES.length} EU–US
                pairings has a named pressure point: the sentence about how the two regimes collide that you can
                take into a meeting.
              </p>
              <p className="mt-4 max-w-3xl leading-relaxed text-text-muted">
                The score is built in the open: the EU and US friction scores for your industry are averaged, a
                modifier for your organisation’s size is added, and the result is capped at ten. The brief shows
                that working beside the number. Coverage is partial and said so — {MAPPED_PAIRINGS} of the{' '}
                {TOTAL_PAIRINGS} policy-by-industry pairings are mapped, and the policies without a mapping for your
                industry are marked before you choose.
              </p>
              <p className="mt-4 max-w-3xl leading-relaxed text-text-muted">
                It works at the level of an industry. When you need the same map drawn across your own entities and
                operations, with every conflict priced and dated and a roadmap with owners, that is the{' '}
                <Link href={FOLLOW_ON_MODULE.href} className="text-stone-teal underline underline-offset-4">
                  {FOLLOW_ON_MODULE.name}
                </Link>
                .
              </p>

              <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {HOW_IT_WORKS.map((step, index) => (
                  <li key={step.title} className="border-t border-border-subtle pt-4">
                    <div className="mb-1 font-mono text-xs uppercase tracking-wider text-stone-teal">Step {index + 1}</div>
                    <h2 className="mb-1 font-semibold text-text-primary">{step.title}</h2>
                    <p className="text-sm leading-relaxed text-text-muted">{step.body}</p>
                  </li>
                ))}
              </ol>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ['A score shown working', 'EU and US scores, their average, the size modifier and the cap, beside every result.'],
                  ['Sources named', 'Each policy links to its official source and states when a person last reviewed it.'],
                  ['Coverage stated', `${MAPPED_PAIRINGS} of ${TOTAL_PAIRINGS} pairings mapped. Unmapped ones are marked, not hidden.`],
                  ['Yours to keep', 'Copy or download the brief as Markdown. The printable version asks for an email.'],
                ].map(([title, copy]) => (
                  <div key={title} className="border border-border-subtle bg-stone-charcoal/60 rounded-lg p-4">
                    <div className="text-sm font-semibold text-text-primary">{title}</div>
                    <div className="text-xs text-text-muted mt-1">{copy}</div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-text-muted mt-5 opacity-80">
                A triage brief against published policy, not legal advice. Cost ranges are directional and the
                friction scale is a judgement, built to show where to ask better questions.
              </p>
            </div>
          </div>
        </section>

        {/* Configuration Section */}
        <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          {/* Worked pairs: one click sets all four controls and opens the brief.
              The score on each is the engine's, computed at render. */}
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-text-muted">
              <Sparkles className="w-3.5 h-3.5 text-silicon-amber-strong" aria-hidden />
              Starting points
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {exampleReadings.map(example => {
                const active =
                  selectedIndustry === example.industry &&
                  selectedEuPolicy === example.eu &&
                  selectedUsPolicy === example.us &&
                  selectedSize === example.size
                return (
                  <button
                    key={example.title}
                    type="button"
                    onClick={() => loadExample(example)}
                    aria-pressed={active}
                    className={`rounded-lg border p-4 text-left transition-colors ${
                      active ? 'border-stone-teal bg-stone-teal/10' : 'border-border-subtle bg-stone-charcoal hover:border-stone-teal/60'
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium text-text-primary">{example.title}</span>
                      <span className={`font-mono text-sm ${example.band.tone}`}>{example.adjusted.toFixed(1)}/10</span>
                    </div>
                    <p className="mt-1 text-xs text-text-muted">
                      {example.industry} · {getPolicyById(example.eu)?.shortName} × {getPolicyById(example.us)?.shortName} · {SIZE_CONTEXT[example.size].label}
                    </p>
                    <p className={`mt-2 text-xs ${example.band.tone}`}>{example.band.label}</p>
                  </button>
                )
              })}
            </div>
          </div>

          <Card className="bg-stone-charcoal border-border-subtle mb-8">
            <CardHeader>
              <CardTitle className="text-lg text-text-primary flex items-center gap-2">
                <Building2 className="w-5 h-5 text-stone-teal" />
                Configure Your Context
              </CardTitle>
            <CardDescription>
                Select your industry and the policies to analyse. Results are a triage brief, not legal advice.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Industry Selection */}
              <div>
                <label className="text-sm font-medium text-text-primary mb-2 block">
                  Industry
                </label>
                <div className="relative">
                  <select
                    value={selectedIndustry}
                    onChange={(e) => {
                      setSelectedIndustry(e.target.value)
                      setShowResults(false)
                    }}
                    className="w-full bg-surface-elevated border border-border-subtle rounded-lg px-4 py-3 text-text-primary appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-stone-teal/50"
                  >
                    <option value="">Select your industry...</option>
                    {INDUSTRIES.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" />
                </div>
              </div>

              {/* Policy Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* EU Policy */}
                <div>
                  <label className="text-sm font-medium text-text-primary mb-2 block flex items-center gap-2">
                    <Globe className="w-4 h-4 text-troy-blue" />
                    EU Policy
                  </label>
                  <div className="space-y-2">
                    {euPolicies.map(policy => (
                      <button
                        key={policy.id}
                        onClick={() => {
                          setSelectedEuPolicy(policy.id)
                          setShowResults(false)
                        }}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          selectedEuPolicy === policy.id
                            ? 'bg-blue-500/10 border-troy-blue/40'
                            : 'bg-surface-elevated border-border-subtle hover:border-blue-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-text-primary text-sm">{policy.shortName}</span>
                          {selectedIndustry && !getIndustryImpact(policy.id, selectedIndustry) && (
                            <span className="rounded border border-border-subtle px-1.5 py-0.5 text-[11px] text-text-muted">
                              Not mapped for {selectedIndustry}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-text-muted">{policy.effectiveDate}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* US Policy */}
                <div>
                  <label className="text-sm font-medium text-text-primary mb-2 block flex items-center gap-2">
                    <Globe className="w-4 h-4 text-alert-red" />
                    US Policy
                  </label>
                  <div className="space-y-2">
                    {usPolicies.map(policy => (
                      <button
                        key={policy.id}
                        onClick={() => {
                          setSelectedUsPolicy(policy.id)
                          setShowResults(false)
                        }}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          selectedUsPolicy === policy.id
                            ? 'bg-red-500/10 border-alert-red/40'
                            : 'bg-surface-elevated border-border-subtle hover:border-red-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-text-primary text-sm">{policy.shortName}</span>
                          {selectedIndustry && !getIndustryImpact(policy.id, selectedIndustry) && (
                            <span className="rounded border border-border-subtle px-1.5 py-0.5 text-[11px] text-text-muted">
                              Not mapped for {selectedIndustry}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-text-muted">{policy.effectiveDate}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Company Size */}
              <div>
                <label className="text-sm font-medium text-text-primary mb-2 block">
                  Company Size
                </label>
                {/* A grid, not a flex row. Three `flex-1` buttons cannot shrink
                    below their own content — flex items default to
                    `min-width: auto` — and "Enterprise (250+ employees)" plus
                    `px-4` pushed the row 6px past a 390px viewport, so the whole
                    page scrolled sideways. Stacked on mobile, which is what the
                    policy pickers above already do, and three across from `sm`. */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {COMPANY_SIZES.map(size => (
                    <button
                      key={size.value}
                      onClick={() => setSelectedSize(size.value)}
                      className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                        selectedSize === size.value
                          ? 'bg-stone-teal/20 border-stone-teal/40 text-stone-teal'
                          : 'bg-surface-elevated border-border-subtle text-text-muted hover:text-text-primary'
                      }`}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Analyze Button */}
                <Button
                  onClick={handleAnalyze}
                  disabled={!selectedIndustry}
                  className="w-full bg-accent-fill text-ink-on-accent hover:bg-accent-fill/90"
                >
                <Scale className="w-4 h-4 mr-2" />
                Analyse compliance friction
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <div ref={resultsRef} className="scroll-mt-24" />
          <AnimatePresence>
            {showResults && selectedIndustry && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Friction Summary */}
                <Card className="bg-stone-charcoal border-border-subtle">
                  <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <CardTitle className="text-lg text-text-primary flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-silicon-amber-strong" />
                          Decision Brief: {selectedIndustry}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {SIZE_CONTEXT[selectedSize as keyof typeof SIZE_CONTEXT].label} operating profile. Sources reviewed: {euPolicy?.shortName} {formatReviewed(euPolicy?.lastReviewed)} · {usPolicy?.shortName} {formatReviewed(usPolicy?.lastReviewed)}.
                        </CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <CopyMarkdownButton
                          toolName="Policy Stress-Test"
                          filename={`policy-stress-test-${new Date().toISOString().slice(0, 10)}.md`}
                          getMarkdown={() => policyStressTestMarkdown({
                            industry: selectedIndustry,
                            size: SIZE_CONTEXT[selectedSize as keyof typeof SIZE_CONTEXT].label,
                            euPolicy,
                            usPolicy,
                            euImpact,
                            usImpact,
                            adjustedFriction,
                            frictionBand,
                            pressurePoint,
                            sizeNote: SIZE_CONTEXT[selectedSize as keyof typeof SIZE_CONTEXT].resourceNote,
                            actions: allActions,
                            evidenceChecklist,
                          })}
                        />
                        <Button
                          variant="outline"
                          onClick={requestBrief}
                          className="border-silicon-amber text-silicon-amber-strong hover:bg-silicon-amber/10"
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Email me the brief
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center mb-8">
                      <FrictionGauge
                        score={euImpact?.frictionScore || 0}
                        label="EU Friction"
                      />
                      <FrictionGauge
                        score={adjustedFriction}
                        label="Execution-Adjusted Friction"
                      />
                      <FrictionGauge
                        score={usImpact?.frictionScore || 0}
                        label="US Friction"
                      />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="bg-surface-elevated border border-border-subtle rounded-lg p-4">
                        <div className={`text-sm font-semibold mb-1 ${frictionBand.tone}`}>{frictionBand.label}</div>
                        <p className="text-sm text-text-muted">{frictionBand.summary}</p>
                        {/* How the number is made, so it can be argued rather than only read. */}
                        <p className="mt-2 font-mono text-[11px] leading-relaxed text-text-muted">
                          EU {euImpact ? `${euImpact.frictionScore}/10` : 'unmapped'} · US {usImpact ? `${usImpact.frictionScore}/10` : 'unmapped'} · average {combinedFriction.toFixed(1)} · +{SIZE_CONTEXT[selectedSize as keyof typeof SIZE_CONTEXT].modifier.toFixed(1)} {SIZE_CONTEXT[selectedSize as keyof typeof SIZE_CONTEXT].label.toLowerCase()} modifier · capped at 10
                        </p>
                      </div>
                      <div className="bg-surface-elevated border border-border-subtle rounded-lg p-4">
                        <div className="text-sm font-semibold text-text-primary mb-1">{pressurePoint.title}</div>
                        <p className="text-sm text-text-muted">{pressurePoint.text}</p>
                      </div>
                      <div className="bg-surface-elevated border border-border-subtle rounded-lg p-4">
                        <div className="text-sm font-semibold text-text-primary mb-1">Size adjustment</div>
                        <p className="text-sm text-text-muted">{SIZE_CONTEXT[selectedSize as keyof typeof SIZE_CONTEXT].resourceNote}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Side by Side Comparison */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {euPolicy && (
                    <PolicyCard
                      policy={euPolicy}
                      impact={euImpact}
                      jurisdiction="EU"
                    />
                  )}
                  {usPolicy && (
                    <PolicyCard
                      policy={usPolicy}
                      impact={usImpact}
                      jurisdiction="US"
                    />
                  )}
                </div>

                {/* Combined Action Plan */}
                {allActions.length > 0 && (
                  <Card className="bg-stone-charcoal border-border-subtle">
                    <CardHeader>
                      <CardTitle className="text-lg text-text-primary flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-stone-teal" />
                        Prioritised Action Plan
                      </CardTitle>
                      <CardDescription>
                        Combined compliance actions across both jurisdictions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {allActions.map((action, idx) => {
                          const colors = PRIORITY_COLORS[action.priority]
                          return (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className={`flex items-start gap-4 p-4 rounded-lg border ${colors.bg} ${colors.border}`}
                            >
                              <Badge
                                variant="outline"
                                className={`flex-shrink-0 ${colors.text} ${colors.border}`}
                              >
                                {action.priority === 'immediate' ? 'Now' :
                                  action.priority === '30-days' ? '30d' :
                                    action.priority === '90-days' ? '90d' : '180d'}
                              </Badge>
                              <div className="flex-1">
                                <span className="text-text-primary text-sm">{action.action}</span>
                              </div>
                              <Badge
                                variant="outline"
                                className={action.source === 'EU'
                                  ? 'border-troy-blue/40 text-troy-blue'
                                  : 'border-alert-red/40 text-alert-red'
                                }
                              >
                                {action.source}
                              </Badge>
                            </motion.div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-stone-charcoal border-border-subtle">
                  <CardHeader>
                    <CardTitle className="text-lg text-text-primary flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-stone-teal" />
                      Evidence to Gather Before Spending Money
                    </CardTitle>
                    <CardDescription>
                      Use this as the first internal checklist before commissioning external legal or technical work.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {evidenceChecklist.map((item, idx) => (
                        <div key={`${item}-${idx}`} className="flex items-start gap-3 rounded-lg border border-border-subtle bg-surface-elevated p-3">
                          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-stone-teal/15 text-xs font-semibold text-stone-teal">
                            {idx + 1}
                          </span>
                          <span className="text-sm text-text-primary">{item}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* CTA */}
                <div className="flex justify-center pt-6">
                  {/* Points at the module this tool feeds (owner-approved pairing,
                      9 September), not the retainer the page used to send people to. */}
                  <Link href={FOLLOW_ON_MODULE.href}>
                    <Button className="bg-accent-fill text-ink-on-accent hover:bg-accent-fill/90">
                      <FileText className="w-4 h-4 mr-2" />
                      Request Detailed Compliance Assessment
                    </Button>
                  </Link>
                </div>

                <ToolSubscribeCard tool="policy-stress-test" />
              </motion.div>
            )}
          </AnimatePresence>
        </section>
        <FollowOnModule moduleId="regulatory-friction" />
      </main>

      <Footer />
      <EmailGateOverlay
        isOpen={showGate}
        onUnlock={unlock}
        onDismiss={dismiss}
        toolName="Policy Stress-Test"
        resultLabel="the printable brief"
      />
    </div>
  )
}
