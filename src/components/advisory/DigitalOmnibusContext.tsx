import Link from 'next/link'

export function DigitalOmnibusContext({ children }: { children: React.ReactNode }) {
  return (
    <aside className="mt-8 border-l-2 border-stone-teal pl-5">
      <h3 className="mb-2 font-semibold text-text-primary">The Digital Omnibus in context</h3>
      <p className="max-w-3xl text-sm leading-relaxed text-text-muted">{children}</p>
      <Link href="/digital-omnibus" className="mt-3 inline-block text-sm font-medium text-stone-teal underline underline-offset-4">
        Read the Digital Omnibus explanation and timeline
      </Link>
    </aside>
  )
}
