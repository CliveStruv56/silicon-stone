import { describe, expect, it } from 'vitest'
import {
  mentionsTerm,
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


describe('mentionsTerm', () => {
  const dataAct = { name: 'Data Act', acronym: null, fullName: null, aliases: null }
  const cra = { name: 'Cyber Resilience Act', acronym: 'CRA', fullName: null, aliases: ['EU CRA'] }

  it('needs the whole phrase, not its words scattered through the text', () => {
    // The GROQ prefilter is tokenised and passes this; the page must not.
    expect(mentionsTerm('The data shows the AI Act is biting.', dataAct)).toBe(false)
    expect(mentionsTerm('Under the Data Act, switching is a right.', dataAct)).toBe(true)
    expect(mentionsTerm('under the data act, switching', dataAct)).toBe(true)
  })

  it('matches an acronym case-sensitively and on word boundaries', () => {
    expect(mentionsTerm('The CRA applies from 2027.', cra)).toBe(true)
    expect(mentionsTerm('A sacrament of democracy.', cra)).toBe(false)
    expect(mentionsTerm('They cra the numbers.', cra)).toBe(false)
    expect(mentionsTerm('(CRA)', cra)).toBe(true)
  })

  it('reads aliases, and survives regex metacharacters in a name', () => {
    expect(mentionsTerm('the EU CRA timetable', { ...cra, acronym: null })).toBe(true)
    const odd = { name: 'C++ (language)', acronym: null, fullName: null, aliases: null }
    expect(mentionsTerm('written in C++ (language) mostly', odd)).toBe(true)
  })
})
