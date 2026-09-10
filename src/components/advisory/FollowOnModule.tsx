import { FollowOnOffering } from './FollowOnOffering'
import { MODULES } from '@/lib/offering'
import { TOOL_JOURNEYS } from '@/lib/tool-journeys'

/**
 * The standalone specialist project connected to this tool. The catalogue owns
 * name, price and route; TOOL_JOURNEYS owns the question and action wording.
 */
export function FollowOnModule({ moduleId }: { moduleId: string }) {
  const offering = MODULES.find(m => m.id === moduleId)
  // A mistyped id must not silently render an empty band beneath the tool.
  if (!offering) throw new Error(`FollowOnModule: no module with id "${moduleId}"`)
  if (!offering.fromTool) {
    throw new Error(`FollowOnModule: "${moduleId}" has no fromTool in the catalogue`)
  }
  const journey = Object.values(TOOL_JOURNEYS).find(item => item.offering.id === moduleId)
  if (!journey) throw new Error(`FollowOnModule: no tool journey for "${moduleId}"`)

  return (
    <FollowOnOffering
      offering={offering}
      eyebrow="Specialist advisory · standalone projects"
      intro={journey.intro}
      ctaLabel={journey.actionLabel}
      note="Free scoping conversation. No previous engagement required."
    />
  )
}
