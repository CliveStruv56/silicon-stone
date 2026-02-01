import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Header, Footer } from '@/components/layout'
import { FileQuestion, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <FileQuestion className="w-16 h-16 mx-auto text-text-muted" />
          </div>
          <h1 className="text-4xl font-bold text-text-primary mb-2">404</h1>
          <h2 className="text-xl text-text-primary mb-4">Page Not Found</h2>
          <p className="text-text-muted mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/">
              <Button className="bg-silicon-amber text-slate-deep hover:bg-silicon-amber/90 w-full">
                <Home className="w-4 h-4 mr-2" />
                Go home
              </Button>
            </Link>
            <Link href="/analysis">
              <Button variant="outline" className="border-border-subtle w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Browse Analysis
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
