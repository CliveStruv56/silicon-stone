import Link from 'next/link'

import { LearnEyebrow } from './LearnEyebrow'
import { WaitlistForm } from './WaitlistForm'
import { formatMonth } from '@/lib/learn/model'
import { trackPath } from '@/lib/learn/types'
import { PROGRAMME, SECTION } from '@/lib/learn/copy'

export interface LearnBandTrack {
  title: string
  slug: string
  opens?: string | null
  courseCount: number
}

/** The tracks the homepage band names: the first to open, and the signature one. */
export const LEARN_BAND_TRACKS = ['foundations', 'eu-ai-act', 'infrastructure-and-sovereignty']

/**
 * One slim band on the homepage, after the decision tools: the programme line,
 * three tracks with their opening months, and the waitlist field. Deliberately
 * short — the hub does the selling.
 */
export function LearnBand({ tracks }: { tracks: LearnBandTrack[] }) {
  return (
    <section aria-labelledby="learn-band-heading" className="border-y border-border-subtle bg-stone-charcoal/30">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[3fr_2fr] lg:px-8">
        <div>
          <LearnEyebrow>
            Learn · {SECTION}
          </LearnEyebrow>
          <h2 id="learn-band-heading" className="mb-3 text-3xl font-bold text-text-primary">
            {PROGRAMME}: AI, from the chip to the boardroom
          </h2>
          <p className="mb-6 max-w-2xl text-text-muted">
            Courses for the leaders who approve, buy and answer for AI. Most training starts at the chatbot; these start at
            the chip, the power bill and the supply chain, then reach the rules.
          </p>
          <ul className="grid gap-3 sm:grid-cols-3">
            {tracks.map((track) => (
              <li key={track.slug}>
                <Link
                  href={trackPath(track.slug)}
                  className="block h-full rounded-lg border border-border-subtle bg-stone-charcoal p-4 hover:border-stone-teal"
                >
                  <span className="block font-mono text-xs text-stone-teal">
                    {formatMonth(track.opens) ?? 'Not yet scheduled'}
                  </span>
                  <span className="mt-1 block font-semibold text-text-primary">{track.title}</span>
                  <span className="mt-1 block text-xs text-text-muted">
                    {track.courseCount} {track.courseCount === 1 ? 'course' : 'courses'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/learn" className="mt-5 inline-block text-stone-teal hover:underline">
            See every course →
          </Link>
        </div>
        <div className="self-center">
          <p className="mb-4 font-semibold text-text-primary">Hear when the first courses open</p>
          <WaitlistForm id="home" source="home" compact />
        </div>
      </div>
    </section>
  )
}
