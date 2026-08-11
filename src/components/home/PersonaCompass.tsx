'use client'

import { useState } from 'react'
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
  'silicon-amber': 'text-silicon-amber-strong',
  'stone-teal': 'text-stone-teal',
  'tier-pulse': 'text-silicon-cyan',
  'text-muted': 'text-text-muted',
  'troy-blue': 'text-troy-blue',
}

/**
 * Marker geometry for the diagram column. The five markers sit on a true
 * pentagon — 72° apart, starting due north — so the dial's arrows point at
 * something now that the persona cards have moved into the list column.
 *
 *   x% = 50 + R·sin θ,  y% = Cy − R·cos θ,  with R = 38% and Cy = 51.5%
 *
 * Everything here is a percentage of the box rather than a pixel offset: the
 * column is 584px wide at `xl` but only 456px at exactly `lg`, and the whole
 * pentagon has to scale between the two. The avatars are the one fixed
 * dimension (72px, 80px at `xl`), which is what sets the lower bound on R —
 * at 62% the dial's arrowheads reach r≈0.28×box, so a marker's inner edge has
 * to clear that or the arrows spear the faces instead of pointing at them.
 *
 * Cy is 51.5%, not 50%, because a pentagon is not vertically symmetric: one
 * point sits due north but two sit below the horizontal, so the shape spans
 * 38% above the centre and only 30.74% below it (cos 144° = −0.809). Centred
 * on 50% it reads as pushed toward the top of its box. Balancing the real
 * extents — avatar half-height above, avatar half-height plus the label below
 * — puts the optical centre near 51.5%; measured, that leaves the top and
 * bottom gaps within a few px of each other at both `lg` and `xl`. The dial
 * is offset to match, since the arrows have to radiate from the same point
 * the markers orbit.
 */
const marker: Record<PersonaSlug, string> = {
  clara: 'left-1/2 top-[13.5%]',
  ian: 'left-[86.14%] top-[39.76%]',
  sofia: 'left-[72.34%] top-[82.24%]',
  citizen: 'left-[27.66%] top-[82.24%]',
  troy: 'left-[13.86%] top-[39.76%]',
  positional: '',
}

/** Ray bearings in degrees clockwise from north, matching `orbit`. */
const RAY_ANGLES = [0, 72, 144, 216, 288]

/** Compass tick marks every 15°, with the cardinals drawn longer. */
const TICKS = Array.from({ length: 24 }, (_, i) => i * 15)

/**
 * One row in the list column. Horizontal and content-sized rather than a fixed
 * box: the old card was 240×230px because the pentagon dictated it, which left
 * dead space no amount of copy could fill. A wide row absorbs the persona's
 * description comfortably, so the text that used to be hidden at `lg` is back.
 *
 * Hovering or focusing a row lights its marker in the diagram — that linkage is
 * what stops the diagram being five anonymous faces.
 */
function PersonaRow({
  slug,
  onActivate,
  onDeactivate,
}: {
  slug: PersonaSlug
  onActivate: () => void
  onDeactivate: () => void
}) {
  const persona = PERSONAS[slug]

  return (
    <Link
      href={`/intelligence?persona=${slug}`}
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
      onFocus={onActivate}
      onBlur={onDeactivate}
      className={cn(
        // `card-interactive` carries the resting depth, the hover lift and the
        // reduced-motion opt-out that used to be hand-rolled here.
        'card-interactive group flex items-center gap-4 rounded-[32px] border bg-stone-charcoal p-3.5',
        borderMap[persona.color] ?? borderMap['text-muted'],
      )}
    >
      <Image
        src={persona.avatar}
        alt=""
        width={48}
        height={48}
        className={cn(
          'h-12 w-12 flex-shrink-0 rounded-full border-2 object-cover',
          ringMap[persona.color] ?? ringMap['text-muted'],
        )}
      />

      <div className="min-w-0 flex-1">
        {/* Name and role share a line. Stacked, they made every row three text
            lines tall, which at `lg` (where all five descriptions wrap) put the
            section above the height it had before this redesign. `flex-wrap`
            lets the role drop below on a narrow column rather than truncate. */}
        <div className="flex flex-wrap items-baseline gap-x-2">
          <h3 className="text-base font-semibold leading-tight text-text-primary">
            {persona.name}
          </h3>
          <span className="font-mono text-[10.5px] uppercase leading-tight tracking-[0.08em] text-text-muted">
            {persona.role}
          </span>
        </div>
        <p className="mt-1 text-sm leading-snug text-text-muted">
          {persona.description}.
        </p>
      </div>

      <ArrowRight
        className={cn(
          'h-4 w-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5',
          textMap[persona.color] ?? textMap['text-muted'],
        )}
      />
    </Link>
  )
}

/**
 * A persona's node on the dial. Deliberately decorative: the list column
 * already carries one link per persona, and making these links too would give
 * every persona two tab stops to the same destination.
 */
function PersonaMarker({
  slug,
  active,
  dimmed,
}: {
  slug: PersonaSlug
  active: boolean
  dimmed: boolean
}) {
  const persona = PERSONAS[slug]

  return (
    <div
      aria-hidden="true"
      className={cn(
        // Sized to the avatar alone, so `-translate-y-1/2` lands the *avatar's*
        // centre on the pentagon point. The label is taken out of flow and hung
        // below: inside the flex column it added its own height to the block,
        // which pushed every face above its true point and cost enough radius
        // to put the arrowheads through the bottom two at `lg`.
        'absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 motion-reduce:transition-none',
        marker[slug],
        active && 'scale-110',
        dimmed && 'opacity-40',
      )}
    >
      <Image
        src={persona.avatar}
        alt=""
        width={80}
        height={80}
        className={cn(
          'block h-[72px] w-[72px] rounded-full border-2 object-cover xl:h-20 xl:w-20',
          ringMap[persona.color] ?? ringMap['text-muted'],
        )}
      />
      <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.1em] text-text-muted xl:text-[12px]">
        {persona.name.split(' ').pop()}
      </span>
    </div>
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
 * Persona routing, split in two: the five taggable personas as a stacked list
 * on the left, the compass dial and its markers on the right. Sits inside the
 * "Read" run of the page, between the tier ladder and the tools gallery.
 *
 * The earlier version put the persona cards *on* the pentagon, which forced two
 * compromises this layout does not need: the heading had nowhere to live, so
 * the real `h2` went `sr-only` at `lg` while the hub painted an `aria-hidden`
 * copy of the same words; and each card was locked to 240×230px by the
 * geometry, leaving space that no amount of copy could fill. Here the heading
 * sits in normal flow and the rows size to their content.
 *
 * Below `lg` the diagram is dropped entirely and the list carries the section.
 */
export function PersonaCompass() {
  const [active, setActive] = useState<PersonaSlug | null>(null)

  const activePersona = active ? PERSONAS[active] : null

  return (
    <section
      aria-labelledby="persona-heading"
      className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-14"
    >
      <StaggerContainer>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12">
          <StaggerItem>
            <Badge
              variant="outline"
              className="mb-6 border-silicon-amber/60 text-silicon-amber-strong font-mono text-[12.5px] tracking-[0.10em] uppercase bg-silicon-amber/5"
            >
              Read · persona routing
            </Badge>
            <h2
              id="persona-heading"
              className="font-bold text-text-primary mb-4"
              style={{
                fontSize: 'clamp(32px, 3.4vw, 44px)',
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

            <div className="mt-6 flex flex-col gap-2.5">
              {BRIEFINGS_PERSONA_ORDER.map((slug: PersonaSlug) => (
                <PersonaRow
                  key={slug}
                  slug={slug}
                  onActivate={() => setActive(slug)}
                  onDeactivate={() => setActive(null)}
                />
              ))}
            </div>
          </StaggerItem>

          {/* The diagram. Hidden below `lg`, where a radial layout is
              unreadable and the list alone carries the section. */}
          <StaggerItem className="hidden lg:block lg:self-center">
            <div className="relative mx-auto aspect-square w-full max-w-[600px]">
              <div className="absolute left-1/2 top-[51.5%] flex h-[62%] w-[62%] -translate-x-1/2 -translate-y-1/2 items-center justify-center">
                <CompassDial />
                {/* `relative` lifts the words above the dial, which is
                    absolutely positioned and paints a solid face. Decorative:
                    the section's accessible name is the real `h2` in the list
                    column, so this is `aria-hidden` and never read twice.
                    At rest it names the section; on hover it names whichever
                    persona the reader is pointing at, which is what stops the
                    dial being a decorative plate. */}
                <div className="relative max-w-[58%] px-2 text-center" aria-hidden="true">
                  {activePersona ? (
                    <>
                      <p
                        className="font-bold text-text-primary"
                        style={{
                          fontSize: 'clamp(17px, 1.5vw, 22px)',
                          letterSpacing: '-0.02em',
                          lineHeight: 1.12,
                        }}
                      >
                        {activePersona.name}
                      </p>
                      <p className="mt-2 font-mono text-[10px] uppercase leading-snug tracking-[0.08em] text-text-muted">
                        {activePersona.role}
                      </p>
                    </>
                  ) : (
                    <p
                      className="font-bold text-text-primary"
                      style={{
                        fontSize: 'clamp(18px, 1.7vw, 25px)',
                        letterSpacing: '-0.02em',
                        lineHeight: 1.1,
                      }}
                    >
                      Find Your{' '}
                      <span className="text-silicon-amber-strong">Perspective.</span>
                    </p>
                  )}
                </div>
              </div>

              {BRIEFINGS_PERSONA_ORDER.map((slug: PersonaSlug) => (
                <PersonaMarker
                  key={slug}
                  slug={slug}
                  active={active === slug}
                  dimmed={active !== null && active !== slug}
                />
              ))}
            </div>
          </StaggerItem>
        </div>

        {/* Positional (the WaymarkPath reading lens) deliberately has no row
            here — the sister-product card on /products carries that cross-link,
            and repeating it mid-page read as double-billing. */}
      </StaggerContainer>
    </section>
  )
}
