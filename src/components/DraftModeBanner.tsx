import { draftMode } from 'next/headers'

export async function DraftModeBanner() {
  const { isEnabled } = await draftMode()
  if (!isEnabled) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border border-silicon-amber/60 bg-silicon-amber px-4 py-2 text-sm font-medium text-ink-on-accent shadow-lg">
      <span className="font-mono text-xs uppercase tracking-wider">Preview mode</span>
      <a
        href="/api/draft-mode/disable"
        className="underline hover:no-underline"
      >
        Exit preview
      </a>
    </div>
  )
}
