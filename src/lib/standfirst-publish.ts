/**
 * Whether a published article should reach Standfirst. Pure, for the same
 * reason as `published-at.ts`: the decision is the part worth testing.
 *
 * Every later edit re-fires the publish webhook. Standfirst gives one document
 * one broadcast, but it counts first sight, not first publication: the first
 * edit of an old article after this connection went live would otherwise
 * become a new broadcast, and with auto-send on it would go to the whole list.
 * So only a recent publication is forwarded.
 */
export const STANDFIRST_FRESH_HOURS = 72

export function isFreshPublication(publishedAt: string | null | undefined, now: Date): boolean {
  // No date means this run has just stamped one: a new publication made outside Studio.
  if (!publishedAt) return true
  const at = Date.parse(publishedAt)
  if (Number.isNaN(at)) return false
  return now.getTime() - at <= STANDFIRST_FRESH_HOURS * 60 * 60 * 1000
}
