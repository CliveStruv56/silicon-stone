'use client'

import { useId } from 'react'
import { AlertTriangle, HelpCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AssessmentAnswerV2, AssessmentQuestionV2 } from '@/lib/compliance-v2/types'
import { makeAnswer } from '@/lib/compliance-v2/flow'

/**
 * One question, on its own screen (§7.1).
 *
 * Native inputs rather than styled buttons, deliberately. A `<fieldset>` of
 * radios gives arrow-key navigation, a group label and a checked state to a
 * screen reader for free; a grid of `<button>`s gives none of those and has to
 * reimplement all three badly. §17.5 asks for keyboard-only completion and
 * screen-reader labels, and this is the cheapest way to actually have them.
 *
 * The escapes — "Not sure" and "Prefer not to say" — sit in the same group as
 * the real options rather than off to one side. They are answers (§6.1), and
 * putting them in a different visual class is how a questionnaire teaches people
 * that not knowing is a failure to complete something.
 */

interface Props {
  question: AssessmentQuestionV2
  answer?: AssessmentAnswerV2
  warnings: string[]
  onAnswer: (answer: AssessmentAnswerV2) => void
}

function selectedValues(answer?: AssessmentAnswerV2): string[] {
  if (!answer || answer.state !== 'answered') return []
  if (Array.isArray(answer.value)) return answer.value
  return typeof answer.value === 'string' ? [answer.value] : []
}

export function QuestionCard({ question, answer, warnings, onAnswer }: Props) {
  const groupId = useId()
  const selected = selectedValues(answer)
  const isMulti = question.answerType === 'multi'

  const choose = (value: string) => {
    if (!isMulti) {
      onAnswer(makeAnswer(question.id, 'answered', value))
      return
    }
    // "None of these" is exclusive on the way in — selecting it clears the rest,
    // and selecting anything else clears it. The data-entry warning catches the
    // combination arriving from elsewhere; this stops it being produced here.
    const exclusive = value === 'none' || value === 'none_of_these'
    const next = exclusive
      ? [value]
      : selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected.filter((item) => item !== 'none' && item !== 'none_of_these'), value]
    onAnswer(makeAnswer(question.id, 'answered', next))
  }

  return (
    <Card className="bg-stone-charcoal border-border-subtle">
      <CardHeader>
        <div className="text-xs font-mono uppercase tracking-wider text-stone-teal">
          {question.section}
        </div>
        <CardTitle className="mt-2 text-xl text-text-primary">{question.prompt}</CardTitle>
        <p className="mt-3 text-sm text-text-muted">{question.help}</p>
      </CardHeader>

      <CardContent className="space-y-5">
        {question.answerType === 'text' ? (
          <div>
            <label htmlFor={`${groupId}-text`} className="sr-only">
              {question.prompt}
            </label>
            <textarea
              id={`${groupId}-text`}
              rows={4}
              defaultValue={typeof answer?.value === 'string' ? answer.value : ''}
              onChange={(event) => onAnswer(makeAnswer(question.id, 'answered', event.target.value))}
              className="w-full rounded-lg border border-border-subtle bg-surface-elevated p-3 text-sm text-text-primary focus:border-stone-teal focus:outline-none"
              placeholder="A sentence or two is enough."
            />
          </div>
        ) : (
          <fieldset>
            <legend className="sr-only">{question.prompt}</legend>
            <div className="space-y-2">
              {question.options?.map((option) => {
                const id = `${groupId}-${option.value}`
                return (
                  <label
                    key={option.value}
                    htmlFor={id}
                    className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors ${
                      selected.includes(option.value)
                        ? 'border-stone-teal bg-surface-elevated'
                        : 'border-border-subtle bg-surface-elevated/40 hover:border-stone-teal/60'
                    }`}
                  >
                    <input
                      id={id}
                      type={isMulti ? 'checkbox' : 'radio'}
                      name={groupId}
                      value={option.value}
                      checked={selected.includes(option.value)}
                      onChange={() => choose(option.value)}
                      className="mt-1 h-4 w-4 accent-stone-teal"
                    />
                    <span className="text-sm">
                      <span className="text-text-primary">{option.label}</span>
                      {option.help && (
                        <span className="mt-1 block text-xs text-text-muted">{option.help}</span>
                      )}
                    </span>
                  </label>
                )
              })}

              {/*
                The escapes, in the same group and the same visual class as the
                real options. An unknown is an answer, not a refusal to give one.
              */}
              {question.allowUnknown && (
                <EscapeOption
                  groupId={groupId}
                  name={isMulti ? `${groupId}-unknown` : groupId}
                  label="Not sure"
                  help="A real answer. The result carries it as an unknown rather than guessing."
                  checked={answer?.state === 'unknown'}
                  onSelect={() => onAnswer(makeAnswer(question.id, 'unknown'))}
                />
              )}
              {question.allowNotApplicable && (
                <EscapeOption
                  groupId={groupId}
                  name={isMulti ? `${groupId}-declined` : groupId}
                  label="Prefer not to say"
                  help="Nothing in the result waits on this."
                  checked={answer?.state === 'declined'}
                  onSelect={() => onAnswer(makeAnswer(question.id, 'declined'))}
                />
              )}
            </div>
          </fieldset>
        )}

        {warnings.map((warning) => (
          <p
            key={warning}
            role="status"
            className="flex gap-2 rounded-lg border border-silicon-amber/40 bg-surface-elevated p-3 text-sm text-silicon-amber-strong"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{warning}</span>
          </p>
        ))}

        <details className="group">
          <summary className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-stone-teal hover:underline">
            <HelpCircle className="h-3.5 w-3.5" />
            Why we ask
          </summary>
          <p className="mt-2 text-sm text-text-primary">{question.whyAsked}</p>
          {question.examples?.length ? (
            <ul className="mt-3 space-y-1">
              {question.examples.map((example) => (
                <li key={example} className="text-sm text-text-muted">
                  — {example}
                </li>
              ))}
            </ul>
          ) : null}
        </details>

        {question.importance === 'classification_decisive' && (
          <Badge variant="outline" className="border-border-subtle text-text-muted text-xs">
            This answer can change the result
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}

function EscapeOption({
  groupId,
  name,
  label,
  help,
  checked,
  onSelect,
}: {
  groupId: string
  name: string
  label: string
  help: string
  checked: boolean
  onSelect: () => void
}) {
  const id = `${groupId}-${label.replace(/\s+/g, '-').toLowerCase()}`
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors ${
        checked ? 'border-stone-teal bg-surface-elevated' : 'border-border-subtle bg-surface-elevated/40 hover:border-stone-teal/60'
      }`}
    >
      <input
        id={id}
        type="radio"
        name={name}
        checked={checked}
        onChange={onSelect}
        className="mt-1 h-4 w-4 accent-stone-teal"
      />
      <span className="text-sm">
        <span className="text-text-primary">{label}</span>
        <span className="mt-1 block text-xs text-text-muted">{help}</span>
      </span>
    </label>
  )
}
