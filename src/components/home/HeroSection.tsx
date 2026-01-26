'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { urlFor } from '@/sanity/lib/image'

// Animation variants for staggered entry
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
    const description = settings?.heroDescription || "We combine Supply Chain Forensics, Comparative Policy Stress-Testing, and Scenario-Based Drift Modeling to help decision-makers navigate the collision of silicon speed and stone reality."

    return (
        <section className="relative overflow-hidden bg-slate-deep noise-overlay">
            {/* Background Image Logic */}
            {settings?.heroImage ? (
                <div className="absolute inset-0 z-0 select-none">
                    <Image
                        src={urlFor(settings.heroImage).width(1920).height(1080).quality(90).url()}
                        alt={settings.heroTitle || "Hero Background"}
                        fill
                        priority
                        className="object-cover opacity-60 mix-blend-overlay"
                    />
                </div>
            ) : null}

            {/* Standard Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-stone-charcoal/50 to-transparent" />

            {/* Background Image (If provided) */}
            {/* Logic: If we have an image, we show it behind the gradient. 
                We need to import urlFor. I'll add the import in a separate step or assume I'll add it now.
            */}

            {/* Subtle grid overlay for depth */}
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
                className="relative mx-auto max-w-7xl px-6 py-12 lg:py-16"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="max-w-3xl">
                    <motion.div variants={itemVariants}>
                        <Badge variant="outline" className="mb-6 border-stone-teal text-stone-teal font-ui-mono bg-stone-teal/5">
                            Forensic Technopolitics
                        </Badge>
                    </motion.div>

                    <motion.h1
                        variants={itemVariants}
                        className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl lg:text-5xl leading-tight mb-6"
                    >
                        {/* If sanity title exists, render it. Otherwise render the hardcoded styled version */}
                        {settings?.heroTitle ? (
                            settings.heroTitle
                        ) : (
                            <>
                                Forensic analysis of the <span className="text-silicon-amber">EU AI Act</span>, <span className="text-stone-teal">Semiconductor Supply Chains</span>, and <span className="text-white">Digital Sovereignty</span>.
                            </>
                        )}
                    </motion.h1>

                    <motion.p
                        variants={itemVariants}
                        className="mt-4 text-lg text-text-muted leading-relaxed max-w-2xl"
                    >
                        {description}
                    </motion.p>

                    <motion.div
                        variants={itemVariants}
                        className="mt-8 flex gap-4"
                    >
                        <Link href="/analysis">
                            <Button className="bg-silicon-amber text-slate-deep hover:bg-silicon-amber/90 transition-transform hover:scale-105 font-medium">
                                Start Reading
                            </Button>
                        </Link>
                        <Link href="/tools">
                            <Button variant="outline" className="border-stone-teal text-stone-teal hover:bg-stone-teal/10 transition-transform hover:scale-105 font-ui-mono text-xs">
                                EXPLORE TOOLS
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </motion.div>
        </section>
    )
}
