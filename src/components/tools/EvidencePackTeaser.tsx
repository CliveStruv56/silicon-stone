import Link from 'next/link'
import { Lock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EVIDENCE_PACK_ENABLED } from '@/lib/flags'
import { AMOUNTS, DERIVED, gbp } from '@/lib/offering'

/**
 * The paid Evidence Pack — components 4–11 of the report.
 *
 * Dark by default and rendered by nothing until `NEXT_PUBLIC_EVIDENCE_PACK_ENABLED`
 * is set, because the £39 credit against the £79 toolkit needs single-use codes
 * scoped to a SKU, and there is no store to issue them from yet. This is the
 * seam, not the product: enabling the flag surfaces the offer but checkout and
 * code issuance still have to be built.
 *
 * The credit is stated here rather than after payment on purpose — it materially
 * changes the buying decision, and hiding it until the receipt wastes its whole
 * effect.
 */

const COMPONENTS = [
  'Annex III classification rationale, including the full Article 6(3) analysis',
  'Decision impact analysis',
  'Human oversight review against Articles 14 and 26',
  'Vendor due diligence questionnaire, article-anchored and sendable as-is',
  'Adjacent GDPR and vendor-risk addendum',
  'AI system record aligned to the 18-column register schema',
  'Evidence register',
  '30/60/90-day action plan',
]

export function EvidencePackTeaser() {
  if (!EVIDENCE_PACK_ENABLED) return null

  return (
    <Card className="bg-surface-elevated border-silicon-amber/30">
      <CardHeader>
        <div className="flex items-center gap-2 text-silicon-amber-strong">
          <Lock className="h-5 w-5" />
          <CardTitle className="text-lg">The full Evidence Pack — {gbp(AMOUNTS.evidencePack)}</CardTitle>
        </div>
        <CardDescription>
          Eight further components: the operational artefacts that go in a compliance file, bespoke
          to this system rather than generic templates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="grid gap-2 sm:grid-cols-2">
          {COMPONENTS.map((component) => (
            <li key={component} className="text-sm text-text-muted">
              {component}
            </li>
          ))}
        </ul>
        <p className="rounded-lg border border-silicon-amber/40 bg-silicon-amber/10 p-4 text-sm text-text-primary">
          <span className="font-semibold">The {gbp(AMOUNTS.evidencePack)} comes back.</span> Buy the Evidence Pack and its
          full value applies against the{' '}
          <Link href="/products/ai-act-toolkit" className="text-silicon-amber-strong hover:underline">
            {gbp(AMOUNTS.toolkitStandard)} AI Act Compliance Toolkit
          </Link>{' '}
          — making that upgrade {gbp(DERIVED.toolkitAfterEvidencePack)}. One credit per purchaser, valid for 90
          days, not redeemable for cash or against the {gbp(AMOUNTS.checklist)} checklist pack.
        </p>
      </CardContent>
    </Card>
  )
}
