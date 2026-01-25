'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Header, Footer } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  QUESTIONS,
  RISK_DETAILS,
  KEY_DEADLINE,
  type RiskLevel,
  type Question
} from '@/lib/compliance-data'
import { AlertTriangle, CheckCircle2, Clock, FileText, ChevronRight, RotateCcw } from 'lucide-react'

export default function ComplianceCheckerPage() {
  const [currentStep, setCurrentStep] = useState<string>('start')
  const [history, setHistory] = useState<string[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<RiskLevel | null>(null)

  const handleOptionClick = (option: Question['options'][0], questionId: string) => {
    const newAnswers = { ...answers, [questionId]: option.label }
    setAnswers(newAnswers)

    if (option.riskOutcome) {
      setResult(option.riskOutcome)
    } else if (option.nextStep) {
      setHistory([...history, currentStep])
      setCurrentStep(option.nextStep)
    }
  }

  const handleReset = () => {
    setCurrentStep('start')
    setHistory([])
    setAnswers({})
    setResult(null)
  }

  const handleBack = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1]
      setHistory(history.slice(0, -1))
      setCurrentStep(prev)
      // Remove the last answer
      const questionIds = Object.keys(answers)
      if (questionIds.length > 0) {
        const newAnswers = { ...answers }
        delete newAnswers[questionIds[questionIds.length - 1]]
        setAnswers(newAnswers)
      }
    }
  }

  const currentQuestion = QUESTIONS[currentStep]
  const resultData = result ? RISK_DETAILS[result] : null

  // Calculate days until key deadline
  const deadlineDate = new Date('2026-08-02')
  const today = new Date()
  const daysUntil = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-background">
        {/* Hero Section */}
        <section className="bg-slate-deep border-b border-border-subtle py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
            <Badge variant="outline" className="mb-4 border-stone-teal text-stone-teal">
              Interactive Tool
            </Badge>
            <h1 className="text-3xl font-bold text-text-primary sm:text-4xl mb-4">
              EU AI Act Compliance Checker
            </h1>
            <p className="text-lg text-text-muted max-w-2xl mx-auto mb-6">
              Determine your AI system's risk tier under the European Union's AI Act regulations with industry-specific guidance.
            </p>

            {/* Deadline Countdown */}
            <div className="inline-flex items-center gap-3 bg-silicon-amber/10 border border-silicon-amber/30 rounded-lg px-4 py-2">
              <Clock className="w-5 h-5 text-silicon-amber" />
              <span className="text-silicon-amber font-medium">
                {daysUntil} days until {KEY_DEADLINE.label}
              </span>
            </div>

            <p className="text-sm italic text-text-muted mt-4 opacity-70">
              For informational purposes only; does not constitute legal advice.
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className="mx-auto max-w-4xl px-6 py-12">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Progress Indicator */}
                {history.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 text-sm text-text-muted mb-2">
                      {history.map((_, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-stone-teal" />
                          {idx < history.length - 1 && <ChevronRight className="w-3 h-3" />}
                        </div>
                      ))}
                      <ChevronRight className="w-3 h-3" />
                      <div className="w-2 h-2 rounded-full bg-silicon-amber animate-pulse" />
                    </div>
                  </div>
                )}

                <Card className="bg-stone-charcoal border-border-subtle shadow-xl">
                  <CardHeader>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-mono text-stone-teal uppercase">
                        Step {history.length + 1}
                      </span>
                      {history.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleBack}
                          className="text-text-muted hover:text-text-primary h-auto p-0"
                        >
                          &larr; Back
                        </Button>
                      )}
                    </div>
                    <CardTitle className="text-xl text-text-primary leading-tight">
                      {currentQuestion.text}
                    </CardTitle>
                    {currentQuestion.description && (
                      <CardDescription className="text-text-muted text-base">
                        {currentQuestion.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {currentQuestion.options.map((option, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        className="w-full justify-start text-left h-auto py-4 px-6 border-border-subtle hover:bg-surface-elevated hover:border-silicon-amber/50 hover:text-silicon-amber group transition-all"
                        onClick={() => handleOptionClick(option, currentQuestion.id)}
                      >
                        <span className="flex items-center w-full">
                          <span className="flex-1 text-base font-medium">{option.label}</span>
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                            &rarr;
                          </span>
                        </span>
                      </Button>
                    ))}
                  </CardContent>
                </Card>

                {/* Answer Summary */}
                {Object.keys(answers).length > 0 && (
                  <div className="mt-6 p-4 bg-surface-elevated rounded-lg border border-border-subtle">
                    <h4 className="text-xs font-mono text-stone-teal uppercase mb-3">Your Selections</h4>
                    <div className="space-y-2">
                      {Object.entries(answers).map(([, answer], idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-text-muted">
                          <CheckCircle2 className="w-4 h-4 text-stone-teal flex-shrink-0" />
                          <span>{answer}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                {/* Result Header Card */}
                <Card className="bg-stone-charcoal border-border-subtle shadow-2xl overflow-hidden">
                  <div className={`h-2 w-full ${resultData?.bgColor}`} />
                  <CardHeader className="text-center pb-2">
                    <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-elevated border border-border-subtle mx-auto">
                      <span className="text-3xl">
                        {result === 'Unacceptable' ? '🚫' :
                          result === 'High' ? '⚠️' :
                            result === 'Limited' ? '👁️' : '✅'}
                      </span>
                    </div>
                    <CardTitle className={`text-3xl font-bold ${resultData?.color} mb-2`}>
                      {resultData?.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center space-y-6">
                    <p className="text-lg text-text-primary font-medium">
                      {resultData?.desc}
                    </p>

                    {/* Key Deadlines */}
                    {resultData?.deadlines && resultData.deadlines.length > 0 && (
                      <div className="bg-surface-elevated rounded-lg p-4 border border-border-subtle text-left">
                        <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Key Deadlines
                        </h4>
                        <div className="space-y-2">
                          {resultData.deadlines.map((deadline, i) => (
                            <div key={i} className="flex items-start gap-3">
                              <span className={`font-mono text-sm ${resultData.color} font-medium min-w-[120px]`}>
                                {deadline.date}
                              </span>
                              <span className="text-text-primary text-sm">{deadline.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Key Obligations */}
                    <div className="bg-surface-elevated rounded-lg p-6 text-left border border-border-subtle">
                      <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4 border-b border-border-subtle pb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Key Obligations
                      </h4>
                      <ul className="space-y-3">
                        {resultData?.obligations.map((item, i) => (
                          <li key={i} className="flex items-start gap-3 text-text-primary">
                            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${resultData.bgColor}`} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Compliance Checklist */}
                {resultData?.checklist && resultData.checklist.length > 0 && (
                  <Card className="bg-stone-charcoal border-border-subtle">
                    <CardHeader>
                      <CardTitle className="text-lg text-text-primary flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-stone-teal" />
                        Compliance Checklist
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-6 md:grid-cols-2">
                        {resultData.checklist.map((section, i) => (
                          <div key={i} className="bg-surface-elevated rounded-lg p-4 border border-border-subtle">
                            <h5 className="text-sm font-semibold text-stone-teal uppercase tracking-wider mb-3">
                              {section.category}
                            </h5>
                            <ul className="space-y-2">
                              {section.items.map((item, j) => (
                                <li key={j} className="flex items-start gap-2 text-sm text-text-muted">
                                  <div className="w-4 h-4 rounded border border-border-subtle flex-shrink-0 mt-0.5" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Next Steps */}
                {resultData?.nextSteps && resultData.nextSteps.length > 0 && (
                  <Card className="bg-stone-charcoal border-border-subtle">
                    <CardHeader>
                      <CardTitle className="text-lg text-text-primary flex items-center gap-2">
                        <FileText className="w-5 h-5 text-silicon-amber" />
                        Recommended Next Steps
                      </CardTitle>
                      <CardDescription>
                        Documentation estimate: {resultData.documentationEstimate}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {resultData.nextSteps.map((step, i) => (
                          <div
                            key={i}
                            className={`flex items-start gap-4 p-3 rounded-lg border ${
                              step.priority === 'immediate'
                                ? 'bg-alert-red/5 border-alert-red/20'
                                : step.priority === '30-days'
                                  ? 'bg-silicon-amber/5 border-silicon-amber/20'
                                  : 'bg-stone-teal/5 border-stone-teal/20'
                            }`}
                          >
                            <Badge
                              variant="outline"
                              className={`flex-shrink-0 text-xs ${
                                step.priority === 'immediate'
                                  ? 'border-alert-red text-alert-red'
                                  : step.priority === '30-days'
                                    ? 'border-silicon-amber text-silicon-amber'
                                    : 'border-stone-teal text-stone-teal'
                              }`}
                            >
                              {step.priority === 'immediate' ? 'Immediate' : step.priority === '30-days' ? '30 Days' : '90 Days'}
                            </Badge>
                            <span className="text-text-primary text-sm">{step.action}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Assessment Summary */}
                <Card className="bg-surface-elevated border-border-subtle">
                  <CardHeader>
                    <CardTitle className="text-sm text-text-muted uppercase tracking-wider">
                      Your Assessment Path
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {Object.values(answers).map((answer, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {answer}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="border-text-muted text-text-muted"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Check Another System
                  </Button>
                  <Link href="/services#contact">
                    <Button className="bg-silicon-amber text-slate-deep hover:bg-silicon-amber/90 w-full sm:w-auto">
                      Get Full Assessment
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      <Footer />
    </div>
  )
}
