import Link from 'next/link'

const WAYMARKPATH_URL =
  process.env.NEXT_PUBLIC_WAYMARKPATH_URL ?? 'https://waymarkpath.vercel.app'

const footerNavigation = {
  intelligence: [
    { name: 'All intelligence', href: '/intelligence' },
    { name: 'Atlantic Drift', href: '/analysis/category/atlantic-drift' },
    { name: 'AI Act & Compliance', href: '/analysis/category/ai-act' },
    { name: 'Semiconductors', href: '/analysis/category/semiconductors' },
  ],
  engage: [
    { name: 'Tools', href: '/tools' },
    { name: 'Products', href: '/products' },
    { name: 'Advisory', href: '/advisory' },
    { name: 'Methodology', href: '/methodology' },
    { name: 'About', href: '/about' },
  ],
  company: [
    { name: 'Contact', href: '/advisory#contact' },
    { name: 'Privacy', href: '/privacy' },
    { name: 'Terms', href: '/terms' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-slate-deep">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="inline-block">
              <span className="text-xl font-bold tracking-tight">
                <span className="text-silicon-amber">Silicon</span>
                <span className="text-text-muted"> & </span>
                <span className="text-stone-teal">Stone</span>
              </span>
            </Link>
            <p className="text-sm text-text-muted max-w-xs">
              Forensic Technopolitics for the senior leaders defining the AI power shift.
              Published from Sanday, Orkney.
            </p>
          </div>

          {/* Intelligence */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Intelligence</h3>
            <ul className="mt-4 space-y-3">
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
            <ul className="mt-4 space-y-3">
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

          {/* Related + Company */}
          <div>
            <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-sister-indigo">
              Related
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href={WAYMARKPATH_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-sister-indigo hover:text-sister-indigo/80 transition-colors"
                >
                  WaymarkPath
                </Link>
              </li>
            </ul>

            <h3 className="mt-8 text-sm font-semibold text-text-primary">Company</h3>
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
