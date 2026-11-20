'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Play } from 'lucide-react'
import { youTubeEmbedUrl, youTubeWatchUrl } from '@/lib/youtube'

/**
 * The article video slot: click to load.
 *
 * Until the reader presses play this renders no iframe and requests nothing
 * from YouTube or Google: the poster is our own image (or a plain panel), and
 * the "Watch on YouTube" link is an ordinary anchor that does nothing until
 * followed. On play the iframe is created against the privacy-enhanced origin
 * (youtube-nocookie.com), which the Content-Security-Policy frame-src allows
 * and nothing else. Without JavaScript the plain link still works.
 */
export function ArticleVideo({
  videoId,
  title,
  posterUrl,
  posterAlt = '',
}: {
  videoId: string
  title: string
  posterUrl?: string | null
  /** Alt text for the poster image. */
  posterAlt?: string
}) {
  const [playing, setPlaying] = useState(false)
  const frameRef = useRef<HTMLIFrameElement>(null)

  // The play button disappears when the player replaces it, so move focus to
  // the player or keyboard and screen-reader users are dropped back on the page.
  useEffect(() => {
    if (playing) frameRef.current?.focus()
  }, [playing])

  return (
    <figure className="mb-10" data-testid="article-video">
      <div className="relative aspect-video overflow-hidden rounded-lg bg-stone-charcoal">
        {playing ? (
          <iframe
            ref={frameRef}
            className="absolute inset-0 h-full w-full"
            src={youTubeEmbedUrl(videoId, true)}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <>
            {posterUrl && (
              <Image
                src={posterUrl}
                alt={posterAlt}
                fill
                priority
                sizes="(min-width: 896px) 896px, 100vw"
                className="object-cover"
              />
            )}
            <button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label={`Play video: ${title}`}
              className="group absolute inset-0 flex items-center justify-center bg-black/35 transition-colors hover:bg-black/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-silicon-amber-strong"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-silicon-amber-strong text-slate-deep shadow-lg transition-transform group-hover:scale-105">
                <Play className="ml-1 h-7 w-7" fill="currentColor" aria-hidden="true" />
              </span>
            </button>
          </>
        )}
      </div>
      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm text-text-muted">
        <span>
          Playing loads the video from YouTube, which may set cookies.
        </span>
        <a
          href={youTubeWatchUrl(videoId)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-stone-teal underline underline-offset-2 hover:text-silicon-amber-strong"
        >
          Watch on YouTube
        </a>
      </figcaption>
    </figure>
  )
}
