import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const WAYMARKPATH_URL =
    process.env.NEXT_PUBLIC_WAYMARKPATH_URL ?? 'https://waymarkpath.vercel.app'

// WaymarkPath is adjacent to the Read → Use → Buy → Engage ladder, not a rung on it.
// This is a deliberately lighter "Related" card, not a peer offering section.
export function AdjacentBlock() {
    return (
        <section
            aria-label="Related companion"
            className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16"
        >
            <div className="rounded-[10px] border border-dashed border-sister-indigo/30 bg-stone-charcoal/20 px-6 py-5 md:px-8 md:py-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                <div className="flex-1 min-w-0">
                    <span className="block font-mono text-[10px] tracking-[0.12em] uppercase text-sister-indigo mb-2">
                        Related — a separate companion
                    </span>
                    <h3 className="text-base md:text-lg font-semibold text-text-primary">
                        WaymarkPath
                    </h3>
                    <p className="mt-1 text-sm text-text-muted leading-relaxed max-w-2xl">
                        The career-transition companion for the individual professional
                        navigating the same shifts. Free to start.
                    </p>
                </div>

                <div className="flex-shrink-0">
                    <Link
                        href={WAYMARKPATH_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-2 px-4 py-2 rounded-md border border-sister-indigo/40 text-sister-indigo hover:bg-sister-indigo/10 transition-colors text-sm font-medium"
                    >
                        See WaymarkPath
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>
            </div>
        </section>
    )
}
