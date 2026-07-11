export type SubmitResult =
  | { queued: false; response: Response }
  | { queued: true }

/**
 * POST JSON with offline queueing (P2-6). When the request fails at the
 * network level and a service worker controls the page, the worker's
 * background-sync queue (see src/app/sw.ts) has already captured the request
 * and will replay it on reconnect — Background Sync where supported, an
 * online-event message from the page elsewhere (Safari/iOS). HTTP errors are
 * NOT queued; they return normally for the form's own error handling.
 */
export async function submitWithOfflineQueue(
  url: string,
  body: unknown,
): Promise<SubmitResult> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return { queued: false, response }
  } catch (error) {
    if (
      typeof navigator !== 'undefined' &&
      navigator.serviceWorker?.controller
    ) {
      return { queued: true }
    }
    // No service worker (dev, unsupported browser): a network failure really
    // is a failure.
    throw error
  }
}
