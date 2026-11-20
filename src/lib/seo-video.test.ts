import { describe, expect, it } from 'vitest'
import { buildVideoSchema } from './seo'

const base = {
  videoId: 'dQw4w9WgXcQ',
  name: 'A video',
  description: 'About the video.',
  uploadDate: '2026-11-20T09:00:00Z',
  pageUrl: 'https://www.siliconandstone.com/analysis/x',
}

describe('buildVideoSchema', () => {
  it('carries every field Google requires for a VideoObject', () => {
    const v = buildVideoSchema(base)
    expect(v['@type']).toBe('VideoObject')
    expect(v.name).toBe('A video')
    expect(v.description).toBe('About the video.')
    expect(v.thumbnailUrl.length).toBeGreaterThan(0)
    expect(v.uploadDate).toBe('2026-11-20T09:00:00Z')
  })
  it('points embedUrl at the privacy-enhanced origin and contentUrl at the watch page', () => {
    const v = buildVideoSchema(base)
    expect(v.embedUrl).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0')
    expect(v.contentUrl).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  })
  it('puts our own image first and the YouTube thumbnail after it', () => {
    const v = buildVideoSchema({ ...base, thumbnailUrl: 'https://cdn.sanity.io/images/x.jpg' })
    expect(v.thumbnailUrl[0]).toBe('https://cdn.sanity.io/images/x.jpg')
    expect(v.thumbnailUrl[1]).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg')
  })
  it('adds a duration only when one is given', () => {
    expect(buildVideoSchema(base)).not.toHaveProperty('duration')
    expect(buildVideoSchema({ ...base, durationSeconds: 245 }).duration).toBe('PT4M5S')
  })
})
