'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
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
            {/* Background Image */}
            {settings?.heroImage?.asset ? (
                <div className="absolute inset-0 z-0 select-none">
                    <Image
                        src={urlFor(settings.heroImage).width(1920).height(1080).quality(85).url()}
                        alt={settings.heroImage.alt || "The view from the edge of Europe"}
                        fill
                        priority
                        className="object-cover opacity-30 grayscale mix-blend-luminosity"
                    />
                </div>
            ) : (
                <div className="absolute inset-0 z-0 select-none">
                    <Image
                        src="/intelligence-stream-bg.png"
                        alt="The view from the edge of Europe"
                        fill
                        priority
                        className="object-cover opacity-30 grayscale mix-blend-luminosity"
                    />
                </div>
            )}

            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-deep/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-deep via-transparent to-transparent" />

            {/* Subtle grid overlay */}
            <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, rgba(74, 155, 155, 0.5) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(74, 155, 155, 0.5) 1px, transparent 1px)
                    `,
                    backgroundSize: '60px 60px',
                }}
            />

            <motion.div
                className="relative mx-auto max-w-7xl px-6 py-20 lg:py-32"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="max-w-3xl">
                    <motion.div variants={itemVariants}>
                        <Badge variant="outline" className="mb-6 border-stone-teal text-stone-teal font-mono text-xs bg-stone-teal/5">
                            Strategic Intelligence
                        </Badge>
                    </motion.div>

                    <motion.h1
                        variants={itemVariants}
                        className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl lg:text-6xl leading-tight mb-6"
                    >
                        {settings?.heroTitle || (
                            <>
                                Navigate the Collision.{' '}
                                <span className="text-silicon-amber">Own the Orchestration Layer.</span>
                            </>
                        )}
                    </motion.h1>

                    <motion.p
                        variants={itemVariants}
                        className="mt-4 text-xl text-text-muted leading-relaxed max-w-2xl"
                    >
                        {settings?.heroDescription ||
                            "Strategic intelligence for mid-career leaders. We bridge the gap between silicon speed and the stone reality of European tech sovereignty."}
                    </motion.p>

                    <motion.div
                        variants={itemVariants}
                        className="mt-10"
                    >
                        <Link href="/briefings">
                            <Button size="lg" className="bg-silicon-amber text-slate-deep hover:bg-silicon-amber/90 transition-transform hover:scale-105 font-semibold text-base px-8">
                                Enter the Intelligence Stream
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </motion.div>
        </section>
    )
}
