'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Header, Footer } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

// --- Types & Data ---

type RiskLevel = 'Unacceptable' | 'High' | 'Limited' | 'Minimal' | 'Uncertain'

interface Question {
    id: string
    text: string
    description?: string
    options: {
        label: string
        value: string
        nextStep?: string
        riskOutcome?: RiskLevel
    }[]
}

const QUESTIONS: Record<string, Question> = {
    start: {
        id: 'start',
        text: 'What is the primary function of your AI system?',
        description: 'Select the category that best describes the system\'s core purpose.',
        options: [
            { label: 'Social Scoring or Behavioral Manipulation', value: 'manipulation', riskOutcome: 'Unacceptable' },
            { label: 'Biometric Identification or Categorization', value: 'biometrics', nextStep: 'biometrics' },
            { label: 'Critical Infrastructure / Safety Components', value: 'safety', riskOutcome: 'High' },
            { label: 'Education, Employment, or Credit Scoring', value: 'scoring', riskOutcome: 'High' },
            { label: 'Law Enforcement or Migration Control', value: 'law', riskOutcome: 'High' },
            { label: 'Generative AI / Chatbot / Content Creation', value: 'genai', nextStep: 'genai' },
            { label: 'Internal Operations / Optimization (Non-Personal)', value: 'ops', riskOutcome: 'Minimal' },
        ],
    },
    biometrics: {
        id: 'biometrics',
        text: 'Is the biometric identification "Real-Time" and "Remote" in public spaces for law enforcement?',
        description: 'Specifically referring to scanning crowds in real-time to identify individuals.',
        options: [
            { label: 'Yes, Real-Time Remote Identification', value: 'realtime', riskOutcome: 'Unacceptable' },
            { label: 'No, it is post-processing or authentication only', value: 'post', riskOutcome: 'High' },
        ],
    },
    genai: {
        id: 'genai',
        text: 'Is the Generative AI system a "General Purpose AI Model" (GPAI) with systemic risks?',
        description: 'Does it have high impact capabilities (e.g., GPT-4 class) or effectively unlimited scope?',
        options: [
            { label: 'Yes, it is a high-impact GPAI model', value: 'gpai_systemic', riskOutcome: 'High' },
            { label: 'No, it is a standard chatbot / creative tool', value: 'standard_genai', riskOutcome: 'Limited' },
        ],
    },
}

const RISK_DETAILS: Record<RiskLevel, { color: string; title: string; desc: string; obligations: string[] }> = {
    Unacceptable: {
        color: 'text-alert-red',
        title: 'Unacceptable Risk (Prohibited)',
        desc: 'This AI practice is banned in the European Union due to fundamental rights violations.',
        obligations: ['Cease deployment immediately.', 'Legal penalties for non-compliance are severe.'],
    },
    High: {
        color: 'text-silicon-amber',
        title: 'High Risk',
        desc: 'Permitted but subject to strict compliance obligations before market entry.',
        obligations: [
            'Fundamental Rights Impact Assessment (FRIA).',
            'Data governance and technical documentation.',
            'Human oversight and accuracy requirements.',
            'Registration in EU database.',
        ],
    },
    Limited: {
        color: 'text-stone-teal',
        title: 'Limited Risk (Transparency)',
        desc: 'Subject to specific transparency obligations.',
        obligations: [
            'Disclose that content is AI-generated.',
            'Ensure users know they are interacting with a machine.',
            'Label deepfakes accordingly.',
        ],
    },
    Minimal: {
        color: 'text-text-muted',
        title: 'Minimal Risk',
        desc: 'No specific restrictions under the AI Act, though GDPR still applies.',
        obligations: ['Standard data protection compliance.', 'Voluntary codes of conduct encouraged.'],
    },
    Uncertain: {
        color: 'text-text-muted',
        title: 'Analysis Inconclusive',
        desc: 'The tool could not strictly categorize your system based on these inputs.',
        obligations: ['Consult a legal expert for a detailed assessment.'],
    },
}

// --- Component ---

export default function ComplianceCheckerPage() {
    const [currentStep, setCurrentStep] = useState<string>('start')
    const [history, setHistory] = useState<string[]>([])
    const [result, setResult] = useState<RiskLevel | null>(null)

    const handleOptionClick = (option: Question['options'][0]) => {
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
        setResult(null)
    }

    const handleBack = () => {
        if (history.length > 0) {
            const prev = history[history.length - 1]
            setHistory(history.slice(0, -1))
            setCurrentStep(prev)
        }
    }

    const currentQuestion = QUESTIONS[currentStep]
    const resultData = result ? RISK_DETAILS[result] : null

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1 bg-background">
                <section className="bg-slate-deep border-b border-border-subtle py-12 md:py-16">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
                        <Badge variant="outline" className="mb-4 border-stone-teal text-stone-teal">
                            Interactive Tool
                        </Badge>
                        <h1 className="text-3xl font-bold text-text-primary sm:text-4xl mb-4">
                            EU AI Act Compliance Checker
                        </h1>
                        <p className="text-lg text-text-muted max-w-2xl mx-auto">
                            Determine your AI system's risk tier under the European Union's AI Act regulations.
                            <br />
                            <span className="text-sm italic opacity-70">
                                (For informational purposes only; does not constitute legal advice.)
                            </span>
                        </p>
                    </div>
                </section>

                <section className="mx-auto max-w-3xl px-6 py-12">
                    <AnimatePresence mode="wait">
                        {!result ? (
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
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
                                                onClick={() => handleOptionClick(option)}
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
                            </motion.div>
                        ) : (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4 }}
                            >
                                <Card className="bg-stone-charcoal border-border-subtle shadow-2xl overflow-hidden">
                                    <div className={`h-2 w-full ${result === 'Unacceptable' ? 'bg-alert-red' :
                                            result === 'High' ? 'bg-silicon-amber' :
                                                result === 'Limited' ? 'bg-stone-teal' :
                                                    'bg-text-muted'
                                        }`} />
                                    <CardHeader className="text-center pb-2">
                                        <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-elevated border border-border-subtle">
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

                                        <div className="bg-surface-elevated rounded-lg p-6 text-left border border-border-subtle">
                                            <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4 border-b border-border-subtle pb-2">
                                                Key Obligations
                                            </h4>
                                            <ul className="space-y-3">
                                                {resultData?.obligations.map((item, i) => (
                                                    <li key={i} className="flex items-start gap-3 text-text-primary">
                                                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${resultData.color.replace('text-', 'bg-')}`} />
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                                            <Button onClick={handleReset} variant="outline" className="border-text-muted text-text-muted">
                                                Check Another System
                                            </Button>
                                            <Link href="/contact">
                                                <Button className="bg-silicon-amber text-slate-deep hover:bg-silicon-amber/90">
                                                    Get Full Assessment
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>
            </main>

            <Footer />
        </div>
    )
}
