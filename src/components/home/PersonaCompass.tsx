'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
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
  'silicon-amber': 'border-silicon-amber/60',
  'stone-teal': 'border-stone-teal/60',
  'tier-pulse': 'border-silicon-cyan/60',
  'text-muted': 'border-border-subtle',
  'troy-blue': 'border-troy-blue/60',
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

/** Ray bearings in degrees clockwise from north, matching `placement`. */
const RAY_ANGLES = [0, 90, 140, 220, 270]

function PersonaNode({ slug }: { slug: PersonaSlug }) {
  const persona = PERSONAS[slug]

  return (
    <Link
      href={`/intelligence?persona=${slug}`}
      className={cn('group block h-full lg:h-auto', placement[slug])}
    >
      <div
        className={cn(
          'mx-auto flex h-full w-full max-w-[290px] flex-col items-center rounded-lg border bg-stone-charcoal p-5 text-center transition-all duration-300 hover:-translate-y-1 lg:h-auto',
          borderMap[persona.color] ?? borderMap['text-muted'],
        )}
      >
        <Image
          src={persona.avatar}
          alt=""
          width={96}
          height={96}
          className={cn(
            'h-24 w-24 rounded-md border-2 object-cover',
            ringMap[persona.color] ?? ringMap['text-muted'],
          )}
        />

        <h3 className="mt-4 text-base font-semibold leading-tight text-text-primary">
          {persona.name}
        </h3>
        <div className="mt-1.5 font-mono text-[11px] uppercase leading-tight tracking-[0.08em] text-text-muted">
          {persona.role}
        </div>

        <p className="mt-3 text-xs leading-relaxed text-text-muted">
          {persona.description}.
        </p>

        <div
          className={cn(
            'mt-auto flex items-center gap-1 pt-4 text-xs lg:mt-4 lg:pt-0',
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

/** The ring and its five outward arrows. Purely decorative. */
function CompassRing() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 400"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <circle
        cx="200"
        cy="200"
        r="145"
        fill="none"
        stroke="var(--stone-teal)"
        strokeWidth="3"
        opacity="0.55"
      />
      {/* y = 200 − radius, so each ray runs outward from just beyond the ring. */}
      {RAY_ANGLES.map((angle) => (
        <g
          key={angle}
          transform={`rotate(${angle} 200 200)`}
          stroke="var(--stone-teal)"
          fill="var(--stone-teal)"
          opacity="0.75"
        >
          <line x1="200" y1="47" x2="200" y2="22" strokeWidth="3" strokeLinecap="round" />
          <polygon points="200,6 192,22 208,22" stroke="none" />
        </g>
      ))}
    </svg>
  )
}

/**
 * Persona routing rendered as a compass: the five taggable personas arranged
 * around a hub that carries the section title, stacking to a plain card list
 * below `lg` where a radial layout would be unreadable. Replaces the former
 * PersonaNavigator grid and sits inside the "Read" run of the page, between the
 * tier ladder and the tools gallery.
 *
 * The heading lives in the hub on desktop. To keep one real `h2` in the
 * document, the header block above stays in the DOM and goes `sr-only` at `lg`,
 * and the hub's copy is `aria-hidden`.
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
            <div className="lg:sr-only">
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
                Intelligence tailored to your seat at the table. Every briefing
                is tagged for the roles its analysis serves most.
              </p>
            </div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:items-center lg:gap-x-6 lg:gap-y-8">
            {BRIEFINGS_PERSONA_ORDER.map((slug: PersonaSlug) => (
              <PersonaNode key={slug} slug={slug} />
            ))}

            {/* Hub — centre cell on desktop only. Its fixed height sets the
                middle row, so the ring never collides with the outer nodes. */}
            <div className="hidden lg:col-start-2 lg:row-start-2 lg:flex lg:items-center lg:justify-center">
              <div className="relative flex h-[420px] w-[420px] items-center justify-center">
                <CompassRing />
                <div className="max-w-[230px] px-4 text-center" aria-hidden="true">
                  <p
                    className="font-bold text-text-primary"
                    style={{
                      fontSize: 'clamp(24px, 2.2vw, 32px)',
                      letterSpacing: '-0.02em',
                      lineHeight: 1.1,
                    }}
                  >
                    Find Your Perspective.
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-text-muted">
                    Intelligence tailored to your seat at the table.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </StaggerItem>

        {/* Positional is a reading lens, not a sixth filterable persona — it
            routes to WaymarkPath rather than a hub filter, so it sits apart. */}
        <StaggerItem>
          <Link
            href={PERSONAS.positional.href as string}
            className="group mt-5 flex flex-col gap-2 rounded-lg border border-sister-indigo/40 bg-stone-charcoal p-4 transition-colors hover:border-sister-indigo/70 sm:flex-row sm:items-center sm:justify-between"
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
