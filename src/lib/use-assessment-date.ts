'use client'

import { useSyncExternalStore } from 'react'
import { todayIso } from './ai-act-dates'

const subscribe = () => () => {}

/**
 * Today's date as an ISO day, read in the browser.
 *
 * Returns `null` on the server and during hydration. A page that is prerendered
 * would otherwise freeze the build's date into its HTML, so anything that
 * depends on the date must render a date-neutral form while this is `null` and
 * the dated form once it is a string. The snapshot is read on every render, so a
 * tab left open across midnight picks up the new day on its next render.
 */
export function useAssessmentDate(): string | null {
  return useSyncExternalStore(subscribe, () => todayIso(), () => null)
}
