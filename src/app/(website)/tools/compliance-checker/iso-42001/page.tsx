import Link from 'next/link'
import type { Metadata } from 'next'
import { Header, Footer } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { StatuteQuote } from '@/components/tools/StatuteQuote'
import { FollowOnOffering } from '@/components/advisory/FollowOnOffering'
import {
  FIT_LABELS,
  ISO_42001_CROSSWALK,
  type CrosswalkFit,
  type CrosswalkRow,
} from '@/lib/ai-act-explainers/iso-42001'
import { HARMONISED_STANDARDS } from '@/lib/ai-act-explainers/harmonised-standards'
import {
  ANNEX_I_APPLIES,
  ANNEX_III_APPLIES,
  packDate,
} from '@/lib/compliance-v2/engine/dates'
import { RULE_PACK } from '@/lib/rulepack'
import { offeringById } from '@/lib/offering'

/**
 * ISO/IEC 42001 to the EU AI Act: what an AI management system already
 * evidences, and what the Act adds. Content and its rules live in
 * `src/lib/ai-act-explainers/iso-42001.ts`; this file holds layout only.
 *
 * A server component because every row's AI Act extract is verified against
 * the `server-only` corpus at build time.
 */

const PATH = '/tools/compliance-checker/iso-42001'

export const metadata: Metadata = {
  title: 'ISO/IEC 42001 and the EU AI Act: what carries over | Silicon and Stone',
  description:
    'An element-by-element crosswalk from ISO/IEC 42001 to the EU AI Act: what your AI management system already evidences, what the Act adds, and the duties with no counterpart in the standard.',
  alternates: { canonical: PATH },
}

const briefing = offeringById('advisory-briefing')

/** Which route a timeline label belongs to, so a row with two dates reads clearly. */
const ROUTE_NAMES: Record<string, string> = {
  [ANNEX_III_APPLIES]: 'Annex III systems',
  [ANNEX_I_APPLIES]: 'Annex I products',
}

const FIT_STYLES: Record<CrosswalkFit, string> = {
  strong: 'border-stone-teal/60 text-stone-teal',
  partial: 'border-silicon-amber/60 text-silicon-amber-strong',
  none: 'border-border-subtle text-text-muted',
}

function appliesLine(row: CrosswalkRow): string {
  return row.appliesFrom
    .map((label) => {
      const date = packDate(label)
      const verb = date.inForce ? 'Applies since' : 'Applies from'
      const route = ROUTE_NAMES[label]
      return route ? `${verb} ${date.display} for ${route}` : `${verb} ${date.display}`
    })
    .join(' · ')
}

function rolesLine(row: CrosswalkRow): string {
  return row.roles.map((role) => (role === 'provider' ? 'Providers' : 'Deployers')).join(' and ')
}

function Row({ row }: { row: CrosswalkRow }) {
  return (
    <article id={row.id} className="scroll-mt-24 rounded-lg border border-border-subtle bg-surface-elevated p-5">
      <div className="flex flex-wrap items-center gap-2">
        {row.iso ? (
          <span className="font-mono text-sm text-text-primary">
            ISO/IEC 42001 {row.iso.ref} <span className="text-text-muted">· {row.iso.label}</span>
          </span>
        ) : (
          <span className="font-mono text-sm text-text-muted">No ISO/IEC 42001 element</span>
        )}
        <Badge variant="outline" className={`font-mono text-[11px] ${FIT_STYLES[row.fit]}`}>
          {FIT_LABELS[row.fit]}
        </Badge>
      </div>
      <h3 className="mt-3 text-lg font-semibold text-text-primary">{row.requirement}</h3>
      <p className="mt-1 text-xs text-text-muted">
        {rolesLine(row)} · {appliesLine(row)}
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <div className="font-mono text-xs uppercase tracking-wider text-text-muted">What your 42001 work gives you</div>
          <p className="mt-1 text-sm leading-relaxed text-text-primary">{row.reuse}</p>
        </div>
        <div>
          <div className="font-mono text-xs uppercase tracking-wider text-text-muted">What the AI Act adds</div>
          <p className="mt-1 text-sm leading-relaxed text-text-primary">{row.adds}</p>
        </div>
      </div>

      <div className="mt-4">
        <StatuteQuote citation={row.aiAct} />
      </div>
    </article>
  )
}

export default function Iso42001CrosswalkPage() {
  const { manifest } = RULE_PACK
  const mapped = ISO_42001_CROSSWALK.filter((row) => row.fit !== 'none')
  const gaps = ISO_42001_CROSSWALK.filter((row) => row.fit === 'none')
  const count = (fit: CrosswalkFit) => ISO_42001_CROSSWALK.filter((row) => row.fit === fit).length

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <section className="mx-auto max-w-4xl px-6 py-10">
          <Link href="/tools/compliance-checker" className="text-sm text-silicon-amber-strong hover:underline">
            ← The Compliance Checker
          </Link>

          <h1 className="mt-6 text-3xl font-semibold text-text-primary">ISO/IEC 42001 and the EU AI Act: what carries over</h1>
          <p className="mt-3 max-w-3xl text-text-muted">
            If you already run an AI management system to ISO/IEC 42001, much of the evidence the AI Act asks for
            exists. The gap sits where the Act behaves as product law rather than a management standard: duties per
            AI system, conformity assessment, registration and reporting to authorities. This crosswalk shows it
            element by element, with the Act quoted from the same pinned text the Compliance Checker uses.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-border-subtle text-text-muted font-mono text-xs">
              Rule pack {manifest.version}
            </Badge>
            <Badge variant="outline" className={`font-mono text-xs ${FIT_STYLES.strong}`}>
              {count('strong')} strong
            </Badge>
            <Badge variant="outline" className={`font-mono text-xs ${FIT_STYLES.partial}`}>
              {count('partial')} partial
            </Badge>
            <Badge variant="outline" className={`font-mono text-xs ${FIT_STYLES.none}`}>
              {count('none')} with no counterpart
            </Badge>
          </div>

          <div className="mt-8 rounded-lg border border-silicon-amber/40 bg-silicon-amber/5 p-5">
            <h2 className="text-base font-semibold text-text-primary">Certification is not a presumption of conformity</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-primary">
              Under Article 40, a presumption of conformity comes only from harmonised standards whose references
              are published in the Official Journal. ISO/IEC 42001 is not one of them. The harmonised standards
              published so far:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-text-primary">
              {HARMONISED_STANDARDS.map((standard) => (
                <li key={standard.reference}>
                  <span className="font-mono">{standard.reference}</span>, published {standard.date}, covering{' '}
                  {standard.covers}.{' '}
                  <a href={standard.sourceUrl} className="text-silicon-amber-strong hover:underline" rel="noreferrer">
                    {standard.sourceLabel}
                  </a>
                  <span className="text-text-muted"> · checked {standard.checkedAt}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-text-muted">
              This list is not part of the pinned rule pack, so it is not corpus-verified. It is kept by hand and
              dated, and more standards are expected.
            </p>
          </div>

          <h2 className="mt-12 text-2xl font-semibold text-text-primary">Where your 42001 work carries over</h2>
          <p className="mt-2 text-sm text-text-muted">
            The overlap ratings are this publication’s judgement of how much an operating 42001 system typically
            evidences, not a legal conclusion. ISO/IEC 42001 elements are named by number, never quoted; the Annex A
            areas are cited at area level.
          </p>
          <div className="mt-6 space-y-4">
            {mapped.map((row) => (
              <Row key={row.id} row={row} />
            ))}
          </div>

          <h2 className="mt-12 text-2xl font-semibold text-text-primary">What ISO/IEC 42001 does not cover</h2>
          <p className="mt-2 text-sm text-text-muted">
            Duties with no counterpart in the standard. A certificate gives you nothing toward these; each needs its
            own owner.
          </p>
          <div className="mt-6 space-y-4">
            {gaps.map((row) => (
              <Row key={row.id} row={row} />
            ))}
          </div>

          <p className="mt-10 text-sm text-text-muted">
            Not sure whether your systems are high-risk, or whether you are their provider or deployer?{' '}
            <Link href="/tools/compliance-checker" className="text-silicon-amber-strong hover:underline">
              Run the Compliance Checker
            </Link>{' '}
            or read{' '}
            <Link href="/tools/compliance-checker/faq" className="text-silicon-amber-strong hover:underline">
              the questions we are asked most
            </Link>
            .
          </p>

          <div className="mt-6 space-y-3 rounded-lg border border-border-subtle bg-stone-charcoal p-6 text-sm text-text-muted">
            <p>
              <strong className="text-text-primary">This is explanation, not legal advice,</strong> and it has not
              been reviewed by counsel. ISO/IEC 42001 is a standard of the International Organization for
              Standardization and the International Electrotechnical Commission; obtain the text from them or your
              national standards body.
            </p>
            <p>
              <strong className="text-text-primary">AI Act quotations are from a consolidated text, which has no
              legal value.</strong>{' '}
              Only the acts published in the Official Journal of the European Union are authentic. Source:{' '}
              {manifest.provenance.instrument}, CELEX <span className="font-mono">{manifest.provenance.celex}</span>.
              © European Union, {new Date(manifest.provenance.retrieved).getFullYear()}. Reuse is authorised provided
              the source is acknowledged.
            </p>
          </div>
        </section>

        <FollowOnOffering
          offering={briefing}
          eyebrow="Turn the crosswalk into a plan"
          intro="Bring your Statement of Applicability and one AI system. The Advisory Briefing tells you which of these gaps are yours, and in what order to close them."
          ctaLabel="Explore the Advisory Briefing"
          note="Prepared from your Compliance Checker result. Review of supporting documents is scoped separately."
        />
      </main>
      <Footer />
    </div>
  )
}
