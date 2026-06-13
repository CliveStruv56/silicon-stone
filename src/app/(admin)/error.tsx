'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-deep px-6">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <AlertTriangle className="w-16 h-16 mx-auto text-alert-red" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Admin Error
        </h1>
        <p className="text-text-muted mb-6">
          An error occurred in the admin area. Please try again or contact support.
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
          <Link href="/admin">
            <Button className="bg-silicon-amber text-ink-on-accent hover:bg-silicon-amber/90 w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
