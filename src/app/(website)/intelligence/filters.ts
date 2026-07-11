import { PERSONAS } from '@/lib/personas'

// Shared between the server page (SSR-filtered deep links, P1-5) and the
// client feed (popstate URL sync) — keep this module free of 'use client'.

export type IntelligenceTier = 'pulse' | 'briefing' | 'audit'

export interface FeedFilters {
  persona: string | null
  tier: IntelligenceTier | null
  topic: string | null
}

export function getPersonaParam(value: string | null): string | null {
  return value && value in PERSONAS ? value : null
}

export function getTierParam(value: string | null): IntelligenceTier | null {
  return value === 'pulse' || value === 'briefing' || value === 'audit' ? value : null
}

export function getTopicParam(value: string | null): string | null {
  return value && /^[a-z0-9-]+$/i.test(value) ? value : null
}
