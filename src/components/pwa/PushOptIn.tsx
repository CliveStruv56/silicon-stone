'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { track } from '@/lib/track'
import { useStandalone } from '@/lib/pwa/useStandalone'
import { PUSH_TOPICS, type PushTopicId } from '@/lib/push/topics'
import {
  pushSupported,
  pushConfigured,
  isIOS,
  getCurrentTopics,
  subscribeToTopics,
  unsubscribe,
} from '@/lib/push/client'

/**
 * Restrained Web Push opt-in (P3-6). Lives on /more — a secondary surface, so
 * it is never requested on first load. Two topics, each independently
 * toggleable, with a documented iOS caveat (push there needs an installed
 * Home-Screen PWA on 16.4+). Fires "Push Opt In" on the first grant.
 */
export function PushOptIn() {
  const standalone = useStandalone()
  const [ready, setReady] = useState(false)
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [selected, setSelected] = useState<Set<PushTopicId>>(
    new Set(PUSH_TOPICS.map((t) => t.id)),
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const iosNeedsInstall = isIOS() && !standalone

  useEffect(() => {
    let cancelled = false
    async function init() {
      const ok = pushSupported() && pushConfigured()
      if (!ok) {
        if (!cancelled) {
          setSupported(false)
          setReady(true)
        }
        return
      }
      const current = await getCurrentTopics()
      if (cancelled) return
      setSupported(true)
      if (current.length > 0) {
        setSubscribed(true)
        setSelected(new Set(current))
      }
      setReady(true)
    }
    init()
    return () => {
      cancelled = true
    }
  }, [])

  // Don't render the section at all when push can't work here — no dead button.
  if (!pushConfigured()) return null
  if (ready && !supported && !iosNeedsInstall) return null

  const toggle = (id: PushTopicId) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const enable = async () => {
    setBusy(true)
    setError('')
    try {
      const topics = [...selected]
      if (topics.length === 0) {
        setError('Pick at least one topic.')
        return
      }
      const saved = await subscribeToTopics(topics)
      setSubscribed(true)
      setSelected(new Set(saved))
      track('Push Opt In', { topics: saved.join(',') })
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'error'
      setError(
        reason === 'denied'
          ? 'Notifications are blocked in your browser settings.'
          : 'Could not enable notifications. Please try again.',
      )
    } finally {
      setBusy(false)
    }
  }

  // Live-update topic membership for an already-subscribed device.
  const applyTopics = async (next: Set<PushTopicId>) => {
    setBusy(true)
    setError('')
    try {
      const topics = [...next]
      if (topics.length === 0) {
        await unsubscribe()
        setSubscribed(false)
        setSelected(new Set(PUSH_TOPICS.map((t) => t.id)))
        return
      }
      const saved = await subscribeToTopics(topics)
      setSelected(new Set(saved))
    } catch {
      setError('Could not update your preferences.')
    } finally {
      setBusy(false)
    }
  }

  const turnOff = async () => {
    setBusy(true)
    setError('')
    try {
      await unsubscribe()
      setSubscribed(false)
      setSelected(new Set(PUSH_TOPICS.map((t) => t.id)))
    } catch {
      setError('Could not turn off notifications.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-lg border border-border-subtle bg-stone-charcoal/40 p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-md bg-silicon-amber/10 p-2">
          {subscribed ? (
            <Bell className="h-5 w-5 text-silicon-amber-strong" />
          ) : (
            <BellOff className="h-5 w-5 text-text-muted" />
          )}
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-text-primary">Notifications</h2>
          <p className="mt-1 text-sm text-text-muted">
            Two topics, nothing else. Choose what warrants an alert.
          </p>

          {iosNeedsInstall ? (
            <p className="mt-4 rounded-md border border-border-subtle bg-slate-deep/50 p-3 text-sm text-text-muted">
              On iPhone or iPad, add Silicon &amp; Stone to your Home Screen first
              (<span className="text-text-primary">Share → Add to Home Screen</span>), then open it
              from there to enable notifications. This is an iOS requirement.
            </p>
          ) : (
            <>
              <ul className="mt-4 space-y-3">
                {PUSH_TOPICS.map((topic) => {
                  const checked = selected.has(topic.id)
                  return (
                    <li key={topic.id} className="flex items-start gap-3">
                      <input
                        id={`push-${topic.id}`}
                        type="checkbox"
                        checked={checked}
                        disabled={busy}
                        onChange={() => {
                          if (subscribed) {
                            const next = new Set(selected)
                            if (checked) next.delete(topic.id)
                            else next.add(topic.id)
                            applyTopics(next)
                          } else {
                            toggle(topic.id)
                          }
                        }}
                        className="mt-1 h-4 w-4 accent-silicon-amber"
                      />
                      <label htmlFor={`push-${topic.id}`} className="cursor-pointer">
                        <span className="block text-sm font-medium text-text-primary">
                          {topic.label}
                        </span>
                        <span className="block text-xs text-text-muted">{topic.description}</span>
                      </label>
                    </li>
                  )
                })}
              </ul>

              <div className="mt-4 flex items-center gap-3">
                {subscribed ? (
                  <Button
                    variant="outline"
                    onClick={turnOff}
                    disabled={busy}
                    className="border-border-subtle text-text-muted hover:text-text-primary"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Turn off notifications'}
                  </Button>
                ) : (
                  <Button
                    onClick={enable}
                    disabled={busy}
                    className="bg-accent-fill text-ink-on-accent hover:bg-accent-fill/90 font-medium"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Enable notifications'
                    )}
                  </Button>
                )}
                {subscribed && !busy && (
                  <span className="text-xs text-stone-teal">On for this device</span>
                )}
              </div>

              {error && <p className="mt-3 text-sm text-alert-red">{error}</p>}

              <p className="mt-3 text-xs text-text-muted/60">
                Delivered to this device only. No account, no email required.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
