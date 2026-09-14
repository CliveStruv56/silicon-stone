import { FollowOnOffering } from './FollowOnOffering'
import { offeringById } from '@/lib/offering'

/**
 * The Advisory Briefing band beneath a free tool, rendered ABOVE that tool's
 * specialist-project band (owner request, 2026-09-13).
 *
 * The Compliance Checker renders its own copy of this band with
 * Checker-specific wording, because the Briefing is literally a review of a
 * Checker result. On the other three tools the Briefing is the step that
 * should ideally come before the project, so the summary is overridden: the
 * catalogue's summary opens "A review of your Compliance Checker result",
 * which on the Supply Chain Mapper page would be a non sequitur.
 */
export function FollowOnBriefing({
  toolName,
  eyebrow = 'Start here · before a specialist project',
  intro,
}: {
  /** The free tool this band follows; names it in the intro. */
  toolName?: string
  eyebrow?: string
  /** Full override for pages with no tool result to bring (e.g. /products). */
  intro?: string
}) {
  const briefing = offeringById('advisory-briefing')
  const bring = toolName ? `Bring your ${toolName} result` : 'Bring your result, or one of your AI systems'
  return (
    <FollowOnOffering
      offering={briefing}
      eyebrow={eyebrow}
      intro={intro ?? `Ideally the work begins with an Advisory Briefing. ${bring}; leave with priorities, evidence gaps and next actions in writing.`}
      summary="The output of a tool or product, or one of your AI systems. A one-hour discussion with an independent adviser and a written follow-up."
      ctaLabel="Explore the Advisory Briefing"
      note="The Briefing fee is deducted in full from whichever project you go on to start with us."
    />
  )
}
