'use client'

import { useState } from 'react'
import Link from 'next/link'

import { Header, Footer } from '@/components/layout'
import { submitWithOfflineQueue } from '@/lib/offline/submit'
import { AdvisoryNextStep } from '@/components/products/AdvisoryNextStep'
import { GuaranteeNote } from '@/components/products/GuaranteeNote'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FileText,
  CheckCircle,
  Factory,
  Landmark,
  Briefcase,
  Building2,
} from 'lucide-react'

const briefings = [
  {
    title: 'AI and European Manufacturing',
    description: 'AI landscape, regulatory exposure, and supply chain risks specific to European manufacturing and industrial operations.',
    icon: Factory,
    status: 'First release',
  },
  {
    title: 'AI in Financial Services',
    description: 'Compliance obligations, opportunity mapping, and geopolitical risk for banking, insurance, and investment firms.',
    icon: Landmark,
    status: 'Coming Q3 2026',
  },
  {
    title: 'AI for Professional Services',
    description: 'What law firms, consultancies, and accountancies need to know about AI adoption, liability, and competitive positioning.',
    icon: Briefcase,
    status: 'Coming Q4 2026',
  },
  {
    title: 'AI and the Public Sector',
    description: 'Procurement requirements, governance frameworks, and democratic accountability considerations for government AI use.',
    icon: Building2,
    status: 'Coming Q4 2026',
  },
]

export default function BriefingsProductPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'queued' | 'error'>('idle')

  const handleNotify = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    try {
      const result = await submitWithOfflineQueue('/api/subscribe', {
        email,
        tags: ['early-access', 'tier-sector-reports'],
      })
      if (result.queued) {
        setStatus('queued')
        setEmail('')
        return
      }

      if (!result.response.ok) throw new Error('Failed to subscribe')

      setStatus('success')
      setEmail('')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-slate-deep border-b border-border-subtle">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
            <div className="max-w-3xl">
              <Badge variant="outline" className="mb-4 border-text-muted text-text-muted">
                Coming Soon
              </Badge>
              <h1 className="text-4xl font-bold text-text-primary sm:text-5xl mb-6">
                Sector Reports
              </h1>
              <p className="text-xl text-text-muted leading-relaxed mb-6">
                Focused 15-20 page briefings combining AI landscape analysis, regulatory
                exposure assessment, and geopolitical risk — tailored to specific industries.
              </p>
              <div className="flex items-center gap-4">
                <div className="text-2xl font-mono font-bold text-text-muted">£39 each</div>
                <div className="text-sm text-text-muted">or 3 for £99</div>
              </div>
            </div>
          </div>
        </section>

        {/* What Each Briefing Contains */}
        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <h2 className="text-2xl font-semibold text-text-primary mb-4">
            Every Briefing Includes
          </h2>
          <p className="text-text-muted mb-8 max-w-3xl">
            A consistent analytical framework applied to each sector, so you know exactly
            what to expect and can compare across industries.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              'Executive summary with three key findings',
              'AI landscape: adoption rates, key vendors, emerging applications',
              'Regulatory exposure: which AI Act provisions hit this sector hardest',
              'Geopolitical risk: US dependency, supply chain vulnerabilities',
              'Three scenarios: low, medium, and high friction',
              '90-day action checklist',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-text-muted">
                <CheckCircle className="w-4 h-4 text-stone-teal flex-shrink-0 mt-0.5" />
                {item}
              </div>
            ))}
          </div>
        </section>

        {/* Briefings Catalogue */}
        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <h2 className="text-2xl font-semibold text-text-primary mb-8">
            Planned Briefings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {briefings.map((briefing) => {
              const Icon = briefing.icon
              return (
                <Card key={briefing.title} className="bg-stone-charcoal border-border-subtle">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Icon className="w-6 h-6 text-stone-teal" />
                      <Badge variant="outline" className="text-[12px] text-text-muted border-border-subtle">
                        {briefing.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg text-text-primary mt-3">
                      {briefing.title}
                    </CardTitle>
                    <CardDescription>{briefing.description}</CardDescription>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Notify CTA */}
        <section className="bg-stone-charcoal/50">
          <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
            <div className="max-w-xl mx-auto text-center">
              <FileText className="w-10 h-10 text-stone-teal mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                Get Notified at Launch
              </h2>
              <p className="text-text-muted mb-6">
                Join the newsletter and be the first to know when briefings are available.
                Subscribers get early access and a launch discount.
              </p>

              {status === 'success' ? (
                <div className="text-sm text-stone-teal">
                  You&apos;re on the list. We&apos;ll notify you when briefings launch.
                </div>
              ) : status === 'queued' ? (
                <div className="text-sm text-stone-teal">
                  You&apos;re offline — your signup will send when the connection returns.
                </div>
              ) : (
                <form onSubmit={handleNotify} className="flex gap-2 max-w-md mx-auto">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="flex-1 rounded-md border border-border-subtle bg-slate-deep px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-stone-teal"
                  />
                  <Button
                    type="submit"
                    disabled={status === 'loading'}
                    className="bg-stone-teal text-ink-on-accent hover:bg-stone-teal/90"
                  >
                    {status === 'loading' ? 'Joining...' : 'Notify Me'}
                  </Button>
                </form>
              )}

              {status === 'error' && (
                <p className="text-sm text-alert-red mt-2">Something went wrong. Please try again.</p>
              )}

              <div className="mt-6 flex justify-center">
                <GuaranteeNote future className="justify-center" />
              </div>

              <p className="text-sm text-text-muted mt-6">
                Available now:{' '}
                <Link href="/products/ai-act-toolkit" className="text-silicon-amber-strong hover:underline">
                  AI Act Compliance Toolkit
                </Link>
                {' '}&bull;{' '}
                <Link href="/products/ai-audit-checklist" className="text-stone-teal hover:underline">
                  AI Audit Checklist Pack
                </Link>
              </p>
            </div>
          </div>
        </section>

        <AdvisoryNextStep />
      </main>

      <Footer />
    </div>
  )
}
