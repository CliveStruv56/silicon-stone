'use client'

import { useEffect, useRef } from 'react'

/**
 * Thin scroll-depth progress bar for article routes (P2-1). Mounted only by
 * the article page, so it never appears elsewhere. Progress is written as a
 * scaleX transform inside rAF — compositor-only, no layout, no easing (the
 * bar tracks the reader's own scrolling, so there is no added motion for
 * prefers-reduced-motion to suppress).
 */
export function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const article = document.querySelector('article')
    const bar = barRef.current
    if (!article || !bar) return

    let ticking = false
    const update = () => {
      ticking = false
      const rect = article.getBoundingClientRect()
      const total = rect.height - window.innerHeight
      const progress = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1
      bar.style.transform = `scaleX(${progress})`
    }
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5"
      style={{ marginTop: 'env(safe-area-inset-top)' }}
    >
      <div
        ref={barRef}
        className="h-full origin-left bg-gradient-to-r from-stone-teal to-silicon-cyan"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  )
}
