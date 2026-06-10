'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { urlFor } from '@/sanity/lib/image'

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.1,
        },
    },
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: [0.25, 0.46, 0.45, 0.94] as const,
        },
    },
}

const HERO_IMAGE_ALT =
    'A figure on a clifftop on an Outer Orkney isle, looking out across the North Atlantic — the view from the edge'

const HERO_OVERLAY_BACKGROUND = `
    linear-gradient(to right,
        rgba(11,17,23,0.50) 0%,
        rgba(11,17,23,0.18) 32%,
        rgba(11,17,23,0.70) 60%,
        rgba(11,17,23,0.95) 100%
    ),
    linear-gradient(to top,
        rgba(11,17,23,0.70) 0%,
        rgba(11,17,23,0) 38%
    )
`

export interface HeroSectionProps {
    settings?: {
        heroTitle?: string
        heroDescription?: string
        heroImage?: {
            asset?: { _ref: string }
            alt?: string
        }
    } | null
}

export function HeroSection({ settings }: HeroSectionProps) {
    return (
        <section className="relative overflow-hidden bg-slate-deep noise-overlay">
            {/* Background Image — full opacity. The directional overlay holds type legibility. */}
            <div className="absolute inset-0 z-0 select-none">
                {settings?.heroImage?.asset ? (
                    <Image
                        src={urlFor(settings.heroImage).width(1920).height(1080).quality(85).url()}
                        alt={settings.heroImage.alt || HERO_IMAGE_ALT}
                        fill
                        priority
                        sizes="100vw"
                        className="object-cover object-[center_30%] md:object-[center_30%]"
                    />
                ) : (
                    <Image
                        src="/homepage-redesign-2026/the-watcher.png"
                        alt={HERO_IMAGE_ALT}
                        fill
                        priority
                        sizes="100vw"
                        className="object-cover object-[left_center] md:object-[center_30%]"
                    />
                )}
            </div>

            {/* Directional gradient overlay — preserves figure on the left, darkens the right for type. */}
            <div
                className="absolute inset-0 z-[1] pointer-events-none"
                style={{ background: HERO_OVERLAY_BACKGROUND }}
            />

            {/* Subtle teal grid — quiet brand cohesion */}
            <div
                className="absolute inset-0 z-[2] opacity-[0.025] pointer-events-none mix-blend-overlay"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, rgba(74, 155, 155, 0.5) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(74, 155, 155, 0.5) 1px, transparent 1px)
                    `,
                    backgroundSize: '80px 80px',
                }}
            />

            <motion.div
                className="relative z-10 mx-auto max-w-7xl px-6 py-24 lg:py-36"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="lg:grid lg:grid-cols-3 lg:gap-8">
                    <div className="lg:col-start-2 lg:col-span-2">
                        <motion.div variants={itemVariants}>
                            <Badge
                                variant="outline"
                                className="mb-8 rounded-md border-silicon-amber bg-silicon-amber/14 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.10em] text-silicon-amber shadow-[0_0_0_1px_rgba(246,173,85,0.35),0_0_28px_rgba(246,173,85,0.20),0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-sm"
                            >
                                Forensic Technopolitics · the view from the edge
                            </Badge>
                        </motion.div>

                        <motion.h1
                            variants={itemVariants}
                            className="font-bold text-text-primary mb-6"
                            style={{
                                fontSize: 'clamp(44px, 6vw, 80px)',
                                letterSpacing: '-0.028em',
                                lineHeight: 1.02,
                            }}
                        >
                            {settings?.heroTitle || 'AI. Policy. Power. Leadership.'}
                        </motion.h1>

                        <motion.p
                            variants={itemVariants}
                            className="text-text-primary font-medium mb-8 max-w-2xl"
                            style={{
                                fontSize: 'clamp(20px, 2vw, 26px)',
                                letterSpacing: '-0.005em',
                                lineHeight: 1.38,
                            }}
                        >
                            Independent, decision-grade intelligence for UK and European leaders managing AI governance, technology dependency, and operational resilience.
                        </motion.p>

                        <motion.p
                            variants={itemVariants}
                            className="mb-8 max-w-xl text-base font-medium leading-relaxed text-text-primary/90"
                            style={{
                                textShadow: '0 2px 18px rgba(0, 0, 0, 0.65)',
                            }}
                        >
                            AI fluency is fast becoming{' '}
                            <span className="font-semibold text-silicon-amber">the baseline, not the edge</span>
                            {' '}— for industries and the careers inside them.
                        </motion.p>

                        <motion.p
                            variants={itemVariants}
                            className="mb-8 max-w-xl border-l-2 border-silicon-amber/50 pl-4 text-base italic leading-relaxed text-silicon-amber"
                            style={{
                                textShadow: '0 2px 18px rgba(0, 0, 0, 0.65)',
                            }}
                        >
                            Read every briefing three ways — for your institution, for the balance of power, and for your own position.
                        </motion.p>

                        <motion.p
                            variants={itemVariants}
                            className="max-w-xl text-base font-medium leading-relaxed text-text-primary/90"
                            style={{
                                textShadow: '0 2px 18px rgba(0, 0, 0, 0.65)',
                            }}
                        >
                            {settings?.heroDescription ||
                                'Calibrated, decision-grade analysis from someone who spent thirty years inside the industry. Published twice a week from an Outer Orkney isle — sixty miles north of mainland Scotland — because the view from the edge is structurally clearer than the view from any centre.'}
                        </motion.p>

                        <motion.div
                            variants={itemVariants}
                            className="mt-10 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6"
                        >
                            <Link href="/#subscribe">
                                <Button
                                    size="lg"
                                    className="bg-silicon-amber text-slate-deep hover:bg-silicon-amber/90 transition-transform hover:scale-105 font-semibold text-base px-8"
                                >
                                    Get the Atlantic Drift Briefing
                                </Button>
                            </Link>

                            <Link
                                href="/methodology"
                                className="group inline-flex items-center gap-2 text-text-primary hover:text-silicon-amber transition-colors font-medium"
                            >
                                Read the methodology
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </motion.div>

                        <motion.p
                            variants={itemVariants}
                            className="mt-10 font-mono text-xs uppercase tracking-[0.10em] text-text-muted flex items-center gap-2"
                        >
                            <span className="text-stone-teal" aria-hidden="true">●</span>
                            Two briefings a week · Tuesday Stone Briefing · Friday Practical Move
                        </motion.p>
                    </div>
                </div>
            </motion.div>
        </section>
    )
}
