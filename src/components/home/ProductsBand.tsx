'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer'
import { ForensicCard } from '@/components/ui/ForensicCard'
import { Badge } from '@/components/ui/badge'
import { PRODUCTS } from '@/lib/offering'

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
                Practical tools for your team, with a live implementation review included in Toolkit Professional.
              </p>
            </div>
          </StaggerItem>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {PRODUCTS.map((product) => (
              <StaggerItem key={product.id}>
                <Link href={product.href} className="block h-full">
                  <ForensicCard
                    accent={product.id === 'ai-act-toolkit' ? 'amber' : 'subtle'}
                    showMarkers={false}
                    gridHover={true}
                    delay={0}
                    className="h-full cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-mono text-sm font-semibold text-silicon-amber-strong">
                        {product.priceTiers ? `From ${product.price}` : product.price}
                      </span>
                      {product.status && (
                        <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-text-muted">
                          · {product.status}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">
                      {product.name}
                    </h3>
                    <p className="text-sm text-text-muted leading-relaxed mb-4">
                      {product.summary}
                    </p>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-silicon-amber-strong">
                      <span>View product</span>
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
