'use client'

import { useCallback, useState } from 'react'
import { Badge, Box, Button, Card, Flex, Stack, Text } from '@sanity/ui'
import { ErrorOutlineIcon, WarningOutlineIcon } from '@sanity/icons'
import type { DocumentActionComponent, DocumentActionDescription } from 'sanity'
import {
  hasBlocker,
  preflightArticle,
  type PreflightDocument,
  type PreflightIssue,
} from '@/lib/publish-preflight'

/**
 * Wraps Studio's own publish action for articles with the pre-publish checks in
 * src/lib/publish-preflight.ts.
 *
 * It wraps rather than replaces so publishing keeps every behaviour Sanity
 * gives it — the disabled states, the "already published" handling, the
 * keyboard shortcut. On a finished draft the wrapper is invisible: no issues
 * means the original handler is called directly and nothing renders.
 *
 * A blocker cannot be clicked past. Warnings can, from the same dialog, because
 * they are judgements an editor is entitled to make.
 */

function IssueCard({ issue }: { issue: PreflightIssue }) {
  const blocking = issue.severity === 'blocker'
  return (
    <Card
      padding={3}
      radius={2}
      shadow={1}
      tone={blocking ? 'critical' : 'caution'}
      role="listitem"
    >
      <Stack space={3}>
        <Flex align="center" gap={2}>
          <Text size={1}>{blocking ? <ErrorOutlineIcon /> : <WarningOutlineIcon />}</Text>
          <Box flex={1}>
            <Text size={1} weight="semibold">
              {issue.title}
            </Text>
          </Box>
          <Badge tone={blocking ? 'critical' : 'caution'} fontSize={0}>
            {blocking ? 'Must fix' : 'Check'}
          </Badge>
        </Flex>
        <Text size={1} muted style={{ whiteSpace: 'pre-wrap' }}>
          {issue.detail}
        </Text>
      </Stack>
    </Card>
  )
}

function PreflightDialog({
  issues,
  onCancel,
  onPublishAnyway,
}: {
  issues: PreflightIssue[]
  onCancel: () => void
  onPublishAnyway: () => void
}) {
  const blocked = hasBlocker(issues)

  return (
    <Stack space={4}>
      <Text size={1} muted>
        {blocked
          ? 'This draft is not finished. Publishing is blocked until the item below is resolved.'
          : 'Nothing here prevents publishing. Confirm you have considered each point.'}
      </Text>

      <Stack space={3} role="list">
        {issues.map((issue) => (
          <IssueCard key={issue.id} issue={issue} />
        ))}
      </Stack>

      <Flex gap={2} justify="flex-end">
        <Button
          mode="ghost"
          text={blocked ? 'Back to the draft' : 'Cancel'}
          onClick={onCancel}
        />
        {!blocked && (
          <Button tone="caution" text="Publish anyway" onClick={onPublishAnyway} />
        )}
      </Flex>
    </Stack>
  )
}

/**
 * Wrapped components are cached against the action they wrap. Sanity resolves
 * the action list on render, and returning a fresh component identity each time
 * would remount it — closing the dialog the moment it opened.
 */
const wrapped = new WeakMap<DocumentActionComponent, DocumentActionComponent>()

export function withPublishPreflight(
  publishAction: DocumentActionComponent,
): DocumentActionComponent {
  const cached = wrapped.get(publishAction)
  if (cached) return cached

  const Guarded: DocumentActionComponent = (props) => {
    // Called unconditionally and first: it is a hook-using component, so its
    // hooks must run in the same order on every render, ahead of ours.
    const original = publishAction(props) as DocumentActionDescription | null
    const [issues, setIssues] = useState<PreflightIssue[] | null>(null)

    const close = useCallback(() => setIssues(null), [])

    const doc = (props.draft ?? props.published) as PreflightDocument | null

    const publish = useCallback(() => {
      setIssues(null)
      original?.onHandle?.()
    }, [original])

    const handle = useCallback(() => {
      const found = doc ? preflightArticle(doc) : []
      if (found.length === 0) {
        original?.onHandle?.()
        return
      }
      setIssues(found)
    }, [doc, original])

    if (!original) return original

    return {
      ...original,
      onHandle: handle,
      // Only take over the dialog slot while we are actually showing one, so a
      // future publish action that carries its own keeps it.
      dialog: issues
        ? {
            type: 'dialog',
            header: hasBlocker(issues) ? 'Not ready to publish' : 'Publish this article?',
            onClose: close,
            content: (
              <PreflightDialog
                issues={issues}
                onCancel={close}
                onPublishAnyway={publish}
              />
            ),
          }
        : original.dialog,
    }
  }

  Guarded.action = publishAction.action
  Guarded.displayName = 'withPublishPreflight(publish)'

  wrapped.set(publishAction, Guarded)
  return Guarded
}
