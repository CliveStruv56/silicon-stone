import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function DeadlineCountdown() {
  return (
    <div className="w-full bg-stone-charcoal border-none px-6 py-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-6">
        <div>
          <div className="font-mono text-xs font-bold uppercase tracking-wider text-silicon-amber-strong">
            AI Act implementation
          </div>
          <p className="mt-1 text-sm font-medium text-text-primary">
            The timetable is phased. The evidence work is not.
          </p>
        </div>

        <p className="text-xs leading-relaxed text-text-muted md:max-w-2xl">
          Catalogue your systems. Clarify your role. Capture vendor evidence. Set review triggers.
          Article 50 transparency obligations have applied since 2 August 2026; watermarking
          for systems already on the market follows on 2 December 2026.
        </p>

        <Link
          href="/tools/compliance-checker"
          className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-stone-teal transition-colors hover:text-silicon-amber-strong"
        >
          Assess readiness
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
