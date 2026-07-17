'use client'

import { PUSH_TOPIC_IDS, type PushTopicId } from './topics'

/**
 * Client-side Web Push helpers (P3-6): capability detection, VAPID key
 * conversion, and the subscribe/update/unsubscribe flow against the SW push
 * manager + our API routes.
 */

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

export function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function pushConfigured(): boolean {
  return Boolean(VAPID_PUBLIC_KEY)
}

/** iOS/iPadOS detection (push there requires an installed Home-Screen PWA). */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ reports as Mac; disambiguate by touch support.
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

function toJSON(sub: PushSubscription) {
  const json = sub.toJSON()
  return {
    endpoint: sub.endpoint,
    keys: {
      p256dh: json.keys?.p256dh ?? '',
      auth: json.keys?.auth ?? '',
    },
  }
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!pushSupported()) return null
  return (await navigator.serviceWorker.ready) ?? null
}

/** The topics this device is currently subscribed to (empty if none). */
export async function getCurrentTopics(): Promise<PushTopicId[]> {
  const reg = await getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  if (!sub) return []
  try {
    const res = await fetch('/api/push/topics?endpoint=' + encodeURIComponent(sub.endpoint))
    if (res.ok) {
      const data = (await res.json()) as { topics?: string[] }
      return (data.topics ?? []).filter((t): t is PushTopicId =>
        PUSH_TOPIC_IDS.includes(t as PushTopicId),
      )
    }
  } catch {
    // Fall through — treat as subscribed-but-unknown.
  }
  return []
}

export async function hasSubscription(): Promise<boolean> {
  const reg = await getRegistration()
  return Boolean(await reg?.pushManager.getSubscription())
}

/**
 * Request permission (if needed), subscribe via the SW push manager, and
 * persist the chosen topics. Returns the topics saved, or throws with a
 * user-facing reason.
 */
export async function subscribeToTopics(topics: PushTopicId[]): Promise<PushTopicId[]> {
  if (!pushSupported()) throw new Error('unsupported')
  if (!pushConfigured()) throw new Error('not-configured')

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('denied')

  const reg = await getRegistration()
  if (!reg) throw new Error('no-registration')

  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      // Cast: the DOM lib types applicationServerKey as BufferSource over a
      // concrete ArrayBuffer; our Uint8Array is ArrayBufferLike at the type
      // level but a valid BufferSource at runtime.
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    })
  }

  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription: toJSON(sub), topics }),
  })
  if (!res.ok) throw new Error('save-failed')

  const data = (await res.json()) as { topics?: PushTopicId[] }
  return data.topics ?? topics
}

/** Fully unsubscribe this device (drops the push subscription + our record). */
export async function unsubscribe(): Promise<void> {
  const reg = await getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  if (!sub) return

  await fetch('/api/push/unsubscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  }).catch(() => {})

  await sub.unsubscribe().catch(() => {})
}
