'use client'

import Link from 'next/link'
import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer'
import { ForensicCard } from '@/components/ui/ForensicCard'
import { Badge } from '@/components/ui/badge'
import { PERSONAS, PERSONA_ORDER, type PersonaSlug } from '@/lib/personas'
import { ShieldCheck, Truck, Globe, MapPin, User, Compass, ArrowRight } from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'shield-check': ShieldCheck,
  'truck': Truck,
  'globe': Globe,
  'map-pin': MapPin,
  'user': User,
  'compass': Compass,
}

const colorMap: Record<string, string> = {
  'silicon-amber': 'text-silicon-amber',
  'stone-teal': 'text-stone-teal',
  'tier-pulse': 'text-silicon-cyan',
  'alert-red': 'text-alert-red',
  'sister-indigo': 'text-sister-indigo',
  'text-muted': 'text-text-muted',
}

const hoverBorderMap: Record<string, string> = {
  'silicon-amber': 'hover:border-silicon-amber/60',
  'stone-teal': 'hover:border-stone-teal/60',
  'tier-pulse': 'hover:border-silicon-cyan/60',
  'alert-red': 'hover:border-alert-red/60',
  'sister-indigo': 'hover:border-sister-indigo/60',
  'text-muted': 'hover:border-text-muted/60',
}

export function PersonaNavigator() {
  return (
    <section aria-labelledby="persona-heading" className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-14">
      <StaggerContainer>
        <StaggerItem>
          <div className="text-center max-w-2xl mx-auto mb-8">
            <Badge
              variant="outline"
              className="mb-5 border-silicon-amber/60 text-silicon-amber font-mono text-[12.5px] tracking-[0.10em] uppercase bg-silicon-amber/5"
            >
              Persona Routing
            </Badge>
            <h2
              id="persona-heading"
              className="font-bold text-text-primary mb-4"
              style={{
                fontSize: 'clamp(32px, 4vw, 48px)',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              Find Your Perspective
            </h2>
            <p className="text-base text-text-muted leading-relaxed">
              Intelligence tailored to your seat at the table.
            </p>
          </div>
        </StaggerItem>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PERSONA_ORDER.map((slug: PersonaSlug) => {
            const persona = PERSONAS[slug]
            const Icon = iconMap[persona.icon] || User
            const colorClass = colorMap[persona.color] || 'text-text-muted'
            const hoverBorder = hoverBorderMap[persona.color] || 'hover:border-text-muted/60'
            const href = persona.href ?? `/intelligence?persona=${slug}`
            const isHighlighted = Boolean(persona.href)

            return (
              <StaggerItem key={slug}>
                <Link href={href} className="block h-full">
                  <ForensicCard
                    accent="subtle"
                    showMarkers={false}
                    gridHover={true}
                    delay={0}
                    className={`h-full cursor-pointer transition-all ${hoverBorder} ${
                      isHighlighted ? 'border-sister-indigo/50 ring-1 ring-sister-indigo/20' : ''
                    }`}
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
