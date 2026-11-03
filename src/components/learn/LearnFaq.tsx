import { JsonLd } from '@/components/seo/JsonLd'
import { buildFaqSchema } from '@/lib/seo'

/**
 * Questions and answers as native <details>, which are keyboard-operable and
 * readable with scripts off, plus FAQPage structured data built from the same
 * array, so the markup cannot say something the page does not.
 */
export function LearnFaq({ items }: { items: ReadonlyArray<{ q: string; a: string }> }) {
  return (
    <>
      <JsonLd data={buildFaqSchema(items)} />
      <div className="divide-y divide-border-subtle rounded-xl border border-border-subtle bg-stone-charcoal">
        {items.map((item) => (
          <details key={item.q} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-teal">
              {item.q}
              <span aria-hidden className="font-mono text-stone-teal transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-text-muted">{item.a}</p>
          </details>
        ))}
      </div>
    </>
  )
}
