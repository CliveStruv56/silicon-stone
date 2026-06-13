import { useToast } from '@sanity/ui'
import { CheckmarkCircleIcon } from '@sanity/icons'
import type { DocumentActionComponent } from 'sanity'

type FactCheckState = { status?: string }

/**
 * "Run fact-check" document action for articles. POSTs to /api/fact-check,
 * which verifies every checkable claim against fresh web searches and patches
 * the report onto the document's factCheck field. The route authenticates via
 * the admin session cookie (same origin), so the editor must also be logged
 * in at /login. Advisory only — nothing here blocks publishing.
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
        const res = await fetch('/api/fact-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId: props.id }),
        })
        if (res.status === 401) {
          // The admin session (separate from the Sanity Studio login) is
          // missing or expired. Open /login in a new tab so the editor can
          // re-authenticate without losing their place in this document, then
          // re-run the action. Best-effort: popup blockers may swallow open().
          if (typeof window !== 'undefined') {
            window.open('/login', '_blank', 'noopener')
          }
          toast.push({
            status: 'error',
            title: 'Admin session expired',
            description:
              'Opened the admin login in a new tab — sign in there, then run the fact-check again. (This is the /login access code, not your Sanity login.)',
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
