import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { RULE_PACK } from '@/lib/rulepack'
import { verifyCitation } from '@/lib/rulepack/corpus'
import { packDate } from '@/lib/compliance-v2/engine/dates'
import { AI_ACT_FAQ } from './faq'
import { HARMONISED_STANDARDS } from './harmonised-standards'
import { ISO_42001_CROSSWALK } from './iso-42001'
import type { StatuteCitation } from './types'

/**
 * The FAQ and the ISO/IEC 42001 crosswalk quote statute on public pages, so
 * they are held to the Compliance Checker's rule: no legal quotation reaches a
 * screen unverified.
 */

const faqCitations = AI_ACT_FAQ.flatMap((entry) =>
  entry.citations.map((citation) => ({ where: `faq:${entry.id}`, citation })),
)
const crosswalkCitations = ISO_42001_CROSSWALK.map((row) => ({
  where: `crosswalk:${row.id}`,
  citation: row.aiAct,
}))
const ALL: Array<{ where: string; citation: StatuteCitation }> = [...faqCitations, ...crosswalkCitations]

/** Every prose string a reader sees, keyed for the failure message. */
const PROSE: Array<[string, string]> = [
  ...AI_ACT_FAQ.flatMap((entry): Array<[string, string]> => [
    [`faq:${entry.id}:question`, entry.question],
    ...entry.answer.map((text, i): [string, string] => [`faq:${entry.id}:answer[${i}]`, text]),
    ...(entry.list ?? []).map((text, i): [string, string] => [`faq:${entry.id}:list[${i}]`, text]),
  ]),
  ...ISO_42001_CROSSWALK.flatMap((row): Array<[string, string]> => [
    [`crosswalk:${row.id}:requirement`, row.requirement],
    [`crosswalk:${row.id}:reuse`, row.reuse],
    [`crosswalk:${row.id}:adds`, row.adds],
  ]),
]

describe('statute citations in the explainers', () => {
  it('exist', () => {
    // A filter that silently matched nothing would make every assertion below
    // vacuous. The counts are floors, not inventories.
    expect(faqCitations.length).toBeGreaterThanOrEqual(10)
    expect(crosswalkCitations.length).toBe(ISO_42001_CROSSWALK.length)
  })

  it.each(ALL.map((item) => [item.where, item.citation.locator, item.citation] as const))(
    '%s %s is verbatim in the pinned corpus',
    (_where, _locator, citation) => {
      expect(verifyCitation(citation.corpusArticle, citation.quote)).toEqual({ status: 'verified' })
    },
  )

  it('every corpusArticle is a key of the pinned manifest, so no provision link can 404', () => {
    const keys = Object.keys(RULE_PACK.manifest.corpus)
    for (const { where, citation } of ALL) {
      expect(keys, where).toContain(citation.corpusArticle)
    }
  })

  it('every locator names the provision its quote comes from', () => {
    // An anchor copy-pasted onto the wrong provision would still verify — the
    // quote is checked against corpusArticle, not against the locator text.
    for (const { where, citation } of ALL) {
      const label = citation.corpusArticle.startsWith('annex-')
        ? `Annex ${citation.corpusArticle.slice('annex-'.length).toUpperCase()}`
        : `Article ${citation.corpusArticle}`
      expect(
        citation.locator === label || citation.locator.startsWith(`${label}(`) || citation.locator.startsWith(`${label},`),
        `${where}: "${citation.locator}" does not name ${label}`,
      ).toBe(true)
    }
  })

  it('the check is not a rubber stamp: a paraphrase fails', () => {
    // Mutation test kept in the suite. If verifyCitation ever accepted this,
    // every assertion above would be meaningless.
    expect(verifyCitation('113', 'high-risk obligations apply from 2 August 2026')).toEqual({ status: 'not-found' })
    expect(verifyCitation('2', 'This Regulation applies to companies outside the EU')).toEqual({
      status: 'not-found',
    })
  })
})

describe('dates in explainer prose', () => {
  const DATE = /\b\d{1,2} (?:January|February|March|April|May|June|July|August|September|October|November|December) \d{4}\b/g
  const allowed = new Set([...RULE_PACK.timeline.map((entry) => entry.date), ...HARMONISED_STANDARDS.map((s) => s.date)])

  it('every date a reader sees comes from the pack timeline or a sourced fact', () => {
    // A literal date typed into an answer is how a stale one comes back. What
    // this catches is a date from nowhere — one no pack entry or sourced fact
    // carries. It cannot catch a real pack date attached to the wrong duty:
    // "high-risk from 2 August 2026" passes, because 2 August 2026 is Article
    // 50's date. Mutation-tested 2026-10-29 and found exactly that, which is
    // why the next test pins the one answer where that mistake matters most,
    // and why the rest is a reviewer's job.
    for (const [where, text] of PROSE) {
      for (const match of text.match(DATE) ?? []) {
        expect(allowed, `${where} writes "${match}", which is in neither the pack nor HARMONISED_STANDARDS`).toContain(
          match,
        )
      }
    }
  })

  it('the high-risk dates answer states the deferred dates, not the original one', () => {
    const entry = AI_ACT_FAQ.find((item) => item.id === 'high-risk-dates')
    expect(entry).toBeDefined()
    const prose = entry!.answer.join(' ')
    expect(prose).toContain(packDate('Standalone high-risk systems').display)
    expect(prose).toContain(packDate('Embedded product-safety high-risk systems').display)
  })

  it('every crosswalk applicability label resolves in the pinned pack', () => {
    for (const row of ISO_42001_CROSSWALK) {
      expect(row.appliesFrom.length, row.id).toBeGreaterThan(0)
      for (const label of row.appliesFrom) expect(() => packDate(label), `${row.id}: ${label}`).not.toThrow()
    }
  })
})

describe('explainer content', () => {
  it('renders plain text: no markdown emphasis reaches a reader as asterisks', () => {
    for (const [where, text] of PROSE) expect(text, where).not.toMatch(/\*[^*\s][^*]*\*|_[^_\s][^_]*_/)
  })

  it('FAQ ids and crosswalk ids are unique, since both are page anchors', () => {
    const faqIds = AI_ACT_FAQ.map((entry) => entry.id)
    const rowIds = ISO_42001_CROSSWALK.map((row) => row.id)
    expect(new Set(faqIds).size).toBe(faqIds.length)
    expect(new Set(rowIds).size).toBe(rowIds.length)
  })

  it('never claims ISO/IEC 42001 gives a presumption of conformity', () => {
    // The only standard that does is a harmonised one cited in the Official
    // Journal. A crosswalk row reading "42001 satisfies Article 17" would be the
    // exact over-claim the page exists to correct.
    for (const [where, text] of PROSE) {
      expect(text, where).not.toMatch(/42001[^.]*\b(?:satisf|presum|guarantee|ensures? compliance)/i)
    }
    expect(HARMONISED_STANDARDS.map((s) => s.reference).join(' ')).not.toMatch(/42001/)
  })

  it('gap rows quote ISO nothing, and mapped rows name an ISO element', () => {
    for (const row of ISO_42001_CROSSWALK) {
      if (row.fit === 'none') expect(row.iso, row.id).toBeNull()
      else expect(row.iso?.ref, row.id).toMatch(/^(?:Clauses? |A\.)/)
    }
  })

  it('every sourced fact carries a source URL on EUR-Lex and a check date', () => {
    for (const fact of HARMONISED_STANDARDS) {
      expect(fact.sourceUrl).toMatch(/^https:\/\/eur-lex\.europa\.eu\//)
      expect(fact.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})
