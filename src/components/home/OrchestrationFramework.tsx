'use client'

import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer'
import { ForensicCard } from '@/components/ui/ForensicCard'
import { Badge } from '@/components/ui/badge'
import {
  Lock,
  ShieldAlert,
  Eye,
  ServerCrash,
  FileWarning,
  Layers,
  ShieldCheck,
  Globe,
  GitBranch,
  Scale,
} from 'lucide-react'

const dependentItems = [
  { icon: Lock, text: 'Locked to a single vendor\'s API and pricing model' },
  { icon: ShieldAlert, text: 'Training data jurisdiction unknown or non-EU' },
  { icon: ServerCrash, text: 'No fallback when the primary service degrades' },
  { icon: Eye, text: 'Compliance gaps invisible until external audit' },
  { icon: FileWarning, text: 'Vendor\'s roadmap dictates your capabilities' },
]

const orchestratorItems = [
  { icon: Layers, text: 'Multi-model routing with automatic fallback' },
  { icon: Globe, text: 'Data residency and sovereignty by design' },
  { icon: ShieldCheck, text: 'Continuous compliance monitoring across models' },
  { icon: GitBranch, text: 'Vendor-agnostic architecture, zero lock-in' },
  { icon: Scale, text: 'Full audit trail for every AI decision path' },
]

export function OrchestrationFramework() {
  return (
    <section aria-labelledby="orchestration-heading" className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
      <StaggerContainer>
        <StaggerItem>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge variant="outline" className="mb-4 border-stone-teal text-stone-teal font-mono text-xs">
              The Orchestration Layer
            </Badge>
            <h2 id="orchestration-heading" className="text-3xl lg:text-4xl font-bold text-text-primary mb-4">
              From AI User to AI Architect
            </h2>
            <p className="text-lg text-text-muted leading-relaxed">
              European resilience is not built at the model layer. It&apos;s built at the
              Orchestration Layer&mdash;where you manage multiple models to ensure digital
              sovereignty and zero vendor lock-in.
            </p>
          </div>
        </StaggerItem>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StaggerItem>
            <ForensicCard accent="red" showMarkers={true} gridHover={false} className="h-full">
              <div className="flex items-center gap-3 mb-6">
                <Badge className="bg-alert-red/20 text-alert-red border-alert-red/30">
                  High Risk
                </Badge>
                <h3 className="text-lg font-semibold text-text-primary">Model Dependent</h3>
              </div>
              <ul className="space-y-4">
                {dependentItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.text} className="flex items-start gap-3">
                      <Icon className="w-5 h-5 text-alert-red flex-shrink-0 mt-0.5" />
                      <span className="text-text-muted">{item.text}</span>
                    </li>
                  )
                })}
              </ul>
            </ForensicCard>
          </StaggerItem>

          <StaggerItem>
            <ForensicCard accent="teal" showMarkers={true} gridHover={false} className="h-full">
              <div className="flex items-center gap-3 mb-6">
                <Badge className="bg-stone-teal/20 text-stone-teal border-stone-teal/30">
                  High Resilience
                </Badge>
                <h3 className="text-lg font-semibold text-text-primary">Sovereign Orchestrator</h3>
              </div>
              <ul className="space-y-4">
                {orchestratorItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.text} className="flex items-start gap-3">
                      <Icon className="w-5 h-5 text-stone-teal flex-shrink-0 mt-0.5" />
                      <span className="text-text-muted">{item.text}</span>
                    </li>
                  )
                })}
              </ul>
            </ForensicCard>
          </StaggerItem>
        </div>
      </StaggerContainer>
    </section>
  )
}
