'use client'

import Link from 'next/link'
import { BookOpen, CalendarClock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ComplianceFindingV2, FindingKind } from '@/lib/compliance-v2/types'
import { KIND_LABEL, REVIEW_STATUS_LABEL, ROLE_LABEL } from '@/lib/compliance-v2/result-sections'

/**
 * One finding, with everything §12.2 asks a card to show.
 *
 * **Explain, then cite** (§4.4). The plain-English account comes first and the
 * extract last, because "the user should not need to open the source to
 * understand the finding" — the link is for verification, not comprehension.
 * That ordering is the whole difference between a result that teaches and one
 * that sends people away to read a Regulation.
 *
 * Three tones for nine kinds, as v1 settled on for the same reason: tone carries
 * whether this is something to do, something available, or something to know,
 * and the badge label carries the precision inside that. Nine tones would make a
 * routine transparency duty look as alarming as a possible prohibition.
 */

const KIND_TONE: Record<FindingKind, string> = {
  current_obligation: 'border-silicon-amber text-silicon-amber-strong',
  future_obligation: 'border-silicon-amber text-silicon-amber-strong',
  conditional_obligation: 'border-silicon-amber text-silicon-amber-strong',
  unresolved_issue: 'border-silicon-amber text-silicon-amber-strong',
  supplier_responsibility: 'border-stone-teal text-stone-teal',
  entitlement_or_relief: 'border-stone-teal text-stone-teal',
  recommended_safeguard: 'border-border-subtle text-text-muted',
  adjacent_law: 'border-border-subtle text-text-muted',
  enforcement_information: 'border-border-subtle text-text-muted',
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <div className="text-xs font-mono uppercase tracking-wider text-text-muted">{label}</div>
      <div className="mt-1 text-sm text-text-primary">{children}</div>
    </div>
  )
}

/**
 * A corpus link only where the pinned pack carries the provision. `Annex III`
 * and `Article 6(3)` both resolve; a provision the pack does not hold gets no
 * link rather than a broken one.
 */
function provisionHref(provision: string): string | undefined {
  if (/^Annex III/.test(provision)) return '/tools/compliance-checker/provisions/annex-iii'
  const article = /^Article\s+(\d+[a-z]?)/.exec(provision)?.[1]
  return article ? `/tools/compliance-checker/provisions/${article}` : undefined
}

export function FindingCard({ finding }: { finding: ComplianceFindingV2 }) {
  const href = finding.source ? provisionHref(finding.source.provision) : undefined

  return (
    <li className="rounded-lg border border-border-subtle bg-surface-elevated p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={`${KIND_TONE[finding.kind]} text-xs`}>
          {KIND_LABEL[finding.kind]}
        </Badge>
        {finding.appliesToRoles.map((role) => (
          <Badge key={role} variant="outline" className="border-border-subtle text-text-muted text-xs">
            {ROLE_LABEL[role] ?? role}
          </Badge>
        ))}
        {finding.source && (
          <Badge variant="outline" className="border-stone-teal text-stone-teal font-mono text-xs">
            {finding.source.provision}
          </Badge>
        )}
        {finding.effectiveFrom && (
          <span className="inline-flex items-center gap-1 text-xs text-text-muted">
            <CalendarClock className="h-3.5 w-3.5" />
            From {finding.effectiveFrom}
          </span>
        )}
      </div>

      <h4 className="mt-3 text-sm font-semibold text-text-primary">{finding.title}</h4>
      <p className="mt-2 text-sm text-text-primary">{finding.whyItApplies}</p>

      <details className="group mt-3">
        <summary className="cursor-pointer text-xs font-medium text-stone-teal hover:underline">
          What the law means, and what to do
        </summary>

        <Detail label="What it means">{finding.practicalMeaning}</Detail>
        <Detail label="What to do">{finding.action}</Detail>

        {finding.evidenceToKeep.length > 0 && (
          <Detail label="Evidence to keep">
            <ul className="space-y-1">
              {finding.evidenceToKeep.map((item) => (
                <li key={item}>— {item}</li>
              ))}
            </ul>
          </Detail>
        )}

        {finding.source?.conditions.length ? (
          <Detail label="Conditions">
            <ul className="space-y-1">
              {finding.source.conditions.map((item) => (
                <li key={item}>— {item}</li>
              ))}
            </ul>
          </Detail>
        ) : null}

        {finding.source?.exceptions.length ? (
          <Detail label="Exceptions">
            <ul className="space-y-1">
              {finding.source.exceptions.map((item) => (
                <li key={item}>— {item}</li>
              ))}
            </ul>
          </Detail>
        ) : null}

        {finding.missingAnswerIds.length > 0 && (
          <Detail label="Unresolved">
            This rests on {finding.missingAnswerIds.length === 1 ? 'a fact' : 'facts'} you told us you
            did not know:{' '}
            <span className="font-mono text-xs">{finding.missingAnswerIds.join(', ')}</span>.
          </Detail>
        )}

        {/*
          The extract comes last. §10: "The user should not need to open the
          source to understand the finding. The source link remains available for
          verification and further reading."
        */}
        {finding.source && (
          <div className="mt-4 rounded border-l-2 border-stone-teal pl-4">
            <p className="text-sm italic text-text-primary">“{finding.source.shortExtract}”</p>
            <p className="mt-2 text-xs text-text-muted">
              {finding.source.documentTitle}, {finding.source.provision}
            </p>
            {/*
              §20.17 and Phase 8's exit criterion: the review status is
              displayed, and displayed accurately. Every proposition is
              `internal` today, and the label says what that means rather than
              dressing it up as a process.
            */}
            <p className="mt-1 text-xs text-text-muted">
              {REVIEW_STATUS_LABEL[finding.source.reviewStatus] ?? finding.source.reviewStatus} ·
              last checked {finding.source.reviewedAt}
            </p>
            <div className="mt-2 flex flex-wrap gap-4">
              {href && (
                <Link href={href} className="inline-flex items-center gap-2 text-xs text-stone-teal hover:underline">
                  <BookOpen className="h-3.5 w-3.5" />
                  Read it as pinned to this assessment
                </Link>
              )}
              <a
                href={finding.source.officialUrl}
                rel="noreferrer"
                className="text-xs text-text-muted hover:underline"
              >
                Official source
              </a>
            </div>
          </div>
        )}
      </details>
    </li>
  )
}
