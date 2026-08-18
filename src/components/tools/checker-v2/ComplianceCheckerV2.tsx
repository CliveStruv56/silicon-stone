'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, RefreshCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { QuestionCard } from './QuestionCard'
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
import { classify } from '@/lib/compliance-v2/engine/classify'
import { evaluateTerritorialScope } from '@/lib/compliance-v2/engine/scope'
import { evaluateLegalRoles } from '@/lib/compliance-v2/engine/roles'
import { evaluateOrganisationSize } from '@/lib/compliance-v2/engine/organisation-size'
import { evaluateArticle50, routesOwedBy } from '@/lib/compliance-v2/engine/article-50'
import { checkerVersionStamp } from '@/lib/checker-version'

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

const ROLE_LABEL: Record<string, string> = {
  provider: 'Provider',
  deployer: 'Deployer',
  importer: 'Importer',
  distributor: 'Distributor',
  product_manufacturer: 'Product manufacturer',
  authorised_representative: 'Authorised representative',
}

const APPLICABILITY_LABEL: Record<string, string> = {
  applies: 'applies',
  likely_applies: 'likely applies',
  possibly_applies: 'possibly applies',
  does_not_apply: 'does not apply',
  cannot_determine: 'cannot be determined',
}

const CLASSIFICATION_LABEL: Record<string, string> = {
  potentially_prohibited: 'Potentially prohibited',
  likely_high_risk: 'Likely high-risk',
  possible_high_risk: 'Possible high-risk',
  specific_transparency_duties: 'Specific transparency duties',
  no_specific_category_identified: 'No specific category identified',
  out_of_scope: 'Outside EU AI Act scope',
  insufficient_information: 'Insufficient information',
}

export function ComplianceCheckerV2({ exitHref }: { exitHref: string }) {
  const [flow, setFlow] = useState<FlowState>(EMPTY_FLOW)
  const [showResult, setShowResult] = useState(false)

  const question = currentQuestion(flow)
  const sections = flowSections(flow)
  const progress = flowProgress(flow)
  const warnings = dataEntryWarnings(flow)
  const finished = isFinished(flow)

  const onAnswer = (answer: AssessmentAnswerV2) => {
    if (!question) return
    setFlow((state) => applyAnswer(state, question.id, answer))
  }

  const result = useMemo(() => {
    if (!showResult) return null
    const scope = evaluateTerritorialScope(flow.answers)
    const transparency = evaluateArticle50(flow.answers)
    const roles = evaluateLegalRoles(flow.answers)
    const held = roles
      .filter((role) => role.applicability === 'applies' || role.applicability === 'likely_applies')
      .map((role) => role.role)
    return {
      classification: classify(flow.answers, scope),
      scope,
      roles,
      size: evaluateOrganisationSize(flow.answers),
      transparency: routesOwedBy(transparency, held),
      stamp: checkerVersionStamp(),
    }
  }, [flow.answers, showResult])

  if (showResult && result) {
    return (
      <div className="space-y-6">
        <BetaNotice exitHref={exitHref} />

        <Card className="bg-stone-charcoal border-border-subtle">
          <CardHeader>
            <Badge variant="outline" className="w-fit border-border-subtle text-text-muted text-xs">
              {result.classification.confidence} confidence — from rule completeness, never a score
            </Badge>
            <CardTitle className="mt-3 text-3xl text-text-primary">
              {CLASSIFICATION_LABEL[result.classification.classification]}
            </CardTitle>
            <CardDescription className="mt-3 text-base">
              {result.classification.explanation}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Panel title="Statutory route">
              {result.classification.statutoryRoutes.length ? (
                <ul className="flex flex-wrap gap-2">
                  {result.classification.statutoryRoutes.map((route) => (
                    <li key={route}>
                      <Badge variant="outline" className="border-stone-teal text-stone-teal font-mono text-xs">
                        {route}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-text-muted">
                  No route is cited, because none applies. A high-risk result without one would be a
                  defect, not a judgement call.
                </p>
              )}
            </Panel>

            <Panel title="Territorial scope">
              <p className="text-sm text-text-primary">{result.scope.explanation}</p>
            </Panel>

            <Panel title="Your role">
              <ul className="space-y-2">
                {result.roles.map((role) => (
                  <li key={role.role} className="text-sm">
                    <span className="font-semibold text-text-primary">{ROLE_LABEL[role.role]}</span>{' '}
                    <span className="text-text-muted">
                      — {APPLICABILITY_LABEL[role.applicability]}
                    </span>
                    <p className="mt-1 text-text-primary">{role.explanation}</p>
                  </li>
                ))}
                {result.roles.length === 0 && (
                  <li className="text-sm text-text-muted">No role could be established.</li>
                )}
              </ul>
            </Panel>

            {/*
              Not "your supplier's duties" — the honest heading is that these
              fall on a party whose role you do not hold, which may be the
              supplier and may be someone else in the chain. §7.7 forbids
              relabelling them as yours; it does not license guessing whose
              they are.
            */}
            {result.transparency.supplierSide.length > 0 && (
              <Panel title="Duties that fall on another party">
                <ul className="space-y-2">
                  {result.transparency.supplierSide.map((route) => (
                    <li key={route.id} className="text-sm text-text-primary">
                      <span className="font-mono text-xs text-stone-teal">{route.provision}</span> —{' '}
                      {route.duty}
                    </li>
                  ))}
                </ul>
              </Panel>
            )}

            <Panel title="Organisation size">
              <p className="text-sm text-text-primary">{result.size.summary}</p>
            </Panel>

            {result.classification.missingAnswerIds.length > 0 && (
              <Panel title="What we did not establish">
                <ul className="space-y-1">
                  {result.classification.missingAnswerIds.map((id) => (
                    <li key={id} className="font-mono text-xs text-text-muted">
                      {id}
                    </li>
                  ))}
                </ul>
              </Panel>
            )}

            <p className="rounded-lg border border-border-subtle bg-surface-elevated p-4 text-xs text-text-muted">
              <strong className="text-text-primary">This is a preview of the v2 engine.</strong> The
              finished result — typed findings, embedded legal explanations, and the suppression
              rules that keep irrelevant material off the page — is the next phase of work. What is
              above is the classification and the provisions behind it, nothing more.
              <br />
              <span className="font-mono">
                checker {result.stamp.checkerVersion} · catalogue{' '}
                {result.stamp.questionCatalogueVersion} · rule pack {result.stamp.rulepackVersion}
              </span>
            </p>
          </CardContent>
        </Card>

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

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
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
