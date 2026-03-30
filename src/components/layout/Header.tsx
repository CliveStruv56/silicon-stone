'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

type Category = {
  _id: string
  title: string
  slug: string
}

type NavItem = {
  name: string
  href: string
  highlight?: boolean
  children?: { name: string; href: string }[]
}

const staticNavigation = [
  {
    name: 'Briefings',
    href: '/briefings',
    highlight: true,  // Mark as primary
    children: [
      { name: 'All Intelligence', href: '/briefings' },
      { name: 'For Compliance', href: '/briefings?persona=clara' },
      { name: 'For Operations', href: '/briefings?persona=ian' },
      { name: 'For Policy', href: '/briefings?persona=sofia' },
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
    name: 'Products',
    href: '/products',
    children: [
      { name: 'AI Act Compliance Toolkit', href: '/products/ai-act-toolkit' },
      { name: 'AI Audit Checklist Pack', href: '/products/ai-audit-checklist' },
      { name: 'Sector Briefings', href: '/products/briefings' },
    ],
  },
  {
    name: 'Methodology',
    href: '/methodology',
  },
  {
    name: 'Services',
    href: '/services',
  },
  {
    name: 'About',
    href: '/about',
  },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  // Fetch categories on mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories')
        if (res.ok) {
          const data = await res.json()
          setCategories(data)
        }
      } catch (e) {
        console.error('Failed to fetch categories', e)
      }
    }
    fetchCategories()
  }, [])

  // Fallback categories when Sanity has none
  const fallbackCategories = [
    { name: 'All Analysis', href: '/analysis' },
  ]

  // Build navigation with dynamic Analysis dropdown
  const analysisNav = {
    name: 'Analysis',
    href: '/analysis',
    children: categories.length > 0
      ? categories.map(cat => ({
        name: cat.title,
        href: `/analysis/category/${cat.slug}`
      }))
      : fallbackCategories
  }

  const navigation = [analysisNav, ...staticNavigation]

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
          {navigation.map((item: NavItem) => (
            <div key={item.name} className="relative group">
              <Link
                href={item.href}
                className={`font-ui-mono transition-colors hover:text-text-primary ${
                  item.highlight
                    ? 'text-silicon-cyan'
                    : 'text-text-muted'
                }`}
              >
                {item.name}
              </Link>
              {item.children && item.children.length > 0 && (
                <div className="absolute left-0 top-full pt-0 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150">
                  <div className="pt-2">
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
          <Link href="/#subscribe">
            <Button variant="default" className="bg-silicon-amber text-slate-deep hover:bg-silicon-amber/90">
              Subscribe
            </Button>
          </Link>
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
              <Link href="/#subscribe" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="default" className="w-full bg-silicon-amber text-slate-deep hover:bg-silicon-amber/90">
                  Subscribe
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
