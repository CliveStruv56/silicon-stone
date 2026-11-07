/** Editorial review date, not the date the visitor happens to open the page. */
export const DIGITAL_OMNIBUS_REVIEWED = '2026-11-07'

/** The review date as shown on the page, always derived from the constant above. */
export const DIGITAL_OMNIBUS_REVIEWED_LABEL = new Date(`${DIGITAL_OMNIBUS_REVIEWED}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

export const OMNIBUS_SOURCES = {
  overview: { title: 'European Commission: the two Digital Omnibus tracks', url: 'https://digital-strategy.ec.europa.eu/en/policies/digital-rulebook' },
  enacted: { title: 'European Commission: AI Omnibus enters into force', url: 'https://digital-strategy.ec.europa.eu/en/news/ai-omnibus-enters-force' },
  legislation: { title: 'EUR-Lex: Regulation (EU) 2026/1744', url: 'https://eur-lex.europa.eu/eli/reg/2026/1744/oj/eng' },
  timeline: { title: 'European Commission: AI Act implementation timeline', url: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/timeline/timeline-implementation-eu-ai-act' },
  proposal: { title: 'European Parliament: broader Digital Omnibus procedure', url: 'https://oeil.europarl.europa.eu/oeil/en/procedure-file?reference=2025%2F0360%28COD%29' },
  package: { title: 'European Commission: data, privacy and cybersecurity proposals', url: 'https://digital-strategy.ec.europa.eu/en/faqs/digital-package' },
  privacy: { title: 'EDPB and EDPS: support for simplification and concerns over privacy changes', url: 'https://www.edpb.europa.eu/news/digital-omnibus-edpb-and-edps-support-simplification-and-competitiveness-while-raising-key_en' },
  councilPosition: { title: 'Council: position on the broader Digital Omnibus (data, privacy and incident reporting)', url: 'https://www.consilium.europa.eu/en/press/press-releases/2026/10/21/digital-rulebook-council-agrees-position-to-simplify-data-protection-privacy-and-cyber-reporting-rules/' },
  agreement: { title: 'Council: political agreement on the AI Omnibus', url: 'https://www.consilium.europa.eu/en/press/press-releases/2026/05/07/artificial-intelligence-council-and-parliament-agree-to-simplify-and-streamline-rules/' },
  scope: { title: 'AI Act Service Desk: Article 2, scope', url: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-2' },
}

export const OMNIBUS_HISTORY = [
  { date: '19 November 2025', title: 'Two proposals introduced', detail: 'The Commission proposes changes to the AI Act and, in a separate legislative file, to data, privacy and cybersecurity rules.', source: 'overview' },
  { date: '7 May 2026', title: 'Political agreement on AI announced', detail: 'Parliament and Council negotiators agree the AI changes. Political agreement precedes formal adoption and entry into force.', source: 'agreement' },
  { date: '27 July 2026', title: 'AI Omnibus enters into force', detail: 'Regulation (EU) 2026/1744 changes the AI Act. The broader Digital Omnibus remains a separate proposal.', source: 'enacted' },
  { date: '21 October 2026', title: 'Council agrees its position on the broader package', detail: 'The Council’s Permanent Representatives Committee approves its negotiating mandate (its position for talks with Parliament) on the data, privacy and incident-reporting proposal. Negotiations with Parliament start only once Parliament adopts its own position, so this is not an agreed text.', source: 'councilPosition' },
] as const

export const OMNIBUS_APPLICATIONS = [
  { name: 'Advisory Briefing', href: '/advisory/advisory-briefing', question: 'What does this mean for our AI system?', detail: 'The output of a tool or product, or one of your AI systems, with a one-hour discussion and written next steps.' },
  { name: 'Exposure Diagnostic', href: '/advisory/exposure-diagnostic', question: 'Where are we exposed?', detail: 'Examine your systems, vendor evidence and dependencies. European Procurement Readiness is included where relevant to the agreed scope.' },
  { name: 'Strategic Assessment', href: '/advisory/strategic-assessment', question: 'What should the board commit to?', detail: 'Translate requirements, procurement evidence gaps and regulatory uncertainty into investment priorities and an implementation roadmap. Where sovereignty is part of the decision, the scope extends to data flows, access, key custody and portability.' },
]
