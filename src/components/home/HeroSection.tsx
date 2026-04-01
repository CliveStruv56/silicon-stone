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
                <div className="max-w-4xl">
                    <motion.div variants={itemVariants}>
                        <Badge variant="outline" className="mb-6 border-silicon-amber text-silicon-amber font-mono text-xs bg-silicon-amber/5">
                            Career Infrastructure for the AI Age
                        </Badge>
                    </motion.div>

                    <motion.h1
                        variants={itemVariants}
                        className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl lg:text-6xl leading-[1.1] mb-8"
                    >
                        {settings?.heroTitle || (
                            <>
                                AI Literacy is No Longer Optional.{' '}
                                <span className="block mt-2 text-silicon-amber">
                                    It&apos;s Your Career Infrastructure.
                                </span>
                            </>
                        )}
                    </motion.h1>

                    <motion.p
                        variants={itemVariants}
                        className="text-xl text-text-muted leading-relaxed max-w-3xl"
                    >
                        {settings?.heroDescription ||
                            "For leaders in their prime (35\u201355), the risk isn\u2019t just disruption\u2014it\u2019s obsolescence. We provide the forensic intelligence and orchestration frameworks you need to secure your seat in the AI-driven economy."}
                    </motion.p>

                    <motion.div
                        variants={itemVariants}
                        className="mt-10"
                    >
                        <Link href="/#subscribe">
                            <Button size="lg" className="bg-silicon-amber text-slate-deep hover:bg-silicon-amber/90 transition-transform hover:scale-105 font-semibold text-base px-8">
                                Get Your Career Readiness Audit
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </motion.div>
        </section>
    )
}
