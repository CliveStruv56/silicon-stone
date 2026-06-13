'use client'

import { useCallback, useEffect, useState } from 'react'

type ThemeMode = 'light' | 'dark' | 'system'

const ORDER: ThemeMode[] = ['light', 'dark', 'system']
const LABEL: Record<ThemeMode, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
}

function systemPrefersDark() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
}

/**
 * Light / Dark / System theme control. Light is the default; the choice persists
 * in localStorage and is applied before paint by the inline script in the root
 * layout (so there is no flash). "System" follows the OS preference and updates
 * live if the OS theme changes. Clicking cycles Light → Dark → System.
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const [mode, setMode] = useState<ThemeMode>('light')
  const [mounted, setMounted] = useState(false)

  // Resolve a mode to the actual .dark class on <html>, and persist the choice.
  const apply = useCallback((next: ThemeMode) => {
    const dark = next === 'dark' || (next === 'system' && systemPrefersDark())
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem('theme', next)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    // Default to 'system' when nothing is stored, so the control reflects that
    // first-time visitors follow their OS preference.
    let stored: ThemeMode = 'system'
    try {
      const t = localStorage.getItem('theme')
      if (t === 'light' || t === 'dark' || t === 'system') stored = t
    } catch {
      /* ignore */
    }
    setMode(stored)
  }, [])

  // When following the system, react live to OS theme changes.
  useEffect(() => {
    if (mode !== 'system' || typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => document.documentElement.classList.toggle('dark', mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [mode])

  const cycle = () => {
    const next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length]
    setMode(next)
    apply(next)
  }

  const label = mounted ? `Theme: ${LABEL[mode]} (click to change)` : 'Toggle theme'

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={label}
      title={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md text-text-muted transition-colors hover:text-text-primary hover:bg-surface-elevated ${className}`}
    >
      <span className="sr-only">{label}</span>
      {!mounted || mode === 'light' ? (
        // Sun
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path strokeLinecap="round" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : mode === 'dark' ? (
        // Moon
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      ) : (
        // Monitor (System)
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
          <rect x="2.5" y="4" width="19" height="12" rx="1.5" />
          <path strokeLinecap="round" d="M8.5 20h7M12 16v4" />
        </svg>
      )}
    </button>
  )
}
