import Link from 'next/link'
import { GraduationCap } from 'lucide-react'

import { TOOL_COURSE, codeSlug } from '@/lib/learn/model'
import type { TOOL_JOURNEYS } from '@/lib/tool-journeys'

/**
 * The quiet line after a tool's result: the Silicon & Stone Learning course
 * that teaches you to read it. Which course is `TOOL_COURSE` in
 * `src/lib/learn/model.ts`; the link goes through `/learn/code/<code>` so it
 * survives a course slug being renamed in Studio.
 */
export function ToolCourseLink({ tool }: { tool: keyof typeof TOOL_JOURNEYS }) {
  const code = TOOL_COURSE[tool]
  return (
    <p className="flex items-center gap-2 text-sm text-text-muted">
      <GraduationCap className="h-4 w-4 shrink-0 text-stone-teal" aria-hidden />
      <span>
        Learn to read this result properly:{' '}
        <Link href={`/learn/code/${codeSlug(code)}`} className="text-stone-teal hover:underline">
          course {code} in Silicon & Stone Learning →
        </Link>
      </span>
    </p>
  )
}
