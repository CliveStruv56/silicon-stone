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
export function FollowOnBriefing({ toolName }: { toolName: string }) {
  const briefing = offeringById('advisory-briefing')
  return (
    <FollowOnOffering
      offering={briefing}
      eyebrow="Start here · before a specialist project"
      intro={`Ideally the work begins with an Advisory Briefing. Bring your ${toolName} result and one principal question; leave with priorities, evidence gaps and next actions in writing.`}
      summary="One AI system, one principal question. A one-hour discussion with an independent adviser and a written follow-up."
      ctaLabel="Explore the Advisory Briefing"
      note="The Briefing fee is deducted in full from whichever project you go on to start with us."
    />
  )
}
