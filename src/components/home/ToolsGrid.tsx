import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const tools = [
  {
    name: 'Compliance Checker',
    description: 'Determine if your AI system qualifies as High-Risk under the EU AI Act',
    href: '/tools/compliance-checker',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'text-silicon-amber',
  },
  {
    name: 'Supply Chain Mapper',
    description: 'Visualize semiconductor supply chain vulnerabilities and chokepoints',
    href: '/tools/supply-chain-mapper',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'text-stone-teal',
  },
  {
    name: 'Scenario Modeler',
    description: 'Compare strategic outcomes under different geopolitical futures',
    href: '/tools/scenario-modeler',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    color: 'text-silicon-amber',
  },
  {
    name: 'Policy Stress-Test',
    description: 'Test your strategy against regulatory and trade policy scenarios',
    href: '/tools/policy-stress-test',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    color: 'text-stone-teal',
  },
]

export function ToolsGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {tools.map((tool) => (
        <Link key={tool.name} href={tool.href}>
          <Card className="h-full bg-stone-charcoal border-border-subtle transition-colors hover:border-stone-teal/50 cursor-pointer">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base font-medium text-text-primary flex items-center gap-3">
                  <span className={tool.color}>{tool.icon}</span>
                  {tool.name}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-muted">{tool.description}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
