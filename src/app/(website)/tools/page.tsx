import type { Metadata } from 'next'
import { Header, Footer } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { ToolsGrid } from '@/components/home/ToolsGrid'

export const metadata: Metadata = {
    title: 'Interactive Tools | Silicon and Stone',
    description: 'Forensic analysis tools for navigating the AI Act, supply chain vulnerabilities, and geopolitical scenarios.',
    alternates: { canonical: '/tools' },
}

export default function ToolsPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1">
                <section className="bg-slate-deep border-b border-border-subtle">
                    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
                        <div className="max-w-3xl">
                            <Badge variant="outline" className="mb-4 border-silicon-amber text-silicon-amber">
                                Interactive Analysis
                            </Badge>
                            <h1 className="text-4xl font-bold text-text-primary sm:text-5xl mb-6">
                                Forensic Tools
                            </h1>
                            <p className="text-xl text-text-muted leading-relaxed">
                                Move beyond static analysis. Use our interactive models to stress-test your
                                assumptions against the realities of regulation, geography, and drift.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
                    <ToolsGrid />
                </section>
            </main>

            <Footer />
        </div>
    )
}
