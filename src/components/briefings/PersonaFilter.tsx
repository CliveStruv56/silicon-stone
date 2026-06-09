'use client'

import { Shield, Truck, Globe, MapPin, User, Compass } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PERSONAS, BRIEFINGS_PERSONA_ORDER, type PersonaSlug } from '@/lib/personas'

interface PersonaFilterProps {
  selectedPersona: string | null
  onPersonaChange: (persona: string | null) => void
  personaCounts?: Record<string, number>
  className?: string
}

const PERSONA_ICONS: Record<PersonaSlug, React.ReactNode> = {
  clara: <Shield className="h-4 w-4" />,
  ian: <Truck className="h-4 w-4" />,
  sofia: <Globe className="h-4 w-4" />,
  robert: <MapPin className="h-4 w-4" />,
  positional: <Compass className="h-4 w-4" />,
  citizen: <User className="h-4 w-4" />,
}

export function PersonaFilter({
  selectedPersona,
  onPersonaChange,
  personaCounts = {},
  className,
}: PersonaFilterProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {/* All filter */}
      <button
        onClick={() => onPersonaChange(null)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
          'text-sm font-medium',
          !selectedPersona
            ? 'bg-silicon-cyan/20 border-silicon-cyan text-silicon-cyan'
            : 'bg-stone-charcoal/50 border-border-subtle text-text-muted hover:border-stone-teal hover:text-text-primary'
        )}
      >
        <span>All</span>
        {personaCounts.all !== undefined && (
          <Badge variant="secondary" className="text-xs px-1.5 py-0">
            {personaCounts.all}
          </Badge>
        )}
      </button>

      {/* Persona filters */}
      {BRIEFINGS_PERSONA_ORDER.map((slug) => {
        const persona = PERSONAS[slug]
        const isSelected = selectedPersona === slug
        const count = personaCounts[slug]

        return (
          <button
            key={slug}
            onClick={() => onPersonaChange(isSelected ? null : slug)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
              'text-sm',
              isSelected
                ? 'bg-silicon-amber/20 border-silicon-amber text-silicon-amber'
                : 'bg-stone-charcoal/50 border-border-subtle text-text-muted hover:border-stone-teal hover:text-text-primary'
            )}
          >
            {PERSONA_ICONS[slug]}
            <span className="hidden sm:inline">{persona.name.split(' ')[1]}</span>
            <span className="sm:hidden">{persona.name.split(' ')[1]?.slice(0, 1)}</span>
            {count !== undefined && count > 0 && (
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs px-1.5 py-0',
                  isSelected && 'bg-silicon-amber/30'
                )}
              >
                {count}
              </Badge>
            )}
          </button>
        )
      })}
    </div>
  )
}

// Export a mobile-friendly dropdown version
export function PersonaFilterDropdown({
  selectedPersona,
  onPersonaChange,
  className,
}: Omit<PersonaFilterProps, 'personaCounts'>) {
  return (
    <div className={cn('relative', className)}>
      <select
        value={selectedPersona || ''}
        onChange={(e) => onPersonaChange(e.target.value || null)}
        className={cn(
          'w-full px-4 py-3 rounded-lg border bg-stone-charcoal border-border-subtle',
          'text-text-primary appearance-none cursor-pointer',
          'focus:outline-none focus:ring-1 focus:ring-silicon-cyan focus:border-silicon-cyan'
        )}
      >
        <option value="">All Personas</option>
        {BRIEFINGS_PERSONA_ORDER.map((slug) => (
          <option key={slug} value={slug}>
            {PERSONAS[slug].name}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg
          className="h-4 w-4 text-text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}
