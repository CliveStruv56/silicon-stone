import type { Metadata } from 'next'
import { Header, Footer } from '@/components/layout'
import { SavedShell } from './SavedShell'

export const metadata: Metadata = {
  title: 'Saved | Silicon and Stone',
  description: 'Articles you save for later, readable offline.',
  robots: { index: false },
}

// Static shell, precached by the service worker (see next.config.ts), hosting
// the client-side saved-articles experience: the list and the offline reader
// both live inside SavedShell and switch via ?read=<slug> pushState, so a
// saved article is fully readable with the network disabled (P2-4).
export default function SavedPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-deep">
      <Header />
      <main className="flex-1">
        <SavedShell />
      </main>
      <Footer />
    </div>
  )
}
