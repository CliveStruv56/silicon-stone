'use client'

import { useCallback, useEffect, useRef } from 'react'

/**
 * Call `onSeen` once, the first time the element given the returned callback
 * ref is visible enough while `enabled` is true.
 *
 * Used by the two explorer tools (Supply Chain Mapper, Scenario Modeler) whose
 * result is on the page from the first paint: for them "a result was shown" is
 * honestly measured as "the reader, having changed an input, scrolled to the
 * result", not as "the page loaded". `onSeen` is read through a ref, so it may
 * close over the latest state without re-arming the observer.
 *
 * It hands back a *callback* ref, not a ref object, on purpose. The Modeler's
 * result sits inside `AnimatePresence mode="wait"`, which mounts the new card
 * after the old one has animated out — a render of AnimatePresence, not of the
 * page — so an effect in the page never learns the element changed and an
 * observer left on the old node never fires. A browser walk-through caught
 * that; the first two versions passed every unit test.
 */
export function useSeenOnce(
  enabled: boolean,
  onSeen: () => void,
  threshold = 0.3,
): (element: Element | null) => void {
  const callback = useRef(onSeen)
  const enabledRef = useRef(enabled)
  const done = useRef(false)
  const element = useRef<Element | null>(null)
  const observer = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    callback.current = onSeen
  })

  const arm = useCallback(() => {
    observer.current?.disconnect()
    observer.current = null
    const target = element.current
    if (done.current || !enabledRef.current || !target) return
    if (typeof IntersectionObserver === 'undefined') return

    observer.current = new IntersectionObserver(
      (entries) => {
        if (done.current) return
        // A card taller than the screen can never be `threshold` visible, so
        // half a screen of it counts too.
        const seen = entries.some(
          (entry) =>
            entry.isIntersecting &&
            (entry.intersectionRatio >= threshold || entry.intersectionRect.height >= window.innerHeight * 0.5),
        )
        if (seen) {
          done.current = true
          observer.current?.disconnect()
          callback.current()
        }
      },
      { threshold: [0, 0.1, 0.25, threshold, 0.5, 0.75, 1] },
    )
    observer.current.observe(target)
  }, [threshold])

  useEffect(() => {
    enabledRef.current = enabled
    arm()
  }, [enabled, arm])

  useEffect(() => () => observer.current?.disconnect(), [])

  return useCallback(
    (node: Element | null) => {
      if (node === element.current) return
      element.current = node
      arm()
    },
    [arm],
  )
}
