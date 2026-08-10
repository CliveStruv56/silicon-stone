'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Header, Footer } from '@/components/layout'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function WebsiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Website error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <AlertTriangle className="w-16 h-16 mx-auto text-alert-red" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Something went wrong
          </h1>
          <p className="text-text-muted mb-6">
            We encountered an error loading this page. Please try again.
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
              <Button className="bg-accent-fill text-ink-on-accent hover:bg-accent-fill/90 w-full">
                <Home className="w-4 h-4 mr-2" />
                Go home
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
