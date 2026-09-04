/**
 * Provisional copy for the two dedicated engagement pages — NOT owner-supplied.
 *
 * Everything in this file is a **drafted guess** at how the Exposure Diagnostic
 * and the Strategic Assessment actually run. The owner asked for a structure to
 * react to and will supply the real detail; until then none of it may reach a
 * customer, because a stated timeline is a commercial promise and an invented
 * one is a false description of a service someone is paying up to
 * `AMOUNTS.strategicAssessment` for.
 *
 * `PROVISIONAL_CONTENT_APPROVED` is a hard-coded constant rather than an env
 * flag on purpose. An env flag could be switched on in Vercel while the text
 * below was still fiction; a constant in this file means turning it on requires
 * opening the file where the fiction lives and replacing it first.
 *
 * To go live: replace the content below with the real detail, then set the
 * constant to `true`. The pages render every *other* section unconditionally —
 * those are traceable to `src/lib/offering.ts` or to copy already published on
 * `/advisory`, so each page stands on its own with this switched off.
 *
 * There are deliberately **no testimonials, case studies or client quotes**
 * here, in draft or otherwise. The proof section is a layout slot only; nothing
 * that could be mistaken for a real client's words is written anywhere in this
 * codebase, and inventing one is not a thing to do at any confidence level.
 */

export const PROVISIONAL_CONTENT_APPROVED = false

export type EngagementStage = {
  /** Short label — "Week 1–2", "Day 30". Kept vague where the real cadence is unknown. */
  when: string
  title: string
  detail: string
}

/**
 * DRAFT — the Exposure Diagnostic's shape.
 *
 * Grounded where it can be: the 30-day follow-up call is real (it is a listed
 * feature on `/advisory`), as is the 15–25 page report. The week numbering,
 * the scoping call and the three-to-four process-owner conversations are
 * inferred from the Drift Retainer's Baseline Month, which does describe
 * "short conversations with three or four process owners" — a reasonable
 * pattern to borrow, but not a statement the owner has made about this product.
 */
export const DIAGNOSTIC_STAGES: EngagementStage[] = [
  {
    when: 'Before we start',
    title: 'A scoping call',
    detail:
      'Half an hour to agree the boundary — which entities, which systems, which jurisdictions. The fee is quoted against that boundary, so scope is settled before anything is invoiced.',
  },
  {
    when: 'Weeks 1–2',
    title: 'Evidence gathering',
    detail:
      'Your AI systems inventory as it actually stands, the documentation your vendors can produce on request, and short conversations with the people who own the affected processes.',
  },
  {
    when: 'Week 3',
    title: 'Analysis',
    detail:
      'Dependency mapping across models, APIs, cloud and jurisdiction, and a regulatory-friction read on where US and EU requirements pull against each other in your operations.',
  },
  {
    when: 'Week 4',
    title: 'Report and walkthrough',
    detail:
      'The written report, delivered and then talked through — so the prioritised actions arrive with the reasoning attached rather than as a list to interpret alone.',
  },
  {
    when: 'Day 30',
    title: 'The follow-up call',
    detail:
      'A month later, once you have tried to act on it: what moved, what stalled, and what the next quarter should carry.',
  },
]

/**
 * DRAFT — the Strategic Assessment's shape. Six weeks is an estimate; the
 * board presentation and the 40+ page report are real listed deliverables.
 */
export const ASSESSMENT_STAGES: EngagementStage[] = [
  {
    when: 'Before we start',
    title: 'Scoping and mandate',
    detail:
      'What decision is this assessment for, and who signs it off. A board-ready document needs to know which board and which question before the work starts.',
  },
  {
    when: 'Weeks 1–2',
    title: 'Discovery',
    detail:
      'Systems, vendors, contracts and the governance you already run — plus interviews across the functions that would carry whatever the board decides.',
  },
  {
    when: 'Weeks 3–4',
    title: 'Multi-framework analysis',
    detail:
      'Your position read against each framework in scope, with the overlaps and the genuine conflicts separated — the second of which is where the cost usually sits.',
  },
  {
    when: 'Week 5',
    title: 'Draft and challenge',
    detail:
      'A draft you can argue with before it is finished. An assessment that first appears in its final form at a board meeting is one nobody has stress-tested.',
  },
  {
    when: 'Week 6',
    title: 'Board presentation and roadmap',
    detail:
      'The report, the presentation, and an implementation roadmap sequenced by what has to be true first.',
  },
]

/**
 * DRAFT — indicative report contents. The page count and the executive summary
 * are real; this chapter breakdown is inferred from the review areas already
 * listed on `/advisory` and has not been confirmed against a delivered report.
 */
export const DIAGNOSTIC_REPORT_CONTENTS: string[] = [
  'Executive summary — the two or three things that actually matter, for someone who will read only this',
  'AI systems inventory — what you run, including what arrived without anyone deciding to buy it',
  'Vendor evidence assessment — what each supplier can prove, and where the gaps sit',
  'Dependency map — models, APIs, cloud and jurisdiction across the stack',
  'Regulatory-friction read — where US and EU divergence touches your operations',
  'Prioritised actions — sequenced by exposure, with what to do this quarter marked',
]

export const ASSESSMENT_REPORT_CONTENTS: string[] = [
  'Executive summary and the recommendation, stated plainly',
  'Framework-by-framework position, with overlaps and conflicts separated',
  'The requirements analysis — what you actually need any tooling to do',
  'Options appraisal, vendor-agnostic',
  'Implementation roadmap, sequenced by dependency',
  'Board presentation pack',
]
