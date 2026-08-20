'use client'

import { useCallback, useMemo } from 'react'
import { Button, Card, Stack, Text, useToast } from '@sanity/ui'
import { AddIcon } from '@sanity/icons'
import { set, useFormValue, type ArrayOfObjectsInputProps } from 'sanity'
import { buildCitationMembers, type CitationCandidate } from '@/lib/citations'

/**
 * The article's public Sources / Citations list, with one addition: a control
 * that copies the research sources recorded in Provenance into it.
 *
 * Why a copy and not an automatic write. The public list is authored by hand —
 * the schema says so, and the publish preflight only *warns* on an empty one
 * because an opinion-led piece may legitimately cite nothing. But `/create`
 * never wrote citations at all, so almost every generated draft arrived with an
 * empty Sources list and the warning fired every time, which trains an editor
 * to click past the dialog that also carries the placeholder blocker.
 *
 * So the machine does the gathering and the human still decides what the reader
 * sees: one click brings the candidates in, and you delete the ones that do not
 * belong. Nothing reaches a reader without passing through an editor.
 */

interface Snapshot {
  title?: string
  url?: string
  publisher?: string
}

export function CitationsInput(props: ArrayOfObjectsInputProps) {
  const toast = useToast()
  const snapshots = useFormValue(['citationSnapshots']) as Snapshot[] | undefined

  const existing = useMemo(
    () => (Array.isArray(props.value) ? (props.value as { url?: string }[]) : []),
    [props.value],
  )

  // Only the snapshots not already on the list, deduped by the shared URL rule
  // so this agrees with what the fact-check appends.
  const candidates = useMemo(() => {
    if (!Array.isArray(snapshots) || snapshots.length === 0) return []
    return buildCitationMembers(
      snapshots as CitationCandidate[],
      existing,
      // Studio keys only need to be unique within the array.
      () => Math.random().toString(36).slice(2, 10),
    )
  }, [snapshots, existing])

  const handleAdd = useCallback(() => {
    if (candidates.length === 0) return
    props.onChange(set([...(Array.isArray(props.value) ? props.value : []), ...candidates]))
    toast.push({
      status: 'success',
      title: `Added ${candidates.length} source${candidates.length === 1 ? '' : 's'}`,
      description: 'From the research this draft was written from. Delete any that do not belong.',
    })
  }, [candidates, props, toast])

  const total = Array.isArray(snapshots) ? snapshots.length : 0

  return (
    <Stack space={3}>
      {props.renderDefault(props)}

      {total > 0 && (
        <Card padding={3} radius={2} tone={candidates.length > 0 ? 'primary' : 'transparent'} border>
          <Stack space={3}>
            <Text size={1} muted>
              {candidates.length > 0
                ? `This draft was written from ${total} research source${total === 1 ? '' : 's'}. ${candidates.length} ${candidates.length === 1 ? 'is' : 'are'} not on the list above.`
                : `All ${total} research source${total === 1 ? '' : 's'} for this draft ${total === 1 ? 'is' : 'are'} already listed.`}
            </Text>
            {candidates.length > 0 && (
              <>
                <Button
                  icon={AddIcon}
                  text={`Add ${candidates.length} from research`}
                  tone="primary"
                  mode="ghost"
                  onClick={handleAdd}
                />
                <Text size={0} muted>
                  These are what the drafting model was given, not sources anyone has
                  checked. Keep the ones that support what the piece actually claims.
                </Text>
              </>
            )}
          </Stack>
        </Card>
      )}
    </Stack>
  )
}
