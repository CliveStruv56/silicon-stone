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
                className="relative z-10 mx-auto max-w-7xl px-6 py-16 lg:py-24"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="lg:grid lg:grid-cols-3 lg:gap-8">
                    <div className="lg:col-start-2 lg:col-span-2">
                        {/* The hero always sits on the dark Atlantic photo, so all text here is
                            FIXED light + a readable bright accent — it must NOT follow the theme
                            tokens (which flip to dark ink in light mode). */}
                        <motion.div variants={itemVariants}>
                            <Badge
                                variant="outline"
                                className="mb-8 max-w-full whitespace-normal rounded-md border-[#F6AD55]/70 bg-[#F6AD55]/12 px-3 py-1.5 font-mono text-[11px] sm:text-[12.5px] uppercase tracking-[0.06em] sm:tracking-[0.10em] text-[#F6AD55] shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-sm"
                            >
                                Forensic Technopolitics
                                <span className="hidden sm:inline"> · the view from the edge</span>
                            </Badge>
                        </motion.div>

                        <motion.h1
                            variants={itemVariants}
                            className="font-bold text-white mb-6 text-balance"
                            style={{
                                fontSize: 'clamp(38px, 4.4vw, 60px)',
                                letterSpacing: '-0.01em',
                                lineHeight: 1.08,
                                textShadow: '0 2px 30px rgba(0,0,0,0.45)',
                            }}
                        >
                            {settings?.heroTitle || (
                                <>
                                    You&apos;ve deployed AI.{' '}
                                    <span className="text-[#F6AD55]">Have you governed it?</span>
                                </>
                            )}
                        </motion.h1>

                        <motion.p
                            variants={itemVariants}
                            className="font-medium mb-7 max-w-2xl text-white/92"
                            style={{
                                fontSize: 'clamp(19px, 1.9vw, 24px)',
                                letterSpacing: '-0.005em',
                                lineHeight: 1.42,
                                textShadow: '0 2px 20px rgba(0,0,0,0.5)',
                            }}
                        >
                            Independent, decision-grade intelligence and advisory on AI governance, the technology supply chain, and the geopolitics of dependency — for leaders at mid-size UK and European companies who have to act without a Big-Four budget. Read from thirty years inside the industry.
                        </motion.p>

                        <motion.div
                            variants={itemVariants}
                            className="mt-2 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6"
                        >
                            <Link href="/#subscribe">
                                <Button
                                    size="lg"
                                    className="bg-[#1f807c] text-white hover:bg-[#27938d] transition-transform hover:scale-105 font-semibold text-base px-8 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
                                >
                                    Get the Atlantic Drift Briefing
                                </Button>
                            </Link>

                            <Link href="/advisory#contact">
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="border-white/40 bg-white/5 text-white hover:bg-white/10 hover:text-white transition-transform hover:scale-105 font-semibold text-base px-8 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-sm"
                                >
                                    Book a 20-minute AI exposure call
                                </Button>
                            </Link>

                            <Link
                                href="/methodology"
                                className="group inline-flex items-center gap-2 whitespace-nowrap font-medium text-[#8fcbc4] hover:text-[#b6e0da] transition-colors"
                            >
                                Read the methodology
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </motion.div>

                        <motion.p
                            variants={itemVariants}
                            className="mt-10 font-mono text-xs uppercase tracking-[0.10em] text-white/65 flex items-center gap-2"
                        >
                            <span className="text-[#8fcbc4]" aria-hidden="true">●</span>
                            Two briefings a week · Tuesday Stone Briefing · Friday Practical Move
                        </motion.p>
                    </div>
                </div>
            </motion.div>
        </section>
    )
}
