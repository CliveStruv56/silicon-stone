import { CourseCard } from './CourseCard'
import { compareCodes } from '@/lib/learn/model'
import type { CourseCardData, LevelData } from '@/lib/learn/types'

/**
 * The six levels, 0 to 5, each with its courses in code order. Drawn top to
 * bottom with the level number in a rail, so the climb reads as a ladder on a
 * phone as well as on a wide screen.
 */
export function PathwayLadder({ levels, courses }: { levels: LevelData[]; courses: CourseCardData[] }) {
  return (
    <ol className="space-y-8">
      {levels.map((level) => {
        const onLevel = courses
          .filter((course) => course.level === level.number)
          .sort((a, b) => compareCodes(a.code, b.code))
        return (
          <li key={level.number} className="grid gap-4 md:grid-cols-[12rem_1fr]">
            <div className="border-l-2 border-silicon-amber pl-4">
              <p className="font-mono text-3xl font-bold text-silicon-amber-strong">{level.number}</p>
              <h3 className="font-semibold text-text-primary">{level.title}</h3>
              {level.summary && <p className="mt-1 text-sm text-text-muted">{level.summary}</p>}
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {onLevel.map((course) => (
                <li key={course._id}>
                  <CourseCard course={course} />
                </li>
              ))}
            </ul>
          </li>
        )
      })}
    </ol>
  )
}
