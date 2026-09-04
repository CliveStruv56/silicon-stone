import Link from 'next/link'
import { Linkedin } from 'lucide-react'

import { ENGAGEMENTS } from '@/lib/offering'

// TODO(owner): replace with company/founder LinkedIn URL (via
// NEXT_PUBLIC_LINKEDIN_URL or this fallback).
const LINKEDIN_URL = process.env.NEXT_PUBLIC_LINKEDIN_URL || 'https://www.linkedin.com/'

const footerNavigation = {
  intelligence: [
    { name: 'All intelligence', href: '/intelligence' },
    { name: 'Series', href: '/intelligence/series' },
    { name: 'Atlantic Drift', href: '/analysis/category/atlantic-drift' },
    { name: 'AI Act & Compliance', href: '/analysis/category/ai-act' },
    { name: 'Semiconductors', href: '/analysis/category/semiconductors' },
  ],
  engage: [
    { name: 'Tools', href: '/tools' },
    { name: 'Products', href: '/products' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Glossary', href: '/glossary' },
    { name: 'Methodology', href: '/methodology' },
    { name: 'About', href: '/about' },
  ],
  /**
   * The engagements, read from the catalogue rather than retyped.
   *
   * They got their own pages on 2026-09-04 and the footer did not follow, which
   * left them reachable only from the hub and the header dropdown. Mapping
   * `ENGAGEMENTS` stops that recurring: a renamed route or a new engagement
   * arrives here on its own, and `engagement-pages.test.ts` already asserts
   * every `href` in that array resolves to a real page and reaches the sitemap.
   *
   * **Only the ones with a page of their own.** `board-level` points at
   * `/advisory#contact`, and a footer link that jumps to a form on another page
   * is not a destination — it reads as a fifth product and delivers a scroll
   * position. The rule is the filter, so if Board-level ever gets a page it
   * appears here without anyone remembering to add it. Retyping the list would
   * have duplicated the Post-Omnibus Briefing, which is in the catalogue and was
   * also hard-coded here — caught by looking at the rendered footer, not by the
   * suite.
   */
  advisory: [
    { name: 'Advisory', href: '/advisory' },
    ...ENGAGEMENTS.filter((engagement) => !engagement.href.includes('#')).map((engagement) => ({
      name: engagement.name,
      href: engagement.href,
    })),
    // Not an engagement — the free guide that feeds them.
    { name: 'US Executive’s Guide', href: '/us-executive-guide' },
  ],
  company: [
    { name: 'Contact', href: '/advisory#contact' },
    { name: 'Privacy', href: '/privacy' },
    { name: 'Terms', href: '/terms' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-footer-bg">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="inline-block">
              <span className="text-xl font-bold tracking-tight">
                <span className="text-silicon-amber-strong">Silicon</span>
                <span className="text-text-muted"> & </span>
                <span className="text-stone-teal">Stone</span>
              </span>
            </Link>
            <p className="text-sm text-text-muted max-w-xs">
              Forensic Technopolitics for the senior leaders defining the AI power shift.
              Published from Sanday, Orkney.
            </p>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Silicon and Stone on LinkedIn"
              className="inline-flex text-text-muted hover:text-stone-teal transition-colors"
            >
              <Linkedin className="h-5 w-5" />
            </a>
          </div>

          {/* Intelligence */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Intelligence</h3>
            <ul className="mt-4 space-y-2">
              {footerNavigation.intelligence.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-text-muted hover:text-stone-teal transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Engage */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Engage</h3>
            <ul className="mt-4 space-y-2">
              {footerNavigation.engage.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-text-muted hover:text-stone-teal transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Advisory */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Advisory</h3>
            <ul className="mt-4 space-y-2">
              {footerNavigation.advisory.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-text-muted hover:text-stone-teal transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Company</h3>
            <ul className="mt-4 space-y-2">
              {footerNavigation.company.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-text-muted hover:text-stone-teal transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
              <li>
                {/* Internal explainer, not the external app — see the
                    2026-08-06 CHANGELOG entry in the homepage-redesign
                    context folder. */}
                <Link
                  href="/waymarkpath"
                  className="text-sm text-sister-indigo hover:text-sister-indigo/80 transition-colors"
                >
                  WaymarkPath
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t border-border-subtle pt-8">
          <p className="text-xs text-text-muted leading-relaxed max-w-3xl mb-6">
            What we publish is analysis, not instruction. We aim to inform; the decisions are yours. The publication is not responsible for outcomes.
          </p>
          <p className="text-xs text-text-muted">
            &copy; {new Date().getFullYear()} Silicon and Stone. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
