# Competitors and partners: GRC platforms and AI-governance specialists

> Researched 2026-10-29. Prices marked *third party* are estimates from Vendr
> and similar sites. None of these vendors publishes a price, except Saidot.
> Every stale-date claim in §5 was re-fetched and quoted on the same day.
> Nothing here is a commitment. It is the evidence for a decision the owner has
> not made yet.

## 1. The short version

- **None of them sells what we sell.** Sprinto, Vanta and Drata automate
  control evidence for SOC 2 and ISO 27001, and now ISO/IEC 42001 too. They
  sell a subscription to a security or compliance lead. The AI-governance
  specialists are enterprise-priced. Our buyer is a
  compliance or country manager at a 50–600-person European company, with AI
  deployed, no governance and no Big-Four budget (`docs/Legal firm
  plan/legal-partnership-plan-prd.md` §2), and through them the board. That
  buyer needs a judgement on their own system, not evidence collection.
- **The overlap is the top of the funnel.** Free AI Act checkers and AI Act
  explainers compete for the same searches as our Compliance Checker.
- **Our durable edge is verification, not currency.** Correct
  post-Omnibus dates are spreading. Drata's own blog has them, and so do
  Saidot, Credo AI and Holistic AI. Statute-verified quotation and
  deterministic classification are harder to copy than a date.
- **Best partner: Sprinto's SPARK programme. Second: Vanta's Service Provider
  Program.** Both send their customers' interpretation questions elsewhere,
  and neither lists an AI Act–specialist partner. Drata ranks third, because
  Atoro already holds the EU/UK AI Act position in its channel.

## 2. Landscape

| Company | Category | AI Act coverage | Price | Verdict for our buyer |
|---|---|---|---|---|
| Sprinto | GRC automation | Shadow-AI detection; maps controls to AI Act Articles; free 7-question checker, email-gated, with a stale date | ~$5k–$25k/yr (third party) | **Partner, rank 1**; adjacent at the funnel |
| Vanta | GRC automation | EU AI Act product (role and risk classification, impact assessments, ISO 42001/NIST reuse); links to a third-party checker | Vendr median $20,000/yr (third party) | **Partner, rank 2**; adjacent |
| Drata | GRC automation | AI Act learn pages, ISO 42001, AI Agent Governance (limited availability) | Vendr median $24,934/yr (third party) | Partner, rank 3; adjacent |
| Credo AI | AI-governance specialist | AI Act, NIST, ISO 42001; current on the Omnibus | Enterprise quote | Adjacent; only for Strategic Assessment–sized clients |
| Holistic AI | AI-governance specialist (London) | Controls mapped to AI Act/NIST/42001; free risk calculator | Enterprise quote | Adjacent; competes on free tools and content |
| trail (Collibra) | AI-governance specialist | AI Act/42001 automation plus services; acquired by Collibra, October 2026 | Not found | Adjacent; absorbed into an enterprise data platform |
| Saidot | AI-governance specialist (Finland) | AI Act knowledge graph; dates current | **Published:** $1,638/mo Library, $3,627/mo Enterprise | Adjacent; possible content ally |
| Modulos | AI-governance specialist (Switzerland) | 24 frameworks, **already including EN 18286** | ~$50k+/yr (third party, attributed to Modulos) | Adjacent |
| OneTrust AI Governance | Enterprise privacy/GRC | AI Act templates, risk tiering | Quote; "low to mid six figures" overall (third party) | Not our buyer; Big-Four channel |
| Trustible | AI-governance specialist (US) | AI Act, NIST, ISO 42001 | Not published | Possible; has a consulting track with revenue sharing |

Sources for each row are in the research notes summarised in §6.

## 3. What we learned from them, and what we built from it

Sprinto's checker answers the same questions ours does, gates the result behind
an email form, and states a date that has been wrong since 27 July 2026.
Vanta's guide sends readers to the Future of Life Institute checker, which
says it is "in no way affiliated with the European Union" and runs on the
June 2024 text, and calls it "the EU's official AI Act compliance checker
tool". The gap is a source that answers the high-intent questions from the
statute itself. Two pages now do that:

- **`/tools/compliance-checker/faq`**: ten questions (scope for a non-EU
  company, provider or deployer when building on a third-party model, the
  post-Omnibus dates, what applies now, the embedded-product route, penalties,
  42001). The page quotes 26 extracts, each string-matched against the pinned
  rule pack, and carries `FAQPage` markup.
- **`/tools/compliance-checker/iso-42001`**: 20 rows. Fifteen map an ISO/IEC
  42001 element to an AI Act requirement, rated strong or partial. Five are
  duties with no counterpart in the standard: classification, conformity
  assessment, registration, the prohibitions, and Article 50 transparency.
  This is the page every Sprinto, Vanta and Drata customer on 42001 needs. It
  is also the partner pitch in a single page.

One fact surfaced while building it, and it matters to every vendor here.
**EN 18286:2026 became the first harmonised standard under the AI Act on 14
October 2026** (Commission Implementing Decision (EU) 2026/2274, confirmed
against the Official Journal text). It covers quality management systems for
providers, including post-market monitoring. ISO/IEC 42001 is not cited. Any
platform selling "42001 maps to the AI Act" now has a harder story to tell.
Modulos already lists EN 18286.

## 4. Partnership: the case and the plan

### Sprinto SPARK (rank 1)

- Page: https://sprinto.com/partners-program/ (modified 2026-10-19). Four
  tracks: Channel, Consulting, Technology and Referral.
- Verified wording: Consulting Partners "pair board-grade insight with
  Sprinto's automated platform … guiding leadership from risk to ROI". That
  is our register. Referral Partners "earn generous lifetime rewards".
- Not published: commission rates, tiers, requirements.
- **Why first.** It is the smallest of the three GRC vendors, so a very small
  firm is likelier to get a real partner manager. It has a referral track that
  needs no implementation bench. Its own blog says the platform "won't draft
  your technical documentation". And no AI Act–specialist SPARK partner
  was found.

### Vanta Service Provider Program (rank 2)

- Pages: https://www.vanta.com/partners/service-providers and the partner
  directory. Partners get deal registration, co-marketing, a demo instance and
  a directory listing. The directory has no AI Act or 42001 filter.
- The application accepts "Compliance consulting" and a "0-50" client band. It
  asks whether you have a prospect ready to evaluate Vanta. **Arrive with
  one.**
- The MSP terms let Vanta terminate for convenience and bar giving access to
  "Vanta Competitors". Read that clause before joining two programmes.
- Its guide already sends the interpretation question to "a licensed
  attorney". The pitch is to be the step before the attorney.

### Drata (rank 3), Credo AI, Trustible

- Drata's Alliance Program has three tiers, deal registration and a directory.
  Atoro (Ireland) already sells EU AI Act readiness and 42001 to UK and EU
  clients there, so the position is taken.
- Credo AI has a "Boutique Partners" track, and Trustible courts consultants
  with revenue sharing. Their enterprise prices miss our buyer, so each is
  worth one exploratory note and no more.

### What we offer, what we ask for

**Offer:**
- An interpretation layer they lack: deterministic classification and
  post-Omnibus answers, verified against CELEX 02024R1689-20260727.
- The Advisory Briefing as the place to send a customer whose question is
  regulatory rather than evidential.
- Date-correct co-authored content.

**Ask:**
- A disclosed referral fee.
- Their AI Act interpretation questions routed to us.
- A directory listing and any co-marketing on offer.
- A demo instance, so we describe their AI Act mapping accurately.
- The fee schedule and the exclusivity terms under NDA **before** signing.

### Risks

- **Channel conflict.** All three sell AI Act modules, and Sprinto's checker
  competes with ours for the same email.
- **Brand drift.** These ecosystems are SOC 2 and startup-shaped. The
  partnership must not pull us into implementation work or a CTO buyer.
- **Dependency.** They can terminate at will, and none publishes its fees.
- **The legal-advice line.** Keep the demarcation from the law-firm PRD.
  Referrals must reduce the vendor's exposure, not add to it.

### First steps

1. **Week 1: Sprinto.** Send a Partnership Enquiry, type Consulting, and
   mention referral interest. Bring three things:
   - a one-page note setting their checker's "High-risk AI system obligations
     apply from August 2026" against Article 113 (c)(i) and (ii), with the
     CELEX;
   - links to the FAQ and the 42001 crosswalk;
   - a proposed flow: their customer's interpretation question → Advisory
     Briefing → findings returned as evidence tasks in their platform.

   Offer one co-branded session, "What the Omnibus moved, and what EN 18286
   changes".
2. **Weeks 2–4: Vanta,** ideally with a live prospect. Use the same pack,
   adapted to their guide.
3. **Before signing either,** see the fee addendum and the exclusivity clause.

## 5. Dated-claims watch (re-fetched 2026-10-29)

| Source | Exact text | Against the pinned pack |
|---|---|---|
| Sprinto checker FAQ, sprinto.com/calculator/eu-ai-act-compliance-checker (modified 2026-10-13) | "High-risk AI system obligations apply from August 2026." | Annex III from 2 December 2027; Annex I from 2 August 2028. |
| Drata, drata.com/learn/eu-ai/compliance-software | A table row: "High-Risk AI obligations \| August 2, 2026 \| Full conformity requirements for Annex III high-risk systems"; and "a political agreement was reached on the EU's Digital Omnibus package—a set of proposed simplifications" | Annex III from 2 December 2027. The Omnibus is in force (Regulation (EU) 2026/1744). |
| Vanta, vanta.com/resources/eu-ai-act-guide | "You can use the EU's official AI Act compliance checker tool", linking to artificialintelligenceact.eu; a timeline entry headed "Aug 2, 2026" | That tool is unaffiliated with the EU and runs on pre-Omnibus text. |

Current and correct: Saidot's guide, Credo AI's Omnibus post, Holistic AI's
"deadline moved to 2027" post, and Drata's own blog.

Use these privately, in a partner conversation, as evidence of the gap. Do not
publish them as a named comparison. Every page here changes without notice,
and a published correction of a competitor goes stale the day they fix it.

## 6. Method and limits

- The research was done by a delegated agent. I spot-checked the three claims
  the outreach plan quotes back to vendors (Sprinto's partner wording, Drata's
  stale table, Vanta's "official" checker line) against the live pages, and
  they match.
- No vendor publishes referral percentages or tier requirements, and none
  were found from third parties.
- Drata's application form and Credo AI's apply page returned no usable text.
- Specific dates could not be extracted from Holistic AI's risk calculator.
