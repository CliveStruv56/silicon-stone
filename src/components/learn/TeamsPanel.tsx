import Link from 'next/link'
import { Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { TEAMS_PANEL } from '@/lib/learn/copy'

export function TeamsPanel() {
  return (
    <div className="flex flex-col items-start gap-6 rounded-xl border border-silicon-amber/30 bg-silicon-amber/5 p-6 sm:p-8">
      <div className="flex gap-4">
        <Users className="mt-1 h-6 w-6 shrink-0 text-silicon-amber-strong" aria-hidden />
        <div>
          <h3 className="text-xl font-semibold text-text-primary">{TEAMS_PANEL.heading}</h3>
          <p className="mt-2 max-w-2xl text-text-muted">{TEAMS_PANEL.body}</p>
        </div>
      </div>
      <Button asChild variant="outline" className="shrink-0 border-silicon-amber text-silicon-amber-strong hover:bg-silicon-amber/10">
        <Link href="/learn/teams">In-house training →</Link>
      </Button>
    </div>
  )
}
