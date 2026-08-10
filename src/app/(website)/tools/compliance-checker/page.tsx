'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Gauge,
  LockKeyhole,
  RefreshCcw,
  ShieldCheck,
} from 'lucide-react'
import { Header, Footer } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  assessmentQuestions,
  type AssessmentAnswers,
  type AssessmentQuestion,
  type AssessmentValue,
  evaluateAssessment,
  getVisibleQuestions,
} from '@/lib/ai-act-assessment'
import { CopyMarkdownButton } from '@/components/tools/CopyMarkdownButton'
import { ToolSubscribeCard } from '@/components/tools/ToolSubscribeCard'
import { complianceCheckerMarkdown } from '@/lib/tools-markdown'

function values(value: AssessmentValue | undefined): string[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function resultTone(classification: string) {
  if (classification === 'Prohibited practice') {
    return {
      border: 'border-alert-red/40',
      bg: 'bg-alert-red/10',
      text: 'text-alert-red',
      badge: 'border-alert-red text-alert-red',
    }
  }

  // Future-dated prohibition reads amber, not red: it is a dated hard stop to
  // plan against, not a practice to halt today.
  if (classification === 'Likely high-risk' || classification === 'Uncertain' || classification === 'Prohibited from 2 December 2026') {
    return {
      border: 'border-silicon-amber/40',
      bg: 'bg-silicon-amber/10',
      text: 'text-silicon-amber',
      badge: 'border-silicon-amber text-silicon-amber',
    }
  }

  if (classification === 'Out of EU scope') {
    return {
      border: 'border-text-muted/40',
      bg: 'bg-text-muted/10',
      text: 'text-text-primary',
      badge: 'border-text-muted text-text-muted',
    }
  }

  return {
    border: 'border-stone-teal/40',
    bg: 'bg-stone-teal/10',
    text: 'text-stone-teal',
    badge: 'border-stone-teal text-stone-teal',
  }
}

function optionIsSelected(question: AssessmentQuestion, answers: AssessmentAnswers, value: string) {
  return values(answers[question.id]).includes(value)
}

export default function ComplianceCheckerPage() {
  const [answers, setAnswers] = useState<AssessmentAnswers>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showResult, setShowResult] = useState(false)

  const visibleQuestions = useMemo(() => getVisibleQuestions(answers), [answers])
  const currentQuestion = visibleQuestions[currentIndex] ?? visibleQuestions[visibleQuestions.length - 1]
  const result = useMemo(() => evaluateAssessment(answers), [answers])
  const tone = resultTone(result.classification)
  const progress = Math.round(((currentIndex + 1) / visibleQuestions.length) * 100)
  const currentValue = currentQuestion ? answers[currentQuestion.id] : undefined
  const canContinue = !currentQuestion?.required || values(currentValue).length > 0

  const setAnswer = (question: AssessmentQuestion, value: AssessmentValue) => {
    setAnswers((prev) => ({ ...prev, [question.id]: value }))
  }

  const toggleMulti = (question: AssessmentQuestion, value: string) => {
    const previous = values(answers[question.id])
    const next = previous.includes(value)
      ? previous.filter((item) => item !== value)
      : [...previous, value]

    const cleaned = value === 'none' || value === 'not-sure'
      ? [value]
      : next.filter((item) => item !== 'none' && item !== 'not-sure')

    setAnswer(question, cleaned)
  }

  const goNext = () => {
    if (!canContinue) return
    if (currentIndex >= visibleQuestions.length - 1) {
      setShowResult(true)
      return
    }
    setCurrentIndex((index) => Math.min(index + 1, visibleQuestions.length - 1))
  }

  const goBack = () => {
    if (showResult) {
      setShowResult(false)
      return
    }
    setCurrentIndex((index) => Math.max(index - 1, 0))
  }

  const reset = () => {
    setAnswers({})
    setCurrentIndex(0)
    setShowResult(false)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-background">
        <section className="bg-slate-deep border-b border-border-subtle py-10 md:py-10">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="max-w-4xl">
              <Badge variant="outline" className="mb-4 border-stone-teal text-stone-teal">
                AI Act Risk & Readiness
              </Badge>
              <h1 className="text-3xl font-bold text-text-primary sm:text-4xl mb-4">
                Create a first-pass AI system record
              </h1>
              <p className="text-lg text-text-muted max-w-3xl">
                Classify a third-party AI tool or product use case, identify likely obligations,
                capture missing vendor evidence, and set review triggers for ongoing governance.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ['Classification', 'Likely AI Act risk tier with confidence'],
                  ['Vendor evidence', 'Questions to ask before relying on the tool'],
                  ['Ongoing review', 'Triggers for reassessment after launch'],
                ].map(([title, copy]) => (
                  <div key={title} className="border border-border-subtle bg-stone-charcoal/60 rounded-lg p-4">
                    <div className="text-sm font-semibold text-text-primary">{title}</div>
                    <div className="text-xs text-text-muted mt-1">{copy}</div>
                  </div>
                ))}
              </div>
              <p className="text-sm italic text-text-muted mt-5 opacity-80">
                Informational triage only; not formal legal advice.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-10">
          {!showResult && currentQuestion ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.22 }}
                className="grid gap-6 lg:grid-cols-[240px_1fr]"
              >
                <aside className="space-y-4">
                  <Card className="bg-stone-charcoal border-border-subtle">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between text-xs text-text-muted mb-2">
                        <span>Assessment progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-surface-elevated overflow-hidden">
                        <div
                          className="h-full bg-stone-teal transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="mt-4 text-xs font-mono uppercase text-stone-teal">
                        {currentQuestion.section}
                      </div>
                      <div className="text-sm text-text-muted mt-1">
                        Step {currentIndex + 1} of {visibleQuestions.length}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-surface-elevated border-border-subtle">
                    <CardContent className="pt-6 space-y-3 text-sm text-text-muted">
                      <div className="flex gap-2">
                        <ClipboardCheck className="w-4 h-4 text-stone-teal mt-0.5 flex-shrink-0" />
                        <span>Your answers form a reusable AI system record.</span>
                      </div>
                      <div className="flex gap-2">
                        <Gauge className="w-4 h-4 text-silicon-amber mt-0.5 flex-shrink-0" />
                        <span>The result uses rule-based triage, not a model guess.</span>
                      </div>
                    </CardContent>
                  </Card>
                </aside>

                <Card className="bg-stone-charcoal border-border-subtle shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-2xl text-text-primary leading-tight">
                      {currentQuestion.text}
                    </CardTitle>
                    {currentQuestion.help && (
                      <CardDescription className="text-text-muted text-base">
                        {currentQuestion.help}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {currentQuestion.type === 'text' && (
                      <Input
                        value={typeof currentValue === 'string' ? currentValue : ''}
                        onChange={(event) => setAnswer(currentQuestion, event.target.value)}
                        placeholder={currentQuestion.placeholder}
                        className="h-12 border-border-subtle bg-slate-deep text-text-primary"
                      />
                    )}

                    {currentQuestion.type === 'single' && (
                      <div className="grid gap-3">
                        {currentQuestion.options?.map((option) => {
                          const selected = optionIsSelected(currentQuestion, answers, option.value)
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setAnswer(currentQuestion, option.value)}
                              className={`text-left rounded-lg border p-4 transition-all ${
                                selected
                                  ? 'border-silicon-amber bg-silicon-amber/10'
                                  : 'border-border-subtle bg-surface-elevated hover:border-stone-teal/70'
                              }`}
                            >
                              <span className="flex items-start gap-3">
                                <span className={`mt-1 h-4 w-4 rounded-full border flex-shrink-0 ${
                                  selected ? 'border-silicon-amber bg-silicon-amber' : 'border-text-muted'
                                }`} />
                                <span>
                                  <span className="block font-medium text-text-primary">{option.label}</span>
                                  {option.description && (
                                    <span className="block text-sm text-text-muted mt-1">{option.description}</span>
                                  )}
                                </span>
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {currentQuestion.type === 'multi' && (
                      <div className="grid gap-3">
                        {currentQuestion.options?.map((option, index) => {
                          const selected = optionIsSelected(currentQuestion, answers, option.value)
                          const previousGroup = currentQuestion.options?.[index - 1]?.group
                          const showGroupHeading = Boolean(option.group) && option.group !== previousGroup
                          return (
                            <div key={option.value}>
                              {showGroupHeading && (
                                <div className="mb-2 mt-2 text-xs font-mono uppercase tracking-wider text-text-muted">
                                  {option.group}
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => toggleMulti(currentQuestion, option.value)}
                                className={`w-full text-left rounded-lg border p-4 transition-all ${
                                  selected
                                    ? 'border-stone-teal bg-stone-teal/10'
                                    : 'border-border-subtle bg-surface-elevated hover:border-stone-teal/70'
                                }`}
                              >
                                <span className="flex items-start gap-3">
                                  <span className={`mt-1 h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 ${
                                    selected ? 'border-stone-teal bg-stone-teal' : 'border-text-muted'
                                  }`}>
                                    {selected && <CheckCircle2 className="w-3 h-3 text-ink-on-accent" />}
                                  </span>
                                  <span className="min-w-0">
                                    <span className="block font-medium text-text-primary">{option.label}</span>
                                    {option.badge && (
                                      <span className="mt-2 inline-block rounded border border-silicon-amber px-2 py-0.5 text-xs font-medium text-silicon-amber">
                                        {option.badge}
                                      </span>
                                    )}
                                    {option.description && (
                                      <span className="mt-2 block text-sm text-text-muted">{option.description}</span>
                                    )}
                                  </span>
                                </span>
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={goBack}
                        disabled={currentIndex === 0}
                        className="text-text-muted hover:text-text-primary"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                      </Button>
                      <Button
                        type="button"
                        onClick={goNext}
                        disabled={!canContinue}
                        className="bg-silicon-amber text-ink-on-accent hover:bg-silicon-amber/90"
                      >
                        {currentIndex >= visibleQuestions.length - 1 ? 'Generate result' : 'Continue'}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <Card className={`bg-stone-charcoal ${tone.border} shadow-2xl overflow-hidden`}>
                <div className={`h-2 ${tone.bg}`} />
                <CardHeader>
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <Badge variant="outline" className={tone.badge}>
                        {result.confidence} confidence
                      </Badge>
                      <CardTitle className={`mt-4 text-3xl ${tone.text}`}>
                        {result.classification}
                      </CardTitle>
                      <CardDescription className="mt-3 text-base text-text-muted max-w-3xl">
                        {result.summary}
                      </CardDescription>
                    </div>
                    <div className="rounded-lg border border-border-subtle bg-surface-elevated p-4 min-w-[180px]">
                      <div className="text-xs uppercase tracking-wider text-text-muted">Likely role</div>
                      <div className="text-xl font-semibold text-text-primary mt-1">{result.role}</div>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <div className="grid gap-6 lg:grid-cols-2">
                <ResultCard
                  icon={<ShieldCheck className="w-5 h-5 text-stone-teal" />}
                  title="Why this result"
                  items={result.reasons}
                />
                <ResultCard
                  icon={<AlertTriangle className="w-5 h-5 text-silicon-amber" />}
                  title="Missing evidence"
                  items={result.missingFacts.length ? result.missingFacts : ['No critical missing facts were identified from this answer set.']}
                />
                <ResultCard
                  icon={<ClipboardCheck className="w-5 h-5 text-stone-teal" />}
                  title="Immediate obligations"
                  items={result.obligations}
                />
                <ResultCard
                  icon={<FileText className="w-5 h-5 text-silicon-amber" />}
                  title="Vendor questions"
                  items={result.vendorQuestions.length ? result.vendorQuestions : ['Keep current vendor evidence on file and refresh it when the system changes.']}
                />
              </div>

              <Card className="bg-stone-charcoal border-border-subtle">
                <CardHeader>
                  <CardTitle className="text-lg text-text-primary">Adjacent GDPR and vendor-risk signals</CardTitle>
                  <CardDescription>
                    These do not automatically change the AI Act classification, but they indicate where human consulting may be valuable.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {result.adjacentRisks.length ? (
                    <ul className="grid gap-3 md:grid-cols-2">
                      {result.adjacentRisks.map((risk) => (
                        <li key={risk} className="rounded-lg border border-border-subtle bg-surface-elevated p-4 text-sm text-text-primary">
                          {risk}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-text-muted">No adjacent GDPR or vendor-risk flags were triggered by these answers.</p>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <Card className="bg-stone-charcoal border-border-subtle">
                  <CardHeader>
                    <CardTitle className="text-lg text-text-primary">Ongoing review triggers</CardTitle>
                    <CardDescription>
                      Use these triggers to keep the assessment useful after AI Act implementation dates pass.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {result.reviewTriggers.map((trigger) => (
                        <li key={trigger} className="flex items-start gap-3 text-text-primary">
                          <RefreshCcw className="w-4 h-4 text-stone-teal mt-1 flex-shrink-0" />
                          <span>{trigger}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-surface-elevated border-silicon-amber/30">
                  <CardHeader>
                    <div className="flex items-center gap-2 text-silicon-amber">
                      <LockKeyhole className="w-5 h-5" />
                      <CardTitle className="text-lg">Full report module</CardTitle>
                    </div>
                    <CardDescription>
                      The paid self-serve report should expand this assessment into an exportable evidence pack.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {result.reportSections.map((section) => (
                        <li key={section} className="flex items-start gap-2 text-sm text-text-primary">
                          <CheckCircle2 className="w-4 h-4 text-stone-teal mt-0.5 flex-shrink-0" />
                          <span>{section}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href="/products/ai-act-toolkit">
                      <Button className="w-full bg-silicon-amber text-ink-on-accent hover:bg-silicon-amber/90">
                        View compliance toolkit
                      </Button>
                    </Link>
                    <p className="text-xs text-text-muted text-center">
                      Need it interpreted for your business?{' '}
                      <Link href="/eu-exposure" className="text-silicon-amber hover:underline">
                        See the Post-Omnibus Briefing
                      </Link>
                      , or a standing read via the{' '}
                      <Link href="/advisory#retainer" className="text-silicon-amber hover:underline">
                        Drift Retainer
                      </Link>
                      .
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-stone-charcoal border-border-subtle">
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-wider text-text-muted">
                    Source basis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 md:grid-cols-2">
                    {result.sourceReferences.map((source) => (
                      <a
                        key={source.url}
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-stone-teal hover:text-silicon-amber"
                      >
                        {source.label}
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-stone-charcoal border-border-subtle">
                <CardHeader>
                  <CardTitle className="text-lg text-text-primary">Rules fired</CardTitle>
                  <CardDescription>
                    These versioned rules are the evidence trail behind the result and paid report.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {result.firedRules.map((rule) => (
                      <div key={rule.id} className="rounded-lg border border-border-subtle bg-surface-elevated p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="text-sm font-semibold text-text-primary">{rule.title}</div>
                            <div className="mt-1 text-xs font-mono text-text-muted">{rule.id} · v{rule.version}</div>
                          </div>
                          <Badge variant="outline" className="w-fit border-stone-teal text-stone-teal">
                            {rule.source.article}
                          </Badge>
                        </div>
                        <p className="mt-3 text-sm text-text-muted">{rule.explanation}</p>
                        {rule.evidence.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {rule.evidence.map((item) => (
                              <Badge key={item} variant="outline" className="text-xs border-border-subtle text-text-muted">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
                <Button
                  variant="outline"
                  onClick={goBack}
                  className="border-text-muted text-text-muted"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Edit answers
                </Button>
                <Button
                  variant="outline"
                  onClick={reset}
                  className="border-stone-teal text-stone-teal"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Assess another system
                </Button>
                <CopyMarkdownButton
                  toolName="Compliance Checker"
                  filename={`ai-act-assessment-${new Date().toISOString().slice(0, 10)}.md`}
                  getMarkdown={() => complianceCheckerMarkdown(result, answers, assessmentQuestions)}
                />
              </div>

              <ToolSubscribeCard tool="compliance-checker" />
            </motion.div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}

function ResultCard({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode
  title: string
  items: string[]
}) {
  return (
    <Card className="bg-stone-charcoal border-border-subtle">
      <CardHeader>
        <CardTitle className="text-lg text-text-primary flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm text-text-primary">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-stone-teal flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
