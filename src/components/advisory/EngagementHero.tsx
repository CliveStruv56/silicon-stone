import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FREE_INTRO_WINDOW } from '@/lib/flags'

/**
 * One hero for all four engagement pages.
 *
 * This exists because "keep the pages consistent" is not a thing anyone can do
 * by hand. A styling audit across `/advisory`, the two product pages and
 * `/eu-exposure` found the bones already agreed — identical H1 scale, identical
 * `py-10 lg:py-12` rhythm — and then thirteen divergences on top, of which the
 * loudest was that two of the four had a hero photograph and two had a price
 * card, so the whole right-hand column changed shape as you moved between them.
 *
 * The fix is structural, not cosmetic: the shape is defined once here, so a
 * fifth engagement cannot drift and the four that exist cannot drift apart. The
 * grid, alignment and image treatment deliberately match the `/advisory` hero,
 * which is the one the owner said reads correctly.
 *
 * The "At a glance" price card moved out of the hero and into `AtAGlance`
 * directly below it — it does real conversion work and is not being dropped,
 * but it was what displaced the image.
 */
export function EngagementHero({
  badge,
  title,
  lead,
  body,
  inShort,
  ctaLabel,
  ctaHref = '#contact',
  imageCaption,
  showLaunchLine = false,
}: {
  badge: string
  title: string
  lead: React.ReactNode
  body: React.ReactNode
  /** The priced one-sentence summary, in the amber left-rule box. */
  inShort: React.ReactNode
  ctaLabel: string
  ctaHref?: string
  imageCaption: string
  /** Only the Retainer runs the free-intro launch offer. */
  showLaunchLine?: boolean
}) {
  return (
    <section className="bg-slate-deep border-b border-border-subtle">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center lg:gap-12">
          <div>
            <Badge variant="outline" className="mb-4 border-stone-teal text-stone-teal">
              {badge}
            </Badge>
            <h1 className="text-4xl font-bold text-text-primary sm:text-5xl mb-6">{title}</h1>
            <p className="text-xl text-text-muted leading-relaxed mb-6">{lead}</p>
            <p className="text-text-muted leading-relaxed">{body}</p>

            <p className="mt-6 border-l-2 border-silicon-amber/60 pl-4 leading-relaxed text-text-muted">
              <strong className="font-semibold text-text-primary">In short.</strong> {inShort}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
              <a href={ctaHref}>
                <Button size="lg" className="bg-accent-fill text-ink-on-accent hover:bg-accent-fill/90">
                  {ctaLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <a href="#where-it-leads" className="text-sm text-stone-teal hover:underline">
                Where it leads →
              </a>
            </div>
            {showLaunchLine && FREE_INTRO_WINDOW && (
              <p className="mt-2 text-xs italic text-text-muted">
                Free during our launch window — the first ninety days.
              </p>
            )}
          </div>

          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border-subtle lg:aspect-square">
              <Image
                src="/intelligence-stream-bg.png"
                alt="A Forensic Technopolitics global risk map — supply-chain tracing, policy stress-testing and dependency mapping across the transatlantic system"
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-scrim-ink via-scrim-ink/70 to-transparent p-5 pt-16">
                <p className="text-sm italic text-balance text-white/90 [text-shadow:0_1px_8px_rgba(0,0,0,0.7)]">
                  {imageCaption}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
