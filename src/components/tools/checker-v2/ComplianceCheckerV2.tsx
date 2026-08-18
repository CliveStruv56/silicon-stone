'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { QuestionCard } from './QuestionCard'
import { ResultV2 } from './ResultV2'
import {
  EMPTY_FLOW,
  applyAnswer,
  canAdvance,
  currentQuestion,
  dataEntryWarnings,
  flowProgress,
  flowSections,
  goBack,
  goNext,
  isFinished,
  type FlowState,
} from '@/lib/compliance-v2/flow'
import type { AssessmentAnswerV2 } from '@/lib/compliance-v2/types'
import { evaluateAssessmentV2 } from '@/lib/compliance-v2/engine/assemble'

/**
 * The v2 questionnaire (Phase 4).
 *
 * Built **alongside** v1 rather than in place of it — spec §23.2, the opt-in
 * beta decision. v1 stays the default for everyone until §20's release criteria
 * pass; this is reached only by a reader who chooses it, and there is a link
 * back on every screen.
 *
 * All navigation and answer-invalidation logic lives in `lib/compliance-v2/flow.ts`
 * and is unit-tested there. This component holds one piece of state and renders
 * what those functions return, which is what keeps the rules from drifting into
 * a file no test can reach.
 *
 * The result panel below is **deliberately plain**. Phase 5 owns the result
 * experience — typed finding cards, embedded legal explanations, the suppression
 * rules of §12 — and rendering a convincing-looking version of that now would
 * make an unfinished thing look finished. What is here is the classification,
 * its statutory routes and the answers it rests on: enough to see the engine
 * work, and visibly not the finished article.
 */

export function ComplianceCheckerV2({ exitHref }: { exitHref: string }) {
  const [flow, setFlow] = useState<FlowState>(EMPTY_FLOW)
  const [showResult, setShowResult] = useState(false)
  // Captured once, when the component mounts, so the result carries the date it
  // was actually made on and does not move under a re-render.
  const [assessedAt] = useState(() => new Date().toISOString().slice(0, 10))

  const question = currentQuestion(flow)
  const sections = flowSections(flow)
  const progress = flowProgress(flow)
  const warnings = dataEntryWarnings(flow)
  const finished = isFinished(flow)

  const onAnswer = (answer: AssessmentAnswerV2) => {
    if (!question) return
    setFlow((state) => applyAnswer(state, question.id, answer))
  }

  /**
   * The result is computed only when asked for, and against a fixed assessment
   * date captured at that moment. §15.1 wants a result reproducible from its
   * record; a component that read the clock on every render would produce a
   * different one each time the page re-rendered around midnight.
   */
  const result = useMemo(
    () => (showResult ? evaluateAssessmentV2(flow.answers, assessedAt) : null),
    [flow.answers, showResult, assessedAt]
  )

  if (showResult && result) {
    return (
      <div className="space-y-6">
        <BetaNotice exitHref={exitHref} />
        <ResultV2 result={result} />
        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" onClick={() => setShowResult(false)} className="text-text-muted">
            <ArrowLeft className="h-4 w-4" />
            Back to the questions
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setFlow(EMPTY_FLOW)
              setShowResult(false)
            }}
            className="text-text-muted"
          >
            <RefreshCcw className="h-4 w-4" />
            Start again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BetaNotice exitHref={exitHref} />

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-4">
          <Card className="bg-stone-charcoal border-border-subtle">
            <CardContent className="pt-6">
              {/*
                Sections, not "question N of M". §7.1 forbids a fixed count when
                branching is dynamic, and this catalogue genuinely asks different
                numbers of questions on different paths — a count would move
                under the reader.
              */}
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-elevated">
                <div className="h-full bg-stone-teal transition-all" style={{ width: `${progress}%` }} />
              </div>

              <ol className="mt-5 space-y-2">
                {sections.map((section) => (
                  <li
                    key={section.title}
                    aria-current={section.current ? 'step' : undefined}
                    className={`flex items-center justify-between gap-2 text-xs ${
                      section.current ? 'text-text-primary' : 'text-text-muted'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {section.complete && <Check className="h-3 w-3 text-stone-teal" />}
                      {section.title}
                    </span>
                    <span className="font-mono">
                      {section.answeredCount}/{section.questionIds.length}
                    </span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </aside>

        <div className="space-y-4">
          {question ? (
            <QuestionCard
              key={question.id}
              question={question}
              answer={flow.answers[question.id]}
              warnings={warnings
                .filter((warning) => warning.questionId === question.id)
                .map((warning) => warning.message)}
              onAnswer={onAnswer}
            />
          ) : (
            <Card className="bg-stone-charcoal border-border-subtle">
              <CardContent className="pt-6 text-text-muted">No questions to ask.</CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setFlow(goBack)}
              disabled={flow.index === 0}
              className="text-text-muted hover:text-text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            {finished ? (
              <Button
                onClick={() => setShowResult(true)}
                className="bg-accent-fill text-ink-on-accent hover:bg-accent-fill/90"
              >
                See the result
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={() => setFlow(goNext)}
                disabled={!canAdvance(flow)}
                className="bg-accent-fill text-ink-on-accent hover:bg-accent-fill/90"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function BetaNotice({ exitHref }: { exitHref: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-teal/40 bg-surface-elevated p-4">
      <p className="text-sm text-text-primary">
        <strong>You are using the v2 preview.</strong> It is not the tool this site currently
        stands behind, and its result is not yet the finished one.
      </p>
      <Link href={exitHref} className="text-sm text-stone-teal hover:underline">
        Back to the current version
      </Link>
    </div>
  )
}
