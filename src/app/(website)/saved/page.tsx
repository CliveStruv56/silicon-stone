import type { Metadata } from 'next'
import Link from 'next/link'
import { Bookmark } from 'lucide-react'
import { Header, Footer } from '@/components/layout'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Saved | Silicon and Stone',
  description: 'Articles you save for later, readable offline.',
  robots: { index: false },
}

// Empty-state shell for the Saved tab (P1-2). The offline article store that
// fills this list ships with P2-4.
export default function SavedPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-deep">
      <Header />

      <main className="flex-1">
        <section className="mx-auto max-w-2xl px-6 py-20 text-center lg:px-8">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-border-subtle bg-stone-charcoal/30">
            <Bookmark className="h-6 w-6 text-stone-teal" aria-hidden="true" />
          </div>
          <h1 className="font-statement text-3xl font-bold text-text-primary mb-4">
            Nothing saved yet
          </h1>
          <p className="text-text-muted mb-8">
            Articles you save will appear here and stay readable offline.
            Saving is rolling out with the next update — in the meantime, the
            latest intelligence is one tap away.
          </p>
          <Link href="/intelligence">
            <Button variant="default" className="bg-primary text-primary-foreground hover:opacity-90">
              Browse Intelligence
            </Button>
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  )
}
