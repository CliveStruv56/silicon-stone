import Link from 'next/link'

const footerNavigation = {
  analysis: [
    { name: 'Atlantic Drift', href: '/analysis/atlantic-drift' },
    { name: 'AI Act & Compliance', href: '/analysis/ai-act' },
    { name: 'Semiconductors', href: '/analysis/semiconductors' },
    { name: 'Digital Sovereignty', href: '/analysis/digital-sovereignty' },
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
    { name: 'Contact', href: '/contact' },
  ],
  legal: [
    { name: 'Privacy', href: '/privacy' },
    { name: 'Terms', href: '/terms' },
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
        <div className="mt-12 border-t border-border-subtle pt-8">
          <p className="text-xs text-text-muted">
            &copy; {new Date().getFullYear()} Silicon and Stone. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
