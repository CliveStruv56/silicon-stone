'use client'

import { useSyncExternalStore } from 'react'

// Reader preference for inline glossary highlights. Off by default: an article
// reads as clean text until the reader opts in, and the choice persists across
// every article via localStorage. useSyncExternalStore keeps SSR and the first
// client render both "off" (no hydration mismatch, no flash for the default).

const STORAGE_KEY = 'ss:glossary-highlights'
const CHANGE_EVENT = 'ss:glossary-highlights-change'

function readPreference(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'on'
  } catch {
    return false
  }
}

export function setGlossaryHighlights(enabled: boolean): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off')
  } catch {
    // Private mode or storage disabled — fall through; the in-memory event below
    // still updates this tab for the current session.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

function subscribe(callback: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}

export function useGlossaryHighlights(): boolean {
  return useSyncExternalStore(subscribe, readPreference, () => false)
}
