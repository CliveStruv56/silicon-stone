/**
 * Decides when a search that found nothing has *settled*, so the zero-result
 * log records what a reader actually searched for rather than every prefix
 * they passed through while typing.
 *
 * The search box navigates 300ms after each pause in typing, so typing
 * "quantum sovereignty" can render "quan", "quantum", "quantum sov" and so on,
 * each of which may find nothing. A query counts as settled only once it has
 * stayed on screen, unchanged, for SETTLE_MS. Any newer query cancels the
 * pending one. Each settled query is reported at most once per page session.
 *
 * Why a quiet period rather than an explicit submit: the box has no button and
 * searches as you type, so most readers never press Enter, and an
 * Enter-only rule would miss most real searches. A reader who presses Enter
 * also stays on the page, so the quiet period covers them too. Plain timers, no
 * React, so it is testable on its own.
 */
export const SETTLE_MS = 3_000

export function createSettledReporter(
  report: (query: string) => void,
  delayMs = SETTLE_MS,
) {
  const reported = new Set<string>()
  let timer: ReturnType<typeof setTimeout> | undefined

  return {
    /** The query now on screen with no results, or null when there is none. */
    update(query: string | null) {
      if (timer) clearTimeout(timer)
      timer = undefined
      if (!query || reported.has(query)) return
      timer = setTimeout(() => {
        timer = undefined
        reported.add(query)
        report(query)
      }, delayMs)
    },
    cancel() {
      if (timer) clearTimeout(timer)
      timer = undefined
    },
  }
}
