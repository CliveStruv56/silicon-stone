'use client'

import { FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TOOL_EVENTS, trackToolAction, type ToolSlug } from '@/lib/tool-analytics'

/**
 * "Download PDF" for a result rendered with `CheckerResultDocument`.
 *
 * It opens the browser's print dialog over the site's print stylesheet, where
 * "Save as PDF" is the default destination on every current desktop browser.
 * The document title is set to `fileName` for the duration, because browsers
 * name the saved PDF after it. Every `<details>` in the document is opened
 * first — a closed one prints only its summary line, which would drop the
 * reasoning and the full-text links from the PDF.
 */
export function openDetailsAndPrint(fileName: string): void {
  const details = Array.from(document.querySelectorAll<HTMLDetailsElement>('.checker-result-document details'))
  const wasOpen = details.map((element) => element.open)
  details.forEach((element) => {
    element.open = true
  })
  const previousTitle = document.title
  document.title = fileName

  const restore = () => {
    document.title = previousTitle
    details.forEach((element, index) => {
      element.open = wasOpen[index]
    })
    window.removeEventListener('afterprint', restore)
  }
  window.addEventListener('afterprint', restore)
  window.print()
}

export function PdfDownloadButton({
  fileName,
  tool,
  className,
}: {
  fileName: string
  tool: ToolSlug
  className?: string
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        trackToolAction(TOOL_EVENTS.pdfDownload, tool)
        openDetailsAndPrint(fileName)
      }}
      className={className ?? 'border-stone-teal text-stone-teal dark:border-stone-teal'}
    >
      <FileDown className="h-4 w-4" />
      Download PDF
    </Button>
  )
}
