'use client'

import { useState } from 'react'
import { Check, Copy, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PdfDownloadButton } from '@/components/tools/PdfDownloadButton'

/**
 * Controls on a saved result's page: copy the link, download the PDF, delete.
 * Delete asks once, then removes the record for everyone holding the link.
 */
export function SavedResultActions({ id, token, fileName }: { id: string; token: string; fileName: string }) {
  const [copied, setCopied] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [state, setState] = useState<'idle' | 'deleting' | 'deleted' | 'error'>('idle')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked: the address bar still has it.
    }
  }

  const remove = async () => {
    setState('deleting')
    try {
      const response = await fetch(
        `/api/tools/compliance-checker/saved/${id}?token=${encodeURIComponent(token)}`,
        { method: 'DELETE' },
      )
      setState(response.ok ? 'deleted' : 'error')
    } catch {
      setState('error')
    }
  }

  if (state === 'deleted') {
    return (
      <div className="rounded-lg border border-stone-teal/40 bg-stone-teal/10 p-4 text-sm text-text-primary" role="status">
        Deleted. This link no longer opens anything, for you or anyone you shared it with.{' '}
        <a href="/tools/compliance-checker" className="text-silicon-amber-strong hover:underline">
          Run the Checker again
        </a>
        .
      </div>
    )
  }

  return (
    <div className="space-y-3" data-print-hide>
      <div className="flex flex-wrap gap-3">
        <PdfDownloadButton fileName={fileName} tool="compliance-checker" />
        <Button type="button" variant="outline" onClick={copy} className="border-stone-teal text-stone-teal dark:border-stone-teal">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied' : 'Copy link'}
        </Button>
        {!confirming ? (
          <Button type="button" variant="ghost" onClick={() => setConfirming(true)} className="text-text-muted hover:text-alert-red">
            <Trash2 className="h-4 w-4" />
            Delete this saved result
          </Button>
        ) : (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-alert-red/40 bg-alert-red/10 px-3 py-2 text-sm text-text-primary">
            <span>Delete it for everyone with the link? This cannot be undone.</span>
            <Button type="button" size="sm" onClick={remove} disabled={state === 'deleting'} className="bg-alert-red text-white hover:bg-alert-red/90">
              {state === 'deleting' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Delete
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setConfirming(false)}>
              Keep it
            </Button>
          </div>
        )}
      </div>
      {state === 'error' && (
        <p className="text-sm text-alert-red">That did not work. Reload the page and try again.</p>
      )}
    </div>
  )
}
