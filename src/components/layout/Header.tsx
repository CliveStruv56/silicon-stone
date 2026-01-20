'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

const navigation = [
  {
    name: 'Analysis',
    href: '/analysis',
    children: [
      { name: 'Atlantic Drift', href: '/analysis/atlantic-drift' },
      { name: 'US Technopolitics', href: '/analysis/category/us-technopolitics' },
      { name: 'European Sovereignty', href: '/analysis/category/european-sovereignty' },
      { name: 'Asian Innovation', href: '/analysis/category/asian-innovation' },
      { name: 'AI Act & Compliance', href: '/analysis/ai-act' },
      { name: 'Semiconductor Supply Chains', href: '/analysis/semiconductors' },
      { name: 'Digital Sovereignty', href: '/analysis/digital-sovereignty' },
      { name: 'Edge Economy', href: '/analysis/edge-economy' },
    ],
  },
  {
    name: 'Tools',
    href: '/tools',
    children: [
      { name: 'Compliance Checker', href: '/tools/compliance-checker' },
      { name: 'Supply Chain Mapper', href: '/tools/supply-chain-mapper' },
      { name: 'Scenario Modeler', href: '/tools/scenario-modeler' },
    ],
  },
  {
    name: 'Methodology',
    href: '/methodology',
  },
  {
    name: 'About',
    href: '/about',
  },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-slate-deep/95 backdrop-blur supports-[backdrop-filter]:bg-slate-deep/80">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        {/* Logo */}
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="text-xl font-bold tracking-tight">
              <span className="text-silicon-amber">Silicon</span>
              <span className="text-text-muted"> & </span>
              <span className="text-stone-teal">Stone</span>
            </span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-text-muted"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Open main menu</span>
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </div>

        {/* Desktop navigation */}
        <div className="hidden lg:flex lg:gap-x-8">
          {navigation.map((item) => (
            <div key={item.name} className="relative group">
              <Link
                href={item.href}
                className="text-sm font-medium text-text-muted transition-colors hover:text-text-primary"
              >
                {item.name}
              </Link>
              {item.children && (
                <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="rounded-lg bg-stone-charcoal p-2 shadow-xl ring-1 ring-border-subtle">
                    {item.children.map((child) => (
                      <Link
                        key={child.name}
                        href={child.href}
                        className="block rounded-md px-3 py-2 text-sm text-text-muted transition-colors hover:bg-surface-elevated hover:text-text-primary whitespace-nowrap"
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Search & CTA */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-4 lg:items-center">
          <Link
            href="/search"
            className="text-text-muted hover:text-text-primary transition-colors"
            aria-label="Search"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </Link>
          <Button variant="default" className="bg-silicon-amber text-slate-deep hover:bg-silicon-amber/90">
            Subscribe
          </Button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div className="space-y-1 px-6 pb-4 pt-2">
            {navigation.map((item) => (
              <div key={item.name}>
                <Link
                  href={item.href}
                  className="block py-2 text-base font-medium text-text-muted hover:text-text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
                {item.children && (
                  <div className="ml-4 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.name}
                        href={child.href}
                        className="block py-1.5 text-sm text-text-muted hover:text-text-primary"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Link
              href="/search"
              className="block py-2 text-base font-medium text-text-muted hover:text-text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              Search
            </Link>
            <div className="pt-4">
              <Button variant="default" className="w-full bg-silicon-amber text-slate-deep hover:bg-silicon-amber/90">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
