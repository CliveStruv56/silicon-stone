import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/* Preview art is shared with `ToolsGallery` on the home page — same 1600px WebP
 * renders, same intrinsic ratio, so the two listings stay visually consistent
 * and the browser cache is shared between them. The aspect ratio is applied to
 * the frame rather than the image so the row reserves its height before the
 * WebP lands and nothing shifts underneath it. */
const PREVIEW_RATIO = 3168 / 1344

const tools = [
  {
    name: 'Supply Chain Mapper',
    description: 'Visualise semiconductor supply-chain vulnerabilities and chokepoints',
    href: '/tools/supply-chain-mapper',
    preview: '/tools/supply-chain-mapper-preview.webp',
    previewAlt:
      'Isometric illustration: supply routes from a mine, a chemical plant and a container port converge on a single mountain pass marked with a red warning symbol, then continue to a semiconductor fabrication plant.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'text-stone-teal',
  },
  {
    name: 'Compliance Checker',
    description: 'Create a first-pass AI system record, identify likely obligations, and capture missing vendor evidence',
    href: '/tools/compliance-checker',
    preview: '/tools/compliance-checker-preview.webp',
    previewAlt:
      'Isometric illustration: circuit traces run from a server rack out to four graded tiers — red and flagged with a warning symbol, amber, teal, then unlit grey — echoing the EU AI Act risk classes from prohibited down to minimal.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'text-silicon-amber-strong',
  },
  {
    name: 'Scenario Modeler',
    description: 'Compare strategic outcomes under different geopolitical futures',
    href: '/tools/scenario-modeler',
    preview: '/tools/scenario-modeler-preview.webp',
    previewAlt:
      'Isometric illustration: three coloured paths leave one office tower for three different futures — a fractured red plateau under a warning symbol, a cracked sandstone block, and intact teal ground carrying a smaller building.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    color: 'text-silicon-amber-strong',
  },
  {
    name: 'Policy Stress-Test',
    description: 'Test your strategy against regulatory and trade policy scenarios',
    href: '/tools/policy-stress-test',
    preview: '/tools/policy-stress-test-preview.webp',
    previewAlt:
      'Isometric illustration: the US Capitol and a European institutional building sit on opposite sides of a deep rift, their green policy routes reaching the edge and stopping at red warning symbols rather than meeting.',
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
          <Card className="card-interactive h-full bg-stone-charcoal border-border-subtle hover:border-stone-teal/50 cursor-pointer">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base font-medium text-text-primary flex items-center gap-3">
                  <span className={tool.color}>{tool.icon}</span>
                  {tool.name}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div
                className="relative mb-4 overflow-hidden rounded-md border border-border-subtle/50 bg-slate-deep/50"
                style={{ aspectRatio: PREVIEW_RATIO }}
              >
                <Image
                  src={tool.preview}
                  alt={tool.previewAlt}
                  fill
                  sizes="(min-width: 1280px) 552px, (min-width: 640px) 46vw, 92vw"
                  className="object-cover"
                />
              </div>
              <p className="text-sm text-text-muted">{tool.description}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
