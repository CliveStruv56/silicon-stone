import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DeadlineCountdown } from './DeadlineCountdown'

describe('DeadlineCountdown prerender', () => {
  // On the server the browser date is unknown (null), so the prerendered page
  // must assert nothing about whether 2 December 2026 has passed.
  const html = renderToStaticMarkup(createElement(DeadlineCountdown)).replace(/<!-- -->/g, '')

  it('takes both dates from the pinned pack', () => {
    expect(html).toContain('apply from 2 August 2026')
    expect(html).toContain('2 December 2026')
  })

  it('uses tense-neutral wording until the browser supplies the date', () => {
    expect(html).toContain('is set for 2 December 2026')
    expect(html).not.toMatch(/ends on|ended on|have applied since/)
  })
})
