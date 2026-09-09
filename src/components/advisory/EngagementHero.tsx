import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FREE_INTRO_WINDOW } from '@/lib/flags'

/** Shared introduction and CTA, with distinct artwork for each engagement. */
export function EngagementHero({
  badge,
  title,
  lead,
  body,
  inShort,
  ctaLabel,
  ctaHref = '#contact',
  imageCaption,
  imageSrc,
  imageAlt,
  artwork = 'photograph',
  imageRatio = 1,
  showRelatedLink = true,
  showLaunchLine = false,
}: {
  badge: string
  title: string
  lead: React.ReactNode
  body: React.ReactNode
  /** One-sentence summary, in the amber left-rule box. */
  inShort: React.ReactNode
  ctaLabel: string
  ctaHref?: string
  imageCaption: string
  imageSrc: string
  imageAlt: string
  /** A photograph is framed and scrimmed; a transparent cutout floats on the page. */
  artwork?: 'photograph' | 'cutout'
  /** Width ÷ height of a cutout, so its box hugs the artwork instead of leaving a
      transparent band between the picture and its caption. Ignored for photographs,
      which are cropped to the frame. */
  imageRatio?: number
  showRelatedLink?: boolean
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
              <Button asChild size="lg" className="bg-accent-fill text-ink-on-accent hover:bg-accent-fill/90">
                <a href={ctaHref}>
                  {ctaLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              {showRelatedLink && (
                <a href="#where-it-leads" className="text-sm text-stone-teal hover:underline">
                  Where it leads →
                </a>
              )}
            </div>
            {showLaunchLine && FREE_INTRO_WINDOW && (
              <p className="mt-2 text-xs italic text-text-muted">
                Free during our launch window — the first ninety days.
              </p>
            )}
          </div>

          {artwork === 'cutout' ? (
            /* A cutout has no edges of its own to frame, and --scrim-ink is fixed dark
               for artwork that is always dark — laid over transparency it would float
               a dark band on the light theme's stone page. So the caption comes out
               from under the image and themes with everything else. */
            <figure className="relative m-0">
              <div className="relative" style={{ aspectRatio: imageRatio }}>
                <Image
                  src={imageSrc}
                  alt={imageAlt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-contain object-center"
                />
              </div>
              <figcaption className="mt-4 text-sm italic text-balance text-text-muted">
                {imageCaption}
              </figcaption>
            </figure>
          ) : (
            <div className="relative">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border-subtle lg:aspect-square">
                <Image
                  src={imageSrc}
                  alt={imageAlt}
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
          )}
        </div>
      </div>
    </section>
  )
}
