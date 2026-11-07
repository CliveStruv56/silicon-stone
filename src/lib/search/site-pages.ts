import { SCENARIOS } from '@/lib/scenario-data'

/**
 * The hand-built public pages that site search must be able to find.
 *
 * Articles, series, authors, products and glossary terms live in Sanity and are
 * searched there. Everything here is a Next.js page with no document behind it,
 * so before this registry existed `/search` could not find the Compliance
 * Checker, the pricing page or any advisory engagement.
 *
 * Three rules, each held by `site-pages.test.ts`:
 *
 * - **`description` is the page's own words.** It is copied verbatim from the
 *   page's metadata description or its on-page copy, never written here. A
 *   search result is a public claim, and this file is not a place to make new
 *   ones. The test finds every description in its route's source.
 * - **Every `path` is a real, indexed page.** It resolves to a `page.tsx` that
 *   does not redirect, and it is listed in `sitemap.ts`'s STATIC_ROUTES.
 * - **`keywords` are search terms only.** Synonyms and the words people type
 *   ("checker", "prices"). They are never displayed, so they are not claims, but
 *   keep them honest: a keyword that drags a page into the wrong results costs
 *   more than a missing one.
 *
 * The registry also feeds the "search by meaning" index (`npm run
 * search:index-pages`), so a change here should be followed by a re-index.
 */

export type SitePageKind = 'tool' | 'product' | 'advisory' | 'guide' | 'page'

export type SitePage = {
  path: string
  title: string
  description: string
  kind: SitePageKind
  keywords: readonly string[]
}

/** Matches the template in tools/scenario-modeler/layout.tsx, from the same data. */
const scenarioModelerDescription = `${SCENARIOS.length} geopolitical scenarios — ${SCENARIOS.map((s) => s.shortName).join(', ')} — priced sector by sector and re-read through your own exposure lens, with a board brief for each.`

export const SITE_PAGES: readonly SitePage[] = [
  // ── Tools ────────────────────────────────────────────────────────────────
  {
    path: '/tools/compliance-checker',
    title: 'AI Act Compliance Checker',
    kind: 'tool',
    description:
      'Classify an AI system under the EU AI Act: a rule-based risk tier, the obligations that follow, the vendor evidence to ask for, and the transparency rules in force since August 2026.',
    keywords: ['checker', 'check', 'assessment', 'self-assessment', 'classifier', 'classification', 'risk tier', 'high-risk', 'eu ai act', 'ai act', 'compliance', 'obligations', 'does the ai act apply'],
  },
  {
    path: '/tools/compliance-checker/faq',
    title: 'EU AI Act questions, answered from the statute',
    kind: 'guide',
    description:
      'EU AI Act scope for US companies, provider or deployer roles, the high-risk dates after the Digital Omnibus on AI, and penalties, with the statute quoted.',
    keywords: ['faq', 'questions', 'ai act', 'scope', 'applies', 'provider', 'deployer', 'penalties', 'fines', 'deadlines', 'dates'],
  },
  {
    path: '/tools/compliance-checker/iso-42001',
    title: 'ISO/IEC 42001 and the EU AI Act',
    kind: 'guide',
    description:
      'From ISO/IEC 42001 to the EU AI Act, element by element: what your AI management system already evidences, what the Act adds, and what it leaves uncovered.',
    keywords: ['iso', '42001', 'iso 42001', 'crosswalk', 'standard', 'management system', 'aims', 'certification'],
  },
  {
    path: '/tools/compliance-checker/provisions',
    title: 'AI Act provisions',
    kind: 'guide',
    description:
      'The Articles of the EU AI Act quoted verbatim by the Compliance Checker, with the consolidated text of each.',
    keywords: ['articles', 'statute', 'legal text', 'provisions', 'regulation text', 'annex iii'],
  },
  {
    path: '/tools/policy-stress-test',
    title: 'Policy Stress-Test',
    kind: 'tool',
    description:
      'Pair an EU policy with a US policy for your industry — AI Act, GDPR, Chips Acts, DMA, Data Act, export controls — and get the friction scored, the pressure point named, and a dated action plan.',
    keywords: ['stress test', 'policy', 'friction', 'us eu', 'transatlantic', 'gdpr', 'export controls', 'chips act', 'comparison'],
  },
  {
    path: '/tools/scenario-modeler',
    title: 'Scenario Modeler',
    kind: 'tool',
    description: scenarioModelerDescription,
    keywords: ['scenario', 'scenarios', 'modeller', 'modelling', 'modeling', 'geopolitics', 'geopolitical', 'taiwan', 'what if', 'board brief'],
  },
  {
    path: '/tools/supply-chain-mapper',
    title: 'Supply Chain Mapper',
    kind: 'tool',
    description:
      'Map the semiconductor and critical-mineral chokepoints exposing European technology supply chains.',
    keywords: ['supply chain', 'supplier', 'suppliers', 'chokepoints', 'semiconductors', 'chips', 'critical minerals', 'map'],
  },
  {
    path: '/tools',
    title: 'Interactive Tools',
    kind: 'tool',
    description:
      'Forensic analysis tools for navigating the AI Act, supply chain vulnerabilities, and geopolitical scenarios.',
    keywords: ['tools', 'free tools', 'calculators', 'checker'],
  },

  // ── Products ─────────────────────────────────────────────────────────────
  {
    path: '/products/ai-act-toolkit',
    title: 'AI Act Compliance Toolkit',
    kind: 'product',
    description:
      'Assess AI gaps, catalogue systems, score supplier dependencies and build an action plan. Standard toolkit or Professional with a live implementation review.',
    keywords: ['toolkit', 'kit', 'templates', 'workbook', 'checklist', 'audit', 'gap analysis', 'ai register', 'inventory'],
  },
  {
    path: '/products/sector-reports',
    title: 'Sector Reports',
    kind: 'product',
    description:
      'Preview AI and European Manufacturing: full contents and an Executive Summary excerpt. Sector reports include monthly updates for 12 months with one payment.',
    keywords: ['report', 'reports', 'manufacturing', 'sector', 'industry'],
  },
  {
    path: '/products',
    title: 'Products',
    kind: 'product',
    description:
      'Digital products for European businesses navigating AI regulation, supply chain risk, and digital sovereignty.',
    keywords: ['products', 'buy', 'shop', 'downloads'],
  },

  // ── Advisory ─────────────────────────────────────────────────────────────
  {
    path: '/advisory',
    title: 'Advisory',
    kind: 'advisory',
    description:
      'Independent AI and technopolitical advisory: an Advisory Briefing, broader assessments, an ongoing retainer and five standalone specialist projects. Agree the scope after a free conversation.',
    keywords: ['advisory', 'advice', 'adviser', 'advisor', 'consulting', 'consultant', 'consultancy', 'help', 'hire', 'engagement', 'board'],
  },
  {
    path: '/advisory/advisory-briefing',
    title: 'Advisory Briefing',
    kind: 'advisory',
    description:
      'The output of a tool or product, or one of your AI systems. A one-hour discussion and a written follow-up with priorities, evidence gaps and next actions.',
    keywords: ['briefing', 'call', 'session', 'one hour', 'consultation', 'advice'],
  },
  {
    path: '/advisory/exposure-diagnostic',
    title: 'The Exposure Diagnostic',
    kind: 'advisory',
    description:
      'A one-off engagement for the question documents cannot answer: where your dependency on specific vendors, models and jurisdictions becomes an operating constraint — and what to do about it this quarter. Written report, prioritised actions, 30-day follow-up.',
    keywords: ['diagnostic', 'exposure', 'vendor dependency', 'lock-in', 'ai bill of materials', 'dependency'],
  },
  {
    path: '/advisory/strategic-assessment',
    title: 'Strategic Assessment',
    kind: 'advisory',
    description:
      'Before the board commits, two questions: what do you actually need, and how much of your stack do you actually control? A framework-neutral, vendor-agnostic decision document: multi-framework analysis, an architecture and control map covering hosting, access, key custody and exit, a 40-page report, a board-ready presentation and a staged roadmap. Includes the Sovereign Architecture Review.',
    keywords: ['assessment', 'strategy', 'board', 'governance', 'sovereignty', 'sovereign architecture', 'roadmap'],
  },
  {
    path: '/advisory/drift-retainer',
    title: 'The Drift Retainer',
    kind: 'advisory',
    description:
      'A standing, independent read on how the technopolitical drift affects your supply chains, procurement and people — a board-forwardable monthly briefing, a working session on one live decision, direct access between sessions, and a quarterly written exposure review.',
    keywords: ['retainer', 'ongoing', 'monthly', 'standing advice'],
  },
  {
    path: '/advisory/modules/regulatory-friction',
    title: 'Regulatory Friction Assessment',
    kind: 'advisory',
    description:
      'Where US and EU requirements pull against each other across your operations: every conflict friction-scored, priced and dated, with a priority matrix, a regulatory calendar built from pinned statute, and a transatlantic roadmap with owners.',
    keywords: ['friction', 'us eu', 'transatlantic', 'gap analysis', 'conflict', 'regulatory'],
  },
  {
    path: '/advisory/modules/manufacturing-exposure',
    title: 'Manufacturing Exposure Module',
    kind: 'advisory',
    description:
      'Semiconductor, cloud, supplier and operational dependencies mapped against your own organisation, with chokepoints named and the procurement questions to put to exposed suppliers.',
    keywords: ['manufacturing', 'supply chain', 'supplier', 'chokepoints', 'semiconductors', 'procurement'],
  },
  {
    path: '/advisory/modules/scenario-impact',
    title: 'Scenario Impact Analysis',
    kind: 'advisory',
    description:
      'Geopolitical scenarios built for your business, with revenue and margin at risk quantified by business unit as stated ranges, cascades mapped, early-warning indicators owned, and a board brief per scenario.',
    keywords: ['scenario', 'scenarios', 'impact', 'revenue at risk', 'geopolitical', 'board brief'],
  },
  {
    path: '/advisory/modules/european-procurement-readiness',
    title: 'European Procurement Readiness',
    kind: 'advisory',
    description:
      'Prepare for a European buyer’s procurement review with an evidence matrix, gap register and prioritised response plan.',
    keywords: ['procurement', 'tender', 'rfp', 'buyer', 'due diligence', 'vendor questionnaire', 'europe'],
  },

  // ── Guides ───────────────────────────────────────────────────────────────
  {
    path: '/digital-omnibus',
    title: 'Digital Omnibus: What Changes and What Matters',
    kind: 'guide',
    description:
      'A practical guide to the EU Digital Omnibus for UK and EU business leaders and US companies operating in Europe: AI Act dates, proposed data and privacy changes, and the decisions they inform.',
    keywords: ['omnibus', 'digital omnibus', 'deadlines', 'dates', 'delay', 'ai act dates', 'gdpr changes', 'simplification'],
  },
  {
    path: '/us-executive-guide',
    title: 'The US Executive’s Guide to European Digital Sovereignty',
    kind: 'guide',
    description:
      'A free, neutral-interpreter guide for US executives: what Europe’s AI Act and sovereignty rules genuinely require, what is noise, and what is still moving — with a short self-check on your real exposure.',
    keywords: ['us', 'american', 'usa', 'executive', 'guide', 'sovereignty', 'europe', 'eu exposure'],
  },
  {
    path: '/methodology',
    title: 'Methodology',
    kind: 'page',
    description:
      'Forensic Technopolitics: a 3 × 2 matrix of three forensic domains (Supply Chain, Policy, Talent) stress-tested by two analytical methods (Scenario Modelling, Long-Memory Filter).',
    keywords: ['method', 'approach', 'framework', 'long-memory filter', 'forensic'],
  },
  {
    path: '/how-it-fits-together',
    title: 'How it fits together',
    kind: 'page',
    description:
      'One map of everything Silicon & Stone offers: free analysis and tools, self-serve products, the Advisory Briefing, the specialist projects and engagements behind it, and the Drift Retainer they settle into.',
    keywords: ['overview', 'map', 'offerings', 'services', 'where to start'],
  },

  // ── Pages ────────────────────────────────────────────────────────────────
  {
    path: '/pricing',
    title: 'Pricing',
    kind: 'page',
    description: 'One page, every price. The analysis and the tools are free and stay free.',
    keywords: ['price', 'prices', 'cost', 'costs', 'fees', 'how much', 'rates'],
  },
  {
    path: '/intelligence',
    title: 'Intelligence',
    kind: 'page',
    description:
      'One intelligence hub — filter by topic, tier (Pulse, Briefing, Audit) and role. AI regulation, semiconductor supply chains, and digital sovereignty for European decision-makers.',
    keywords: ['analysis', 'articles', 'briefings', 'news', 'archive', 'latest'],
  },
  {
    path: '/intelligence/series',
    title: 'Series',
    kind: 'page',
    description:
      'Reading paths through the intelligence archive — each one an ordered sequence of analysis on a single question, from the first piece to the latest.',
    keywords: ['series', 'reading path', 'collections'],
  },
  {
    path: '/glossary',
    title: 'Glossary',
    kind: 'page',
    description:
      'Plain-language definitions of the institutions, laws, AI techniques, models and semiconductor terms used by Silicon and Stone.',
    keywords: ['glossary', 'definitions', 'terms', 'acronyms', 'jargon', 'what is'],
  },
  {
    path: '/waymarkpath',
    title: 'WaymarkPath',
    kind: 'page',
    description:
      'Build AI awareness and the skills to progress in your career. Take stock of your strengths, prioritise learning and plan your next steps with WaymarkPath.',
    keywords: ['waymark', 'career', 'careers', 'skills', 'training', 'jobs', 'learning'],
  },
  {
    path: '/about',
    title: 'About',
    kind: 'page',
    description:
      'Silicon and Stone combines deep technology industry experience with the clarity that comes from distance: geographic, temporal, and intellectual.',
    keywords: ['about', 'clive', 'who', 'author'],
  },
  {
    path: '/privacy',
    title: 'Privacy Policy',
    kind: 'page',
    description: 'How Silicon and Stone handles your data. GDPR-compliant privacy practices.',
    keywords: ['privacy', 'data', 'cookies', 'gdpr'],
  },
  {
    path: '/terms',
    title: 'Terms of Service',
    kind: 'page',
    description:
      'Terms of service for Silicon and Stone website, digital products, and advisory services.',
    keywords: ['terms', 'conditions', 'legal'],
  },
]
