'use client'

import { useEffect } from 'react'

/**
 * Last-resort boundary for root-layout crashes. It replaces the entire root
 * layout, so no compiled CSS is available — styling must be inline (brand
 * hexes from globals.css: slate-deep, text-primary, text-muted, amber).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Root layout error:', error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1f2e',
          color: '#f7fafc',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          padding: '0 1.5rem',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '28rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#a0aec0', marginBottom: '1.5rem' }}>
            An unexpected error occurred while loading the page.
          </p>
          {error.digest && (
            <p
              style={{
                color: '#a0aec0',
                fontSize: '0.75rem',
                fontFamily: 'ui-monospace, monospace',
                marginBottom: '1.5rem',
              }}
            >
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              backgroundColor: '#f6ad55',
              color: '#1a1f2e',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.625rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
