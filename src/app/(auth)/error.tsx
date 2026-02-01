'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Auth error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-deep px-6">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <AlertTriangle className="w-16 h-16 mx-auto text-alert-red" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Authentication Error
        </h1>
        <p className="text-text-muted mb-6">
          There was a problem with authentication. Please try again.
        </p>
        {error.digest && (
          <p className="text-xs text-text-muted mb-6 font-mono">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
            variant="outline"
            className="border-border-subtle"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try again
          </Button>
          <Link href="/">
            <Button className="bg-silicon-amber text-slate-deep hover:bg-silicon-amber/90 w-full">
              <Home className="w-4 h-4 mr-2" />
              Go home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
