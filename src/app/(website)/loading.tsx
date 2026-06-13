/**
 * Streaming fallback for the public site — a quiet, brand-dark skeleton shown
 * while a route's server fetches (e.g. the multi-query /intelligence hub)
 * resolve. Pages render their own Header/Footer, so this is a full-page shell.
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-deep px-6 py-10">
      <div className="mx-auto max-w-7xl animate-pulse">
        {/* Header bar placeholder */}
        <div className="mb-8 flex items-center justify-between">
          <div className="h-6 w-40 rounded bg-stone-charcoal" />
          <div className="hidden gap-4 lg:flex">
            <div className="h-4 w-24 rounded bg-stone-charcoal" />
            <div className="h-4 w-16 rounded bg-stone-charcoal" />
            <div className="h-4 w-20 rounded bg-stone-charcoal" />
            <div className="h-4 w-20 rounded bg-stone-charcoal" />
          </div>
        </div>

        {/* Title block */}
        <div className="mb-10 space-y-4">
          <div className="h-4 w-32 rounded bg-stone-charcoal" />
          <div className="h-9 w-2/3 max-w-xl rounded bg-stone-charcoal" />
          <div className="h-4 w-1/2 max-w-md rounded bg-stone-charcoal" />
        </div>

        {/* Card grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="space-y-3 rounded-lg border border-border-subtle bg-stone-charcoal/60 p-5"
            >
              <div className="h-3 w-20 rounded bg-surface-elevated" />
              <div className="h-5 w-full rounded bg-surface-elevated" />
              <div className="h-5 w-3/4 rounded bg-surface-elevated" />
              <div className="h-3 w-1/2 rounded bg-surface-elevated" />
            </div>
          ))}
        </div>

        <span className="sr-only">Loading…</span>
      </div>
    </div>
  )
}
