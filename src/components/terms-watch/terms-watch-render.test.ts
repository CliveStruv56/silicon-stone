import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { TermsChangeArticle } from './TermsChangeArticle'
import { TermsChangeList } from './TermsChangeList'
import { termsChangePath, type TermsChange } from '@/lib/terms-watch'

// Mock termsChange documents in the shape TERMS_CHANGES_QUERY returns. Nothing here touches Sanity.
const full: TermsChange = {
  _id: 'tc-1',
  title: 'Consumer plans: training on chats is now on by default',
  slug: 'consumer-training-default',
  provider: 'anthropic',
  documentTitle: 'Consumer Terms',
  sourceUrl: 'https://example.com/terms',
  category: 'data use and training',
  severity: 'high',
  useScopes: ['consumer', 'api'],
  detectedAt: '2026-11-09T08:00:00Z',
  statedEffectiveDate: '2026-12-01',
  whatChanged: 'Chats on personal accounts may now be used to train models unless the user opts out.',
  whoIsAffected: 'Anyone on a personal account.',
  facts: ['The opt-out is in settings.'],
  inferences: ['Business plans look unaffected.'],
  suggestedActions: ['Check the setting.', 'Tell staff not to use personal accounts for work.'],
  quotes: ['You can opt out at any time.'],
  stoneTruth: 'Defaults are policy.',
  publishedAt: '2026-11-10T09:00:00Z',
}
const sparse: TermsChange = {
  _id: 'tc-2',
  title: 'Notice period changed',
  slug: 'notice-period',
  provider: 'spacexsi',
  documentTitle: 'Business Terms',
  sourceUrl: 'https://example.com/b',
  severity: 'low',
  whatChanged: 'Notice period moves from 30 to 14 days.',
  whoIsAffected: 'API customers.',
  publishedAt: '2026-11-03T09:00:00Z',
}

describe('AI Terms Watch with documents present', () => {
  it('renders the list with links, provider names, dates and severity', () => {
    const html = renderToStaticMarkup(createElement(TermsChangeList, { changes: [full, sparse] }))
    expect(html).toContain(`href="${termsChangePath('anthropic', 'consumer-training-default')}"`)
    expect(html).toContain('Anthropic')
    expect(html).toContain('SpaceXSI (xAI)')
    expect(html).toContain('10 November 2026')
    expect(html).toContain('High impact')
    expect(html).toContain('Minor')
  })

  it('hides the provider name on a provider page', () => {
    const html = renderToStaticMarkup(createElement(TermsChangeList, { changes: [full], showProvider: false }))
    expect(html).not.toContain('>Anthropic<')
  })

  it('renders a full detail page body, with the disclaimer and signup', () => {
    const html = renderToStaticMarkup(createElement(TermsChangeArticle, { change: full }))
    for (const text of ['Who is affected', 'What to do', 'Fact', 'Inference', 'Stone Truth', 'Applies to: Personal accounts, API', 'Change detected 9 November 2026']) {
      expect(html).toContain(text)
    }
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).toContain('Silicon &amp; Stone summarises published provider terms')
    expect(html).toContain('Get the briefing')
  })

  it('renders a sparse item without empty sections', () => {
    const html = renderToStaticMarkup(createElement(TermsChangeArticle, { change: sparse }))
    expect(html).toContain('Who is affected')
    for (const text of ['What to do', 'Inference', 'Stone Truth', 'Applies to']) expect(html).not.toContain(text)
  })
})
