import { FollowOnOffering } from './FollowOnOffering'
import { MODULES } from '@/lib/offering'

/**
 * The paid module that follows on from a free tool, shown beneath the tool.
 *
 * Three of the modules grew out of a self-service tool, and until 2026-09-09 all
 * of them were cards on `/advisory` — so a reader who had just run the Supply
 * Chain Mapper and hit its limit was told nothing, while the thing that answers
 * their next question sat two pages away behind a nav item called "Modules".
 * This is the same catalogue entry, put where the question occurs.
 *
 * It addresses someone who has **just finished the tool**, which is what the
 * first version got wrong: it opened "When the tool reaches its limit", which
 * describes the module rather than speaking to the reader, and it wore the same
 * quiet card styling as the tool's own panels, so at the bottom of a long page
 * it read as more tool rather than as the next step. The amber band is the
 * site's commercial callout treatment — the same one the pricing sections use.
 *
 * It reads from `MODULES` by id rather than taking name, price and summary as
 * props: three copies of a catalogue entry across three tool pages is exactly
 * the drift the offering catalogue exists to prevent, and a summary that
 * disagreed with `/pricing` would look entirely healthy on both pages.
 */
export function FollowOnModule({ moduleId }: { moduleId: string }) {
  const offering = MODULES.find(m => m.id === moduleId)
  // A mistyped id must not silently render an empty band beneath the tool.
  if (!offering) throw new Error(`FollowOnModule: no module with id "${moduleId}"`)
  if (!offering.fromTool) {
    throw new Error(`FollowOnModule: "${moduleId}" has no fromTool in the catalogue`)
  }

  return (
    <FollowOnOffering
      offering={offering}
      eyebrow={`Now you have run the ${offering.fromTool.name}`}
      intro="You have the general picture. The next question is usually the specific one — what this means for your organisation, your suppliers and your decisions. That is what this module answers."
      note="Scoped and fixed-priced before any work begins."
    />
  )
}
