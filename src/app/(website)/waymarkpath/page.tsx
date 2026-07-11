'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Header, Footer } from '@/components/layout'
import { submitWithOfflineQueue } from '@/lib/offline/submit'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  User,
  BarChart3,
  Target,
  BookOpen,
  FileText,
  MessageCircle,
  ArrowRight,
  CheckCircle,
  Loader2,
} from 'lucide-react'

const features = [
  {
    icon: User,
    title: 'Profile & Goals',
    description: 'Define where you are and where you want to be. Set your target role, timeline, and constraints.',
  },
  {
    icon: BarChart3,
    title: 'Skills Inventory',
    description: 'Catalogue your existing skills with proficiency levels. See what you already bring to the table.',
  },
  {
    icon: Target,
    title: 'Gap Analysis',
    description: 'AI-powered comparison showing transferable strengths and critical skill gaps, ranked by priority.',
  },
  {
    icon: BookOpen,
    title: 'Learning Path',
    description: 'Curated resources and roadmap milestones for closing skill gaps, with progress tracking.',
  },
  {
    icon: FileText,
    title: 'Resume & Applications',
    description: 'Upload your CV, generate ATS-optimised versions, save job listings, and create tailored cover letters.',
  },
  {
    icon: MessageCircle,
    title: 'Daily Check-ins',
    description: 'Conversational AI coaching with streak tracking and accountability. Stay on course, every day.',
  },
]

export default function WaymarkPathPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'queued' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const result = await submitWithOfflineQueue('/api/subscribe', {
        email,
        tag: 'WaymarkPath_Early_Access',
      })
      if (result.queued) {
        setStatus('queued')
        setEmail('')
        return
      }
      const res = result.response

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to subscribe')
      }

      setStatus('success')
      setEmail('')
      window.plausible?.('WaymarkPath Signup')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
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
              <Badge className="mb-4 bg-silicon-amber/20 text-silicon-amber border-silicon-amber/30">
                Early Access — Coming Soon
              </Badge>
              <h1 className="text-4xl font-bold text-text-primary sm:text-5xl lg:text-6xl leading-tight mb-6">
                WaymarkPath
              </h1>
              <p className="text-2xl text-text-muted leading-relaxed mb-2">
                Your AI-powered career transition companion.
              </p>
              <p className="text-lg text-text-muted leading-relaxed mb-8">
                For mid-career professionals navigating significant career changes.
                Personalised AI coaching, structured roadmaps, skills gap analysis,
                and daily accountability check-ins&mdash;transforming an overwhelming
                career pivot into a clear, achievable path.
              </p>

              {/* Signup form */}
              {status === 'success' || status === 'queued' ? (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-stone-teal/10 border border-stone-teal/30">
                  <CheckCircle className="w-5 h-5 text-stone-teal flex-shrink-0" />
                  <p className="text-stone-teal">
                    {status === 'queued'
                      ? "You're offline — your signup will send when the connection returns."
                      : "You're on the list. We'll notify you when early access opens."}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="flex-1 rounded-md border border-border-subtle bg-stone-charcoal px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-silicon-amber"
                  />
                  <Button
                    type="submit"
                    disabled={status === 'loading'}
                    size="lg"
                    className="bg-silicon-amber text-ink-on-accent hover:bg-silicon-amber/90 font-semibold whitespace-nowrap"
                  >
                    {status === 'loading' ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Joining...</>
                    ) : (
                      'Get Early Access'
                    )}
                  </Button>
                </form>
              )}

              {status === 'error' && (
                <p className="text-sm text-alert-red mt-2">{errorMsg}</p>
              )}

              <p className="text-xs text-text-muted mt-3">
                No spam. We&apos;ll only email you about WaymarkPath launch updates.
              </p>
            </div>
          </div>
        </section>

        {/* Who it's for */}
        <section className="bg-stone-charcoal/50 border-b border-border-subtle">
          <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
              <span className="font-mono text-xs uppercase tracking-wider text-text-muted">Built for:</span>
              <div className="flex flex-wrap gap-3">
                {[
                  'Directors considering a pivot',
                  'Managers upskilling into AI roles',
                  'Technical leads moving to strategy',
                  'Anyone 35\u201355 navigating career change',
                ].map((who) => (
                  <Badge key={who} variant="outline" className="border-border-subtle text-text-muted text-xs">
                    {who}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features grid */}
        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-3xl font-bold text-text-primary mb-4">
              Six Steps to Your Next Chapter
            </h2>
            <p className="text-lg text-text-muted">
              WaymarkPath breaks down the complexity of career transition into
              structured, manageable stages&mdash;with AI coaching at every step.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title} className="bg-stone-charcoal border-border-subtle">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="font-mono text-xs text-silicon-amber">0{idx + 1}</span>
                      <Icon className="w-5 h-5 text-stone-teal" />
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-text-muted">{feature.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* How it works */}
        <section className="bg-stone-charcoal">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-text-primary mb-8 text-center">
                From Overwhelm to Orchestration
              </h2>
              <div className="space-y-6">
                {[
                  {
                    step: '01',
                    title: 'Audit your position',
                    description: 'Map your current skills, experience, and transferable strengths against your target role.',
                  },
                  {
                    step: '02',
                    title: 'Identify the gaps',
                    description: 'AI analysis surfaces the critical skill gaps ranked by impact on your career transition.',
                  },
                  {
                    step: '03',
                    title: 'Build your roadmap',
                    description: 'A personalised learning path with milestones, resources, and realistic timelines.',
                  },
                  {
                    step: '04',
                    title: 'Execute daily',
                    description: 'AI coaching check-ins keep you accountable and on track. Streaks build momentum.',
                  },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="font-mono text-2xl font-bold text-silicon-amber/30 flex-shrink-0 w-10">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary mb-1">{item.title}</h3>
                      <p className="text-sm text-text-muted">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="bg-slate-deep border-t border-border-subtle">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-14">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                Be First In
              </h2>
              <p className="text-text-muted mb-8">
                WaymarkPath is in active development. Join the early access list
                to be notified when the first version launches.
              </p>

              {status === 'success' || status === 'queued' ? (
                <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-stone-teal/10 border border-stone-teal/30 max-w-md mx-auto">
                  <CheckCircle className="w-5 h-5 text-stone-teal flex-shrink-0" />
                  <p className="text-stone-teal">
                    {status === 'queued' ? 'Signup queued — sends when you reconnect.' : "You're on the list."}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="flex-1 rounded-md border border-border-subtle bg-stone-charcoal px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-silicon-amber"
                  />
                  <Button
                    type="submit"
                    disabled={status === 'loading'}
                    className="bg-silicon-amber text-ink-on-accent hover:bg-silicon-amber/90 font-semibold"
                  >
                    {status === 'loading' ? 'Joining...' : 'Get Early Access'}
                  </Button>
                </form>
              )}

              <p className="text-sm text-text-muted mt-8">
                Already using Silicon and Stone?{' '}
                <Link href="/intelligence" className="text-stone-teal hover:underline">
                  Explore the Intelligence Stream
                  <ArrowRight className="w-3 h-3 inline ml-1" />
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
