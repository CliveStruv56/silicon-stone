/**
 * The quick-start gap assessment: twenty questions, held once.
 *
 * The workbook's Assessment tab and the handbook's quick-start section both
 * render from these arrays, so the printed questions and the scored ones are
 * the same questions. The legacy assessment scored all twenty on one scale,
 * which meant answering Yes to "do you use AI in recruitment?" raised the
 * readiness score, and a short total could read as "broadly compliant".
 * Exposure and preparedness are therefore separate lists, and only the second
 * is scored.
 */
/**
 * Exposure questions decide which checklists apply. They are never scored.
 * The two Annex III areas asked about are the ones commercial organisations
 * most often meet; the handbook's decision tree covers all eight (points 4 and
 * 5 checked against the pinned Annex III text, including 5(b)'s exclusion of
 * fraud detection and 5(c)'s restriction to life and health insurance).
 */
export const EXPOSURE = [
  { ref: 'X1', q: 'Does any AI system you build, sell or use reach the EU market, or produce outputs used in the EU?', guide: 'Unsure counts as Yes until you have checked. A No may take you out of scope — record why.', adds: 'Checklist A' },
  { ref: 'X2', q: 'Have you built an AI system, put your name or trade mark on one, or substantially modified a third party’s system?', guide: 'Any of these can make you a provider of that system.', adds: 'Checklist C for any high-risk system you provide' },
  { ref: 'X3', q: 'Do you use AI to recruit or select people, or to decide promotion, termination or task allocation, or to monitor and evaluate workers’ performance or behaviour?', guide: 'Annex III point 4. The handbook decision tree covers the other Annex III areas.', adds: 'Checklist D (or C if you provide it)' },
  { ref: 'X4', q: 'Do you use AI to assess individuals’ creditworthiness, price or assess risk in life or health insurance, or — for a public authority — evaluate people’s eligibility for public assistance benefits and services?', guide: 'Annex III point 5. AI used to detect financial fraud is expressly excluded from 5(b).', adds: 'Checklist D (or C if you provide it)' },
  { ref: 'X5', q: 'Is AI a safety component of — or itself — a product covered by the EU product legislation in Annex I (for example machinery, medical devices, toys, lifts) that needs third-party conformity assessment?', guide: 'Annex I route: high-risk duties from 2 Aug 2028.', adds: 'Checklist C, D or E by role' },
  { ref: 'X6', q: 'Do people interact with an AI system of yours (chatbot, voice or AI agent), or do you generate or publish AI-generated or AI-altered images, audio, video or text?', guide: 'Article 50 transparency, applying since 2 Aug 2026.', adds: 'Checklist B' },
]

/**
 * Preparedness questions are scored: Yes 2, Partly 1, No or Unsure 0.
 * `naIf` lists the exposure questions that must ALL be answered No before N/A
 * is accepted; a question without it can never be N/A. `critical` questions
 * override the band whatever the score.
 */
export const READINESS = [
  { ref: 'R01', q: 'For every AI system, do you know whether you are its provider, deployer, importer or distributor?', rows: 'A-04' },
  { ref: 'R02', q: 'Have you catalogued AI features embedded in other software (CRM, office suites, vendor-managed tools), not only standalone AI products?', rows: 'A-03, A-05, A-06' },
  { ref: 'R03', q: 'Have you checked, and documented, that no system uses manipulative or deceptive techniques or exploits people’s vulnerabilities in ways that cause harm?', rows: 'P-01, P-02', critical: true },
  { ref: 'R04', q: 'Have you checked, and documented, that no system performs social scoring, predicts criminal offending from profiling alone, scrapes facial images untargeted, or performs real-time remote biometric identification for law enforcement?', rows: 'P-03, P-04, P-05, P-08', critical: true },
  { ref: 'R05', q: 'Have you checked, and documented, that no system infers emotions at work or in education, categorises people by protected characteristics from biometrics, or generates the intimate or abuse material prohibited from 2 Dec 2026?', rows: 'P-06, P-07, P-09, P-10', critical: true },
  { ref: 'R06', q: 'For each system that may be high-risk, have you recorded its route (Annex III or Annex I) and the date its duties apply?', rows: 'C-01, E-01', naIf: ['X3', 'X4', 'X5'] },
  { ref: 'R07', q: 'For each high-risk system, can a named, competent person monitor it and override or stop it?', rows: 'D-03, D-04, C-12', naIf: ['X3', 'X4', 'X5'] },
  { ref: 'R08', q: 'Where people interact with a chatbot or AI agent, are they clearly told they are dealing with AI?', rows: 'B-01, B-02, B-03', naIf: ['X6'] },
  { ref: 'R09', q: 'Is AI-generated or materially AI-altered content labelled for readers and marked in a machine-readable way?', rows: 'B-04, B-05, B-06, B-07, B-12', naIf: ['X6'] },
  { ref: 'R10', q: 'Is one named person accountable for AI governance, with a minuted mandate?', rows: 'A-01, A-02' },
  { ref: 'R11', q: 'Do staff who build, buy, oversee or operate AI have AI literacy appropriate to their role (Article 4, applying since 2 Feb 2025)?', rows: 'A-10, A-11, A-12' },
  { ref: 'R12', q: 'Do you keep a written register of your AI systems, their vendors and where their data is stored?', rows: 'A-03, A-04, A-05', critical: true },
  { ref: 'R13', q: 'For each system, could you open the evidence behind its classification — reasoning, vendor documentation, assessments, logs — if an authority asked tomorrow?', rows: 'A-08, A-15' },
  { ref: 'R14', q: 'Does every new AI supplier go through a vendor assessment that records its headquarters, where it processes data and its own AI Act position?', rows: 'A-06, A-13, A-14, A-15' },
]

/**
 * Position bands, highest first. Used verbatim by the workbook formula and the
 * handbook's scoring explanation. Critical findings and incomplete answers
 * override every band.
 */
export const BANDS = [
  { min: 0.8, label: 'Foundations in place — keep the evidence current' },
  { min: 0.5, label: 'Developing — work through the gaps' },
  { min: 0, label: 'Early stage — start with the register and owner' },
]
