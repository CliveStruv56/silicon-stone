'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PERSONAS, BRIEFINGS_PERSONA_ORDER, type PersonaSlug } from '@/lib/personas'

// Complete class literals per persona accent token — Tailwind v4 only emits
// classes it can see as whole strings, so these are never interpolated.
const borderMap: Record<string, string> = {
  'silicon-amber': 'border-silicon-amber/40 hover:border-silicon-amber/80',
  'stone-teal': 'border-stone-teal/40 hover:border-stone-teal/80',
  'tier-pulse': 'border-silicon-cyan/40 hover:border-silicon-cyan/80',
  'text-muted': 'border-text-muted/30 hover:border-text-muted/60',
  'troy-blue': 'border-troy-blue/40 hover:border-troy-blue/80',
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

/**
 * Desktop compass geometry. The five nodes sit on a true pentagon — 72° apart,
 * starting due north — so they read as orbiting the hub rather than as a grid
 * with one card parked on top. Offsets are pre-computed rather than derived at
 * runtime so Tailwind sees complete class strings.
 *
 *   x = R·sin θ, y = −R·cos θ, with R = 320
 *
 * Vertical offsets are absolute rather than `50% ± y` because the pentagon is
 * taller above the hub than below it; anchoring to a fixed centre (485px in a
 * 910px box) keeps the slack even top and bottom.
 */
const orbit: Record<PersonaSlug, string> = {
  clara: 'lg:left-1/2 lg:top-[165px]',
  ian: 'lg:left-[calc(50%+304px)] lg:top-[386px]',
  sofia: 'lg:left-[calc(50%+188px)] lg:top-[744px]',
  citizen: 'lg:left-[calc(50%-188px)] lg:top-[744px]',
  troy: 'lg:left-[calc(50%-304px)] lg:top-[386px]',
  positional: '',
}

/** Ray bearings in degrees clockwise from north, matching `orbit`. */
const RAY_ANGLES = [0, 72, 144, 216, 288]

/** Compass tick marks every 15°, with the cardinals drawn longer. */
const TICKS = Array.from({ length: 24 }, (_, i) => i * 15)

function PersonaNode({ slug }: { slug: PersonaSlug }) {
  const persona = PERSONAS[slug]

  return (
    <Link
      href={`/intelligence?persona=${slug}`}
      className={cn(
        'group block h-full lg:absolute lg:h-auto lg:w-[270px] lg:-translate-x-1/2 lg:-translate-y-1/2',
        orbit[slug],
      )}
    >
      <div
        className={cn(
          'mx-auto flex h-full w-full max-w-[290px] flex-col items-center rounded-3xl border bg-stone-charcoal p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md lg:h-[310px] lg:max-w-none',
          borderMap[persona.color] ?? borderMap['text-muted'],
        )}
      >
        <Image
          src={persona.avatar}
          alt=""
          width={96}
          height={96}
          className={cn(
            'h-24 w-24 rounded-2xl border-2 object-cover',
            ringMap[persona.color] ?? ringMap['text-muted'],
          )}
        />

        <h3 className="mt-4 text-lg font-semibold leading-tight text-text-primary">
          {persona.name}
        </h3>
        <div className="mt-1.5 font-mono text-[11.5px] uppercase leading-tight tracking-[0.08em] text-text-muted">
          {persona.role}
        </div>

        <p className="mt-3 text-sm leading-relaxed text-text-muted">
          {persona.description}.
        </p>

        <div
          className={cn(
            'mt-auto flex items-center gap-1 pt-4 text-sm',
            textMap[persona.color] ?? textMap['text-muted'],
          )}
        >
          <span>Explore</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  )
}

/**
 * The hub dial: a gridded face, bearing ticks, a slow-turning dashed outer ring
 * and five arrows out to the nodes. Decorative — the hub's words are marked
 * aria-hidden and the real heading lives in the section header.
 */
function CompassDial() {
  const reduceMotion = useReducedMotion()

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 400"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <defs>
        <radialGradient id="hub-face" cx="50%" cy="38%" r="68%">
          <stop offset="0%" stopColor="var(--silicon-amber)" stopOpacity="0.16" />
          <stop offset="55%" stopColor="var(--stone-teal)" stopOpacity="0.10" />
          <stop offset="100%" stopColor="var(--stone-teal)" stopOpacity="0.02" />
        </radialGradient>
        <pattern id="hub-grid" width="16" height="16" patternUnits="userSpaceOnUse">
          <path
            d="M16 0H0V16"
            fill="none"
            stroke="var(--stone-teal)"
            strokeWidth="0.5"
            opacity="0.20"
          />
        </pattern>
      </defs>

      {/* Face — a solid panel, then a gradient wash under a fine grid that
          echoes the grid backdrop in the persona portraits. */}
      <circle cx="200" cy="200" r="135" fill="var(--stone-charcoal)" />
      <circle cx="200" cy="200" r="135" fill="url(#hub-face)" />
      <circle cx="200" cy="200" r="135" fill="url(#hub-grid)" />

      {/* Bearing ticks, cardinals longer and amber. */}
      {TICKS.map((angle) => {
        const cardinal = angle % 90 === 0
        return (
          <line
            key={angle}
            x1="200"
            y1={200 - 135}
            x2="200"
            y2={200 - (cardinal ? 119 : 127)}
            transform={`rotate(${angle} 200 200)`}
            stroke={cardinal ? 'var(--silicon-amber)' : 'var(--stone-teal)'}
            strokeWidth={cardinal ? 2.5 : 1}
            opacity={cardinal ? 0.75 : 0.35}
            strokeLinecap="round"
          />
        )
      })}

      {/* Rim — a soft halo under a heavy ring. */}
      <circle
        cx="200"
        cy="200"
        r="138"
        fill="none"
        stroke="var(--stone-teal)"
        strokeWidth="10"
        opacity="0.10"
      />
      <circle
        cx="200"
        cy="200"
        r="135"
        fill="none"
        stroke="var(--stone-teal)"
        strokeWidth="5"
        opacity="0.75"
      />

      {/* Slow-turning outer ring — held still when the visitor prefers reduced motion. */}
      <motion.circle
        cx="200"
        cy="200"
        r="150"
        fill="none"
        stroke="var(--stone-teal)"
        strokeWidth="1.5"
        strokeDasharray="2 10"
        strokeLinecap="round"
        opacity="0.45"
        style={{ transformOrigin: '200px 200px' }}
        animate={reduceMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 90, ease: 'linear', repeat: Infinity }}
      />

      {/* Arrows out to each node. y = 200 − radius. */}
      {RAY_ANGLES.map((angle) => (
        <g
          key={angle}
          transform={`rotate(${angle} 200 200)`}
          stroke="var(--stone-teal)"
          fill="var(--stone-teal)"
          opacity="0.8"
        >
          <line x1="200" y1="44" x2="200" y2="30" strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="200,18 192,30 208,30" stroke="none" />
        </g>
      ))}
    </svg>
  )
}

/**
 * Persona routing rendered as a compass: the five taggable personas orbit a hub
 * that carries the section title, collapsing to a plain card list below `lg`
 * where a radial layout would be unreadable. Sits inside the "Read" run of the
 * page, between the tier ladder and the tools gallery.
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:relative lg:block lg:h-[910px]">
            {BRIEFINGS_PERSONA_ORDER.map((slug: PersonaSlug) => (
              <PersonaNode key={slug} slug={slug} />
            ))}

            {/* Hub — desktop only; below lg its words are carried by the header. */}
            <div className="hidden lg:absolute lg:left-1/2 lg:top-[485px] lg:flex lg:h-[360px] lg:w-[360px] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:items-center lg:justify-center">
              <CompassDial />
              {/* `relative` keeps the words above the dial — the SVG is
                  positioned and now paints a solid face. */}
              <div className="relative max-w-[205px] px-2 text-center" aria-hidden="true">
                <p
                  className="font-bold text-text-primary"
                  style={{
                    fontSize: 'clamp(26px, 2.4vw, 34px)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.08,
                  }}
                >
                  Find Your{' '}
                  <span className="text-silicon-amber-strong">Perspective.</span>
                </p>
                <p className="mt-3 text-sm leading-relaxed text-text-muted">
                  Intelligence tailored to your seat at the table.
                </p>
              </div>
            </div>
          </div>
        </StaggerItem>

        {/* Positional is a reading lens, not a sixth filterable persona — it
            routes to WaymarkPath rather than a hub filter, so it sits apart. */}
        <StaggerItem>
          <Link
            href={PERSONAS.positional.href as string}
            className="group mt-5 flex flex-col gap-2 rounded-2xl border border-sister-indigo/40 bg-stone-charcoal p-4 transition-colors hover:border-sister-indigo/70 sm:flex-row sm:items-center sm:justify-between"
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
