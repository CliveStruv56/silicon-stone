'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Compass } from 'lucide-react'
import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PERSONAS, BRIEFINGS_PERSONA_ORDER, type PersonaSlug } from '@/lib/personas'

// Complete class literals per persona accent token — Tailwind v4 only emits
// classes it can see as whole strings, so these are never interpolated.
const borderMap: Record<string, string> = {
  'silicon-amber': 'border-silicon-amber/30 hover:border-silicon-amber/70',
  'stone-teal': 'border-stone-teal/30 hover:border-stone-teal/70',
  'tier-pulse': 'border-silicon-cyan/30 hover:border-silicon-cyan/70',
  'text-muted': 'border-border-subtle hover:border-text-muted/60',
  'troy-blue': 'border-troy-blue/30 hover:border-troy-blue/70',
}

const ringMap: Record<string, string> = {
  'silicon-amber': 'border-silicon-amber/50',
  'stone-teal': 'border-stone-teal/50',
  'tier-pulse': 'border-silicon-cyan/50',
  'text-muted': 'border-border-subtle',
  'troy-blue': 'border-troy-blue/50',
}

const textMap: Record<string, string> = {
  'silicon-amber': 'text-silicon-amber',
  'stone-teal': 'text-stone-teal',
  'tier-pulse': 'text-silicon-cyan',
  'text-muted': 'text-text-muted',
  'troy-blue': 'text-troy-blue',
}

// Where each persona sits on the desktop compass: north, east, south-east,
// south-west, west — reading clockwise from the top, as the source diagram does.
const placement: Record<PersonaSlug, string> = {
  clara: 'lg:col-start-2 lg:row-start-1',
  ian: 'lg:col-start-3 lg:row-start-2',
  sofia: 'lg:col-start-3 lg:row-start-3',
  citizen: 'lg:col-start-1 lg:row-start-3',
  troy: 'lg:col-start-1 lg:row-start-2',
  positional: '',
}

/** Ray angles in degrees, clockwise from north, matching `placement`. */
const RAYS: { slug: PersonaSlug; angle: number; stroke: string }[] = [
  { slug: 'clara', angle: 0, stroke: 'var(--silicon-amber)' },
  { slug: 'ian', angle: 90, stroke: 'var(--stone-teal)' },
  { slug: 'sofia', angle: 140, stroke: 'var(--silicon-cyan)' },
  { slug: 'citizen', angle: 220, stroke: 'var(--text-muted)' },
  { slug: 'troy', angle: 270, stroke: 'var(--troy-blue)' },
]

function PersonaNode({ slug }: { slug: PersonaSlug }) {
  const persona = PERSONAS[slug]

  return (
    <Link
      href={`/intelligence?persona=${slug}`}
      className={cn('group block h-full', placement[slug])}
    >
      <div
        className={cn(
          'flex h-full flex-col rounded-lg border bg-stone-charcoal p-4 transition-all duration-300 hover:-translate-y-1',
          borderMap[persona.color] ?? borderMap['text-muted'],
        )}
      >
        <div className="flex items-center gap-3">
          <Image
            src={persona.avatar}
            alt=""
            width={56}
            height={56}
            className={cn(
              'h-14 w-14 flex-shrink-0 rounded-md border object-cover',
              ringMap[persona.color] ?? ringMap['text-muted'],
            )}
          />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold leading-tight text-text-primary">
              {persona.name}
            </h3>
            <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.08em] text-text-muted">
              {persona.role}
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-text-muted">
          {persona.description}.
        </p>

        <div
          className={cn(
            'mt-3 flex items-center gap-1 text-xs',
            textMap[persona.color] ?? textMap['text-muted'],
          )}
        >
          <span>Explore</span>
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  )
}

/** Decorative hub-and-spoke ring behind the desktop grid. */
function CompassRing() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 200"
      className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 lg:block"
    >
      <circle
        cx="100"
        cy="100"
        r="52"
        fill="none"
        stroke="var(--border-subtle)"
        strokeWidth="1.5"
      />
      {RAYS.map(({ slug, angle, stroke }) => (
        <g key={slug} transform={`rotate(${angle} 100 100)`} stroke={stroke} fill={stroke}>
          <line x1="100" y1="46" x2="100" y2="22" strokeWidth="1.5" strokeLinecap="round" />
          <polygon points="100,14 95,26 105,26" stroke="none" />
        </g>
      ))}
    </svg>
  )
}

/**
 * Persona routing rendered as a compass: the five taggable personas arranged
 * around a hub on desktop, stacking to a plain card list below `lg` where a
 * radial layout would be unreadable. Replaces the former PersonaNavigator grid
 * and sits inside the "Read" run of the page, between the tier ladder and the
 * tools gallery.
 */
export function PersonaCompass() {
  return (
    <section
      aria-labelledby="persona-heading"
      className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-14"
    >
      <StaggerContainer>
        <StaggerItem>
          <div className="max-w-3xl mb-8">
            <Badge
              variant="outline"
              className="mb-6 border-silicon-amber/60 text-silicon-amber font-mono text-[12.5px] tracking-[0.10em] uppercase bg-silicon-amber/5"
            >
              Read · persona routing
            </Badge>
            <h2
              id="persona-heading"
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
              Intelligence tailored to your seat at the table. Every briefing is
              tagged for the roles its analysis serves most.
            </p>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-6">
            <CompassRing />

            {BRIEFINGS_PERSONA_ORDER.map((slug: PersonaSlug) => (
              <PersonaNode key={slug} slug={slug} />
            ))}

            {/* Hub — centre cell on desktop only; below lg its message is
                already carried by the section subhead above. */}
            <div className="hidden lg:col-start-2 lg:row-start-2 lg:flex lg:items-center lg:justify-center">
              <div className="flex h-[150px] w-[150px] flex-col items-center justify-center gap-2 rounded-full border border-border-subtle bg-stone-charcoal/60 px-4 text-center">
                <Compass className="h-5 w-5 text-silicon-amber" />
                <span className="font-mono text-[11px] uppercase leading-tight tracking-[0.08em] text-text-muted">
                  Five seats
                  <br />
                  one feed
                </span>
              </div>
            </div>
          </div>
        </StaggerItem>

        {/* Positional is a reading lens, not a sixth filterable persona — it
            routes to WaymarkPath rather than a hub filter, so it sits apart. */}
        <StaggerItem>
          <Link
            href={PERSONAS.positional.href as string}
            className="group mt-4 flex flex-col gap-2 rounded-lg border border-sister-indigo/40 bg-stone-charcoal p-4 transition-colors hover:border-sister-indigo/70 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-sm leading-relaxed text-text-muted">
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-muted">
                A reading lens · not a feed filter ·{' '}
              </span>
              Reading every shift for its impact on your own position and career?{' '}
              {PERSONAS.positional.ctaCopy}
            </p>
            <span className="flex flex-shrink-0 items-center gap-1 text-sm text-sister-indigo">
              Visit WaymarkPath
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </StaggerItem>
      </StaggerContainer>
    </section>
  )
}
