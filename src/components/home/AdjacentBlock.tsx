import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

// WaymarkPath is adjacent to the Read → Use → Buy → Engage ladder, not a rung on it.
// This is a deliberately lighter "Related" card, not a peer offering section.
//
// Points at the internal /waymarkpath page rather than the external app
// (NEXT_PUBLIC_WAYMARKPATH_URL, which the footer still uses): the page explains
// the companion and carries the early-access capture, so it is the right first
// stop from the home page. It became the home page's only route to /waymarkpath
// when the persona compass's Positional strip was removed.
export function AdjacentBlock() {
    return (
        <section
            aria-label="Related companion"
            className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12"
        >
            <div className="rounded-[10px] border border-dashed border-sister-indigo/30 bg-stone-charcoal/20 px-6 py-5 md:px-8 md:py-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                <div className="flex-1 min-w-0">
                    <span className="block font-mono text-[12px] tracking-[0.12em] uppercase text-sister-indigo mb-2">
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
                        href="/waymarkpath"
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
