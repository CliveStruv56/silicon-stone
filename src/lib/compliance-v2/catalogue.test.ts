import { describe, expect, it } from 'vitest'
import type { ActionKind } from '@/lib/ai-act-rules'
import { FINDING_KIND_FROM_ACTION_KIND, type AssessmentQuestionV2 } from './types'
import { CORE_QUESTIONS, QUESTION_CATALOGUE, validateCatalogue } from './questions'
import { LEGAL_PROPOSITIONS, validatePropositions } from './legal-content/propositions'
import { collectQuestionIds, evaluateCondition } from './conditions'

/**
 * Phase 1's structural guarantees. The one check that cannot live here is the
 * verbatim match of every proposition extract against the pinned corpus —
 * `rulepack/corpus.ts` is `server-only` and throws under vitest, so that runs in
 * `scripts/compliance-v2-check.ts` and gates the build.
 */

const question = (over: Partial<AssessmentQuestionV2> = {}): AssessmentQuestionV2 => ({
  id: 'q1',
  section: 'Section',
  prompt: 'Prompt?',
  help: 'Help.',
  whyAsked: 'Because.',
  answerType: 'single',
  options: [{ value: 'a', label: 'A' }],
  allowUnknown: true,
  allowNotApplicable: false,
  importance: 'context_only',
  ...over,
})

describe('the live catalogue', () => {
  it('is structurally valid', () => {
    expect(validateCatalogue()).toEqual([])
  })

  it('asks the whole universal triage §7.2 requires', () => {
    expect(QUESTION_CATALOGUE.map((item) => item.id)).toEqual([
      'organisation_establishment',
      'ai_market_connection',
      'organisation_activity',
      'intended_use_family',
      'intended_use_description',
      'individual_impact',
      'personal_data_use',
      'employee_band',
    ])
  })

  /**
   * §7.2's closing rule, and the fix for defect 3. The use *family* selects
   * which branch opens; it must not be treated as a fact that decides the tier,
   * or being in a regulated sector becomes a high-risk classification again.
   */
  it('the use family is not classification-decisive', () => {
    const family = CORE_QUESTIONS.find((item) => item.id === 'intended_use_family')
    expect(family?.importance).toBe('context_only')
  })

  /** §4.3: an unknown is available wherever a non-specialist may not know. */
  it('every triage question offers "not sure"', () => {
    for (const item of CORE_QUESTIONS) {
      expect(item.allowUnknown, item.id).toBe(true)
    }
  })
})

describe('catalogue validation', () => {
  it('rejects a duplicate question id', () => {
    const problems = validateCatalogue([question(), question()])
    expect(problems.map((item) => item.problem)).toContain('duplicate question id')
  })

  it('rejects a duplicate option value', () => {
    const problems = validateCatalogue([
      question({ options: [{ value: 'a', label: 'A' }, { value: 'a', label: 'Also A' }] }),
    ])
    expect(problems.map((item) => item.problem)).toContain('duplicate option value "a"')
  })

  /**
   * The check that keeps §6.1 honest at the catalogue level: an unknown belongs
   * in `allowUnknown`, not in the value space, or it becomes exactly the
   * "default enum value" §6.1 forbids converting an unknown into.
   */
  it('rejects an unknown smuggled in as an option value', () => {
    const problems = validateCatalogue([
      question({ options: [{ value: 'a', label: 'A' }, { value: 'not_sure', label: 'Not sure' }] }),
    ])
    expect(problems.some((item) => /encodes an unknown as a value/.test(item.problem))).toBe(true)
  })

  it('rejects a condition referencing a question that does not exist', () => {
    const problems = validateCatalogue([
      question({ visibleWhen: { questionId: 'nope', equals: 'x' } }),
    ])
    expect(problems.some((item) => /references unknown question "nope"/.test(item.problem))).toBe(true)
  })

  /**
   * A forward reference is the silent one: the branch never opens, and nothing
   * errors — the questionnaire simply skips a section nobody notices is missing.
   */
  it('rejects a condition referencing a question asked later', () => {
    const problems = validateCatalogue([
      question({ id: 'first', visibleWhen: { questionId: 'second', equals: 'x' } }),
      question({ id: 'second' }),
    ])
    expect(problems.some((item) => /asked later or is itself/.test(item.problem))).toBe(true)
  })

  it('rejects a classification-decisive question that is not required', () => {
    const problems = validateCatalogue([question({ importance: 'classification_decisive' })])
    expect(problems.some((item) => /must be required/.test(item.problem))).toBe(true)
  })

  it('rejects a text question carrying options', () => {
    const problems = validateCatalogue([question({ answerType: 'text' })])
    expect(problems.some((item) => /text question has options/.test(item.problem))).toBe(true)
  })
})

describe('conditions', () => {
  const answers = {
    colour: { questionId: 'colour', state: 'answered' as const, value: 'red', source: 'manual' as const },
    tags: { questionId: 'tags', state: 'answered' as const, value: ['a', 'b'], source: 'manual' as const },
    dunno: { questionId: 'dunno', state: 'unknown' as const, value: null, source: 'manual' as const },
  }

  it('matches an equality on an answered value', () => {
    expect(evaluateCondition({ questionId: 'colour', equals: 'red' }, answers)).toBe(true)
    expect(evaluateCondition({ questionId: 'colour', equals: 'blue' }, answers)).toBe(false)
  })

  it('matches membership on a multi answer', () => {
    expect(evaluateCondition({ questionId: 'tags', includesAny: ['b', 'z'] }, answers)).toBe(true)
    expect(evaluateCondition({ questionId: 'tags', includesAny: ['z'] }, answers)).toBe(false)
  })

  /**
   * The rule the whole answer model exists for. An unknown has no value, so a
   * value test is false — and false because there is nothing to compare, not
   * because the unknown was coerced to an empty one. `{ state }` is the only way
   * to ask about it.
   */
  it('never satisfies a value test from an unknown answer', () => {
    expect(evaluateCondition({ questionId: 'dunno', equals: 'red' }, answers)).toBe(false)
    expect(evaluateCondition({ questionId: 'dunno', includesAny: ['red'] }, answers)).toBe(false)
    expect(evaluateCondition({ questionId: 'dunno', state: 'unknown' }, answers)).toBe(true)
  })

  it('is false for a question that has not been reached', () => {
    expect(evaluateCondition({ questionId: 'absent', equals: 'red' }, answers)).toBe(false)
    expect(evaluateCondition({ questionId: 'absent', state: 'answered' }, answers)).toBe(false)
  })

  it('composes with all, any and not', () => {
    const condition = {
      all: [
        { questionId: 'colour', equals: 'red' },
        { any: [{ questionId: 'tags', includesAny: ['z'] }, { not: { questionId: 'dunno', state: 'answered' as const } }] },
      ],
    }
    expect(evaluateCondition(condition, answers)).toBe(true)
  })

  it('collects every referenced question id', () => {
    const ids = collectQuestionIds({
      all: [
        { questionId: 'a', equals: 'x' },
        { not: { any: [{ questionId: 'b', state: 'unknown' }, { questionId: 'c', includesAny: ['y'] }] } },
      ],
    })
    expect([...ids].sort()).toEqual(['a', 'b', 'c'])
  })
})

describe('the legal content library', () => {
  it('is structurally valid', () => {
    expect(validatePropositions()).toEqual([])
  })

  it('rejects a duplicate proposition id', () => {
    const [first] = LEGAL_PROPOSITIONS
    const problems = validatePropositions([first, { ...first }])
    expect(problems.map((item) => item.problem)).toContain('duplicate proposition id')
  })

  /**
   * An ellipsis cannot match the corpus verbatim, so this fails at authoring
   * time with a message that says why rather than as a build failure whose cause
   * is three files away.
   */
  it('rejects an extract that has been elided', () => {
    const [first] = LEGAL_PROPOSITIONS
    const problems = validatePropositions([
      { ...first, shortExtract: 'Deployers shall keep the logs… for at least six months' },
    ])
    expect(problems.some((item) => /contiguous/.test(item.problem))).toBe(true)
  })

  it('every proposition names at least one role it binds', () => {
    for (const proposition of LEGAL_PROPOSITIONS) {
      expect(proposition.applicableRoles.length, proposition.id).toBeGreaterThan(0)
    }
  })
})

describe('the shipped vocabulary maps into the v2 one', () => {
  const ALL_ACTION_KINDS: ActionKind[] = [
    'duty',
    'conditional',
    'concession',
    'support',
    'enforcement',
    'good-practice',
  ]

  it('every v1 item kind has a v2 meaning', () => {
    for (const kind of ALL_ACTION_KINDS) {
      expect(FINDING_KIND_FROM_ACTION_KIND[kind], kind).toBeTruthy()
    }
    expect(Object.keys(FINDING_KIND_FROM_ACTION_KIND).sort()).toEqual([...ALL_ACTION_KINDS].sort())
  })

  /**
   * The decision of record: extend rather than run a parallel vocabulary. v1's
   * `enforcement` is the value §4.2's eight labels have no home for, so v2 gains
   * a ninth rather than mislabelling a penalty statement as adjacent law.
   */
  it('an enforcement statement stays an enforcement statement', () => {
    expect(FINDING_KIND_FROM_ACTION_KIND.enforcement).toBe('enforcement_information')
  })

  /**
   * v1 has no future status — futurity lives in the condition prose — so the map
   * must not guess which conditional duties are really future ones. Phase 3
   * splits them at the source.
   */
  it('a v1 conditional never becomes a future obligation by assumption', () => {
    expect(FINDING_KIND_FROM_ACTION_KIND.conditional).toBe('conditional_obligation')
  })
})
