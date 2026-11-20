/**
 * YouTube URL handling for the article video slot. Pure, no network.
 *
 * Only the video id is ever used to build an embed or a link, and only after
 * the URL has been parsed against an allow-list of YouTube hosts, so a pasted
 * URL can never put another origin into an iframe.
 */

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/
const HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'youtu.be',
])

/** The 11-character video id from a YouTube URL, or null if it is not one. */
export function parseYouTubeId(input: string | null | undefined): string | null {
  if (!input) return null
  let url: URL
  try {
    url = new URL(input.trim())
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  const host = url.hostname.toLowerCase()
  if (!HOSTS.has(host)) return null

  let id: string | null = null
  if (host === 'youtu.be') {
    id = url.pathname.split('/')[1] || null
  } else if (url.pathname === '/watch') {
    id = url.searchParams.get('v')
  } else {
    const m = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/)
    id = m ? m[1] : null
  }
  return id && VIDEO_ID.test(id) ? id : null
}

/** Plain link to the video on YouTube (a normal link: nothing loads until clicked). */
export function youTubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`
}

/** Privacy-enhanced embed origin. Only ever used after the visitor presses play. */
export function youTubeEmbedUrl(id: string, autoplay = false): string {
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0${autoplay ? '&autoplay=1' : ''}`
}

/** Thumbnail URL for structured data only: crawlers fetch it, visitors never do. */
export function youTubeThumbnailUrl(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
}

/** ISO 8601 duration (PT#H#M#S) from whole seconds, or null if invalid. */
export function isoDuration(totalSeconds: number | null | undefined): string | null {
  if (typeof totalSeconds !== 'number' || !Number.isFinite(totalSeconds) || totalSeconds <= 0) return null
  const s = Math.round(totalSeconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}${sec || (!h && !m) ? `${sec}S` : ''}`
}
