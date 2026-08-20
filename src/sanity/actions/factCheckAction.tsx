import { useToast } from '@sanity/ui'
import { CheckmarkCircleIcon } from '@sanity/icons'
import type { DocumentActionComponent } from 'sanity'
import { describeExchangeFailure, fetchWithAdminSession } from '../lib/studio-session'

type FactCheckState = { status?: string }

/**
 * "Run fact-check" document action for articles. POSTs to /api/fact-check,
 * which verifies every checkable claim against fresh web searches and patches
 * the report onto the document's factCheck field. The route authenticates via
 * the admin session cookie (same origin); when that has lapsed it is renewed
 * from the editor's Sanity login rather than sending them to /login — see
 * ../lib/studio-session. Advisory only — nothing here blocks publishing.
 */
export const FactCheckAction: DocumentActionComponent = (props) => {
  const toast = useToast()
  const doc = (props.draft ?? props.published) as { factCheck?: FactCheckState } | null
  const running = doc?.factCheck?.status === 'running'

  return {
    label: running ? 'Fact-check running…' : 'Run fact-check',
    icon: CheckmarkCircleIcon,
    disabled: !doc || running,
    title: running
      ? 'A fact-check is already in progress for this article'
      : 'Verify every checkable claim against fresh web searches of primary sources',
    onHandle: async () => {
      try {
        // A 401 here means the admin session lapsed while Studio stayed signed
        // in. fetchWithAdminSession renews it from the Sanity login and replays
        // the request, so the editor normally sees nothing. The /login fallback
        // below is only reached when that renewal itself fails.
        const { res, exchange } = await fetchWithAdminSession('/api/fact-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId: props.id }),
        })
        if (res.status === 401 || res.status === 403) {
          const failure = describeExchangeFailure(exchange)
          if (failure.openLogin && typeof window !== 'undefined') {
            // Best-effort: popup blockers may swallow open().
            window.open('/login', '_blank', 'noopener')
          }
          toast.push({
            status: 'error',
            title: failure.title,
            description: failure.description,
          })
        } else if (res.status === 409) {
          toast.push({ status: 'warning', title: 'A fact-check is already running' })
        } else if (!res.ok) {
          toast.push({ status: 'error', title: `Fact-check failed to start (${res.status})` })
        } else {
          toast.push({
            status: 'success',
            title: 'Fact-check started',
            description: 'The report appears in the Fact Check panel within a few minutes.',
          })
        }
      } catch {
        toast.push({ status: 'error', title: 'Fact-check request failed — is the site running?' })
      }
      props.onComplete()
    },
  }
}
