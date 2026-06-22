import { describe, expect, it } from 'vitest'
import {
  filterGlossaryTerms,
  glossaryLetter,
  glossarySearchScore,
  normaliseGlossaryText,
  type GlossaryTerm,
} from './glossary'

const terms: GlossaryTerm[] = [
  {
    _id: 'gdpr',
    name: 'General Data Protection Regulation',
    slug: 'gdpr',
    acronym: 'GDPR',
    aliases: ['EU data protection law'],
    kind: 'law-policy',
    definition: 'The European Union framework governing personal data processing.',
  },
  {
    _id: 'gpai',
    name: 'General-purpose AI',
    slug: 'general-purpose-ai',
    acronym: 'GPAI',
    kind: 'acronym',
    definition: 'An AI model capable of performing a broad range of tasks.',
  },
]

describe('glossary helpers', () => {
  it('normalises punctuation, accents and case', () => {
    expect(normaliseGlossaryText('Gaia-X / ÉU')).toBe('gaia x eu')
  })

  it('ranks exact acronyms above definition-only matches', () => {
    expect(glossarySearchScore(terms[0], 'GDPR')).toBe(100)
    expect(glossarySearchScore(terms[0], 'personal data')).toBe(20)
  })

  it('searches aliases and filters by kind', () => {
    expect(filterGlossaryTerms(terms, 'data protection')[0]._id).toBe('gdpr')
    expect(filterGlossaryTerms(terms, '', 'acronym').map((term) => term._id)).toEqual(['gpai'])
  })

  it('creates stable alphabet groups', () => {
    expect(glossaryLetter(terms[0])).toBe('G')
    expect(glossaryLetter({ ...terms[0], name: '2nm process' })).toBe('#')
  })
})

