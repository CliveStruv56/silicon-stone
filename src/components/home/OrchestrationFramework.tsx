'use client'

import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer'
import { ForensicCard } from '@/components/ui/ForensicCard'
import { Badge } from '@/components/ui/badge'
import {
  Lock,
  ShieldAlert,
  TrendingDown,
  ServerCrash,
  UserX,
  Layers,
  ShieldCheck,
  Globe,
  GitBranch,
  Crown,
} from 'lucide-react'

const dependentItems = [
  { icon: Lock, text: 'Locked to one vendor\u2019s AI stack\u2014their roadmap dictates your capabilities' },
  { icon: ShieldAlert, text: 'No visibility into how models are trained, updated, or deprecated' },
  { icon: ServerCrash, text: 'Single point of failure when the provider changes terms or pricing' },
  { icon: TrendingDown, text: 'Skills plateau at \u201Cprompt user\u201D\u2014no structural career advantage' },
  { icon: UserX, text: 'Replaceable by anyone with the same subscription' },
]

const orchestratorItems = [
  { icon: Layers, text: 'Route tasks across multiple models\u2014own the decision layer, not the model' },
  { icon: ShieldCheck, text: 'Evaluate, audit, and switch providers without operational disruption' },
  { icon: Globe, text: 'Ensure data sovereignty and compliance by design, not by accident' },
  { icon: GitBranch, text: 'Build institutional AI capability that compounds over time' },
  { icon: Crown, text: 'Position yourself as the leader who architects AI strategy, not just uses it' },
]

export function OrchestrationFramework() {
  return (
    <section aria-labelledby="orchestration-heading" className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
      <StaggerContainer>
        <StaggerItem>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge variant="outline" className="mb-4 border-stone-teal text-stone-teal font-mono text-xs">
              Career Insurance
            </Badge>
            <h2 id="orchestration-heading" className="text-3xl lg:text-4xl font-bold text-text-primary mb-4">
              Move Beyond Being an AI User.{' '}
              <span className="text-silicon-amber">Become an AI Architect.</span>
            </h2>
            <p className="text-lg text-text-muted leading-relaxed">
              Mastering the orchestration layer is a strategic executive skill, not a
              technical coding task. It&apos;s the difference between managing AI and
              being managed by it&mdash;and it&apos;s the key to securing your next
              leadership position.
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
              <p className="text-sm text-text-muted mb-5 italic">
                &ldquo;I use the tools my company provides.&rdquo;
              </p>
              <ul className="space-y-4">
                {dependentItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.text} className="flex items-start gap-3">
                      <Icon className="w-5 h-5 text-alert-red flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-text-muted">{item.text}</span>
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
                <h3 className="text-lg font-semibold text-text-primary">Model Orchestrator</h3>
              </div>
              <p className="text-sm text-text-muted mb-5 italic">
                &ldquo;I architect how AI serves our strategic objectives.&rdquo;
              </p>
              <ul className="space-y-4">
                {orchestratorItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.text} className="flex items-start gap-3">
                      <Icon className="w-5 h-5 text-stone-teal flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-text-muted">{item.text}</span>
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
