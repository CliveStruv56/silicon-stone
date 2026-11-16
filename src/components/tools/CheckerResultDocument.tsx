import { AlertTriangle, RefreshCcw, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ObligationList } from '@/components/tools/ObligationList'
import { VendorQuestionList } from '@/components/tools/VendorQuestionList'
import { CHECKER_DISCLAIMER, longDate, type SavedCheckerResultV1 } from '@/lib/saved-result/record'

/**
 * The Compliance Checker result as a document: the saved-link page and the PDF.
 *
 * Renders **only** from the snapshot it is handed — the stored result, the
 * answer transcript, and the timeline and penalty ceilings of the pack the
 * result was decided against. It imports no live pack data, so a saved result
 * opened after a rule-pack bump reads exactly as it did on the day; the test in
 * `saved-result.test.ts` holds that line.
 *
 * Presentational and free of client state (the obligation and vendor lists use
 * `<details>`, which needs no JavaScript), so it renders on the server for the
 * saved page and inside the client Checker for its print-only PDF copy.
 */

export type CheckerResultSnapshot = Pick<
  SavedCheckerResultV1,
  'result' | 'answerLines' | 'timeline' | 'penalties' | 'stamp' | 'savedAt'
> & { expiresAt?: string }

export function resultTone(classification: string) {
  if (classification === 'Prohibited practice') {
    return {
      border: 'border-alert-red/40',
      bg: 'bg-alert-red/10',
      text: 'text-alert-red',
      badge: 'border-alert-red text-alert-red',
    }
  }

  // Future-dated prohibition reads amber, not red: it is a dated hard stop to
  // plan against, not a practice to halt today.
  if (classification === 'Likely high-risk' || classification === 'Uncertain' || classification === 'Prohibited from 2 December 2026') {
    return {
      border: 'border-silicon-amber/40',
      bg: 'bg-silicon-amber/10',
      text: 'text-silicon-amber-strong',
      badge: 'border-silicon-amber text-silicon-amber-strong',
    }
  }

  if (classification === 'Out of EU scope') {
    return {
      border: 'border-text-muted/40',
      bg: 'bg-text-muted/10',
      text: 'text-text-primary',
      badge: 'border-text-muted text-text-muted',
    }
  }

  return {
    border: 'border-stone-teal/40',
    bg: 'bg-stone-teal/10',
    text: 'text-stone-teal',
    badge: 'border-stone-teal text-stone-teal',
  }
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-sm text-text-primary">
          <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-stone-teal" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function CheckerResultDocument({ snapshot }: { snapshot: CheckerResultSnapshot }) {
  const { result, stamp } = snapshot
  const tone = resultTone(result.classification)

  return (
    <article className="checker-result-document space-y-6" aria-label="AI Act Compliance Checker result">
      <header className="print-avoid-break space-y-2 text-sm text-text-muted">
        <div className="font-mono text-xs uppercase tracking-wider text-stone-teal">
          Silicon &amp; Stone · AI Act Compliance Checker
        </div>
        <p>
          Assessed on <strong className="text-text-primary">{longDate(snapshot.savedAt)}</strong> against rule pack{' '}
          <span className="font-mono text-text-primary">{stamp.rulepackVersion}</span>, built from the consolidated
          text at CELEX <span className="font-mono">{stamp.celex}</span>, current to {longDate(`${stamp.corpusCutOff}T00:00:00Z`)}.
          This result reflects the rules as of that date; a later version of the Checker may read the same answers
          differently.
        </p>
        {snapshot.expiresAt && (
          <p>
            This saved copy is deleted on <strong className="text-text-primary">{longDate(snapshot.expiresAt)}</strong>.
          </p>
        )}
        <p className="opacity-80">{CHECKER_DISCLAIMER}</p>
      </header>

      <Card className={`print-avoid-break overflow-hidden bg-stone-charcoal ${tone.border}`}>
        <div className={`h-2 ${tone.bg}`} />
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <Badge variant="outline" className={tone.badge}>
                {result.confidence} confidence
              </Badge>
              <CardTitle className={`mt-4 text-3xl ${tone.text}`}>{result.classification}</CardTitle>
              <CardDescription className="mt-3 max-w-3xl text-base text-text-muted">
                {/* The engine's sentence opens "this AI system …" when no name was
                    kept; a document should not start a sentence in lower case. */}
                {result.summary.charAt(0).toUpperCase() + result.summary.slice(1)}
              </CardDescription>
            </div>
            <div className="min-w-[180px] rounded-lg border border-border-subtle bg-surface-elevated p-4">
              <div className="text-xs uppercase tracking-wider text-text-muted">Likely role</div>
              <div className="mt-1 text-xl font-semibold text-text-primary">{result.role}</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2 print:grid-cols-1">
        <Card className="print-avoid-break bg-stone-charcoal border-border-subtle">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-text-primary">
              <ShieldCheck className="h-5 w-5 text-stone-teal" />
              Why this result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Bullets items={result.reasons} />
          </CardContent>
        </Card>
        <Card className="print-avoid-break bg-stone-charcoal border-border-subtle">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-text-primary">
              <AlertTriangle className="h-5 w-5 text-silicon-amber-strong" />
              Missing evidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Bullets
              items={result.missingFacts.length ? result.missingFacts : ['No critical missing facts were identified from this answer set.']}
            />
          </CardContent>
        </Card>
      </div>

      <ObligationList items={result.actions} />
      <VendorQuestionList items={result.vendorQuestions} />

      <Card className="print-avoid-break bg-stone-charcoal border-border-subtle">
        <CardHeader>
          <CardTitle className="text-lg text-text-primary">Adjacent GDPR and vendor-risk signals</CardTitle>
          <CardDescription>
            These do not automatically change the AI Act classification, but they indicate where human consulting may be valuable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result.adjacentRisks.length ? (
            <Bullets items={result.adjacentRisks} />
          ) : (
            <p className="text-text-muted">No adjacent GDPR or vendor-risk flags were triggered by these answers.</p>
          )}
        </CardContent>
      </Card>

      <Card className="print-avoid-break bg-stone-charcoal border-border-subtle">
        <CardHeader>
          <CardTitle className="text-lg text-text-primary">Ongoing review triggers</CardTitle>
          <CardDescription>
            Use these triggers to keep the assessment useful after AI Act implementation dates pass.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {result.reviewTriggers.map((trigger) => (
              <li key={trigger} className="flex items-start gap-3 text-text-primary">
                <RefreshCcw className="mt-1 h-4 w-4 flex-shrink-0 text-stone-teal" />
                <span>{trigger}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="bg-stone-charcoal border-border-subtle">
        <CardHeader>
          <CardTitle className="text-lg text-text-primary">Timing</CardTitle>
          <CardDescription>
            The AI Act applies in stages, and the Digital Omnibus moved some of them. As recorded in rule pack{' '}
            {stamp.rulepackVersion}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {snapshot.timeline.map((entry) => (
              <li key={entry.date} className="print-avoid-break rounded-lg border border-border-subtle bg-surface-elevated p-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                  <span className="font-semibold text-text-primary">
                    {entry.label}
                    <span className="ml-2 font-mono text-xs font-normal text-text-muted">{entry.basis}</span>
                  </span>
                  <span className="font-mono text-xs text-text-muted">{entry.date}</span>
                </div>
                <p className="mt-2 text-sm text-text-muted">{entry.detail}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="print-avoid-break bg-stone-charcoal border-border-subtle">
        <CardHeader>
          <CardTitle className="text-lg text-text-primary">Penalty ceilings</CardTitle>
          <CardDescription>
            Ceilings, not expected fines. Each is the higher of the fixed amount and the percentage of total worldwide
            annual turnover — except for SMEs and small mid-caps, which take the lower.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wider text-text-muted">
                <th className="pb-2 pr-4 font-medium">Infringement</th>
                <th className="pb-2 pr-4 font-medium">Ceiling</th>
                <th className="pb-2 font-medium">Basis</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.penalties.map((tier) => (
                <tr key={tier.basis} className="border-b border-border-subtle/50 align-top">
                  <td className="py-3 pr-4 text-text-primary">{tier.infringement}</td>
                  <td className="py-3 pr-4 text-text-muted">{tier.ceiling}</td>
                  <td className="py-3 font-mono text-xs text-stone-teal">{tier.basis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="bg-stone-charcoal border-border-subtle">
        <CardHeader>
          <CardTitle className="text-lg text-text-primary">Rules fired</CardTitle>
          <CardDescription>
            The versioned rules behind the result, from rule pack {stamp.rulepackVersion}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {result.firedRules.map((rule) => (
              <div key={rule.id} className="print-avoid-break rounded-lg border border-border-subtle bg-surface-elevated p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-text-primary">{rule.title}</div>
                    <div className="mt-1 font-mono text-xs text-text-muted">
                      {rule.id} · v{rule.version}
                    </div>
                  </div>
                  <Badge variant="outline" className="w-fit border-stone-teal text-stone-teal">
                    {rule.source.article}
                  </Badge>
                </div>
                <p className="mt-3 text-sm text-text-muted">{rule.explanation}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="print-avoid-break bg-stone-charcoal border-border-subtle">
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wider text-text-muted">Source basis</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 md:grid-cols-2">
            {result.sourceReferences.map((source) => (
              <li key={source.url} className="text-sm">
                <a href={source.url} target="_blank" rel="noreferrer" className="text-stone-teal hover:text-silicon-amber-strong">
                  {source.label}
                </a>
                <span className="print-only-url hidden break-all text-xs text-text-muted"> ({source.url})</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="bg-stone-charcoal border-border-subtle">
        <CardHeader>
          <CardTitle className="text-lg text-text-primary">Your answers</CardTitle>
          <CardDescription>In the question wording used on the day of the assessment.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3 text-sm">
            {snapshot.answerLines.map((line) => (
              <div key={line.question} className="print-avoid-break">
                <dt className="text-text-muted">{line.question}</dt>
                <dd className="mt-0.5 text-text-primary">{line.answer}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <footer className="print-avoid-break border-t border-border-subtle pt-4 text-xs text-text-muted">
        <p>{CHECKER_DISCLAIMER}</p>
        <p className="mt-2">
          Checker {stamp.checkerVersion} · question catalogue {stamp.questionCatalogueVersion} · rule pack{' '}
          {stamp.rulepackVersion} · siliconandstone.com/tools/compliance-checker
        </p>
      </footer>
    </article>
  )
}
