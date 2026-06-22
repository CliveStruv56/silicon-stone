'use client'

import { Highlighter } from 'lucide-react'
import { useGlossaryHighlights, setGlossaryHighlights } from './useGlossaryHighlights'

// Reader control for inline glossary highlights, shown only on articles that
// actually carry glossary annotations. Off by default; the choice persists.
export function GlossaryToggle() {
  const enabled = useGlossaryHighlights()

  return (
    <div className="flex items-center gap-2.5">
      <Highlighter className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
      <span className="text-xs font-medium text-text-muted">Glossary highlights</span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Highlight defined terms in this article with hover and tap definitions"
        onClick={() => setGlossaryHighlights(!enabled)}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-teal ${
          enabled
            ? 'border-stone-teal bg-stone-teal/30'
            : 'border-border-subtle bg-stone-charcoal'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full transition-transform ${
            enabled ? 'translate-x-4 bg-stone-teal' : 'translate-x-1 bg-text-muted'
          }`}
        />
      </button>
      <span className="font-mono text-[0.7rem] uppercase tracking-wide text-text-muted">
        {enabled ? 'On' : 'Off'}
      </span>
    </div>
  )
}
