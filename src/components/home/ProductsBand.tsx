'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer'
import { ForensicCard } from '@/components/ui/ForensicCard'
import { Badge } from '@/components/ui/badge'
import { AMOUNTS, gbp } from '@/lib/offering'

type Product = {
  price: string
  label?: string
  title: string
  body: string
  flagship?: boolean
}

const products: Product[] = [
  {
    price: gbp(AMOUNTS.checklist),
    title: 'AI Audit Checklist Pack',
    body: 'A quick-start audit of your AI exposure, vendor dependencies and compliance gaps. The essential first step.',
  },
  {
    price: `From ${gbp(AMOUNTS.toolkitStandard)}`,
    label: 'Flagship',
    title: 'AI Act Compliance Toolkit',
    body: 'A structured governance toolkit: catalogue systems, classify risk, collect vendor evidence, plan against phased implementation.',
    flagship: true,
  },
  {
    price: `From ${gbp(AMOUNTS.sectorReport)}`,
    label: 'Coming soon',
    title: 'Sector Reports',
    body: 'Focused 15–20pp briefings on AI, regulatory and geopolitical risk for specific industries.',
  },
]

export function ProductsBand() {
  return (
    <section
      aria-labelledby="products-band-heading"
      className="border-b border-border-subtle bg-stone-charcoal/50"
    >
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-16">
        <StaggerContainer>
          <StaggerItem>
            <div className="max-w-2xl mb-8">
              <Badge
                variant="outline"
                className="mb-4 border-silicon-amber/60 text-silicon-amber-strong font-mono text-[12.5px] tracking-[0.10em] uppercase bg-silicon-amber/5"
              >
                Buy · self-serve products
              </Badge>
              <h2
                id="products-band-heading"
                className="font-bold text-text-primary mb-4"
                style={{ fontSize: 'clamp(32px, 4vw, 48px)', letterSpacing: '-0.02em', lineHeight: 1.1 }}
              >
                Take it further — practical products
              </h2>
              <p className="text-base text-text-muted leading-relaxed">
                Packaged digital deliverables you download and run yourself.
              </p>
            </div>
          </StaggerItem>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <StaggerItem key={product.title}>
                <Link href="/products" className="block h-full">
                  <ForensicCard
                    accent={product.flagship ? 'amber' : 'subtle'}
                    showMarkers={false}
                    gridHover={true}
                    delay={0}
                    className="h-full cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-mono text-sm font-semibold text-silicon-amber-strong">
                        {product.price}
                      </span>
                      {product.label && (
                        <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-text-muted">
                          · {product.label}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">
                      {product.title}
                    </h3>
                    <p className="text-sm text-text-muted leading-relaxed mb-4">
                      {product.body}
                    </p>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-silicon-amber-strong">
                      <span>See products</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </ForensicCard>
                </Link>
              </StaggerItem>
            ))}
          </div>
        </StaggerContainer>
      </div>
    </section>
  )
}
