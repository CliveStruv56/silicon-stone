/**
 * The fixed copy on the Learn pages: what changes with a code release, not with
 * a Studio edit. Course, track and route content lives in Sanity.
 *
 * House rules (CLAUDE.md, the voice-edit skill and docs/learn/plan.md "Copy
 * rules"): no hype words, no artificial urgency, no invented social proof,
 * smart quotes, and every regulatory claim dated. "20 places" is true because
 * cohorts are taught live; nothing here counts down.
 *
 * Article 4 was rewritten by Regulation (EU) 2026/1744 on 27 July 2026. It now
 * asks providers and deployers to take measures to support AI literacy, and
 * says in terms that it does not require any specific level. Nothing here may
 * describe the original "ensure a sufficient level" duty; the seed test fails
 * on the phrase.
 */

export const PROGRAMME = 'Silicon to Sovereignty'
export const SECTION = 'Silicon & Stone Learning'

export const HUB_HERO = {
  eyebrow: `${SECTION} · ${PROGRAMME}`,
  headline: 'Most AI training starts at the chatbot. Ours starts at the chip.',
  subhead:
    'Courses for the leaders who have to approve, buy and answer for AI: how it works, what it runs on, what the rules now require, and who really controls your stack.',
  status: 'First courses open January 2027. Founding places are limited to 20 per cohort, because they are taught live.',
}

export const WAITLIST_PROMISE =
  'Course news only: opening dates, founding places, free lessons. No spam, and unsubscribe any time.'

export const WHY_DIFFERENT = [
  {
    title: 'Starts with the physical stack',
    body: 'GPUs, memory, power and the supply chain come first, because they decide cost, risk and sovereignty long before the regulation does.',
  },
  {
    title: 'Current, dated, sourced',
    body: 'Dates as they stand after the Digital Omnibus, primary sources and open corrections: the same standard as the publication. Every course page says when its content was last checked.',
  },
  {
    title: 'One question throughout',
    body: 'Who controls your stack, and what are you liable for in a model you didn’t build? Every level comes back to it, and the capstone is built around it.',
  },
  {
    title: 'You practise on real tools',
    body: 'Courses end with an exercise in the Compliance Checker, Supply Chain Mapper, Scenario Modeler or Policy Stress-Test, so you leave with something you can use.',
  },
]

export const HOW_IT_WORKS = [
  {
    title: 'Core, then Go deeper',
    body: 'Every module has a Core strand for leaders and a Go deeper strand for engineers and specialists. Take the one you need.',
  },
  {
    title: 'Three ways in',
    body: 'Slides for the session, an interactive lesson to work through, and a written guide to keep.',
  },
  {
    title: 'Live first, self-serve after',
    body: 'Each track opens as a live founding cohort of up to 20 people, in four to six weekly sessions. It is released self-serve once the cohort has shaped it.',
  },
  {
    title: 'One exercise per course',
    body: 'Each course ends with a piece of work on your own organisation: a register, a dependency map or a note for the board.',
  },
]

export const AUTHOR = {
  name: 'Clive Struver',
  role: 'Founder and editor, Silicon & Stone',
  href: '/authors/clive-struver',
  bio: [
    'Thirty years in the industry, at Motorola, Anritsu and WDS Global, and in semiconductor supply chains. Now publishing Silicon & Stone from Sanday.',
    'Independent: no vendor sponsorship, no referral fees and no software to sell. The courses are written fresh. Third-party syllabuses shape what is covered, never the material.',
  ],
}

export const TEAMS_PANEL = {
  heading: 'Train your board or your whole staff',
  body: 'Every course can be taught privately, from a 60-minute board briefing to a two-day workshop, with exercises run on your own systems.',
}

export const TEAM_FORMATS = [
  {
    title: 'Board briefing',
    length: '60–90 minutes',
    body: 'For a board or executive team. Built from the board and executive route, and run on your own decisions.',
  },
  {
    title: 'Half-day session',
    length: 'Half a day',
    body: 'One track, or a set of courses chosen for your team, taught live with the exercise on your own systems.',
  },
  {
    title: 'Two-day workshop',
    length: 'Two days',
    body: 'For governance and compliance teams. The practitioner artefacts, built together: register, operating model, FRIA and vendor file.',
  },
  {
    title: 'Per-seat licences',
    length: 'Self-serve',
    body: 'Staff seats for the self-serve courses, including the AI literacy course, once each track is released.',
  },
]

export const CHARITY_LINE =
  'Registered charities and not-for-profits get a discount on every paid course, track and in-house booking, on proof of registered status. The free orientation stays free for everyone.'

export const NOT_THIS = [
  'Not legal advice. The courses explain the law and how to work with it; decisions that need legal advice need a lawyer.',
  'Not a professional qualification. You receive a Silicon & Stone completion certificate, not an accreditation.',
  'Not a substitute for the Articles. Where a course uses the Compliance Checker, its limits are taught explicitly: it triages and records, and classification remains a reasoned judgement against the text.',
]

export const FAQ = [
  {
    q: 'When do the courses open?',
    a: 'The free 30-minute orientation first, then Foundations in January 2027. One track follows roughly every six to eight weeks, finishing with the sovereignty capstone in November 2027. The schedule page has the full order.',
  },
  {
    q: 'What does joining the list commit me to?',
    a: 'Nothing. You’ll get opening dates, founding places and free lessons, and people on the list hear about each opening seven days before it is announced publicly. Unsubscribe any time.',
  },
  {
    q: 'What is a founding cohort?',
    a: 'The first live run of a track, for up to 20 people, at a founding price of about 40% below the standard price. In return we ask for feedback and, if you’re willing, a named testimonial. Founding members keep access to every later update of the self-serve version.',
  },
  {
    q: 'Do I need a technical background?',
    a: 'No. Every module has a Core strand written for leaders and semi-technical readers. The Go deeper strand is there for engineers and specialists who want it.',
  },
  {
    q: 'Does the AI literacy course meet Article 4?',
    a: 'Since Regulation (EU) 2026/1744 amended it on 27 July 2026, Article 4 asks providers and deployers to take measures to support the AI literacy of their staff, and does not require any specific level. Course 0.2 helps you take and record those measures: role-mapped training, a training register and completion records. It does not certify anything.',
  },
  {
    q: 'Is this legal advice, or a qualification?',
    a: 'Neither. The courses explain the law and the technology, and you receive a Silicon & Stone completion certificate. Third-party certifications such as the IAPP AIGP shape what is covered, but the courses are not mapped to them.',
  },
  {
    q: 'Do you offer discounts for charities?',
    a: CHARITY_LINE,
  },
  {
    q: 'Can you train our whole team?',
    a: 'Yes. Courses can be delivered privately, from a 60-minute board briefing to a two-day workshop. Tell us what you need on the in-house training page.',
  },
]

/** Track interest options for step two of the waitlist, in programme order. */
export const STEP_TWO = {
  tracksQuestion: 'What would you like first?',
  roleQuestion: 'Your role',
  audienceQuestion: 'Who is it for?',
  briefingLabel: 'Also send me the Stone Briefing, our weekly analysis of the AI power shift.',
}
