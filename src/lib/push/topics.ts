/**
 * The two — and only two — Web Push topics (P3-6). Restraint is the point:
 * opt-in is requested only after value, and subscribers control each topic
 * independently. With no user accounts, subscriptions are keyed to the device
 * push endpoint, which is fine for these broadcast-style topics.
 */
export const PUSH_TOPICS = [
  {
    id: 'ai-act-deadlines',
    label: 'AI Act deadline alerts',
    description: 'A short alert when an AI Act obligation deadline is approaching.',
  },
  {
    id: 'audit-deep-dives',
    label: 'New Audit-tier Deep Dives',
    description: 'When a new Audit-tier deep dive is published.',
  },
] as const

export type PushTopicId = (typeof PUSH_TOPICS)[number]['id']

export const PUSH_TOPIC_IDS: PushTopicId[] = PUSH_TOPICS.map((t) => t.id)

export function isPushTopic(value: string): value is PushTopicId {
  return PUSH_TOPIC_IDS.includes(value as PushTopicId)
}
