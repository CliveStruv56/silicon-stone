'use client'

import { useCallback } from 'react'
import { useClient } from 'sanity'
import type { DocumentActionComponent, DocumentActionDescription } from 'sanity'
import { apiVersion } from '@/sanity/env'
import { publishedAtPatch } from '@/lib/published-at'

/**
 * Stamps `publishedAt` on the draft immediately before Studio publishes it.
 *
 * Why this exists at all is in `src/lib/published-at.ts`: nothing wrote the
 * field, so ten of sixteen published articles had no publication date and the
 * six that did had been typed in by hand. The rule — stamp when absent, never
 * overwrite — lives in that module because `/api/on-publish` applies the same
 * one as a backstop, and two components deciding the same thing separately is
 * how this repo has produced most of its defects.
 *
 * **A separate wrapper from `withPublishPreflight`, deliberately.** That one
 * answers "is this draft finished?" and can stop a publish; this one answers
 * "what is true about this publication?" and can only add a field. Composed as
 * `withPublishPreflight(withPublishStamp(publish))`, so the guard's dialog is
 * outermost and nothing is stamped on a publish the operator then cancels.
 *
 * **The patch goes to the draft, not the published document.** Publishing
 * copies `drafts.X` over `X`, so a field written to the published document a
 * moment earlier would be overwritten by the very publish that triggered it.
 * The commit is awaited for the same reason — `onHandle` may be async, and
 * firing the publish before the patch lands is a race that loses the date on a
 * fast connection and keeps it on a slow one, which is the worst kind of bug to
 * be handed.
 *
 * **A failure here never costs the publish.** The date is recoverable —
 * `/api/on-publish` fills it in, and `npm run articles:backfill-published-at`
 * repairs anything both missed. An article the operator cannot publish because
 * a patch failed is not.
 */

interface StampableDoc {
  publishedAt?: string | null
}

const wrapped = new WeakMap<DocumentActionComponent, DocumentActionComponent>()

export function withPublishStamp(
  publishAction: DocumentActionComponent,
): DocumentActionComponent {
  const cached = wrapped.get(publishAction)
  if (cached) return cached

  const Stamped: DocumentActionComponent = (props) => {
    // Called unconditionally and first — it uses hooks, so its hook order must
    // not depend on ours. Same reasoning as withPublishPreflight.
    const original = publishAction(props) as DocumentActionDescription | null
    const client = useClient({ apiVersion })

    const draft = props.draft as StampableDoc | null
    const published = props.published as StampableDoc | null

    const handle = useCallback(async () => {
      // Read the draft's date where there is a draft, because that is the
      // document being published. Fall back to the published one so a republish
      // of an already-dated article is still recognised as already dated.
      const patch = publishedAtPatch(draft ?? published ?? {}, new Date())
      if (patch) {
        try {
          const id = props.draft?._id ?? `drafts.${props.id}`
          await client.patch(id).set(patch).commit({ visibility: 'async' })
        } catch (error) {
          // Never block the publish on this. See the docblock.
          console.error('[publish-stamp] could not stamp publishedAt:', error)
        }
      }
      original?.onHandle?.()
    }, [client, draft, published, original, props.draft, props.id])

    if (!original) return original
    return { ...original, onHandle: handle }
  }

  Stamped.action = publishAction.action
  Stamped.displayName = 'withPublishStamp(publish)'

  wrapped.set(publishAction, Stamped)
  return Stamped
}
