'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

type NavChild = { name: string; href: string; note?: string }

type NavItem = {
  name: string
  href: string
  children?: NavChild[]
}

// Primary navigation reads the commitment ladder left → right: free → paid.
// Read (Intelligence) → Use (Tools) → Buy (Products) → Engage (Advisory).
const primaryNavigation: NavItem[] = [
  {
    name: 'Intelligence',
    href: '/intelligence',
  },
  {
    name: 'Tools',
    href: '/tools',
    children: [
      { name: 'Compliance Checker', href: '/tools/compliance-checker' },
      { name: 'Supply Chain Mapper', href: '/tools/supply-chain-mapper' },
      { name: 'Scenario Modeler', href: '/tools/scenario-modeler' },
      { name: 'Policy Stress-Test', href: '/tools/policy-stress-test' },
    ],
  },
  {
    name: 'Products',
    href: '/products',
    children: [
      { name: 'AI Audit Checklist Pack', href: '/products/ai-audit-checklist' },
      { name: 'AI Act Compliance Toolkit', href: '/products/ai-act-toolkit' },
      { name: 'Sector Reports', href: '/products/sector-reports', note: 'Coming soon' },
    ],
  },
  {
    name: 'Advisory',
    href: '/advisory',
  },
]

// Credibility pages — kept, but visually secondary (a lighter right-hand pair).
const secondaryNavigation: NavItem[] = [
  { name: 'Methodology', href: '/methodology' },
  { name: 'About', href: '/about' },
]

const mobileNavigation: NavItem[] = [...primaryNavigation, ...secondaryNavigation]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const matchesHref = (href: string) => {
    const path = href.split('?')[0]
    if (path === '/') return pathname === '/'
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  const isActive = (item: NavItem) => {
    if (matchesHref(item.href)) return true
    return item.children?.some((child) => matchesHref(child.href)) ?? false
  }

  const renderDesktopItem = (item: NavItem, secondary = false) => (
    <div key={item.name} className="relative group">
      <Link
        href={item.href}
        aria-current={isActive(item) ? 'page' : undefined}
        className={`font-ui-mono transition-colors hover:text-text-primary ${
          isActive(item)
            ? 'text-silicon-cyan'
            : secondary
              ? 'text-text-muted/70'
              : 'text-text-muted'
        }`}
      >
        {item.name}
      </Link>
      {item.children && item.children.length > 0 && (
        <div className="absolute left-0 top-full pt-0 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-opacity duration-150">
          <div className="pt-2">
            <div className="rounded-lg bg-stone-charcoal p-2 shadow-xl ring-1 ring-border-subtle">
              {item.children.map((child) => (
                <Link
                  key={child.name}
                  href={child.href}
                  className="block rounded-md px-3 py-2 text-sm text-text-muted transition-colors hover:bg-surface-elevated hover:text-text-primary whitespace-nowrap"
                >
                  {child.name}
                  {child.note && (
                    <span className="ml-2 font-mono text-[12px] uppercase tracking-[0.08em] text-text-muted/60">
                      {child.note}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-subtle glass-plate noise-overlay">
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
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">{mobileMenuOpen ? 'Close main menu' : 'Open main menu'}</span>
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
        <div className="hidden lg:flex lg:items-center lg:gap-x-6">
          {primaryNavigation.map((item) => renderDesktopItem(item))}
          <span aria-hidden="true" className="h-4 w-px bg-border-subtle" />
          {secondaryNavigation.map((item) => renderDesktopItem(item, true))}
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
          <ThemeToggle />
          <Link href="/#subscribe">
            <Button variant="default" className="bg-primary text-primary-foreground hover:opacity-90">
              Subscribe
            </Button>
          </Link>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div id="mobile-menu" className="lg:hidden">
          <div className="space-y-1 px-6 pb-4 pt-2">
            {mobileNavigation.map((item: NavItem) => (
              <div key={item.name}>
                <Link
                  href={item.href}
                  aria-current={isActive(item) ? 'page' : undefined}
                  className={`block py-2 text-base font-medium hover:text-text-primary ${
                    isActive(item) ? 'text-silicon-cyan' : 'text-text-muted'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
                {item.children && item.children.length > 0 && (
                  <div className="ml-4 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.name}
                        href={child.href}
                        className="block py-1.5 text-sm text-text-muted hover:text-text-primary"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {child.name}
                        {child.note && (
                          <span className="ml-2 font-mono text-[12px] uppercase tracking-[0.08em] text-text-muted/60">
                            {child.note}
                          </span>
                        )}
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
            <div className="flex items-center gap-3 pt-4">
              <Link href="/#subscribe" onClick={() => setMobileMenuOpen(false)} className="flex-1">
                <Button variant="default" className="w-full bg-primary text-primary-foreground hover:opacity-90">
                  Subscribe
                </Button>
              </Link>
              <ThemeToggle className="shrink-0" />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
