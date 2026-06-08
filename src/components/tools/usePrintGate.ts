'use client'

import { useState } from 'react'

/**
 * Shared email-gate + print state machine for the interactive tools.
 *
 * The interactive result is free to view; the gate only protects the printable
 * brief / email export. `requestBrief()` prints immediately if already unlocked,
 * otherwise opens the gate. `unlock()` marks unlocked and kicks off the print
 * flow they came for. Previously duplicated verbatim across the tool pages.
 */
export function usePrintGate() {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [showGate, setShowGate] = useState(false)

  const requestBrief = () => {
    if (isUnlocked) {
      window.print()
    } else {
      setShowGate(true)
    }
  }

  const unlock = () => {
    setIsUnlocked(true)
    setShowGate(false)
    // After unlocking, kick off the print/save flow they came here for.
    setTimeout(() => window.print(), 200)
  }

  const dismiss = () => setShowGate(false)

  return { isUnlocked, showGate, requestBrief, unlock, dismiss }
}
