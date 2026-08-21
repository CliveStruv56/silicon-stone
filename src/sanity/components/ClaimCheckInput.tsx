import { useCallback, useMemo, useState } from 'react'
import { Button, Card, Flex, Stack, Text, useToast } from '@sanity/ui'
import { CheckmarkIcon, CopyIcon } from '@sanity/icons'
import { useDocumentOperation, useFormValue, type ObjectInputProps } from 'sanity'
import { blockTextOf, findPassageBlock, passagePattern } from '@/lib/claim-passage'

/**
 * Custom input for a fact-check claim. Renders the standard fields, then an
 * action row: edit the Suggested Revision in place, click "Insert into
 * article" and the original passage is found in the body (whitespace-flexible
 * match) and replaced with the revision. The replacement goes through the
 * normal draft mechanics — nothing is published by this button.
 */

interface ClaimValue {
  _key?: string
  originalText?: string
  suggestedRevision?: string
  verdict?: string
  applied?: boolean
}

interface PortableSpan {
  _type?: string
  _key?: string
  text?: string
  marks?: string[]
}

interface PortableBlock {
  _type?: string
  _key?: string
  children?: PortableSpan[]
}

export function ClaimCheckInput(props: ObjectInputProps) {
  const value = props.value as ClaimValue | undefined
  const toast = useToast()
  const docId = useFormValue(['_id']) as string | undefined
  const docType = useFormValue(['_type']) as string | undefined
  const body = useFormValue(['body']) as PortableBlock[] | undefined
  const publishedId = (docId ?? '').replace(/^drafts\./, '')
  const { patch } = useDocumentOperation(publishedId, docType ?? 'article')
  const [busy, setBusy] = useState(false)

  const revision = value?.suggestedRevision?.trim()
  const hasRevision = !!revision
  const canLocate = !!value?.originalText?.trim()

  // Check up front whether the original passage is still present in the body,
  // so the button state tells the editor before they click.
  const located = useMemo(
    () => (canLocate ? !!findPassageBlock(body, value?.originalText) : false),
    [body, canLocate, value],
  )

  const handleCopy = useCallback(() => {
    if (!revision) return
    navigator.clipboard
      .writeText(revision)
      .then(() => toast.push({ status: 'success', title: 'Revision copied to clipboard' }))
      .catch(() => toast.push({ status: 'error', title: 'Could not copy to clipboard' }))
  }, [revision, toast])

  const handleInsert = useCallback(() => {
    if (!revision || !value?.originalText || !value._key || !Array.isArray(body)) return
    const pattern = passagePattern(value.originalText)
    if (!pattern) return
    setBusy(true)
    try {
      const targetBlock = findPassageBlock(body, value.originalText) as PortableBlock | null
      if (!targetBlock?._key || !targetBlock.children) {
        toast.push({
          status: 'warning',
          title: 'Could not find the original passage in the body',
          description:
            'The text may have been edited since the fact-check ran. Use "Copy revision" and apply it manually.',
        })
        return
      }

      // Fast path: the passage sits inside a single span — replace in place,
      // preserving every other span (links, bold) in the paragraph.
      const spanIndex = targetBlock.children.findIndex(
        (c) => typeof c.text === 'string' && pattern.test(c.text),
      )
      let newChildren: PortableSpan[]
      let simplified = false
      if (spanIndex !== -1) {
        newChildren = targetBlock.children.map((c, i) =>
          i === spanIndex ? { ...c, text: c.text!.replace(pattern, revision) } : c,
        )
      } else {
        // The passage spans multiple formatted segments — rebuild the
        // paragraph as one plain span. Correct words beat preserved styling.
        simplified = true
        const blockText = blockTextOf(targetBlock)
        newChildren = [
          {
            _type: 'span',
            _key: crypto.randomUUID().slice(0, 8),
            text: blockText.replace(pattern, revision),
            marks: [],
          },
        ]
      }

      patch.execute([
        { set: { [`body[_key=="${targetBlock._key}"].children`]: newChildren } },
        { set: { [`factCheck.claims[_key=="${value._key}"].applied`]: true } },
      ])
      toast.push({
        status: 'success',
        title: 'Revision inserted into the article body',
        description: simplified
          ? 'That paragraph had inline formatting (links/bold) which was simplified — give it a quick check.'
          : 'Review the updated paragraph, then publish when ready.',
      })
    } finally {
      setBusy(false)
    }
  }, [body, patch, revision, toast, value])

  return (
    <Stack space={4}>
      {props.renderDefault(props)}
      <Card padding={3} radius={2} tone={value?.applied ? 'positive' : 'primary'} border>
        {value?.applied ? (
          <Flex align="center" gap={2}>
            <Text size={1}>
              <CheckmarkIcon />
            </Text>
            <Text size={1} weight="medium">
              Revision applied to the article body.
            </Text>
          </Flex>
        ) : (
          <Stack space={3}>
            <Text size={1} muted>
              {!hasRevision
                ? 'No suggested revision for this claim.'
                : !canLocate
                  ? 'This claim predates one-click insert (no original passage stored). Re-run the fact-check to enable it, or copy the revision manually.'
                  : located
                    ? 'Edit the Suggested Revision above if needed, then insert it — it replaces the original passage in the body. Nothing is published until you press Publish.'
                    : 'The original passage could not be found in the current body (it may have been edited). Copy the revision and apply it manually.'}
            </Text>
            <Flex gap={2}>
              <Button
                text="Insert into article"
                tone="primary"
                icon={CheckmarkIcon}
                disabled={busy || !hasRevision || !canLocate || !located}
                onClick={handleInsert}
              />
              <Button
                text="Copy revision"
                mode="ghost"
                icon={CopyIcon}
                disabled={!hasRevision}
                onClick={handleCopy}
              />
            </Flex>
          </Stack>
        )}
      </Card>
    </Stack>
  )
}
