'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getPersonaLabel, getPersonaBadgeClasses } from '@/lib/personas'
import { formatDate } from '@/lib/format'

interface PulseHeaderProps {
  impactScore?: number
  stoneTruth?: string
  primaryPersona?: string
  intelligenceTier?: 'pulse' | 'briefing' | 'audit'
  publishedAt?: string
  readingTime?: number
  className?: string
}

function getTierConfig(tier?: string) {
  switch (tier) {
    case 'pulse':
      return {
        label: 'PULSE',
        color: 'bg-tier-pulse text-ink-on-accent',
        borderColor: 'border-tier-pulse',
      }
    case 'briefing':
      return {
        label: 'BRIEFING',
        color: 'bg-tier-briefing text-ink-on-accent',
        borderColor: 'border-tier-briefing',
      }
    case 'audit':
      return {
        label: 'AUDIT',
        color: 'bg-tier-audit text-ink-on-accent',
        borderColor: 'border-tier-audit',
      }
    default:
      return null
  }
}

export function PulseHeader({
  impactScore,
  stoneTruth,
  primaryPersona,
  intelligenceTier,
  publishedAt,
  readingTime,
  className,
}: PulseHeaderProps) {
  const tierConfig = getTierConfig(intelligenceTier)
  const hasContent = impactScore || stoneTruth || tierConfig

  if (!hasContent) {
    return null
  }

  return (
    <div
      className={cn(
        'glass-plate tech-corners rounded-lg p-4 mb-6 border',
        tierConfig?.borderColor || 'border-border-subtle',
        className
      )}
    >
      {/* Impact Score Bar */}
      {impactScore && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-ui-mono text-xs text-text-muted">Impact Score</span>
            <span className="font-ui-mono text-sm text-silicon-cyan">{impactScore}/10</span>
          </div>
          <div className="h-1.5 bg-stone-charcoal rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-stone-teal to-silicon-cyan rounded-full transition-all duration-500"
              style={{ width: `${(impactScore / 10) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Stone Truth */}
      {stoneTruth && (
        <div className="mb-4">
          <span className="font-ui-mono text-xs text-silicon-amber-strong block mb-2">Stone Truth</span>
          <p className="text-lg text-text-primary font-serif italic leading-relaxed">
            &ldquo;{stoneTruth}&rdquo;
          </p>
        </div>
      )}

      {/* Meta Row: Tier, Persona, Date, Reading Time */}
      <div className="flex flex-wrap items-center gap-2">
        {tierConfig && (
          <Badge className={cn('font-ui-mono text-[12px]', tierConfig.color)}>
            {tierConfig.label}
          </Badge>
        )}

        {primaryPersona && (
          <Badge
            variant="outline"
            className={cn('text-xs', getPersonaBadgeClasses(primaryPersona))}
          >
            {getPersonaLabel(primaryPersona)}
          </Badge>
        )}

        {publishedAt && (
          <span className="text-xs text-text-muted">
            {formatDate(publishedAt)}
          </span>
        )}

        {intelligenceTier === 'pulse' ? (
          <>
            <span className="text-text-muted/50">&middot;</span>
            <span className="text-xs text-text-muted">30 sec scan</span>
          </>
        ) : readingTime && readingTime > 0 && (
          <>
            <span className="text-text-muted/50">&middot;</span>
            <span className="text-xs text-text-muted">{readingTime} min read</span>
          </>
        )}
      </div>
    </div>
  )
}
