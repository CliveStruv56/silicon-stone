import { ShieldCheck } from 'lucide-react'

/**
 * Money-back guarantee line shown near every purchase/early-access CTA on
 * product pages (§2.3). `future` phrasing is for products not yet launched
 * (sector reports).
 */
export function GuaranteeNote({
  future = false,
  className = '',
}: {
  future?: boolean
  className?: string
}) {
  return (
    <p className={`flex items-start gap-2 text-sm italic text-text-muted ${className}`}>
      <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-stone-teal" aria-hidden="true" />
      <span>
        {future ? 'When it launches: if' : 'If'} it doesn&rsquo;t earn its price, email within
        30 days for a full refund. No forms, no questions.
      </span>
    </p>
  )
}
