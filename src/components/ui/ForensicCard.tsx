'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { motion, type HTMLMotionProps } from 'framer-motion'

// Forensic Card - A distinctive card with technical corner markers and glass effect
// Replaces standard shadcn/ui cards for the "Forensic Technopolitics" aesthetic

interface ForensicCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
    children: React.ReactNode
    /** Show technical corner markers (+) */
    showMarkers?: boolean
    /** Enable grid overlay on hover */
    gridHover?: boolean
    /** Apply glass-plate backdrop blur effect */
    glass?: boolean
    /** Border accent color: 'teal' | 'amber' | 'red' | 'subtle' */
    accent?: 'teal' | 'amber' | 'red' | 'subtle'
    /** Animation delay for staggered reveals (in seconds) */
    delay?: number
}

const accentColors = {
    teal: 'border-stone-teal/40 hover:border-stone-teal/70',
    amber: 'border-silicon-amber/40 hover:border-silicon-amber/70',
    red: 'border-alert-red/40 hover:border-alert-red/70',
    subtle: 'border-border-subtle hover:border-border-subtle/80',
}

export function ForensicCard({
    children,
    className,
    showMarkers = true,
    gridHover = true,
    glass = false,
    accent = 'subtle',
    delay = 0,
    ...props
}: ForensicCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -6, transition: { duration: 0.25, ease: 'easeOut' } }}
            transition={{
                duration: 0.4,
                delay,
                ease: [0.25, 0.46, 0.45, 0.94] // Custom easing
            }}
            className={cn(
                'relative rounded-lg p-6 transition-all duration-300 card-interactive',
                glass ? 'glass-plate' : 'bg-stone-charcoal',
                accentColors[accent],
                'border',
                showMarkers && 'tech-corners',
                gridHover && 'grid-hover',
                className
            )}
            {...props}
        >
            {/* Content wrapper to sit above pseudo-elements */}
            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    )
}

// Forensic Card Header
interface ForensicCardHeaderProps {
    children: React.ReactNode
    className?: string
}

export function ForensicCardHeader({ children, className }: ForensicCardHeaderProps) {
    return (
        <div className={cn('mb-4', className)}>
            {children}
        </div>
    )
}

// Forensic Card Title with mono-style label support
interface ForensicCardTitleProps {
    children: React.ReactNode
    className?: string
    /** Optional label displayed above title in mono font */
    label?: string
}

export function ForensicCardTitle({ children, className, label }: ForensicCardTitleProps) {
    return (
        <div className={className}>
            {label && (
                <span className="font-ui-mono text-stone-teal mb-1 block">
                    {label}
                </span>
            )}
            <h3 className="text-lg font-semibold text-text-primary">
                {children}
            </h3>
        </div>
    )
}

// Forensic Card Content
interface ForensicCardContentProps {
    children: React.ReactNode
    className?: string
}

export function ForensicCardContent({ children, className }: ForensicCardContentProps) {
    return (
        <div className={cn('text-text-muted', className)}>
            {children}
        </div>
    )
}

// Export compound component
export const Forensic = {
    Card: ForensicCard,
    Header: ForensicCardHeader,
    Title: ForensicCardTitle,
    Content: ForensicCardContent,
}
