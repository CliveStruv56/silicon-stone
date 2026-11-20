import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/** Reads next.config.ts as text: importing it would pull in the Serwist build plugin. */
const config = readFileSync(path.resolve(__dirname, '../../next.config.ts'), 'utf8')

describe('Content-Security-Policy and the article video', () => {
  it('allows frames from the privacy-enhanced YouTube origin only', () => {
    const m = config.match(/"frame-src ([^"]+)"/)
    expect(m, 'frame-src directive not found').not.toBeNull()
    expect(m![1].trim()).toBe('https://www.youtube-nocookie.com')
  })
  it('still forbids framing the site itself', () => {
    expect(config).toContain(`"frame-ancestors 'none'"`)
  })
  it('adds no YouTube or Google host to script, img or connect sources', () => {
    for (const line of config.split('\n')) {
      if (/youtube|ytimg|google/.test(line) && !/frame-src|youtube-nocookie|ArticleVideo|YouTube/.test(line)) {
        throw new Error(`unexpected third-party host in CSP: ${line}`)
      }
    }
  })
})
