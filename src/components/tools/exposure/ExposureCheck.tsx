'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QuestionCard } from '@/components/tools/checker-v2/QuestionCard'
import { FollowOnOffering } from '@/components/advisory/FollowOnOffering'
import { CopyMarkdownButton } from '@/components/tools/CopyMarkdownButton'
import { ToolSubscribeCard } from '@/components/tools/ToolSubscribeCard'
import { ResultsLayout, StartHere, type ResultsSection } from '@/components/tools/results/ResultsLayout'
import {
  EMPTY_FLOW,
  applyAnswer,
  canAdvance,
  currentQuestion,
  flowProgress,
  goBack,
  goNext,
  isFinished,
  isLastQuestion,
  type FlowState,
} from '@/lib/compliance-v2/flow'
import type { AnswerRecordV2, AssessmentAnswerV2 } from '@/lib/compliance-v2/types'
import { RULE_PACK } from '@/lib/rulepack'
import { offeringById } from '@/lib/offering'
import { TOOL_JOURNEYS } from '@/lib/tool-journeys'
import { track } from '@/lib/track'
import { EXPOSURE_QUESTIONS } from '@/lib/exposure/questions'
import { evaluateExposure, VERDICT, VERDICT_EVENT, type ExposureArea, type ExposureResult } from '@/lib/exposure/engine'
import { EXTRACTS, type ExtractId } from '@/lib/exposure/extracts'
import {
  CONFIDENCE_LABEL,
  CONFIDENCE_NOTE,
  playbackNote,
  areasHeading,
  footerText,
  KIND_LABEL,
  exposureMarkdown,
  familyLabel,
  milestoneLine,
  playback,
  scopeExtracts,
} from '@/lib/exposure/report'

const Q = EXPOSURE_QUESTIONS
const TOOL = 'exposure-check'
const briefing = TOOL_JOURNEYS[TOOL].offering
const diagnostic = offeringById('exposure-diagnostic')

const CONTAINER = 'mx-auto max-w-6xl px-6 py-10 lg:px-8'
const linkClass = 'text-stone-teal underline underline-offset-4'

function Extract({ id }: { id: ExtractId }) {
  const extract = EXTRACTS[id]
  return (
    <blockquote className="mt-3 border-l-2 border-stone-teal/60 pl-4 text-sm italic leading-relaxed text-text-muted">
      “{extract.text}”
      <footer className="mt-1 text-xs not-italic">
        <Link href={`/tools/compliance-checker/provisions/${extract.article}`} className={linkClass}>
          {extract.citation}
        </Link>
      </footer>
    </blockquote>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 text-xl font-semibold text-text-primary">{children}</h2>
}

function Playback({ answers }: { answers: AnswerRecordV2 }) {
  const rows = playback(answers)
  return (
    <div>
      <SectionHeading>What you told us</SectionHeading>
      <dl className="grid gap-x-6 gap-y-3 rounded-lg border border-border-subtle bg-stone-charcoal p-5 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.id}>
            <dt className="font-mono text-xs uppercase tracking-wider text-text-muted">{row.question}</dt>
            <dd className={`mt-0.5 text-sm ${row.unknown ? 'italic text-text-muted' : 'text-text-primary'}`}>{row.answer}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-text-muted">{playbackNote(RULE_PACK)}</p>
    </div>
  )
}

function Verdict({ result, answers }: { result: ExposureResult; answers: AnswerRecordV2 }) {
  const inScope = result.scope.outcome !== 'out_of_scope'
  const extracts = scopeExtracts(result, answers)
  return (
    <div className="rounded-lg border border-stone-teal/50 bg-stone-charcoal p-6">
      <p className="font-mono text-xs uppercase tracking-wider text-stone-teal">Verdict</p>
      <h2 className="mt-2 text-2xl font-semibold leading-snug text-text-primary">{VERDICT[result.scope.outcome]}</h2>
      <p className="mt-4 leading-relaxed text-text-muted">{result.scope.explanation}</p>
      {extracts.length > 0 && (
        <div className="mt-3">
          <p className="text-sm text-text-muted">The Act applies to:</p>
          {extracts.map((id) => <Extract key={id} id={id} />)}
        </div>
      )}
      <p className="mt-4 leading-relaxed text-text-primary">{result.meaning}</p>

      <div className="mt-5 border-t border-border-subtle pt-4">
        <p className="text-sm font-medium text-text-primary">Confidence: {CONFIDENCE_LABEL[result.confidence]}</p>
        <p className="mt-1 text-xs text-text-muted">{CONFIDENCE_NOTE}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-text-muted">
          {result.confidenceReasons.map((reason) => <li key={reason}>{reason}</li>)}
        </ul>
      </div>

      {inScope && result.roles.length > 0 && (
        <div className="mt-5 border-t border-border-subtle pt-4">
          <p className="text-sm font-medium text-text-primary">Your likely roles</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-muted">
            {result.roles.map((role) => <li key={role}>{role}</li>)}
          </ul>
        </div>
      )}

      <p className="mt-5 border-t border-border-subtle pt-4 text-sm leading-relaxed text-text-muted">
        <span className="font-medium text-text-primary">What this does not say. </span>
        {result.limits}
      </p>
    </div>
  )
}

function AreaCard({ area, startHere }: { area: ExposureArea; startHere?: string }) {
  const when = milestoneLine(area)
  return (
    <article id={`area-${area.id}`} className="scroll-mt-32 rounded-lg border border-border-subtle bg-stone-charcoal p-5 lg:scroll-mt-24">
      {startHere && <StartHere reason={startHere} />}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="border-stone-teal text-stone-teal">{KIND_LABEL[area.kind]}</Badge>
        {when && <span className="text-xs text-text-muted">{when}</span>}
      </div>
      <h3 className="mt-3 text-lg font-semibold text-text-primary">{area.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-text-muted">{area.summary}</p>
      {area.extracts?.map((id) => <Extract key={id} id={id} />)}
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {area.article && (
          <Link
            href={`/tools/compliance-checker/provisions/${area.article}`}
            className={linkClass}
            aria-label={`Read Article ${area.article}, for ${area.title}`}
          >
            Read Article {area.article}
          </Link>
        )}
        {area.checkFamilies?.map((family) => (
          <Link
            key={family}
            href="/tools/compliance-checker"
            className={linkClass}
            aria-label={`Check a system in the Compliance Checker: ${familyLabel(family)}`}
          >
            Check a system: {familyLabel(family)}
          </Link>
        ))}
      </div>
    </article>
  )
}

function ListBlock({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 rounded-lg border border-border-subtle p-6 pl-10 text-sm leading-relaxed text-text-muted">
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  )
}

function buildSections(result: ExposureResult, answers: AnswerRecordV2): ResultsSection[] {
  const focus = result.focus
  const areaFocus = focus && focus.target !== 'find-out' && focus.target !== 'verdict' ? focus : null
  const sections: ResultsSection[] = [
    { id: 'what-you-told-us', label: 'What you told us', content: <Playback answers={answers} /> },
    {
      id: 'verdict',
      label: 'Verdict',
      content: <Verdict result={result} answers={answers} />,
      ...(focus?.target === 'verdict' ? { startHere: focus.reason } : {}),
    },
  ]
  const findOutSection: ResultsSection | null = result.findOut.length
    ? {
      id: 'find-out',
      label: 'Things to find out',
      ...(focus?.target === 'find-out' ? { startHere: focus.reason } : {}),
      content: (
        <div>
          <SectionHeading>Things to find out</SectionHeading>
          <p className="mb-4 text-sm leading-relaxed text-text-muted">
            You answered “not sure” to {result.findOut.length === 1 ? 'this question' : `these ${result.findOut.length} questions`}. That is a finding, not a failure: often it is the most useful thing a first pass turns up. Here is what to ask, whom to ask, and how each one changes the result.
          </p>
          <ol className="space-y-3">
            {result.findOut.map((item) => (
              <li key={item.questionId} className="rounded-lg border border-border-subtle bg-stone-charcoal p-5">
                <p className="font-medium leading-relaxed text-text-primary">{item.ask}</p>
                <p className="mt-2 text-sm text-text-muted"><span className="text-text-primary">Ask: </span>{item.whom}</p>
                <p className="mt-1 text-sm text-text-muted"><span className="text-text-primary">How it changes the result: </span>{item.effect}</p>
              </li>
            ))}
          </ol>
        </div>
      ),
      }
    : null
  const decisiveUnknown = result.findOut.some((item) => item.decisive)
  if (findOutSection && decisiveUnknown) sections.push(findOutSection)
  if (result.areas.length) {
    sections.push({
      id: 'areas',
      label: areasHeading(result),
      containsStartHere: Boolean(areaFocus),
      content: (
        <div>
          <SectionHeading>{areasHeading(result)}</SectionHeading>
          <div className="space-y-4">
            {result.areas.map((area) => (
              <AreaCard key={area.id} area={area} startHere={areaFocus?.target === area.id ? areaFocus.reason : undefined} />
            ))}
          </div>
        </div>
      ),
    })
  }
  if (result.readiness.length) {
    sections.push({
      id: 'first-steps',
      label: 'First steps',
      content: (
        <div>
          <SectionHeading>First steps</SectionHeading>
          <ListBlock items={result.readiness} />
        </div>
      ),
    })
  }
  if (findOutSection && !decisiveUnknown) sections.push(findOutSection)
  if (result.revisitIf.length) {
    sections.push({
      id: 'check-again',
      label: 'Check again if',
      content: (
        <div>
          <SectionHeading>Check again if</SectionHeading>
          <ListBlock items={result.revisitIf} />
        </div>
      ),
    })
  }
  if (result.scope.outcome !== 'out_of_scope') {
    sections.push({
      id: 'next-step',
      label: 'Next step',
      content: (
        <div>
          <SectionHeading>Next step: check one system at a time</SectionHeading>
          <div className="rounded-lg border border-stone-teal/50 bg-stone-charcoal p-6">
            <p className="leading-relaxed text-text-muted">
              This check looks at the organisation as a whole. The Compliance Checker takes one AI system and gives a first-pass risk tier with a stated confidence, your likely role, the duties that follow and the vendor evidence you are missing.
            </p>
            <Link
              href="/tools/compliance-checker"
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-accent-fill px-5 py-2.5 font-medium text-ink-on-accent transition-colors hover:bg-accent-fill/90"
            >
              Check a system in the Compliance Checker
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      ),
    })
  }
  return sections
}

export function ExposureCheck() {
  const [flow, setFlow] = useState<FlowState>(EMPTY_FLOW)
  const [showResult, setShowResult] = useState(false)
  const [today] = useState(() => new Date())
  const started = useRef(false)
  const completed = useRef(false)

  const question = currentQuestion(flow, Q)
  const progress = flowProgress(flow, Q)
  const finished = isFinished(flow, Q)
  const lastQuestion = isLastQuestion(flow, Q)

  const result = useMemo(
    () => (showResult ? evaluateExposure(flow.answers, RULE_PACK, today) : null),
    [flow.answers, showResult, today],
  )

  // Once per page view: the first result shown, with the coarse verdict only.
  useEffect(() => {
    if (!result || completed.current) return
    completed.current = true
    track('Tool Complete', { tool: TOOL, result: VERDICT_EVENT[result.scope.outcome] })
  }, [result])

  // Bring the result into view each time it is shown, rather than leaving the
  // reader at the foot of the question card or back at the hero.
  useEffect(() => {
    if (showResult) document.getElementById('what-you-told-us')?.scrollIntoView({ block: 'start' })
  }, [showResult])

  const onAnswer = (answer: AssessmentAnswerV2) => {
    if (!started.current) {
      started.current = true
      track('Tool Start', { tool: TOOL })
    }
    setFlow((state) => applyAnswer(state, answer.questionId, answer, Q))
  }

  if (result) {
    const inScope = result.scope.outcome !== 'out_of_scope'
    return (
      <div>
        <div className={CONTAINER}>
        <ResultsLayout sections={buildSections(result, flow.answers)} />

        <div className="mt-10 flex flex-wrap items-center gap-3 lg:ml-[15.5rem]">
          <CopyMarkdownButton
            toolName="Exposure Check"
            filename={`ai-act-exposure-check-${today.toISOString().slice(0, 10)}.md`}
            getMarkdown={() => exposureMarkdown(result, flow.answers, RULE_PACK, today)}
          />
          <Button variant="ghost" onClick={() => setShowResult(false)} className="text-text-muted">
            <ArrowLeft className="h-4 w-4" />
            Change answers
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

        <div className="lg:ml-[15.5rem]">
          <ToolSubscribeCard tool={TOOL} />
          <p className="mt-6 text-xs leading-relaxed text-text-muted">
            {footerText(RULE_PACK)}
          </p>
        </div>
        </div>

        {inScope && (
          <div>
            <FollowOnOffering
              offering={briefing}
              eyebrow="Take your result further"
              intro={TOOL_JOURNEYS[TOOL].intro}
              ctaLabel={`Explore the ${briefing.name}`}
              note="Bring the Markdown copy of your result; preparation from it is included."
            />
            {result.diagnosticReason && (
              <FollowOnOffering
                offering={diagnostic}
                eyebrow="Across the whole organisation"
                intro={result.diagnosticReason}
                ctaLabel={`Explore the ${diagnostic.name.replace(/^The /, '')}`}
                note={diagnostic.priceNote ? `${diagnostic.priceNote.charAt(0).toUpperCase()}${diagnostic.priceNote.slice(1)}.` : ''}
              />
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-6 py-10 lg:px-8">
      <div>
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-elevated">
          <div className="h-full bg-stone-teal transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {question && (
        <QuestionCard key={question.id} question={question} answer={flow.answers[question.id]} warnings={[]} onAnswer={onAnswer} />
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
        <div className="flex items-center gap-2">
          {!lastQuestion && (
            <Button
              onClick={() => setFlow((state) => goNext(state, Q))}
              disabled={!canAdvance(flow, Q)}
              className="bg-accent-fill text-ink-on-accent hover:bg-accent-fill/90"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          {finished && lastQuestion && (
            <Button
              onClick={() => setShowResult(true)}
              className="bg-accent-fill text-ink-on-accent hover:bg-accent-fill/90">
              See the result
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
