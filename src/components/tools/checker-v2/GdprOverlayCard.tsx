'use client'

import { ShieldAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { GdprAiOverlayResult } from '@/lib/compliance-v2/types'
import { KIND_LABEL } from '@/lib/compliance-v2/result-sections'

/**
 * §12.1's seventh section: the data-protection overlay.
 *
 * Its own component rather than a `FindingCard` list, because the differences
 * are the point. There is no role badge — controller and processor are not AI
 * Act roles. There is no provision badge, no extract and no "read it as pinned
 * to this assessment" link — no GDPR text is in the pinned pack, so a citation
 * here would be one nothing verified, and this codebase's rule is that a
 * citation is a field rather than prose. What the block offers instead is a link
 * to the instrument itself, once, at the bottom.
 *
 * The notice is above the findings, not below them. A reader who stops halfway
 * has to have read it — "this is not a GDPR audit" is worth nothing as a
 * footnote.
 */

const REGIME_LABEL: Record<string, string> = {
  eu_gdpr: 'EU GDPR',
  uk_gdpr: 'UK GDPR',
}

export function GdprOverlayCard({
  overlay,
  heading,
}: {
  overlay: GdprAiOverlayResult
  heading: string
}) {
  return (
    <Card className="bg-stone-charcoal border-border-subtle">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-text-muted" aria-hidden />
          {overlay.regimes.map((regime) => (
            <Badge
              key={regime}
              variant="outline"
              className="border-border-subtle text-text-muted font-mono text-xs"
            >
              {REGIME_LABEL[regime] ?? regime}
            </Badge>
          ))}
        </div>
        <CardTitle className="mt-3 text-lg text-text-primary">{heading}</CardTitle>
        <CardDescription>{overlay.notice}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-text-primary">{overlay.jurisdictionNote}</p>

        <ul className="space-y-3">
          {overlay.findings.map((finding) => (
            <li
              key={finding.id}
              className="rounded-lg border border-border-subtle bg-surface-elevated p-4"
            >
              <Badge variant="outline" className="border-border-subtle text-text-muted text-xs">
                {KIND_LABEL[finding.kind]}
              </Badge>
              <h4 className="mt-3 text-sm font-semibold text-text-primary">{finding.title}</h4>
              <p className="mt-2 text-sm text-text-primary">{finding.whyItApplies}</p>

              <details className="group mt-3">
                <summary className="cursor-pointer text-xs font-medium text-stone-teal hover:underline">
                  What this means, and what to check
                </summary>
                <div className="mt-3">
                  <div className="text-xs font-mono uppercase tracking-wider text-text-muted">
                    What it means
                  </div>
                  <p className="mt-1 text-sm text-text-primary">{finding.practicalMeaning}</p>
                </div>
                <div className="mt-3">
                  <div className="text-xs font-mono uppercase tracking-wider text-text-muted">
                    What to check
                  </div>
                  <p className="mt-1 text-sm text-text-primary">{finding.action}</p>
                </div>
                {finding.evidenceToKeep.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs font-mono uppercase tracking-wider text-text-muted">
                      Evidence to keep
                    </div>
                    <ul className="mt-1 space-y-1 text-sm text-text-primary">
                      {finding.evidenceToKeep.map((item) => (
                        <li key={item}>— {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </details>
            </li>
          ))}
        </ul>

        {overlay.references.length > 0 && (
          <div className="border-t border-border-subtle pt-4">
            <div className="text-xs font-mono uppercase tracking-wider text-text-muted">
              Where to read the law itself
            </div>
            <ul className="mt-2 space-y-1">
              {overlay.references.map((reference) => (
                <li key={reference.url}>
                  <a
                    href={reference.url}
                    rel="noreferrer"
                    className="text-sm text-stone-teal hover:underline"
                  >
                    {reference.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
