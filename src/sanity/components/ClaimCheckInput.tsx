import { useMemo } from 'react'
import { Card, Stack, Text } from '@sanity/ui'
import { useFormValue, type ObjectInputProps } from 'sanity'
import { findPassageBlock } from '@/lib/claim-passage'

/**
 * Custom input for a fact-check claim. Renders the standard fields, then a
 * guidance card.
 *
 * THIS COMPONENT MUST NOT WRITE TO THE DOCUMENT, and must not offer a copy
 * button. It used to have "Insert into article", which replaced the body
 * passage with the checker's `suggestedRevision`. That text is the checker's
 * commentary, not publishable prose: on 16 November 2026 it put "...are not
 * confirmed by the supplied evidence." into a live Briefing. The property now
 * is that no Studio control carries checker wording into a reader-facing
 * field; an editor writes the words in the body themselves. A guard test
 * (`ClaimCheckInput.test.ts`) pins this.
 */

interface ClaimValue {
  originalText?: string
  suggestedRevision?: string
}

interface PortableBlock {
  _type?: string
  _key?: string
  children?: { text?: string }[]
}

export function ClaimCheckInput(props: ObjectInputProps) {
  const value = props.value as ClaimValue | undefined
  const body = useFormValue(['body']) as PortableBlock[] | undefined

  const hasRevision = !!value?.suggestedRevision?.trim()
  const canLocate = !!value?.originalText?.trim()
  const located = useMemo(
    () => (canLocate ? !!findPassageBlock(body, value?.originalText) : false),
    [body, canLocate, value],
  )

  return (
    <Stack space={4}>
      {props.renderDefault(props)}
      <Card padding={3} radius={2} tone="caution" border>
        <Stack space={3}>
          <Text size={1} weight="medium">
            {hasRevision
              ? 'The suggested revision above is checker wording. It is not for publication.'
              : 'No suggested revision for this claim.'}
          </Text>
          <Text size={1} muted>
            {hasRevision
              ? 'Studio cannot put it into the article. Read the evidence and the source links, then write the sentence in the body yourself, in the house voice.'
              : 'Read the evidence and the source links. If the article needs a fix, write it in the body yourself, in the house voice.'}{' '}
            Nothing is published until you press Publish.
          </Text>
          {canLocate && (
            <Text size={1} muted>
              {located
                ? 'The original passage is still in the body, so you can find it with the text under "Original Text".'
                : 'The original passage is no longer in the body as written (the paragraph may have been edited).'}
            </Text>
          )}
        </Stack>
      </Card>
    </Stack>
  )
}
