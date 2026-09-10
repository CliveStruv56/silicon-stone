import { BookOpen, Briefcase, FileText, Layers, MessageCircle, Target, User, type LucideIcon } from 'lucide-react'
import type { WaymarkPathCapabilityId } from '@/lib/waymarkpath'

/** Presentation only: product copy and relationships remain in lib/waymarkpath. */
export const STAGE_VISUALS: Record<WaymarkPathCapabilityId, {
  icon: LucideIcon
  tone: 'starting' | 'direction' | 'action' | 'support'
  column: number
  row: number
}> = {
  profile: { icon: User, tone: 'starting', column: 1, row: 2 },
  skills: { icon: Layers, tone: 'starting', column: 2, row: 2 },
  gaps: { icon: Target, tone: 'direction', column: 3, row: 2 },
  learning: { icon: BookOpen, tone: 'action', column: 4, row: 1 },
  resume: { icon: FileText, tone: 'action', column: 4, row: 3 },
  jobs: { icon: Briefcase, tone: 'action', column: 5, row: 3 },
  checkins: { icon: MessageCircle, tone: 'support', column: 6, row: 2 },
}
