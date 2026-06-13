'use client'

import { PortableText, type PortableTextComponents } from 'next-sanity'
import type { ReactNode } from 'react'
import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer'
import { ForensicCard } from '@/components/ui/ForensicCard'
import { Badge } from '@/components/ui/badge'

type PortableBlock = { _type: string; [key: string]: unknown }

interface StanceSettings {
    tag?: string
    title?: string
    descriptor?: string
    voice?: string
    bullets?: PortableBlock[]
}

export interface OrchestrationBattlegroundSettings {
    enabled?: boolean
    eyebrow?: string
    h2?: string
    subhead?: string
    intro?: string
    stance01?: StanceSettings
    stance02?: StanceSettings
    stoneTruth?: {
        label?: string
        body?: PortableBlock[]
    }
}

export interface OrchestrationBattlegroundProps {
    settings?: OrchestrationBattlegroundSettings | null
}

const FALLBACK = {
    eyebrow: 'Stone Briefing · Structural Analysis',
    h2: 'The Orchestration Battleground.',
    subhead: 'The AI race is not being decided at the model layer.',
    intro:
        "Most coverage of the AI race fixates on the model layer — which lab leads the benchmarks, which model dropped this week, whose hardware is faster. The actual structural battle is one layer up: how organisations decide which models to use, when, for what, and how to swap them out. The divide between organisations that own that decision layer and those that don't is widening — and it will define industrial position over the next five years.",
    stance01: {
        tag: 'Stance · 01',
        title: 'Model-Dependent',
        descriptor: 'Vendor-bound · capability is rented',
        voice: '“Our AI is whatever our vendor decides we can do this quarter.”',
    },
    stance02: {
        tag: 'Stance · 02',
        title: 'Orchestration-Side',
        descriptor: 'Architecture-bound · capability is owned',
        voice: '“Our AI is whatever we architect across the providers we audit.”',
    },
    stoneTruthLabel: 'Stone Truth',
}

const fallbackStance01Bullets: ReactNode[] = [
    <>
        The vendor&apos;s roadmap defines the capability ceiling.{' '}
        <strong className="text-text-primary font-semibold">
            Strategic scope tracks product release cadence.
        </strong>
    </>,
    <>
        No visibility into how models are trained, updated, or deprecated.{' '}
        <strong className="text-text-primary font-semibold">
            Compliance posture is inherited from the contract.
        </strong>
    </>,
    <>
        Vendor changes — pricing, terms, geographic availability, model family deprecation — register as{' '}
        <strong className="text-text-primary font-semibold">strategic events</strong>.
    </>,
    <>
        Internal capability plateaus at the prompt-engineering layer.{' '}
        <strong className="text-text-primary font-semibold">No leverage above the model.</strong>
    </>,
    <>
        Functionally indistinguishable from any competitor on the same stack.{' '}
        <strong className="text-text-primary font-semibold">
            The substitution cost is a subscription change.
        </strong>
    </>,
]

const fallbackStance02Bullets: ReactNode[] = [
    <>
        Tasks routed across multiple models.{' '}
        <em className="text-silicon-amber not-italic font-medium">
            The decision layer — what runs where, when — is held in-house.
        </em>
    </>,
    <>
        Providers audited, swapped, and benchmarked{' '}
        <em className="text-silicon-amber not-italic font-medium">
            without operational disruption
        </em>
        .
    </>,
    <>
        Data sovereignty and compliance{' '}
        <em className="text-silicon-amber not-italic font-medium">
            designed into the architecture
        </em>
        , not appended after procurement.
    </>,
    <>
        Capability{' '}
        <em className="text-silicon-amber not-italic font-medium">
            compounds across vendor cycles
        </em>
        . Each model swap leaves institutional learning intact.
    </>,
    <>
        Architecture sets the strategy.{' '}
        <em className="text-silicon-amber not-italic font-medium">
            Strategy doesn&apos;t follow whichever model is currently leading the benchmarks.
        </em>
    </>,
]

const fallbackStoneTruthBody: ReactNode = (
    <>
        Read which side of the orchestration divide your industry sits on.{' '}
        <em className="text-silicon-amber not-italic font-medium">
            The 2030 league table is being set there — not at the model layer where everyone else is looking.
        </em>{' '}
        <strong className="text-text-primary font-semibold">
            The same divide runs through individual careers.
        </strong>{' '}
        AI fluency is sliding from differentiator to baseline — written into the job spec, not the bonus column. The way spreadsheets quietly became, a generation ago.
    </>
)

const stance01PortableComponents: PortableTextComponents = {
    block: {
        normal: ({ children }) => (
            <span className="text-sm leading-relaxed text-text-muted">{children}</span>
        ),
    },
    marks: {
        strong: ({ children }) => (
            <strong className="text-text-primary font-semibold">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
    },
}

const stance02PortableComponents: PortableTextComponents = {
    block: {
        normal: ({ children }) => (
            <span className="text-sm leading-relaxed text-text-muted">{children}</span>
        ),
    },
    marks: {
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => (
            <em className="text-silicon-amber not-italic font-medium">{children}</em>
        ),
    },
}

const stoneTruthPortableComponents: PortableTextComponents = {
    block: {
        normal: ({ children }) => (
            <p className="text-base leading-relaxed text-text-primary">{children}</p>
        ),
    },
    marks: {
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => (
            <em className="text-silicon-amber not-italic font-medium">{children}</em>
        ),
    },
}

function StanceColumn({
    stance,
    fallback,
    fallbackBullets,
    accent,
    portableComponents,
    tagClassName,
}: {
    stance: StanceSettings | undefined
    fallback: { tag: string; title: string; descriptor: string; voice: string }
    fallbackBullets: ReactNode[]
    accent: 'subtle' | 'amber'
    portableComponents: PortableTextComponents
    tagClassName: string
}) {
    const tag = stance?.tag || fallback.tag
    const title = stance?.title || fallback.title
    const descriptor = stance?.descriptor || fallback.descriptor
    const voice = stance?.voice || fallback.voice
    const sanityBullets = stance?.bullets

    return (
        <ForensicCard accent={accent} showMarkers={true} gridHover={false} className="h-full">
            <div className="mb-5">
                <div
                    className={`font-mono text-[12.5px] tracking-[0.10em] uppercase mb-3 ${tagClassName}`}
                >
                    {tag}
                </div>
                <h3 className="text-2xl font-semibold text-text-primary mb-1.5">{title}</h3>
                <p className="text-sm text-text-muted">{descriptor}</p>
            </div>

            <p className="text-sm text-text-muted italic mb-6 pb-6 border-b border-border-subtle leading-relaxed">
                {voice}
            </p>

            <ul className="space-y-4 list-none">
                {sanityBullets && sanityBullets.length > 0
                    ? sanityBullets.map((block, i) => (
                          <li key={i} className="flex items-start gap-3">
                              <span
                                  aria-hidden="true"
                                  className="mt-2 h-1 w-1 rounded-full bg-text-muted/60 flex-shrink-0"
                              />
                              <div className="flex-1">
                                  <PortableText
                                      value={[block] as never}
                                      components={portableComponents}
                                  />
                              </div>
                          </li>
                      ))
                    : fallbackBullets.map((node, i) => (
                          <li key={i} className="flex items-start gap-3">
                              <span
                                  aria-hidden="true"
                                  className="mt-2 h-1 w-1 rounded-full bg-text-muted/60 flex-shrink-0"
                              />
                              <span className="text-sm leading-relaxed text-text-muted flex-1">
                                  {node}
                              </span>
                          </li>
                      ))}
            </ul>
        </ForensicCard>
    )
}

export function OrchestrationBattleground({ settings }: OrchestrationBattlegroundProps) {
    if (settings?.enabled === false) {
        return null
    }

    const eyebrow = settings?.eyebrow || FALLBACK.eyebrow
    const h2 = settings?.h2 || FALLBACK.h2
    const subhead = settings?.subhead || FALLBACK.subhead
    const intro = settings?.intro || FALLBACK.intro
    const stoneTruthLabel = settings?.stoneTruth?.label || FALLBACK.stoneTruthLabel
    const stoneTruthSanityBody = settings?.stoneTruth?.body

    return (
        <section
            aria-labelledby="orchestration-battleground-heading"
            className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-14"
        >
            <StaggerContainer>
                <StaggerItem>
                    <div className="max-w-3xl mb-8">
                        <Badge
                            variant="outline"
                            className="mb-6 border-silicon-amber/60 text-silicon-amber font-mono text-[12.5px] tracking-[0.10em] uppercase bg-silicon-amber/5"
                        >
                            {eyebrow}
                        </Badge>
                        <h2
                            id="orchestration-battleground-heading"
                            className="font-bold text-text-primary mb-4"
                            style={{
                                fontSize: 'clamp(32px, 4vw, 48px)',
                                letterSpacing: '-0.02em',
                                lineHeight: 1.1,
                            }}
                        >
                            {h2}
                        </h2>
                        <p
                            className="text-silicon-amber font-medium mb-6"
                            style={{
                                fontSize: 'clamp(18px, 1.8vw, 22px)',
                                lineHeight: 1.45,
                            }}
                        >
                            {subhead}
                        </p>
                        <p className="text-base text-text-muted leading-relaxed">{intro}</p>
                    </div>
                </StaggerItem>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <StaggerItem>
                        <StanceColumn
                            stance={settings?.stance01}
                            fallback={FALLBACK.stance01}
                            fallbackBullets={fallbackStance01Bullets}
                            accent="subtle"
                            portableComponents={stance01PortableComponents}
                            tagClassName="text-text-muted"
                        />
                    </StaggerItem>
                    <StaggerItem>
                        <StanceColumn
                            stance={settings?.stance02}
                            fallback={FALLBACK.stance02}
                            fallbackBullets={fallbackStance02Bullets}
                            accent="amber"
                            portableComponents={stance02PortableComponents}
                            tagClassName="text-silicon-amber"
                        />
                    </StaggerItem>
                </div>

                <div
                    className="max-w-[880px] rounded-xl px-9 py-8 border border-border-subtle border-l-[3px] border-l-silicon-amber"
                    style={{
                        background:
                            'linear-gradient(to right, rgba(232,154,60,0.06), rgba(74,155,155,0.04))',
                    }}
                >
                    <div className="font-mono text-[12.5px] tracking-[0.10em] uppercase text-silicon-amber mb-3">
                        {stoneTruthLabel}
                    </div>
                    {stoneTruthSanityBody && stoneTruthSanityBody.length > 0 ? (
                        <PortableText
                            value={stoneTruthSanityBody as never}
                            components={stoneTruthPortableComponents}
                        />
                    ) : (
                        <p className="text-base leading-relaxed text-text-primary">
                            {fallbackStoneTruthBody}
                        </p>
                    )}
                </div>
            </StaggerContainer>
        </section>
    )
}
