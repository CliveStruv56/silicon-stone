'use client'

import Link from 'next/link'
import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer'
import { ForensicCard } from '@/components/ui/ForensicCard'
import { Badge } from '@/components/ui/badge'
import { PERSONAS, PERSONA_ORDER, type PersonaSlug } from '@/lib/personas'
import { ShieldCheck, Truck, Globe, MapPin, User, ArrowRight } from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'shield-check': ShieldCheck,
  'truck': Truck,
  'globe': Globe,
  'map-pin': MapPin,
  'user': User,
}

const colorMap: Record<string, string> = {
  'silicon-amber': 'text-silicon-amber',
  'stone-teal': 'text-stone-teal',
  'tier-pulse': 'text-silicon-cyan',
  'alert-red': 'text-alert-red',
  'text-muted': 'text-text-muted',
}

const hoverBorderMap: Record<string, string> = {
  'silicon-amber': 'hover:border-silicon-amber/60',
  'stone-teal': 'hover:border-stone-teal/60',
  'tier-pulse': 'hover:border-silicon-cyan/60',
  'alert-red': 'hover:border-alert-red/60',
  'text-muted': 'hover:border-text-muted/60',
}

export function PersonaNavigator() {
  return (
    <section aria-labelledby="persona-heading" className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
      <StaggerContainer>
        <StaggerItem>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 id="persona-heading" className="text-3xl lg:text-4xl font-bold text-text-primary mb-4">
              Find Your Perspective
            </h2>
            <p className="text-lg text-text-muted">
              Intelligence tailored to your seat at the table.
            </p>
          </div>
        </StaggerItem>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {PERSONA_ORDER.map((slug: PersonaSlug, idx: number) => {
            const persona = PERSONAS[slug]
            const Icon = iconMap[persona.icon] || User
            const colorClass = colorMap[persona.color] || 'text-text-muted'
            const hoverBorder = hoverBorderMap[persona.color] || 'hover:border-text-muted/60'

            return (
              <StaggerItem key={slug}>
                <Link href={`/briefings?persona=${slug}`} className="block h-full">
                  <ForensicCard
                    accent="subtle"
                    showMarkers={false}
                    gridHover={true}
                    delay={0}
                    className={`h-full cursor-pointer transition-all ${hoverBorder}`}
                  >
                    <div className="text-center space-y-3">
                      <div className={`mx-auto w-10 h-10 rounded-full bg-stone-charcoal border border-border-subtle flex items-center justify-center ${colorClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-mono text-xs uppercase tracking-wider text-text-muted mb-1">
                          {persona.role.split('/')[0].trim()}
                        </div>
                        <h3 className="text-sm font-semibold text-text-primary">
                          {persona.name.split(' ')[0]}
                        </h3>
                      </div>
                      <p className="text-xs text-text-muted leading-relaxed">
                        {persona.ctaCopy}
                      </p>
                      <div className={`flex items-center justify-center gap-1 text-xs ${colorClass}`}>
                        <span>Explore</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </ForensicCard>
                </Link>
              </StaggerItem>
            )
          })}
        </div>
      </StaggerContainer>
    </section>
  )
}
