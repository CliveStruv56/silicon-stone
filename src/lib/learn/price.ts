import { LEARN_PRICES, type LearnPrice, type LearnPriceKey } from '../offering'

/**
 * The price block for a course. Level 0 is free whatever track it sits in —
 * the orientation and the literacy course are in Foundations for the reading
 * order, not to be charged at the track's band.
 */
export function priceForCourse(level: number | null, trackPriceKey: LearnPriceKey | null): LearnPrice {
  if (level === 0) return LEARN_PRICES.free
  return LEARN_PRICES[trackPriceKey ?? 'electives'] ?? LEARN_PRICES.electives
}
