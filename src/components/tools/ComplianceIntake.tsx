'use client'

import { useState } from 'react'
import { Bot, Loader2, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { AssessmentQuestion, AssessmentValue } from '@/lib/ai-act-assessment'
import type { Proposal } from '@/lib/intake/parse'

/**
 * The conversational front door to the Compliance Checker.
 *
 * Free text in, proposed answers out, every one confirmed by the user before it
 * reaches the engine. The click path stays exactly where it was — this is an
 * alternative way to fill the form, not a replacement for it.
 */

const MAX_CHARS = 2_000
const MIN_CHARS = 20

interface Props {
  questions: AssessmentQuestion[]
  onConfirm: (answers: Record<string, AssessmentValue>) => void
  onSkip: () => void
}

type Stage = 'describe' | 'review'

function labelFor(question: AssessmentQuestion, value: AssessmentValue): string {
  const byValue = new Map((question.options ?? []).map((option) => [option.value, option.label]))
  if (Array.isArray(value)) return value.map((item) => byValue.get(item) ?? item).join(', ')
  return byValue.get(value) ?? value
}

export function ComplianceIntake({ questions, onConfirm, onSkip }: Props) {
  const [stage, setStage] = useState<Stage>('describe')
  const [description, setDescription] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [proposals, setProposals] = useState<Proposal[]>([])
  // Proposals the user has unticked. Confirmation is explicit and per-answer —
  // the user is accepting each one, not waving through a block.
  const [rejected, setRejected] = useState<Set<string>>(new Set())

  const byId = new Map(questions.map((question) => [question.id, question]))
  const tooShort = description.trim().length < MIN_CHARS

  const submit = async () => {
    setPending(true)
    setError(null)
    try {
      const response = await fetch('/api/tools/compliance-checker/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: description.slice(0, MAX_CHARS) }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data?.error || 'That did not work. Use the questions instead.')
        return
      }
      if (!data.proposals?.length) {
        setError(
          'Nothing in that description mapped cleanly onto the questions. Add detail, or answer the questions directly.',
        )
        return
      }
      setProposals(data.proposals)
      setRejected(new Set())
      setStage('review')
    } catch {
      setError('The intake service is unreachable. Use the questions instead.')
    } finally {
      setPending(false)
    }
  }

  const accept = () => {
    const answers: Record<string, AssessmentValue> = {}
    for (const proposal of proposals) {
      if (rejected.has(proposal.questionId)) continue
      answers[proposal.questionId] = proposal.value
    }
    onConfirm(answers)
  }

  if (stage === 'review') {
    const acceptedCount = proposals.length - rejected.size
    return (
      <Card className="bg-stone-charcoal border-border-subtle shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-text-primary">Check these before we use them</CardTitle>
          <CardDescription className="text-base">
            Nothing here has been assessed yet. Untick anything that is wrong or that you would rather
            answer yourself — you will be taken through the remaining questions either way.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {proposals.map((proposal) => {
            const question = byId.get(proposal.questionId)
            if (!question) return null
            const isRejected = rejected.has(proposal.questionId)
            return (
              <button
                key={proposal.questionId}
                type="button"
                onClick={() =>
                  setRejected((previous) => {
                    const next = new Set(previous)
                    if (next.has(proposal.questionId)) next.delete(proposal.questionId)
                    else next.add(proposal.questionId)
                    return next
                  })
                }
                className={`w-full text-left rounded-lg border p-4 transition-all ${
                  isRejected
                    ? 'border-border-subtle bg-surface-elevated opacity-50'
                    : 'border-stone-teal bg-stone-teal/10'
                }`}
              >
                <div className="text-sm text-text-muted">{question.text}</div>
                <div className="mt-1 font-medium text-text-primary">
                  {labelFor(question, proposal.value)}
                </div>
                <div className="mt-2 text-xs text-text-muted">
                  From your description:{' '}
                  <span className="italic text-silicon-amber-strong">“{proposal.sourcePhrase}”</span>
                  {proposal.confidence === 'medium' && (
                    <Badge variant="outline" className="ml-2 border-silicon-amber text-silicon-amber-strong">
                      Worth checking
                    </Badge>
                  )}
                </div>
                <div className="mt-2 text-xs font-mono uppercase tracking-wider text-text-muted">
                  {isRejected ? 'Skipped — you will be asked' : 'Tap to skip'}
                </div>
              </button>
            )
          })}

          <div className="flex flex-col gap-3 pt-3 border-t border-border-subtle sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStage('describe')}
              className="text-text-muted hover:text-text-primary"
            >
              Rewrite the description
            </Button>
            <Button
              type="button"
              onClick={accept}
              className="bg-accent-fill text-ink-on-accent hover:bg-accent-fill/90"
            >
              Use {acceptedCount} {acceptedCount === 1 ? 'answer' : 'answers'} and continue
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-stone-charcoal border-border-subtle shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl text-text-primary">Describe the system in your own words</CardTitle>
        <CardDescription className="text-base">
          What the tool is, who it affects, and what happens with its output. We will turn that into
          draft answers for you to check.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/*
          Article 50(1): an AI system that interacts directly with a natural
          person must disclose that at first interaction. It would be a poor
          look to get this wrong inside a compliance tool.
        */}
        <div className="flex items-start gap-3 rounded-lg border border-silicon-amber/40 bg-silicon-amber/10 p-4">
          <Bot className="mt-0.5 h-4 w-4 flex-shrink-0 text-silicon-amber-strong" />
          <p className="text-sm text-text-primary">
            <span className="font-semibold">You are interacting with an AI system.</span> It reads your
            description and proposes answers to the questionnaire. It does not decide your risk tier —
            that stays with the rule-based engine, and you confirm every answer first.
          </p>
        </div>

        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value.slice(0, MAX_CHARS))}
          rows={6}
          placeholder="e.g. We use a third-party AI tool to screen and rank job applicants across our EU offices; a recruiter reviews the shortlist but usually goes with it."
          className="w-full rounded-lg border border-border-subtle bg-slate-deep p-4 text-text-primary placeholder:text-text-muted focus:border-stone-teal focus:outline-none"
        />

        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>{tooShort ? `At least ${MIN_CHARS} characters` : 'Ready'}</span>
          <span>
            {description.length} / {MAX_CHARS}
          </span>
        </div>

        {error && (
          <p className="rounded-lg border border-alert-red/40 bg-alert-red/10 p-3 text-sm text-text-primary">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3 pt-3 border-t border-border-subtle sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={onSkip}
            className="text-text-muted hover:text-text-primary"
          >
            Answer the questions instead
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={tooShort || pending}
            className="bg-accent-fill text-ink-on-accent hover:bg-accent-fill/90"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Reading your description
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Draft my answers
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
