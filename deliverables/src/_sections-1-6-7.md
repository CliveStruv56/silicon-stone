## Section 1 — Executive Summary

The EU Artificial Intelligence Act (Regulation (EU) 2024/1689) is the first comprehensive, horizontal law governing artificial intelligence. It regulates AI not by sector but by **risk**: the more an AI system can affect people's safety, livelihoods, or fundamental rights, the heavier the obligations on those who build and use it. This toolkit translates that framework into something an operating business can act on — a way to find out which systems you run, what tier each falls into, what you owe, and by when.

### What the Act does

The Act sorts AI systems into four tiers. A small set of uses is **prohibited** outright. A defined list of consequential uses is **high-risk** and carries the bulk of the engineering and documentation burden. A further set carries **limited-risk** transparency duties — telling people when they are dealing with AI. Everything else is **minimal-risk** and unregulated beyond a baseline literacy duty. The whole of the rest of this document is, in effect, the machinery for placing each of your systems into the right tier and reading off the consequences.

Obligations also depend on your **role**. A *provider* builds a system or places it on the market under its own name and carries the heaviest duties. A *deployer* uses someone else's system in its own activities and carries a lighter, but real, set. Importers and distributors sit in between. Most organisations are deployers of bought-in tools — but a deployer that re-badges a system, or modifies it substantially, can become a provider in law without intending to. Establishing role is therefore the first move, not an afterthought.

### Who it applies to

The Act reaches well beyond businesses established in the EU. It applies to providers placing systems on the EU market wherever they are based, to deployers located in the EU, and — the limb most often missed — wherever the **output of a system is used in the EU**, even if the provider and deployer sit outside it. A UK or US business whose AI screens EU candidates, scores EU customers, or serves EU users is within scope. The question is not where you are incorporated, but where the effect lands.

### The dates that actually apply

Much early commentary described a single "August 2026 cliff" on which the AI Act's main obligations would arrive at once. **That is no longer the position.** The 2026 Digital Omnibus staged the regime across distinct dates, moving the heavy high-risk obligations well beyond 2026:

| Date | What applies |
| :---- | :---- |
| **2 February 2025** | Prohibited practices (Art 5) banned; AI-literacy duty (Art 4) in force |
| **2 August 2025** | General-purpose AI (GPAI) model rules apply |
| **2 August 2026** | Transparency duties (Art 50); penalties and governance framework operational |
| **2 December 2027** | Standalone high-risk systems (Annex III) — full obligations apply |
| **2 August 2028** | Embedded / product-safety high-risk systems (Annex I) — full obligations apply |

The practical reading is precise and matters for how you spend the next two years. The obligations already in force or imminent — confirming nothing prohibited is running, training staff to a baseline, and disclosing AI interactions by August 2026 — are cheap and frequently overlooked. The expensive high-risk obligations do not bite until December 2027 at the earliest, which is runway to build the evidence properly rather than reason to defer starting.

> The August 2026 date is real, but it is a transparency-and-penalties date, not a high-risk date. Your first compliance task is more likely a disclosure line on a chatbot than a conformity assessment.

### What non-compliance costs

The penalty ceilings are deliberately severe. Breaching the Article 5 prohibitions can attract fines of up to €35 million or 7% of total worldwide annual turnover, whichever is greater. Most other breaches of the high-risk and transparency obligations carry ceilings of up to €15 million or 3% of turnover, and supplying incorrect information to authorities up to €7.5 million or 1%. The proportionality provisions temper how these apply to smaller companies, but the direction is clear: this is a regime with enforcement teeth, supervised by national market-surveillance authorities and the European AI Office.

### How to use this toolkit

This document is built to be worked through in order, and then kept:

- **Section 2 — Decision Tree.** Classify each system: in scope, your role, its tier. Start here, system by system.
- **Section 3 — Requirements by Risk Category.** The obligations behind each classification, by article and by role, with the date each applies.
- **Section 4 — The Compliance Checklist.** A working, printable checklist with owner, date, status, and evidence fields. The part you pin to the wall.
- **Section 5 — Template Documents.** Ready-to-adapt register schema, transparency notice, governance policy, and vendor questionnaire.
- **Section 6 — Timeline and Action Plan.** The staged calendar plus a 90-day plan for an organisation starting today.
- **Appendix — Glossary and Resources.** Plain-language definitions and the official sources.

Two companion spreadsheets — the **AI Systems Register** and the **Compliance Tracker** — turn the register schema and checklist into live, auditable records. Use them; a regulator asks for a register first.

### The lens behind the toolkit

Silicon and Stone reads technology regulation through **Forensic Technopolitics** — a method that treats compliance not as a one-off legal event but as a moving exposure to be tracked. Three forensic domains (supply chain, policy, and talent) examined through two methods (scenario-based modelling and a long-memory filter against historical precedent) sit behind how we read the AI Act: where it will be enforced first, where the genuine operating constraints lie, and which dates will move again. The Act has already been re-staged once. Build for a maintained state, not a single deadline.

*This toolkit is an operational aid reconciled to the EU AI Act as amended by the 2026 Digital Omnibus. It is not legal advice. The Act's detailed obligations turn on specific facts; obtain qualified legal counsel before making decisions on individual systems.*

<div class="pagebreak"></div>

## Section 6 — Timeline and Action Plan

Compliance fails most often not on understanding but on sequencing — teams polish a distant obligation while a live one goes unmet. This section sets the staged calendar against which to plan, then gives an organisation starting from scratch a concrete first ninety days.

### The staged timeline

The 2026 Digital Omnibus replaced the original single deadline with a phased schedule. Read each system against the date that matches *its* tier and route, not the headline.

| Date | Milestone | What it means operationally |
| :---- | :---- | :---- |
| **2 Feb 2025** | Prohibited practices banned; AI-literacy duty live | Screen every system against Art 5 now; train staff to a baseline. Already enforceable. |
| **2 Aug 2025** | GPAI model rules apply | Relevant if you build or substantially fine-tune a general-purpose model. |
| **2 Aug 2026** | Transparency (Art 50); penalties & governance framework | Disclose AI interactions; label synthetic content; have an accountable owner and the penalty regime live. |
| **2 Dec 2027** | Standalone high-risk (Annex III) | Full provider/deployer obligations for hiring, credit, education, biometrics and the rest. |
| **2 Aug 2028** | Embedded high-risk (Annex I) | Full obligations for AI that is a safety component of a regulated product. |

The shape to hold in mind: a near band of cheap, already-live duties (prohibitions, literacy, transparency); then a gap; then an expensive high-risk band in 2027–2028. The right programme front-loads the near band and uses the gap to build the high-risk evidence base in order.

> The dates have already moved once. Plan against the staged schedule, but build a process that survives the next revision — a maintained register beats a one-off deadline scramble.

### A 90-day action plan

For an organisation beginning today with no formal AI governance. The aim of the first quarter is not full compliance — that is a multi-year programme for anyone with high-risk systems — but a defensible position: you know what you run, nothing prohibited is live, and you have a plan against the dates.

#### Days 1–30 — See the estate

- **Stand up the AI Systems Register** (Section 5 schema; companion spreadsheet). One row per system.
- **Find the systems.** Survey every department, including AI features inside CRM, office, and vendor-managed software, and tools adopted without approval. Most teams find more than they expected.
- **Run the prohibited-practice screen** (Art 5) across everything found. Anything matching is a stop-now item, not a planning item. Document the check and its reasoning.
- **Assign a named AI governance owner** with authority over the estate and a reporting line to leadership.
- **Brief the board** on initial exposure using the one-page summary (gateway pack template).

#### Days 31–60 — Classify and disclose

- **Classify each system** through the Section 2 decision tree: in scope, role, tier. Record role (watch Art 25), tier, Annex basis, and the date its obligations apply.
- **Start the AI-literacy programme** (Art 4) — proportionate training for staff who operate or rely on AI, with attendance recorded.
- **Scope the August 2026 transparency work** (Art 50): list chatbots and generative/synthetic-content systems; draft the disclosure lines and content labels; update transparency notices. This is the next hard deadline — treat it as the priority delivery.
- **Begin vendor assessment** for material suppliers using the Section 5 questionnaire; record HQ and data location; score dependency.

#### Days 61–90 — Govern and plan the high-risk runway

- **Adopt the Internal AI Governance Policy** (Section 5) at executive level, including the approval gate so no new system enters use without a register entry.
- **Populate the Compliance Tracker** from the Section 4 checklist; assign owners and target dates.
- **Build the high-risk roadmap.** For each high-risk system, map the Art 9–17 (provider) or Art 26–27 (deployer) obligations onto a timeline working back from 2 Dec 2027 (Annex III) or 2 Aug 2028 (Annex I). The technical-documentation and data-governance work is long-lead; start it in 2026.
- **Set the review cadence** (quarterly is defensible) and book the first review.

### The forward calendar

Beyond the first quarter, fix these as standing checkpoints:

- **Before 2 Aug 2026:** transparency disclosures live; governance owner and policy in place; literacy programme running.
- **Through 2026–2027:** high-risk evidence base under construction — risk-management files, data-governance records, technical documentation, instructions for use.
- **Before 2 Dec 2027:** standalone high-risk systems conformity-assessed, registered, and operating under documented human oversight; deployer FRIAs completed where required.
- **Before 2 Aug 2028:** embedded high-risk (product-safety) systems brought into the same state.

Each checkpoint is a register query, not a memory test — which is the point of maintaining the register from day one.

<div class="pagebreak"></div>

## Appendix — Glossary and Resources

### Glossary

**AI system.** A machine-based system that operates with some autonomy, may adapt after deployment, and *infers* from its inputs how to generate outputs — predictions, content, recommendations, or decisions — that influence physical or virtual environments. The inference test distinguishes it from purely deterministic, rule-based software.

**AI Office.** The European Commission body overseeing implementation of the Act, particularly for general-purpose AI, and coordinating with national authorities.

**AI literacy (Art 4).** The duty on providers and deployers to ensure staff operating AI have a sufficient understanding of it, proportionate to their role. In force since 2 February 2025, regardless of risk tier.

**Annex I.** The list of EU product-safety laws (machinery, medical devices, vehicles, lifts, toys, and more). AI that is a safety component of, or is itself, such a regulated product is **embedded high-risk** — obligations apply from 2 August 2028.

**Annex III.** The list of standalone high-risk use areas — employment, creditworthiness and essential services, education, biometrics, critical infrastructure, law enforcement, migration, and justice. Obligations apply from 2 December 2027.

**CE marking.** The conformity marking affixed to a high-risk system once it has passed the required conformity assessment, signalling it may be placed on the EU market.

**Conformity assessment.** The procedure by which a provider demonstrates a high-risk system meets the Act's requirements — internal control for most Annex III systems, or third-party assessment via a notified body where required.

**Deployer.** An actor using an AI system under its own authority in its professional activity. The role most organisations occupy.

**Digital Omnibus (2026).** The amending package that simplified and re-staged the AI Act, replacing the single 2026 deadline with the phased schedule used throughout this toolkit.

**Fundamental Rights Impact Assessment (FRIA, Art 27).** A structured assessment certain deployers of high-risk systems must complete before first use — public bodies and defined private categories such as creditworthiness and certain insurance uses.

**GDPR Article 22.** The data-protection right not to be subject to a solely automated decision with legal or similarly significant effect, save under defined conditions and with safeguards. Applies alongside the AI Act.

**General-purpose AI (GPAI).** A model capable of a wide range of tasks (such as a large language model). Model-provider rules apply from 2 August 2025; building or substantially fine-tuning one may make you a GPAI provider.

**High-risk.** The tier carrying the substantive obligations — Annex III standalone or Annex I embedded systems.

**Market-surveillance authority.** The national body enforcing the Act in each member state, with powers to demand documentation and investigate.

**Notified body.** An independent organisation designated to carry out third-party conformity assessments where the Act requires them.

**Prohibited practice (Art 5).** A use banned outright — including workplace/education emotion inference, social scoring, untargeted facial scraping, and certain manipulative or biometric uses. Banned since 2 February 2025.

**Provider.** An actor that develops a system and places it on the market or puts it into service under its own name or trademark. Carries the heaviest obligations.

**Substantial modification (Art 25).** A change to a high-risk system, or to its intended purpose, significant enough that the modifying party becomes its provider in law.

**Transparency obligations (Art 50).** Duties to disclose AI interaction and to mark AI-generated or manipulated content. Apply from 2 August 2026.

### Resources

- **Official text — Regulation (EU) 2024/1689** and consolidated amendments: the EU's *AI Act Service Desk* and EUR-Lex.
- **European Commission — AI Office:** implementation guidance, GPAI codes of practice, and the high-risk classification guidelines.
- **National competent authority:** identify and bookmark the market-surveillance authority for each member state in which you operate.
- **Regulatory sandboxes:** member states are establishing AI regulatory sandboxes; SMEs and small mid-caps have priority, reduced-cost access.
- **ISO/IEC 42001 (AI management systems):** the international AIMS standard, useful as a technical baseline for internal AI governance and as supporting evidence.
- **Companion deliverables:** the *AI Systems Register* and *Compliance Tracker* spreadsheets, and — for a lighter first pass — the *AI Audit Checklist Pack*.

---

*This toolkit is an operational aid reconciled to the EU AI Act as amended by the 2026 Digital Omnibus, and reflects the staged timeline current at the date of publication. It is not legal advice, and it does not create a lawyer–client relationship. The Act's obligations turn on the specific facts of each system; obtain qualified legal counsel before making decisions on individual systems or relying on any classification in this document. Regulatory content last reviewed 26 June 2026.*

*Silicon and Stone — Forensic Technopolitics. siliconandstone.com*
