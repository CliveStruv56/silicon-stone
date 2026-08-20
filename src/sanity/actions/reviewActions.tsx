'use client'

import { useToast } from '@sanity/ui'
import { CheckmarkCircleIcon, CloseCircleIcon, UndoIcon } from '@sanity/icons'
import type { DocumentActionComponent, DocumentActionDescription } from 'sanity'
import { reviewTransitions } from '@/lib/knowledge/transitions'
import type { KnowledgeReviewStatus } from '@/lib/knowledge/types'
import { describeExchangeFailure, fetchWithAdminSession } from '../lib/studio-session'

/**
 * "Mark ready" / "Reject" / "Return to inbox" on knowledge records.
 *
 * Why these exist. `applyReviewTransition()` enforces the legal edges, the
 * legacy `status → reviewStatus` mapping, the rule that superseding must name
 * its replacement, and the withdrawal of `indexState` when a record stops being
 * ready — and nothing called it. The Review Status field is a plain radio of
 * all four values, so an operator could go straight to `superseded` naming
 * nothing, or `superseded → ready`, which the state machine forbids outright.
 * These actions route the verdict through the service instead.
 *
 * Two deliberate limits:
 *
 * - **`superseded` is not offered here.** It needs the replacement record
 *   picked, which is a reference-picker dialog rather than a button. Until that
 *   exists the field still allows it; these actions simply do not encourage it.
 * - **They are disabled while the document has unsaved edits.** The service
 *   patches an exact `_id`, and a Studio action carries the *published* id.
 *   Captured records are published with no draft, so the normal case is fine —
 *   but the moment you type, a draft shadows it and the patch would land on the
 *   published document, invisible in the editor you are looking at. Publish or
 *   discard first; the tooltip says so.
 *
 * `reviewTransitions` is imported for the menu only — to decide which verdicts
 * to offer from the current state. The rules are still *enforced* server-side.
 * Import it directly and never through `@/lib/knowledge` — the barrel re-exports
 * modules that pull in `node:crypto`, which would land in the Studio bundle.
 */

interface ReviewDoc {
  _id?: string
  reviewStatus?: string
  /** Pre-foundation records carry this instead. */
  status?: string
}

/** The current verdict, reading the legacy field where the new one is absent. */
function effectiveStatus(doc: ReviewDoc | null): KnowledgeReviewStatus | null {
  if (!doc) return null
  const current = doc.reviewStatus
  if (current === 'inbox' || current === 'ready' || current === 'rejected' || current === 'superseded') {
    return current
  }
  // Legacy mapping, mirroring effectiveReviewStatus() in the service. `error`
  // described a capture failure, never a verdict, so it maps to nothing here.
  if (doc.status === 'pending') return 'inbox'
  if (doc.status === 'processed') return 'ready'
  return null
}

const VERDICTS: Array<{
  to: KnowledgeReviewStatus
  label: string
  icon: typeof CheckmarkCircleIcon
  tone: DocumentActionDescription['tone']
  title: string
}> = [
  {
    to: 'ready',
    label: 'Mark ready',
    icon: CheckmarkCircleIcon,
    tone: 'positive',
    title: 'Reviewed and good to draw on',
  },
  {
    to: 'inbox',
    label: 'Return to inbox',
    icon: UndoIcon,
    tone: 'caution',
    title: 'Put this back in the review queue',
  },
  {
    to: 'rejected',
    label: 'Reject',
    icon: CloseCircleIcon,
    tone: 'critical',
    title: 'Not worth keeping. Reversible — a rejected record can return to the inbox.',
  },
]

function makeAction(verdict: (typeof VERDICTS)[number]): DocumentActionComponent {
  const Action: DocumentActionComponent = (props) => {
    const toast = useToast()
    const doc = (props.draft ?? props.published) as ReviewDoc | null
    const from = effectiveStatus(doc)

    // Offer only edges the state machine will actually accept.
    if (!from || !reviewTransitions.check(from, verdict.to).allowed) return null

    const hasUnsavedEdits = Boolean(props.draft)

    return {
      label: verdict.label,
      icon: verdict.icon,
      tone: verdict.tone,
      disabled: hasUnsavedEdits,
      title: hasUnsavedEdits
        ? 'Publish or discard your edits first — the verdict is written to the published record'
        : verdict.title,
      onHandle: async () => {
        try {
          const { res, exchange } = await fetchWithAdminSession('/api/knowledge/review', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documentId: props.published?._id ?? props.id, to: verdict.to }),
          })

          if (res.status === 401 || res.status === 403) {
            const failure = describeExchangeFailure(exchange)
            if (failure.openLogin && typeof window !== 'undefined') {
              window.open('/login', '_blank', 'noopener')
            }
            toast.push({ status: 'error', title: failure.title, description: failure.description })
          } else if (res.ok) {
            toast.push({ status: 'success', title: `Marked ${verdict.to}` })
          } else {
            let message = `Could not update (${res.status})`
            try {
              message = ((await res.json()) as { error?: string }).error ?? message
            } catch {
              /* non-JSON body — keep the status-code message */
            }
            toast.push({ status: 'error', title: 'Review not applied', description: message })
          }
        } catch {
          toast.push({ status: 'error', title: 'Request failed — is the site running?' })
        }
        props.onComplete()
      },
    }
  }
  Action.action = `review-${verdict.to}` as DocumentActionComponent['action']
  return Action
}

export const ReviewActions: DocumentActionComponent[] = VERDICTS.map(makeAction)
