import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ArticleVideo } from './ArticleVideo'

const html = renderToStaticMarkup(
  createElement(ArticleVideo, {
    videoId: 'dQw4w9WgXcQ',
    title: 'A video',
    posterUrl: 'https://cdn.sanity.io/images/3q59mpd7/production/poster.jpg',
  }),
)

describe('ArticleVideo before the reader presses play', () => {
  it('renders no iframe', () => {
    expect(html).not.toContain('<iframe')
  })
  it('names no YouTube or Google host except the plain watch link', () => {
    const hosts = [...html.matchAll(/https?:\/\/([^/"'\s?]+)/g)].map((m) => m[1])
    const thirdParty = hosts.filter((h) => !h.endsWith('sanity.io') && h !== 'www.w3.org')
    expect(new Set(thirdParty)).toEqual(new Set(['www.youtube.com']))
    expect(html).not.toMatch(/youtube-nocookie|ytimg|google|gstatic|doubleclick/)
  })
  it('always offers a plain Watch on YouTube link', () => {
    expect(html).toContain('href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"')
    expect(html).toContain('Watch on YouTube')
  })
  it('has an accessible play button and tells the reader what play does', () => {
    expect(html).toContain('aria-label="Play video: A video"')
    expect(html).toContain('Playing loads the video from YouTube')
  })
  it('keeps the poster alt text', () => {
    const withAlt = renderToStaticMarkup(
      createElement(ArticleVideo, { videoId: 'dQw4w9WgXcQ', title: 'A video', posterUrl: 'https://cdn.sanity.io/images/3q59mpd7/production/p.jpg', posterAlt: 'A rack of chips' }),
    )
    expect(withAlt).toContain('alt="A rack of chips"')
  })
  it('renders without a poster image too', () => {
    const bare = renderToStaticMarkup(createElement(ArticleVideo, { videoId: 'dQw4w9WgXcQ', title: 'A video' }))
    expect(bare).toContain('Play video')
    expect(bare).not.toContain('<img')
  })
})
