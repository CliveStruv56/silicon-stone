import type { AssessmentQuestion } from '@/lib/ai-act-assessment'

/**
 * The controlled vocabulary an intake model is allowed to emit.
 *
 * Derived from the question set rather than hand-written, so a new question or
 * option is available to the model the moment it exists in the form — there is
 * no second list to keep in sync, and no way for the two to drift.
 *
 * Deliberately generic: it takes a question schema as input rather than
 * hard-coding the compliance checker's variables, which is the seam that lets
 * the same intake serve the other tools later without a rewrite.
 */

export interface VocabularyEntry {
  id: string
  text: string
  help?: string
  /** 'single' takes one value, 'multi' takes a list, 'text' takes a verbatim span. */
  type: AssessmentQuestion['type']
  /** Permitted values. Empty for free-text questions. */
  values: string[]
  /** Human labels, so the model can match on meaning rather than on slugs. */
  labels: Record<string, string>
}

export type Vocabulary = Record<string, VocabularyEntry>

export function buildVocabulary(questions: AssessmentQuestion[]): Vocabulary {
  const vocabulary: Vocabulary = {}

  for (const question of questions) {
    vocabulary[question.id] = {
      id: question.id,
      text: question.text,
      help: question.help,
      type: question.type,
      values: question.options?.map((option) => option.value) ?? [],
      labels: Object.fromEntries(
        (question.options ?? []).map((option) => [option.value, option.label]),
      ),
    }
  }

  return vocabulary
}

/**
 * The JSON Schema for the extraction tool.
 *
 * Every answer carries a `source_phrase` as well as a value. That is not
 * decoration: the phrase is checked against the user's own text before the
 * proposal is accepted, which is what stops the model inventing facts the
 * description never contained. A proposal it cannot ground in a real span is
 * discarded rather than shown.
 *
 * No property is marked required. The model must be free to leave a question
 * unanswered — forcing a value for every field is exactly how a guess gets
 * dressed up as an extraction.
 */
export function buildToolSchema(vocabulary: Vocabulary): Record<string, unknown> {
  const properties: Record<string, unknown> = {}

  for (const entry of Object.values(vocabulary)) {
    const value =
      entry.type === 'text'
        ? { type: 'string', description: 'A verbatim span copied from the description.' }
        : entry.type === 'multi'
          ? { type: 'array', items: { type: 'string', enum: entry.values } }
          : { type: 'string', enum: entry.values }

    properties[entry.id] = {
      type: 'object',
      description: entry.text,
      properties: {
        value,
        source_phrase: {
          type: 'string',
          description:
            'The exact words from the description that support this answer, copied verbatim. Required.',
        },
        confidence: {
          type: 'string',
          enum: ['high', 'medium', 'low'],
          description:
            'How directly the description supports this answer. Use "low" when you are inferring rather than reading.',
        },
      },
      required: ['value', 'source_phrase', 'confidence'],
      additionalProperties: false,
    }
  }

  return {
    type: 'object',
    properties,
    additionalProperties: false,
  }
}

/**
 * The vocabulary as prompt text. Slugs alone are not enough — the model needs
 * the human label to match meaning, and the exact slug to emit.
 */
export function describeVocabulary(vocabulary: Vocabulary): string {
  return Object.values(vocabulary)
    .map((entry) => {
      const header = `## ${entry.id} (${entry.type})\n${entry.text}${entry.help ? `\n${entry.help}` : ''}`
      if (entry.type === 'text') return `${header}\nAnswer with a verbatim span from the description.`
      const options = entry.values.map((value) => `- ${value}: ${entry.labels[value] ?? value}`).join('\n')
      return `${header}\n${options}`
    })
    .join('\n\n')
}
