'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'ss:article-size'
const MIN = 16
const MAX = 21
const DEFAULT_SIZE = 18

function applySize(size: number) {
  document.documentElement.style.setProperty('--article-size', `${size}px`)
}

/**
 * A− / A / A+ text-size stepper (P2-2). Drives the `--article-size` CSS var
 * the article body reads its font-size from; Tailwind Typography children are
 * em-based, so the whole piece scales proportionally. Persisted per device in
 * localStorage and seeded before first paint by the root-layout inline script,
 * so returning readers never see the size jump.
 */
export function TextSizeStepper() {
  const [size, setSize] = useState(DEFAULT_SIZE)

  useEffect(() => {
    try {
      const stored = Number(localStorage.getItem(STORAGE_KEY))
      if (stored >= MIN && stored <= MAX) setSize(stored)
    } catch {
      /* ignore */
    }
  }, [])

  const update = (next: number) => {
    setSize(next)
    applySize(next)
    try {
      if (next === DEFAULT_SIZE) localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, String(next))
    } catch {
      /* ignore */
    }
  }

  const buttonClass =
    'px-2.5 py-1 font-mono text-text-muted transition-colors hover:text-text-primary disabled:opacity-40 disabled:hover:text-text-muted'

  return (
    <div
      role="group"
      aria-label="Text size"
      className="flex items-center divide-x divide-border-subtle rounded-lg border border-border-subtle bg-stone-charcoal/30"
    >
      <button
        type="button"
        onClick={() => update(Math.max(MIN, size - 1))}
        disabled={size <= MIN}
        aria-label="Decrease text size"
        className={`${buttonClass} text-xs`}
      >
        A−
      </button>
      <button
        type="button"
        onClick={() => update(DEFAULT_SIZE)}
        disabled={size === DEFAULT_SIZE}
        aria-label="Reset text size"
        className={`${buttonClass} text-sm`}
      >
        A
      </button>
      <button
        type="button"
        onClick={() => update(Math.min(MAX, size + 1))}
        disabled={size >= MAX}
        aria-label="Increase text size"
        className={`${buttonClass} text-base`}
      >
        A+
      </button>
    </div>
  )
}
