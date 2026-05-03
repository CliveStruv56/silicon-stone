import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const WAYMARKPATH_URL =
    process.env.NEXT_PUBLIC_WAYMARKPATH_URL ?? 'https://waymarkpath.vercel.app'

export function AdjacentBlock() {
    return (
        <section
            aria-label="Sister product cross-link"
            className="mx-auto max-w-7xl px-6 pb-16 lg:px-8 lg:pb-24"
        >
            <div
                className="rounded-[10px] px-6 py-6 md:px-8 md:py-7 flex flex-col md:flex-row md:items-center gap-5 md:gap-8"
                style={{
                    border: '1px dashed rgba(99, 102, 241, 0.4)',
                    background:
                        'linear-gradient(to right, rgba(99, 102, 241, 0.06), rgba(232, 154, 60, 0.03))',
                }}
            >
                <div className="flex-shrink-0">
                    <span className="inline-block font-mono text-[11px] tracking-[0.10em] uppercase text-sister-indigo border border-sister-indigo/40 rounded px-2.5 py-1">
                        Sister product
                    </span>
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm md:text-base text-text-primary leading-relaxed">
                        <span className="font-semibold text-sister-indigo">WaymarkPath</span>
                        {' — the AI-powered career transition platform for senior leaders navigating the same shifts these briefings analyse.'}
                    </p>
                    <p className="mt-2 text-xs md:text-sm italic text-text-muted leading-relaxed">
                        A separate platform, in its own register. Free to start. No newsletter — that&apos;s what Silicon &amp; Stone is for.
                    </p>
                </div>

                <div className="flex-shrink-0">
                    <Link
                        href={WAYMARKPATH_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-2 px-4 py-2 rounded-md border border-sister-indigo/50 text-sister-indigo hover:bg-sister-indigo/10 transition-colors text-sm font-medium"
                    >
                        See WaymarkPath
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>
            </div>
        </section>
    )
}
