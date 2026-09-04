'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle, Mail, User, Building2, MessageSquare } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { submitWithOfflineQueue } from '@/lib/offline/submit'
import { BOOKING_URL, FREE_INTRO_WINDOW } from '@/lib/flags'

/**
 * The enquiry form a single-engagement page owns.
 *
 * `/advisory` and `/eu-exposure` each hand-rolled this, and the two copies had
 * already drifted apart in their success states. Two dedicated engagement pages
 * would have made four. The duplicated part is not the markup — it is the
 * submit path: the offline queue, the queued-vs-sent distinction, the error
 * surface and the Plausible goal, all of which are easy to get subtly wrong and
 * impossible to notice from a screenshot.
 *
 * `/eu-exposure` is deliberately NOT migrated onto this in the same change. It
 * is a working conversion form on a live page, and a refactor of it is its own
 * piece of work with its own verification — not a side effect of adding pages.
 *
 * `interest` is the value Kit segments on, so it must be an exact-match string
 * from `ENGAGEMENTS` in `src/app/(website)/advisory/page.tsx`. It is a prop
 * rather than a free-text field because a dedicated page already knows which
 * engagement the reader is asking about — making them re-declare it in a second
 * control is the thing the tier CTAs on `/advisory` exist to avoid.
 */
type TrustItem = {
  icon: React.ComponentType<{ className?: string }>
  title: string
  body: string
}

export function EngagementContactForm({
  interest,
  plausibleEvent,
  heading = 'Start a conversation',
  intro,
  messageLabel = 'Tell us about your situation',
  messagePlaceholder = 'What are you trying to decide? What has prompted this now?',
  trustItems = [],
}: {
  interest: string
  plausibleEvent: string
  heading?: string
  intro?: string
  messageLabel?: string
  messagePlaceholder?: string
  trustItems?: TrustItem[]
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    interest,
    message: '',
  })
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [formQueued, setFormQueued] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')

    try {
      const result = await submitWithOfflineQueue('/api/contact', formData)
      if (result.queued) {
        setFormQueued(true)
        setFormSubmitted(true)
        return
      }
      const res = result.response

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to send enquiry')
      }

      setFormSubmitted(true)
      // The engagement rides as a prop so /advisory's single "Contact Form
      // Submit" goal can finally be told apart by product.
      window.plausible?.(plausibleEvent, { props: { engagement: interest } })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <section id="contact" className="scroll-mt-24 mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 text-2xl font-semibold text-text-primary">{heading}</h2>
          {intro && <p className="mb-6 leading-relaxed text-text-muted">{intro}</p>}

          {trustItems.length > 0 && (
            <div className="space-y-4 text-sm">
              {trustItems.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-stone-teal" />
                    <div>
                      <div className="font-medium text-text-primary">{item.title}</div>
                      <p className="text-text-muted">{item.body}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div>
          {formSubmitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-lg border border-stone-teal/30 bg-stone-teal/10 p-8 text-center"
            >
              <CheckCircle className="mx-auto mb-4 h-12 w-12 text-stone-teal" />
              <h3 className="mb-2 text-xl font-semibold text-text-primary">
                {formQueued ? 'Message queued' : 'Message received'}
              </h3>
              <p className="text-text-muted">
                {formQueued
                  ? 'You’re offline — your message will send automatically when the connection returns.'
                  : 'Thank you for reaching out. We’ll review your enquiry and respond within 48 hours.'}
              </p>
              {!formQueued && BOOKING_URL && (
                <div className="mt-6">
                  <p className="mb-3 text-sm text-text-muted">
                    Don’t want to wait? Pick a time for your 25-minute conversation now.
                    {FREE_INTRO_WINDOW && ' Free during our launch window — the first ninety days.'}
                  </p>
                  <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                    <Button className="bg-stone-teal text-ink-on-accent hover:bg-stone-teal/90">
                      Book your 25-minute call
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                </div>
              )}
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm text-text-muted">
                    <User className="mr-1 inline h-3 w-3" />
                    Name
                  </label>
                  <Input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="border-border-subtle bg-stone-charcoal text-text-primary placeholder:text-text-muted/50 focus:border-stone-teal"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-text-muted">
                    <Mail className="mr-1 inline h-3 w-3" />
                    Email
                  </label>
                  <Input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="border-border-subtle bg-stone-charcoal text-text-primary placeholder:text-text-muted/50 focus:border-stone-teal"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-text-muted">
                  <Building2 className="mr-1 inline h-3 w-3" />
                  Company
                </label>
                <Input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="border-border-subtle bg-stone-charcoal text-text-primary placeholder:text-text-muted/50 focus:border-stone-teal"
                  placeholder="Your organisation"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-text-muted">
                  <MessageSquare className="mr-1 inline h-3 w-3" />
                  {messageLabel}
                </label>
                <textarea
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full rounded-md border border-border-subtle bg-stone-charcoal px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/50 focus:border-stone-teal focus:outline-none focus:ring-1 focus:ring-stone-teal"
                  placeholder={messagePlaceholder}
                />
              </div>

              {formError && <p className="text-center text-sm text-alert-red">{formError}</p>}

              <Button
                type="submit"
                disabled={formLoading}
                className="w-full bg-accent-fill text-ink-on-accent hover:bg-accent-fill/90"
              >
                {formLoading ? 'Sending...' : 'Send enquiry'}
                {!formLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>

              <p className="text-center text-xs text-text-muted">
                By submitting, you agree to our handling of your information in accordance with GDPR.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
