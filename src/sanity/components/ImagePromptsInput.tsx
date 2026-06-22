import { useCallback, useState } from 'react'
import { Badge, Button, Card, Flex, Spinner, Stack, Text, useToast } from '@sanity/ui'
import { SparklesIcon, CopyIcon } from '@sanity/icons'
import { useFormValue, type ObjectInputProps } from 'sanity'

/**
 * Custom input for the article `imagePrompts` field. Renders a "Suggest two
 * prompts" button that POSTs to /api/image-prompts; the route reads the current
 * article, asks Claude for two "what to depict" prompts and patches them back
 * onto this field. Each prompt shows in a card with a Copy button so the editor
 * can paste it straight into the external image agent (which owns the style).
 *
 * Mirrors the fact-check action's auth model: the same-origin request carries
 * the admin session cookie, so the editor must also be signed in at /login.
 */

interface ImagePromptsValue {
  prompts?: string[]
  generatedAt?: string
  model?: string
}

function formatWhen(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
}

export function ImagePromptsInput(props: ObjectInputProps) {
  const value = props.value as ImagePromptsValue | undefined
  const toast = useToast()
  const docId = useFormValue(['_id']) as string | undefined
  const [busy, setBusy] = useState(false)

  const prompts = Array.isArray(value?.prompts) ? value!.prompts!.filter(Boolean) : []
  const hasPrompts = prompts.length > 0

  const handleCopy = useCallback(
    (text: string) => {
      navigator.clipboard
        .writeText(text)
        .then(() => toast.push({ status: 'success', title: 'Prompt copied to clipboard' }))
        .catch(() => toast.push({ status: 'error', title: 'Could not copy to clipboard' }))
    },
    [toast],
  )

  const handleGenerate = useCallback(async () => {
    if (!docId) return
    setBusy(true)
    try {
      const res = await fetch('/api/image-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: docId }),
      })
      if (res.status === 401) {
        // Admin session (separate from the Sanity Studio login) is missing or
        // expired — open /login so the editor can re-auth without losing place.
        if (typeof window !== 'undefined') window.open('/login', '_blank', 'noopener')
        toast.push({
          status: 'error',
          title: 'Admin session expired',
          description:
            'Opened the admin login in a new tab — sign in there, then try again. (This is the /login access code, not your Sanity login.)',
        })
      } else if (res.status === 429) {
        toast.push({ status: 'warning', title: 'Rate limited — wait a little, then try again' })
      } else if (res.status === 422) {
        toast.push({
          status: 'warning',
          title: 'Not enough to work with',
          description: 'Add a title or some body text first, then suggest prompts.',
        })
      } else if (!res.ok) {
        toast.push({ status: 'error', title: `Could not generate prompts (${res.status})` })
      } else {
        toast.push({
          status: 'success',
          title: 'Two prompts suggested',
          description: 'Copy one into your image agent. Re-run any time to refresh.',
        })
      }
    } catch {
      toast.push({ status: 'error', title: 'Request failed — is the site running?' })
    } finally {
      setBusy(false)
    }
  }, [docId, toast])

  return (
    <Stack space={3}>
      <Text size={1} muted>
        Two AI-suggested prompts describing what the main image should depict. Your image agent
        applies the house style — these only set the subject. Copy one in, or re-run to refresh.
      </Text>

      {hasPrompts && (
        <Stack space={3}>
          {prompts.map((prompt, i) => (
            <Card key={i} padding={3} radius={2} tone="primary" border>
              <Stack space={3}>
                <Flex align="center" gap={2}>
                  <Badge tone="primary" mode="outline">
                    Option {i + 1}
                  </Badge>
                </Flex>
                <Text size={1} style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {prompt}
                </Text>
                <Flex>
                  <Button
                    text="Copy"
                    mode="ghost"
                    icon={CopyIcon}
                    fontSize={1}
                    padding={2}
                    onClick={() => handleCopy(prompt)}
                  />
                </Flex>
              </Stack>
            </Card>
          ))}
        </Stack>
      )}

      <Flex align="center" gap={3}>
        <Button
          text={hasPrompts ? 'Regenerate prompts' : 'Suggest two prompts'}
          tone="primary"
          icon={busy ? undefined : SparklesIcon}
          disabled={busy || !docId}
          onClick={handleGenerate}
        />
        {busy && (
          <Flex align="center" gap={2}>
            <Spinner muted />
            <Text size={1} muted>
              Reading the article…
            </Text>
          </Flex>
        )}
        {!busy && hasPrompts && value?.generatedAt && (
          <Text size={1} muted>
            Generated {formatWhen(value.generatedAt)}
          </Text>
        )}
      </Flex>
    </Stack>
  )
}
