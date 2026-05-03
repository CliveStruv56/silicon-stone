import Link from 'next/link'

const WAYMARKPATH_URL =
  process.env.NEXT_PUBLIC_WAYMARKPATH_URL ?? 'https://waymarkpath.vercel.app'

const footerNavigation = {
  analysis: [
    { name: 'Atlantic Drift', href: '/analysis/category/atlantic-drift' },
    { name: 'AI Act & Compliance', href: '/analysis/category/ai-act' },
    { name: 'Semiconductors', href: '/analysis/category/semiconductors' },
    { name: 'Digital Sovereignty', href: '/analysis/category/digital-sovereignty' },
  ],
  methodology: [
    { name: 'Supply Chain Forensics', href: '/methodology#supply-chain' },
    { name: 'Policy Stress-Testing', href: '/methodology#stress-testing' },
    { name: 'Scenario Modeling', href: '/methodology#scenarios' },
    { name: 'Signal Filtering', href: '/methodology#signals' },
  ],
  company: [
    { name: 'About', href: '/about' },
    { name: 'Why the Edge', href: '/about#edge' },
    { name: 'The Long View', href: '/about#long-view' },
    { name: 'Services', href: '/services' },
  ],
  legal: [
    { name: 'Contact', href: '/services#contact' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-slate-deep">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <span className="text-xl font-bold tracking-tight">
                <span className="text-silicon-amber">Silicon</span>
                <span className="text-text-muted"> & </span>
                <span className="text-stone-teal">Stone</span>
              </span>
            </Link>
            <p className="text-sm text-text-muted max-w-xs">
              Forensic Technopolitics from the edge. Cutting through complexity with 30 years of experience.
            </p>
            <p className="text-xs text-text-muted">
              Analysis for decision-makers navigating the AI Act, semiconductor supply chains, and digital sovereignty.
            </p>
          </div>

          {/* Navigation */}
          <div className="mt-12 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">Analysis</h3>
                <ul className="mt-4 space-y-3">
                  {footerNavigation.analysis.map((item) => (
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
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold text-text-primary">Methodology</h3>
                <ul className="mt-4 space-y-3">
                  {footerNavigation.methodology.map((item) => (
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
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">Company</h3>
                <ul className="mt-4 space-y-3">
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
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold text-text-primary">Legal</h3>
                <ul className="mt-4 space-y-3">
                  {footerNavigation.legal.map((item) => (
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
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t border-border-subtle pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-xs text-text-muted">
            &copy; {new Date().getFullYear()} Silicon and Stone. All rights reserved.
          </p>
          <Link
            href={WAYMARKPATH_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-[0.10em] text-sister-indigo border border-sister-indigo/40 hover:bg-sister-indigo/10 transition-colors px-3 py-1.5 rounded"
          >
            WaymarkPath
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </footer>
  )
}
