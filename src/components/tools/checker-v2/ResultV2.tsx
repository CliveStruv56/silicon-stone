'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FindingCard } from './FindingCard'
import { GdprOverlayCard } from './GdprOverlayCard'
import type { ComplianceResultV2 } from '@/lib/compliance-v2/types'
import {
  APPLICABILITY_LABEL,
  CLASSIFICATION_LABEL,
  ROLE_LABEL,
  resultBlocks,
} from '@/lib/compliance-v2/result-sections'

/**
 * The result (§12).
 *
 * Section order, and the rule that hides empty ones, both come from
 * `result-sections.ts` — where the display invariants are tested. This file
 * renders; it decides nothing, which is why a heading cannot drift from the
 * export that reproduces it.
 *
 * What is deliberately absent is as much the point as what is here. No penalty
 * table, no ladder of organisation-size bands, no timeline of every date in the
 * Regulation. §4.5 and §12.4 forbid showing material that does not relate to
 * this reader's result, and v1's defect 4 was showing all three to a micro
 * business with no duties at all. A penalty ceiling appears only as a finding,
 * only where something makes it relevant, and only saying what it is.
 */

export function ResultV2({ result }: { result: ComplianceResultV2 }) {
  const blocks = resultBlocks(result)
  const heldRoles = result.roles.filter(
    (role) => role.applicability === 'applies' || role.applicability === 'likely_applies'
  )

  return (
    <div className="space-y-6">
      {/* 1. Your likely legal position. */}
      <Card className="bg-stone-charcoal border-border-subtle">
        <CardHeader>
          {/*
            A sentence, not a chip. A Badge is `inline-flex` and does not wrap,
            so a sentence inside one runs off a 390px viewport — which it did.
          */}
          <p className="text-xs text-text-muted">
            {result.legalFindings.length + result.readinessFindings.length} findings · confidence is
            derived from how complete the rules are, never from a score
          </p>
          <CardTitle className="mt-3 text-3xl text-text-primary">
            {CLASSIFICATION_LABEL[result.classification]}
          </CardTitle>
          <CardDescription className="mt-3 text-base">
            {result.classificationExplanation}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {result.statutoryRoutes.length > 0 && (
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-text-muted">
                Statutory route
              </div>
              <ul className="mt-2 flex flex-wrap gap-2">
                {result.statutoryRoutes.map((route) => (
                  <li key={route}>
                    <Badge
                      variant="outline"
                      className="border-stone-teal text-stone-teal font-mono text-xs"
                    >
                      {route}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-text-muted">Scope</div>
            <p className="mt-1 text-sm text-text-primary">{result.scope.explanation}</p>
          </div>

          {heldRoles.length > 0 && (
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-text-muted">
                Your role
              </div>
              <ul className="mt-1 space-y-2">
                {heldRoles.map((role) => (
                  <li key={role.role} className="text-sm">
                    <span className="font-semibold text-text-primary">{ROLE_LABEL[role.role]}</span>
                    <span className="text-text-muted"> — {APPLICABILITY_LABEL[role.applicability]}</span>
                    <p className="mt-1 text-text-primary">{role.explanation}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/*
            Size is one line and one band, never a ladder. §8.4: do not show
            large-enterprise or small-mid-cap thresholds to a micro user.
          */}
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-text-muted">
              Organisation size
            </div>
            <p className="mt-1 text-sm text-text-primary">{result.organisationSize.summary}</p>
          </div>
        </CardContent>
      </Card>

      {/*
        2–8. The typed sections and the data-protection overlay, in §12.1's
        order, empties hidden. The order comes from `resultBlocks`, where it is
        asserted — this file must not be the place a section moves.
      */}
      {blocks.map((block) =>
        block.kind === 'gdpr' ? (
          <GdprOverlayCard key={block.key} overlay={block.overlay} heading={block.heading} />
        ) : (
          <Card key={block.key} className="bg-stone-charcoal border-border-subtle">
            <CardHeader>
              <CardTitle className="text-lg text-text-primary">{block.section.heading}</CardTitle>
              <CardDescription>{block.section.blurb}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {block.section.findings.map((finding) => (
                  <FindingCard key={finding.id} finding={finding} />
                ))}
              </ul>
            </CardContent>
          </Card>
        )
      )}

      {result.materialUnknowns.length > 0 && (
        <Card className="bg-stone-charcoal border-border-subtle">
          <CardHeader>
            <CardTitle className="text-lg text-text-primary">What we did not establish</CardTitle>
            <CardDescription>
              Facts you told us you did not know. None of them has been assumed either way — this is
              what the result would have to be re-run against.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.materialUnknowns.map((unknown) => (
                <li key={unknown.questionId} className="text-sm">
                  <span className="text-text-primary">{unknown.question}</span>
                  <span className="text-text-muted"> — {unknown.whatItWouldChange}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 9. When to reassess. */}
      <Card className="bg-stone-charcoal border-border-subtle">
        <CardHeader>
          <CardTitle className="text-lg text-text-primary">When to reassess</CardTitle>
          <CardDescription>
            This result describes the system as you have just described it. Any of these changes it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {result.reviewTriggers.map((trigger) => (
              <li key={trigger} className="text-sm text-text-primary">
                — {trigger}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="space-y-3 rounded-lg border border-border-subtle bg-stone-charcoal p-6 text-sm text-text-muted">
        <p>{result.disclaimer}</p>
        <p className="font-mono text-xs">
          Assessed {result.assessedAt} · checker {result.checkerVersion} · rule pack{' '}
          {result.rulepackVersion} · schema v{result.schemaVersion}
        </p>
      </div>
    </div>
  )
}
