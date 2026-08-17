'use client'

import Image from 'next/image'
import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer'
import { ForensicCard } from '@/components/ui/ForensicCard'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PERSONAS, BRIEFINGS_PERSONA_ORDER, type PersonaSlug } from '@/lib/personas'

// Avatar ring colour per persona accent token. Literal strings so Tailwind
// picks them up at build time.
const ringMap: Record<string, string> = {
  'silicon-amber': 'border-silicon-amber/50',
  'stone-teal': 'border-stone-teal/50',
  'tier-pulse': 'border-silicon-cyan/50',
  'alert-red': 'border-alert-red/50',
  'text-muted': 'border-text-muted/50',
  'troy-blue': 'border-troy-blue/50',
}

interface PersonaIntroProps {
  /** Currently active persona filter, if the host page has one. */
  selectedPersona?: string | null
  /**
   * Makes the cards filter controls. Given, each card becomes a toggle button
   * that selects its persona (or clears it when it is already selected).
   * Omitted, the section renders exactly as it reads — an explainer.
   */
  onPersonaSelect?: (persona: string | null) => void
  /** Matching-article counts by persona slug, as computed by the host feed. */
  personaCounts?: Record<string, number>
}

/**
 * Briefings-page persona explainer, and — when the host passes
 * `onPersonaSelect` — the primary way into the persona filter. The heading copy
 * has always told the reader to "pick the perspective closest to your work", so
 * the cards themselves are the control; the pill row below stays as the compact
 * way to switch once you are down among the articles.
 */
export function PersonaIntro({
  selectedPersona = null,
  onPersonaSelect,
  personaCounts,
}: PersonaIntroProps = {}) {
  const interactive = Boolean(onPersonaSelect)

  return (
    <section
      aria-labelledby="persona-intro-heading"
      className="border-b border-border-subtle"
    >
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
        <StaggerContainer>
          <StaggerItem>
            <div className="text-center max-w-2xl mx-auto mb-10">
              <Badge
                variant="outline"
                className="mb-5 border-silicon-amber/60 text-silicon-amber-strong font-mono text-[12.5px] tracking-[0.10em] uppercase bg-silicon-amber/5"
              >
                Persona Routing
              </Badge>
              <h2
                id="persona-intro-heading"
                className="font-bold text-text-primary mb-4"
                style={{
                  fontSize: 'clamp(32px, 4vw, 48px)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                }}
              >
                Find Your Perspective
              </h2>
              <p className="text-base text-text-muted leading-relaxed">
                Every briefing is tagged for the roles its analysis serves most.
                {interactive
                  ? ' Choose the perspective closest to your work to filter the feed below — choose it again to clear it.'
                  : ' Pick the perspective closest to your work to filter the feed below — or read across all five.'}
              </p>
            </div>
          </StaggerItem>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {BRIEFINGS_PERSONA_ORDER.map((slug: PersonaSlug) => {
              const persona = PERSONAS[slug]
              const ringClass = ringMap[persona.color] || 'border-border-subtle'
              const isSelected = selectedPersona === slug
              const count = personaCounts?.[slug]

              const card = (
                <ForensicCard
                  accent="subtle"
                  showMarkers={false}
                  gridHover={false}
                  delay={0}
                  className={cn(
                    'h-full',
                    isSelected &&
                      'border-silicon-amber hover:border-silicon-amber ring-1 ring-silicon-amber/40'
                  )}
                >
                  <div className="text-center space-y-3">
                    <div
                      className={`mx-auto w-20 h-20 rounded-full overflow-hidden border-2 bg-stone-charcoal ${ringClass}`}
                    >
                      <Image
                        src={persona.avatar}
                        alt={`${persona.name} avatar`}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary">
                        {persona.name}
                      </h3>
                      <div className="font-mono text-[12.5px] uppercase tracking-wider text-text-muted mt-1">
                        {persona.role}
                      </div>
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed">
                      {persona.description}.
                    </p>
                    {count !== undefined && (
                      <div
                        className={cn(
                          'font-mono text-[12px] uppercase tracking-wider',
                          isSelected ? 'text-silicon-amber-strong' : 'text-text-muted/80'
                        )}
                      >
                        {isSelected ? 'Showing ' : ''}
                        {count} briefing{count === 1 ? '' : 's'}
                      </div>
                    )}
                  </div>
                </ForensicCard>
              )

              if (!interactive) {
                return <StaggerItem key={slug}>{card}</StaggerItem>
              }

              return (
                <StaggerItem key={slug}>
                  <button
                    type="button"
                    onClick={() => onPersonaSelect?.(isSelected ? null : slug)}
                    aria-pressed={isSelected}
                    className="block h-full w-full rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-silicon-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-slate-deep"
                  >
                    <span className="sr-only">
                      {isSelected
                        ? `Clear the ${persona.name} filter`
                        : `Filter briefings for ${persona.name}, ${persona.role}`}
                    </span>
                    {card}
                  </button>
                </StaggerItem>
              )
            })}
          </div>
        </StaggerContainer>
      </div>
    </section>
  )
}
