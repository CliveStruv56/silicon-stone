# Persona Profiles

**Silicon and Stone · The five decision-makers we write for**
v1.1 · July 2026 (Transatlantic Troy added)

---

## Why this document exists

Every Silicon and Stone article gets tagged with one or more **personas** in Sanity Studio. Those tags drive what shows up on the briefings page, what gets emailed to whom on Kit, what the social copy looks like, and what the four interactive tools recommend.

Tagging only works if the team has a shared, concrete mental model of who each persona actually is. This document is that model — short enough to read once, specific enough that two people will tag the same article the same way.

The personas are also codified in `context/core/icp.json` (consumed by Hyperagent during drafting) and in Sanity persona documents (visible inside Studio). This markdown is the human-readable source of truth; the JSON and Sanity docs are derived from it.

---

## How to use these profiles

When polishing a draft in Sanity:

1. **Read the piece's Stone Truth first.** Who is that line written for? That's almost always the primary persona.
2. **Check the analytical moves applied.** Supply Chain Forensics is almost always Industrial Ian. Policy Stress-Testing tilts toward Compliance Clara and Sovereign Sofia. Talent & Capability Flow lifts Global Citizen.
3. **Cap persona tags at three.** A piece tagged for all five is a piece tagged for none — the filtering can't surface it for the people who need it.
4. **Global Citizen is not a default.** Use it deliberately, for pieces that genuinely reach beyond the specialised decision-maker types. It is not "everyone."

The CMS uses **short slugs** at the article level: `clara`, `ian`, `sofia`, `citizen`, `troy`. The persona documents themselves use longer slugs: `compliance-clara`, `industrial-ian`, `sovereign-sofia`, `global-citizen`, `transatlantic-troy`. Same people; different field.

---

## 01 · Compliance Clara

**Role:** Legal / Compliance Counsel
**Slug:** `clara`
**Persona doc slug:** `compliance-clara`

### Where she works

- Mid-to-large tech companies (Tier-1 SaaS, enterprise software, AI vendors)
- SaaS providers operating in the EU under cross-jurisdictional obligations
- Regulated industries adjacent to tech: finance, healthcare, defence
- Large law firms with a technology / data practice

**Real-world example:** In-house counsel at a B2B SaaS firm with €200M ARR, assessing AI Act obligations across product lines and reporting to a board that doesn't understand the difference between Article 6 and Article 50.

### What keeps her up at night

- AI Act risk classification for existing products — particularly the Article 6 (high-risk) determination process and the documentation it triggers
- Cross-jurisdictional compliance where US export controls, EU AI Act, and sectoral regulation collide
- Documentation and audit-trail requirements she has to specify before her engineering teams have even decided what the product will do
- Vendor liability and supply-chain compliance — what her company inherits from upstream AI infrastructure providers

### What she reads us for

- Regulatory timelines with specific milestones (the AI Act phased enforcement schedule, in particular)
- Practical compliance checklists she can adapt for internal use
- Template documents and frameworks she can defend internally
- Worked examples of risk classification — what got classified high-risk, what didn't, why

### The pain point that drives her

She has to translate dense regulatory text into actionable compliance plans under deadline pressure, often without dedicated AI-governance resources internally. Her engineering team thinks compliance is overhead; her board thinks it's already handled. She is the one person in the room with both context and accountability, and she has nowhere to outsource the analytical work.

### What a piece tagged for Clara looks like

- The Stone Truth is about regulatory mechanics or compliance risk
- The Methodology Audit lights at least `policy-scenario-modelling` and probably `policy-long-memory-filter`
- The actionable insights are things she could put on a slide for her board on Monday
- The piece often closes with a link to `/tools/compliance-checker`

---

## 02 · Industrial Ian

**Role:** Supply Chain / Operations Director
**Slug:** `ian`
**Persona doc slug:** `industrial-ian`

### Where he works

- European manufacturers, particularly automotive and electronics OEMs
- Automotive Tier-1 suppliers (Bosch, Continental, Schaeffler-tier organisations)
- Industrial technology companies — Siemens, ABB, the broader Mittelstand
- Semiconductor adjacent: equipment, materials, packaging firms

**Real-world example:** VP Operations at a German automotive supplier managing semiconductor procurement for ADAS systems and assessing how to roll AI-assisted production onto a regulated factory floor.

### What keeps him up at night

- Semiconductor supply-chain concentration risk — particularly Taiwan exposure and the next layer down (substrate, advanced packaging, specialised materials)
- US-China decoupling and what it means for components his designs are already locked into
- AI adoption in manufacturing under regulatory constraints — the Annex III high-risk industrial use cases under the AI Act
- Vendor dependency, single-source exposure, and the slow erosion of operational sovereignty across a procurement portfolio

### What he reads us for

- Supply-chain risk mapping and analysis at the depth most trade press doesn't reach
- Geopolitical scenario modelling that connects macro events to component-level exposure
- Vendor assessment frameworks he can hand to his procurement team
- Early warning indicators for disruption — what to monitor, where to look

### The pain point that drives him

He is caught between two pressures pulling in opposite directions: an executive committee asking him to adopt AI for efficiency, and a regulatory environment asking him to govern that AI under the AI Act. Meanwhile, his actual job — managing a fragile global supply chain in 2026 — is harder than at any point in his career, and the analytical resources available to him are either too generic (consulting decks) or too specialised (industry-conference papers) to be operationally useful.

### What a piece tagged for Ian looks like

- The Stone Truth is about a physical chokepoint, a supplier dependency, or a production-floor regulatory cliff
- The Methodology Audit always lights at least one `supply-chain-*` cell, and usually `talent-scenario-modelling` as well
- The actionable insights are things his team could action this quarter — "audit your exposure to X," "set up monitoring for Y"
- The piece often closes with a link to `/tools/supply-chain-mapper` or `/tools/scenario-modeler`

---

## 03 · Sovereign Sofia

**Role:** Policy Analyst / Advisor
**Slug:** `sofia`
**Persona doc slug:** `sovereign-sofia`

### Where she works

- Government digital-policy units (BMWK, DGE, UK DSIT, etc.)
- Think tanks and research institutes — Bruegel, Stiftung Neue Verantwortung, Centre for European Reform
- EU institutions and advisory bodies — DG CONNECT, AI Office, EESC
- Embassy science / technology attaché roles

**Real-world example:** EU Digital Policy Unit analyst tracking AI Act implementation across member states and preparing impact briefings for the cabinet of a senior Commissioner.

### What keeps her up at night

- Digital sovereignty and strategic autonomy — particularly where the rhetoric outpaces the operational reality
- Transatlantic regulatory divergence — what happens when Brussels and Washington enforce different rules on the same companies
- Technology standards and governance frameworks — who sets them, who follows, who arbitrages
- Democratic accountability in AI deployment, especially when capability is concentrated in non-European hyperscalers

### What she reads us for

- Deep comparative analysis across jurisdictions, particularly EU / US / China
- Timeline tracking for regulatory milestones with the structural context that's missing from her internal briefings
- Expert commentary with cited sources — she will check the citations
- Scenario analysis for policy options, including the scenarios her own organisation would prefer not to look at

### The pain point that drives her

She has to keep up with regulatory changes across multiple jurisdictions, in policy areas where the substantive technical reality is moving as fast as the legal text, while maintaining the analytical rigour her credibility depends on. Most coverage available to her is either too captured (industry-funded) or too academic (peer-review pace). She needs practitioner-grade analysis from someone who isn't fundraising or selling.

### What a piece tagged for Sofia looks like

- The Stone Truth is about jurisdictional dynamics, strategic autonomy, or the divergence between regulatory intent and enforcement reality
- The Methodology Audit usually lights `policy-long-memory-filter` (she likes the 30-year cycle pattern matching) and `policy-scenario-modelling`
- The piece often references historical regulatory precedents — the 1986 Semiconductor Agreement, the GDPR rollout pattern, Schrems II
- The piece often closes with a link to `/tools/policy-stress-test`

---

## 04 · Global Citizen

**Role:** Informed General Public
**Slug:** `citizen`
**Persona doc slug:** `global-citizen`

### Where they work

- Independent professionals — consultants, freelance writers, podcast hosts
- Journalists and commentators covering technology, business, or politics
- Educators and researchers outside the three specialised decision-maker types
- Engaged citizens — informed readers without an operational stake but with substantive interest

**Real-world example:** Technology journalist at a national broadsheet, or an informed professional in an adjacent field (medicine, law, education) who follows AI regulation debates and wants analysis beyond headline takes.

### What keeps them up at night

- Understanding the real-world impact of AI regulation past the rhetorical layer
- Cutting through vendor hype and motivated commentary
- Democratic implications of AI governance decisions — particularly the concentration of capability outside the EU
- Making sense of complex geopolitical technology dynamics that mainstream coverage flattens

### What they read us for

- Accessible but rigorous analysis — analytical depth without insider jargon
- Context and background for emerging stories — the structural framing the news cycle skips
- Clear explanations of technical and legal concepts that most reporting glosses
- An independent perspective, demonstrably not captured by any single industry interest

### The pain point that drives them

They want substantive analysis but find most coverage either too superficial (mainstream media) or too captured (trade press funded by the industry it covers). The independent commentary that does exist is mostly aimed at one of the specialised decision-maker types and assumes context they don't have. They need rigorous work pitched at a generalist register — and they're often the people who go on to recommend Silicon and Stone to the three specialised personas.

### What a piece tagged for Global Citizen looks like

- The Stone Truth is broadly intelligible — quotable in a general-audience context, not just an industry one
- The piece is usually a **Briefing** tier rather than an Audit (full matrix can lose this reader)
- The Methodology Audit is visible but not central — the reader can ignore it if they want and still get value
- The piece tends to apply the Long-Memory Filter heavily — historical analogy lands well with this audience
- Use this tag deliberately. A piece tagged "Global Citizen + Industrial Ian" is appropriate for a Pax Silica overview. A piece tagged "Global Citizen + Compliance Clara + Sovereign Sofia" is probably over-tagged.

---

## 05 · Transatlantic Troy

**Role:** Founder / CEO
**Slug:** `troy`
**Persona doc slug:** `transatlantic-troy`

### Where he works

- US and Canadian startups doing business — or wanting to do business — in Europe
- North American mid-market companies with EU customers (not Big Tech giants)
- SaaS and AI product companies expanding transatlantically

**Real-world example:** CEO of a US B2B AI startup with early European traction, weighing whether full EU market entry is worth the compliance cost and what the AI Act, data localisation, and cloud certification rules require of a non-EU provider.

### What keeps him up at night

- AI Act obligations for non-EU providers selling into Europe — what applies to him and when
- Data localisation and cross-border transfer requirements that reshape his architecture and cost base
- EU cloud certification and sovereignty tier schemes that decide whether his stack is even eligible
- Public procurement rules that quietly favour European suppliers over him

### What he reads us for

- Market-entry compliance checklists — what he must do differently because of the sovereignty landscape
- Cost-of-compliance analysis for non-EU entrants — is the market worth it?
- EU regulatory timelines read from a US vantage point
- Certification and procurement requirement breakdowns before he commits engineering time

### The pain point that drives him

He is on the outside looking in. Where Compliance Clara is already inside a European operation managing deadlines, and Industrial Ian is running existing European supply chains, Troy is assessing whether the market is worth entering at all — and what digital sovereignty will cost him to navigate — without an EU legal team on staff. His question for every briefing: *"What does this mean for my European market entry, and what do I need to do differently because of it?"*

### What a piece tagged for Troy looks like

- The Stone Truth is about US-EU regulatory tension, market-access cost, or what sovereignty rules demand of non-EU providers
- The piece reads through the Institutional lens (obligations, exposures, decisions) but from a transatlantic market-entry angle
- The actionable insights are things he could raise with his leadership team before committing to a European go-to-market
- Tags often pair with Clara (shared regulatory substance) but from the outside-in perspective

---

## Shared psychographics

All five personas — regardless of role — share a set of values and frustrations the framework is built to serve.

### Shared values

- **Evidence-based decision-making** over narrative or vibe
- **European strategic autonomy** as a working hypothesis, not a slogan
- **Pragmatism over ideology** — both Silicon Valley techno-optimism and Brussels regulatory pessimism are off-putting
- **Long-term thinking over reactive policy** — they want analysis that holds up at a 3–5 year horizon

### Shared frustrations

- AI hype drowning out substantive analysis
- Potential workforce displacement concerns, often unspoken
- Lack of a coordinated US-EU resource strategy
- Regulatory complexity outpacing organisational capacity to absorb it
- Vendor-captured analysis masquerading as independent research

### Where they actually look for information

- Policy briefings and think-tank reports (but they want shorter, sharper versions)
- Industry conferences and working groups (where the best work is undocumented)
- Curated newsletters and intelligence services (most are too generalist)
- Peer networks and professional communities (Silicon and Stone aims to become one of these for the three specialised personas)

This is the gap. Forensic Technopolitics, the four tools, and the planned YouTube cadence are all designed to occupy it.

---

## Persona maintenance

This document is the source of truth. The downstream artefacts derive from it:

- **`context/core/icp.json`** — consumed by Hyperagent during drafting. Update when persona definitions change.
- **Sanity persona documents** — visible in Studio when polishing a draft. Update via Sanity MCP or directly in Studio when persona definitions change.
- **The five-persona summary in the Welcome Pack** — short version of this doc, kept in sync.

When the persona model evolves (a new persona is added, an existing one is split, a slug is renamed), update in this order: markdown → ICP JSON → Sanity → Welcome Pack. Don't fork.

---

Silicon and Stone · Persona profiles v1.1 · July 2026
Drafted by Hyperagent for Clive Struver · Sanday, Orkney
