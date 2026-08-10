import { AlertTriangle, BadgeCheck, CircleHelp, FileText, RefreshCcw, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { ReportRecord } from '@/lib/report/record'
import { DROPPED_CLAIM_NOTE, type CheckedClaim } from '@/lib/report/verify'

/**
 * Renders a generated preview report.
 *
 * Presentational and server-renderable on purpose — the same component serves
 * the inline view on the checker and the standalone page behind a signed link,
 * and neither needs client state.
 *
 * The one rule it enforces visually: a quotation only appears on screen when the
 * verifier matched it against the pinned corpus. Everything else shows the
 * proposition with an explicit note about why its supporting text is absent.
 */

function formatStamp(iso: string | undefined): string {
  if (!iso) return 'unknown'
  const parsed = new Date(iso)
  return Number.isNaN(parsed.getTime()) ? 'unknown' : parsed.toISOString().replace('T', ' ').slice(0, 16) + ' UTC'
}

function Claim({ claim }: { claim: CheckedClaim }) {
  // Destructured so the discriminant narrows in the unverified branch below —
  // a property access would not, and DROPPED_CLAIM_NOTE has no 'verified' key.
  const { status } = claim
  const verified = status === 'verified'

  return (
    <div className="rounded-lg border border-border-subtle bg-surface-elevated p-4">
      <p className="text-sm text-text-primary">{claim.proposition}</p>
      {verified ? (
        <blockquote className="mt-3 border-l-2 border-stone-teal pl-4 text-sm italic text-text-muted">
          “{claim.verbatim_quote}”
        </blockquote>
      ) : (
        <p className="mt-3 rounded border border-silicon-amber/40 bg-silicon-amber/10 p-3 text-xs text-text-primary">
          {DROPPED_CLAIM_NOTE[status]}
        </p>
      )}
      <div className="mt-3 flex items-center gap-2">
        <Badge variant="outline" className="border-stone-teal text-stone-teal font-mono text-xs">
          {claim.article_reference}
        </Badge>
        {verified ? (
          <span className="inline-flex items-center gap-1 text-xs text-stone-teal">
            <BadgeCheck className="h-3.5 w-3.5" />
            Matched against the primary text
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-silicon-amber-strong">
            <CircleHelp className="h-3.5 w-3.5" />
            Unverified
          </span>
        )}
      </div>
    </div>
  )
}

function Claims({ claims }: { claims: CheckedClaim[] }) {
  if (claims.length === 0) return null
  return (
    <div className="mt-5 space-y-3">
      <div className="text-xs font-mono uppercase tracking-wider text-text-muted">Legal basis</div>
      {claims.map((claim, index) => (
        <Claim key={`${claim.article_reference}-${index}`} claim={claim} />
      ))}
    </div>
  )
}

/** Narrative text arrives as paragraphs; render them as such, never as HTML. */
function Prose({ text }: { text: string }) {
  return (
    <div className="space-y-3">
      {text
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
        .map((paragraph, index) => (
          <p key={index} className="text-text-primary leading-relaxed">
            {paragraph}
          </p>
        ))}
    </div>
  )
}

export function ReportView({ record }: { record: ReportRecord }) {
  const report = record.report

  if (!report || record.status === 'failed') {
    return (
      <Card className="bg-stone-charcoal border-alert-red/40">
        <CardHeader>
          <CardTitle className="text-lg text-text-primary flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-alert-red" />
            No report was produced
          </CardTitle>
          <CardDescription>
            {record.reason ?? 'The report could not be generated.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-muted">
            Your on-screen assessment is unaffected — it is produced by the rules engine, not by this
            report, and it is still yours to copy or download.
          </p>
        </CardContent>
      </Card>
    )
  }

  const withheld = record.status === 'withheld'

  return (
    <div className="space-y-6">
      <Card className="bg-stone-charcoal border-border-subtle">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <Badge variant="outline" className="border-stone-teal text-stone-teal">
                Preview report
              </Badge>
              <CardTitle className="mt-3 text-2xl text-text-primary">{record.toolName}</CardTitle>
              <CardDescription className="mt-2">
                {record.classification} · {record.role} · {record.confidence} confidence
              </CardDescription>
            </div>
            <div className="rounded-lg border border-border-subtle bg-surface-elevated p-4 text-xs text-text-muted space-y-1 min-w-[220px]">
              <div>
                Rule pack <span className="font-mono text-text-primary">{record.packVersion}</span>
              </div>
              <div>Legal text current to {record.corpusCutOff}</div>
              <div>Generated {formatStamp(record.completedAt ?? record.createdAt)}</div>
              {record.model && <div className="font-mono">{record.model}</div>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="rounded-lg border border-border-subtle bg-surface-elevated p-4 text-sm text-text-muted">
            The classification above is deterministic and rule-derived at this pack version. The
            explanation below it is model-generated from the cited primary sources, and every
            quotation has been matched against the consolidated text before being shown. This is
            informational triage, not formal legal advice.
          </p>
        </CardContent>
      </Card>

      {withheld && (
        <Card className="bg-stone-charcoal border-alert-red/40">
          <CardHeader>
            <CardTitle className="text-lg text-text-primary flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-alert-red" />
              This report has been withheld
            </CardTitle>
            <CardDescription>{record.reason}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-muted">
              Showing it anyway would mean putting quotations in front of you that we could not trace
              to the Official Journal. The rules-based result on the checker stands on its own and is
              unaffected.
            </p>
          </CardContent>
        </Card>
      )}

      {!withheld && (
        <>
          <Card className="bg-stone-charcoal border-border-subtle">
            <CardHeader>
              <CardTitle className="text-lg text-text-primary flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-stone-teal" />
                Your role in the value chain
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Prose text={report.roleAnalysis.body.narrative} />
              <Claims claims={report.roleAnalysis.claims} />
            </CardContent>
          </Card>

          <Card className="bg-stone-charcoal border-border-subtle">
            <CardHeader>
              <CardTitle className="text-lg text-text-primary flex items-center gap-2">
                <FileText className="h-5 w-5 text-stone-teal" />
                Why this classification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Prose text={report.classificationRationale.body.narrative} />

              <div className="mt-6 rounded-lg border border-silicon-amber/40 bg-silicon-amber/5 p-5">
                <div className="text-sm font-semibold text-silicon-amber-strong">What we did not ask you</div>
                <p className="mt-1 text-xs text-text-muted">
                  A short questionnaire cannot establish everything the classification depends on.
                  These are the facts it never asked for, and what each would change.
                </p>
                <ul className="mt-4 space-y-4">
                  {report.classificationRationale.body.whatWeDidNotAsk.map((item, index) => (
                    <li key={index}>
                      <div className="text-sm font-medium text-text-primary">{item.fact}</div>
                      <div className="mt-1 text-sm text-text-muted">{item.why_it_matters}</div>
                      <div className="mt-1 text-sm text-text-muted">
                        <span className="text-stone-teal">Would change:</span> {item.would_change}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <Claims claims={report.classificationRationale.claims} />
            </CardContent>
          </Card>

          <Card className="bg-stone-charcoal border-border-subtle">
            <CardHeader>
              <CardTitle className="text-lg text-text-primary flex items-center gap-2">
                <RefreshCcw className="h-5 w-5 text-stone-teal" />
                Your review schedule
              </CardTitle>
              <CardDescription>
                Dated against your answers, not a generic calendar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {report.reviewSchedule.body.entries.map((entry, index) => (
                  <li key={index} className="rounded-lg border border-border-subtle bg-surface-elevated p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                      <span className="font-medium text-text-primary">{entry.trigger}</span>
                      <Badge variant="outline" className="w-fit border-stone-teal text-stone-teal">
                        {entry.timing}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-text-muted">{entry.why}</p>
                  </li>
                ))}
              </ul>
              <Claims claims={report.reviewSchedule.claims} />
            </CardContent>
          </Card>

          {report.unresolved.length > 0 && (
            <Card className="bg-stone-charcoal border-border-subtle">
              <CardHeader>
                <CardTitle className="text-lg text-text-primary flex items-center gap-2">
                  <CircleHelp className="h-5 w-5 text-silicon-amber-strong" />
                  What these answers cannot settle
                </CardTitle>
                <CardDescription>
                  Questions worth putting to a lawyer rather than guessing at.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {report.unresolved.map((item, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm text-text-primary">
                      <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-silicon-amber" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Card className="bg-stone-charcoal border-border-subtle">
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wider text-text-muted">
            Citation check
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-muted">
            {report.stats.verified} of {report.stats.total} quotations matched the consolidated text
            at CELEX 02024R1689-20260727.
            {report.stats.notFound > 0 && ` ${report.stats.notFound} could not be found in it.`}
            {report.stats.uncovered > 0 &&
              ` ${report.stats.uncovered} cited an Article outside this pack's verified corpus and could not be checked.`}
            {report.stats.unparseable > 0 && ` ${report.stats.unparseable} did not resolve to an Article.`}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
