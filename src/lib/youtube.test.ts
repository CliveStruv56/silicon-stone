import { describe, expect, it } from 'vitest'
import { isoDuration, parseYouTubeId, youTubeEmbedUrl, youTubeWatchUrl } from './youtube'

const ID = 'dQw4w9WgXcQ'

describe('parseYouTubeId', () => {
  it.each([
    [`https://www.youtube.com/watch?v=${ID}`],
    [`https://youtube.com/watch?v=${ID}&t=42s`],
    [`https://m.youtube.com/watch?v=${ID}`],
    [`https://youtu.be/${ID}`],
    [`https://youtu.be/${ID}?si=abc`],
    [`https://www.youtube.com/shorts/${ID}`],
    [`https://www.youtube.com/live/${ID}`],
    [`https://www.youtube.com/embed/${ID}`],
    [`https://www.youtube-nocookie.com/embed/${ID}`],
    [`  https://www.youtube.com/watch?v=${ID}  `],
  ])('accepts %s', (url) => {
    expect(parseYouTubeId(url)).toBe(ID)
  })

  it.each([
    [''],
    [null],
    [undefined],
    ['not a url'],
    ['https://example.com/watch?v=' + ID],
    ['https://youtube.com.evil.example/watch?v=' + ID],
    ['https://evil.example/https://www.youtube.com/watch?v=' + ID],
    ['https://www.youtube.com/watch?v=short'],
    ['https://www.youtube.com/watch?v=' + ID + 'x'],
    ['https://www.youtube.com/watch'],
    ['https://www.youtube.com/playlist?list=PL123'],
    ['https://www.youtube.com/@channel'],
    ['javascript:alert(1)'],
    ['ftp://www.youtube.com/watch?v=' + ID],
  ])('rejects %s', (url) => {
    expect(parseYouTubeId(url as string | null | undefined)).toBeNull()
  })
})

describe('urls', () => {
  it('builds a plain watch link on youtube.com', () => {
    expect(youTubeWatchUrl(ID)).toBe(`https://www.youtube.com/watch?v=${ID}`)
  })
  it('embeds only from the privacy-enhanced origin', () => {
    expect(youTubeEmbedUrl(ID)).toBe(`https://www.youtube-nocookie.com/embed/${ID}?rel=0`)
    expect(youTubeEmbedUrl(ID, true)).toBe(`https://www.youtube-nocookie.com/embed/${ID}?rel=0&autoplay=1`)
  })
})

describe('isoDuration', () => {
  it.each([
    [245, 'PT4M5S'],
    [60, 'PT1M'],
    [3600, 'PT1H'],
    [3661, 'PT1H1M1S'],
    [9, 'PT9S'],
  ])('%s s -> %s', (s, out) => {
    expect(isoDuration(s)).toBe(out)
  })
  it.each([[0], [-5], [NaN], [null], [undefined]])('rejects %s', (s) => {
    expect(isoDuration(s as number | null | undefined)).toBeNull()
  })
})
