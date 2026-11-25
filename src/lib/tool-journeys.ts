import { offeringById } from './offering'

/** The paid route from each free tool, shared by discovery and follow-on links. */
export const TOOL_JOURNEYS = {
  // First on purpose: the organisation-level front door, before the per-system Checker.
  'exposure-check': {
    offering: offeringById('advisory-briefing'),
    actionLabel: 'Talk through your exposure',
    intro: 'Which of these areas reach your systems, your role and your suppliers, and what should you do first? Work through your result with an independent adviser.',
  },
  'compliance-checker': {
    offering: offeringById('advisory-briefing'),
    actionLabel: 'Understand your Checker result',
    intro: 'Which actions matter most, and what do you need to establish next? Work through your result with an independent adviser, grounded in how your business uses the system.',
  },
  'supply-chain-mapper': {
    offering: offeringById('manufacturing-exposure'),
    actionLabel: 'Map your actual supplier dependencies',
    intro: 'Which of your products depend on these chokepoints, and which alternatives are actually qualified? Commission a map of your own components and suppliers, with the evidence recorded and resilience actions prioritised.',
  },
  'scenario-modeler': {
    offering: offeringById('scenario-impact'),
    actionLabel: 'Quantify the impact on your business',
    intro: 'What would this shock do to your revenue and margin? Commission scenarios built around your business units, with value at stake, assumptions and the actions that would protect it.',
  },
  'policy-stress-test': {
    offering: offeringById('regulatory-friction'),
    actionLabel: 'Resolve friction across your operations',
    intro: 'Where do EU and US requirements create costs or delays in your operations? Commission a conflict map and a prioritised roadmap, with resolution costs, timing and owners.',
  },
} as const
