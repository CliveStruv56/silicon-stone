// "Three Readings of Every Briefing" explainer — relocated off the homepage
// (the Read → Use → Buy → Engage spine does the primary explaining there).
// This panel explains how to read a single briefing; it lives in the
// Intelligence area and on the Methodology page.

type Reading = {
  name: string
  lens: string
  body: string
  accent: string
}

const readings: Reading[] = [
  {
    name: 'Institutional',
    lens: 'For your organisation',
    body: 'What the shift puts on your desk: the obligations, exposures and decisions it creates for the institution you answer to.',
    accent: 'text-stone-teal',
  },
  {
    name: 'Political',
    lens: 'For the balance of power',
    body: 'How it moves the contest between states, blocs and incumbents — the structural rebalancing beneath the headline.',
    accent: 'text-silicon-amber',
  },
  {
    name: 'Positional',
    lens: 'For your own position',
    body: 'Where it leaves you: your role, your skills and the durable bets worth making in a redrawn labour market.',
    accent: 'text-sister-indigo',
  },
]

export function ThreeReadings({ className = '' }: { className?: string }) {
  return (
    <section aria-labelledby="three-readings-heading" className={className}>
      <div className="max-w-3xl mb-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted mb-3">
          How to read our work
        </p>
        <h2
          id="three-readings-heading"
          className="text-2xl font-semibold text-text-primary mb-3"
        >
          Three Readings of Every Briefing
        </h2>
        <p className="text-text-muted leading-relaxed">
          We read every briefing three ways — for your institution, for the balance of
          power, and for your own position — so you can act on the reading that matters
          to you.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {readings.map((reading) => (
          <div
            key={reading.name}
            className="rounded-lg border border-border-subtle bg-stone-charcoal p-6"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.10em] text-text-muted mb-2">
              {reading.lens}
            </p>
            <h3 className={`text-lg font-semibold mb-2 ${reading.accent}`}>
              {reading.name} reading
            </h3>
            <p className="text-sm text-text-muted leading-relaxed">{reading.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
