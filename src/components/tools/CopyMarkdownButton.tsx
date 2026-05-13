'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, Copy, Download } from 'lucide-react'

interface CopyMarkdownButtonProps {
  getMarkdown: () => string
  filename: string
  toolName: string
  label?: string
  variant?: 'copy' | 'download' | 'both'
}

export function CopyMarkdownButton({
  getMarkdown,
  filename,
  toolName,
  label = 'Copy as Markdown',
  variant = 'both',
}: CopyMarkdownButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const text = getMarkdown()
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.plausible?.('Tool+Copy+Markdown', { props: { tool: toolName } })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select-into-textarea approach for older browsers
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } finally {
        document.body.removeChild(ta)
      }
    }
  }

  const handleDownload = () => {
    const text = getMarkdown()
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    window.plausible?.('Tool+Download+Markdown', { props: { tool: toolName } })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {(variant === 'copy' || variant === 'both') && (
        <Button
          type="button"
          variant="outline"
          onClick={handleCopy}
          className="border-stone-teal text-stone-teal hover:bg-stone-teal/10"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied' : label}
        </Button>
      )}
      {(variant === 'download' || variant === 'both') && (
        <Button
          type="button"
          variant="outline"
          onClick={handleDownload}
          className="border-border-subtle text-text-primary hover:bg-surface-elevated"
        >
          <Download className="w-4 h-4" />
          Download .md
        </Button>
      )}
    </div>
  )
}
