'use client'

import { useSyncExternalStore } from 'react'
import { nowMoment } from './ai-act-dates'

const subscribe = () => () => {}

/**
 * The current moment (an ISO instant, truncated to the hour), read in the
 * browser.
 *
 * Returns `null` on the server and during hydration. A page that is prerendered
 * would otherwise freeze the build's date into its HTML, so anything that
 * depends on the date must render a date-neutral form while this is `null` and
 * the dated form once it is a string. The snapshot is read on every render and
 * is stable within an hour, so a tab left open picks up a new state on its next
 * render.
 */
export function useAssessmentDate(): string | null {
  return useSyncExternalStore(subscribe, () => nowMoment(), () => null)
}
