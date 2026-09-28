## Section 4 — The Compliance Checklist

This section converts the obligations set out earlier into a working instrument. It is not a summary; it is the thing you print, mark up, and return to. The rows are deliberately terse so that ownership and evidence — the parts only you can supply — have room to be filled in.

### How to use this checklist

Work from your role register. Most organisations are a Deployer of someone else's system and, simultaneously, a Provider of any AI they build, fine-tune, or place on the market under their own name. Substantial modification of a third-party system can make you its Provider. Establish your role for each system before you tick anything, because the same obligation falls differently on a Provider than on a Deployer.

The sequence is fixed:

1. **Everyone completes Checklist A.** It is the universal floor — register, prohibited-practice screen, AI literacy, vendor diligence, governance owner. Nothing else is reliable until A is done.
2. **Add Checklist B** if any system interacts with people, or generates or manipulates content. The transparency duties bite on **2 August 2026**.
3. **Add Checklist C** if you are a Provider of a high-risk system; **Checklist D** if you are its Deployer; **Checklist E** if you import or distribute one.

The **Target date** column is pre-filled with the staged statutory deadline for each obligation, not an internal preference. Where an item is good practice with no fixed date, the cell reads "Standing". Treat the statutory dates as the latest acceptable completion, not the start.

Every row carries a stable **ID** (A-01, P-01, B-01 and so on). The same IDs appear in the workbook's Requirements tab, so an action raised in the workbook points back to the exact row here.

Owner, Status, and Evidence location are yours to populate. For **Status**, use a Red / Amber / Green convention: Green means complete with evidence filed; Amber means in progress; Red means not started or failing. **Evidence location** should be a real pointer — a file path, a document reference, a register row — not a description of intent. An obligation you cannot evidence is, for audit purposes, an obligation you have not met.

A note on the supersession that governs every date below: the August 2026 "cliff" that circulated in earlier commentary does not exist in this form. The 2026 Digital Omnibus staged the high-risk regime. On **2 August 2026** the transparency obligations (Article 50), the penalty framework, and the governance architecture apply. The substantive high-risk duties follow later — **2 December 2027** for standalone Annex III systems, **2 August 2028** for high-risk systems embedded in regulated products under Annex I. Do not bring high-risk remediation forward into 2026 on the assumption that it is then due; do not let the later dates lull you, either, because the technical-documentation and data-governance work behind them takes many months.

---

### Checklist A — Universal (every organisation, every tier)

Applies regardless of risk tier or role. Until these rows are Green, the role-specific checklists rest on uncertain ground.

| ☐ ID | Task | Owner | Target date | Status | Evidence location |
|---|------|-------|-------------|--------|-------------------|
| ☐ A-01 | Appoint a named AI governance owner with authority over the AI estate and a direct reporting line to senior management. | | Standing | | |
| ☐ A-02 | Define and minute that person's mandate, decision rights, and escalation route for AI risk. | | Standing | | |
| ☐ A-03 | Stand up the AI Systems Register as the single source of truth for every AI system in use, procured, or under development. | | Standing | | |
| ☐ A-04 | Record for each system: name, function, business owner, your role (Provider / Deployer / Importer / Distributor), and provisional risk tier. | | Standing | | |
| ☐ A-05 | Record for each system the underlying model or vendor, including any general-purpose AI model relied upon. | | Standing | | |
| ☐ A-06 | Establish a register intake step so no new AI system is procured or deployed without an entry. | | Standing | | |
| ☐ A-07 | Screen every registered system against the Article 5 prohibited practices (see Checklist A — prohibitions, below). | | 2 Feb 2025 | | |
| ☐ A-08 | Document the outcome of each prohibition screen, including the reasoning where a system is cleared. | | 2 Feb 2025 | | |
| ☐ A-09 | Withdraw, disable, or remediate any system found to involve a prohibited practice; treat this as immediate, not scheduled. | | 2 Feb 2025 | | |
| ☐ A-10 | Assess the AI literacy required by each role that builds, procures, oversees, or operates AI systems. | | 2 Feb 2025 | | |
| ☐ A-11 | Deliver AI-literacy training proportionate to each role's exposure and document attendance. | | 2 Feb 2025 | | |
| ☐ A-12 | Refresh AI-literacy content as systems, roles, and the regulatory position change. | | Standing | | |
| ☐ A-13 | Conduct vendor due diligence for each AI supplier, recording the vendor's legal entity and headquarters location. | | Standing | | |
| ☐ A-14 | Record, for each vendor, where data is processed and stored, and which sub-processors are involved. | | Standing | | |
| ☐ A-15 | Obtain and file each vendor's statement of its own role and its AI Act / GPAI compliance position. | | Standing | | |
| ☐ A-16 | Retain the vendor contract terms covering AI Act allocation of responsibilities and audit rights. | | Standing | | |
| ☐ A-17 | Decide and minute a review cadence for the register and this checklist (for example, quarterly), with a named owner per cycle. | | Standing | | |
| ☐ A-18 | Schedule the first scheduled review and set a recurring calendar reminder. | | Standing | | |

#### Checklist A — Prohibited-practice screen (Article 5)

Run each registered system against the rows below. Any system matching a prohibition is a stop-now item, addressed in this section's closing note. P-01 to P-08 have applied since 2 February 2025; P-09 and P-10, added to Article 5 by the 2026 Digital Omnibus, apply from 2 December 2026.

| ☐ ID | Task | Owner | Target date | Status | Evidence location |
|---|------|-------|-------------|--------|-------------------|
| ☐ P-01 | Confirm no system deploys subliminal, manipulative, or deceptive techniques that materially distort behaviour and cause harm. | | 2 Feb 2025 | | |
| ☐ P-02 | Confirm no system exploits vulnerabilities of age, disability, or socio-economic situation to distort behaviour. | | 2 Feb 2025 | | |
| ☐ P-03 | Confirm no system performs social scoring leading to detrimental treatment across unrelated contexts. | | 2 Feb 2025 | | |
| ☐ P-04 | Confirm no system assesses or predicts the risk of an individual committing a criminal offence based solely on profiling. | | 2 Feb 2025 | | |
| ☐ P-05 | Confirm no system scrapes facial images untargeted from the internet or CCTV to build recognition databases. | | 2 Feb 2025 | | |
| ☐ P-06 | Confirm no system infers emotions in the workplace or in education, outside permitted medical or safety grounds. | | 2 Feb 2025 | | |
| ☐ P-07 | Confirm no system performs biometric categorisation inferring protected characteristics outside permitted exceptions. | | 2 Feb 2025 | | |
| ☐ P-08 | Confirm no use of real-time remote biometric identification in public spaces for law enforcement outside the narrow exceptions. | | 2 Feb 2025 | | |
| ☐ P-09 | Confirm no system is placed on the market, put into service or used to generate or manipulate realistic intimate or sexually explicit material of an identifiable person without their explicit consent (Art 5(1)(ba)). | | 2 Dec 2026 | | |
| ☐ P-10 | Confirm no system is placed on the market, put into service or used to generate or manipulate child sexual abuse material (Art 5(1)(bb)). | | 2 Dec 2026 | | |

> The register is the load-bearing wall of this entire exercise. Every obligation that follows is scoped, evidenced, and audited against it. An organisation that cannot say with confidence which AI systems it runs has not yet started compliance — it has only described it.

---

### Checklist B — Limited-risk / transparency (due 2 August 2026)

Applies to any system that interacts directly with people, or that generates or manipulates image, audio, video, or text content. These are the obligations that genuinely apply from 2 August 2026 — not the high-risk regime.

| ☐ ID | Task | Owner | Target date | Status | Evidence location |
|---|------|-------|-------------|--------|-------------------|
| ☐ B-01 | Identify every system in the register where a person interacts with AI (chatbots, voice agents, conversational interfaces). | | 2 Aug 2026 | | |
| ☐ B-02 | Ensure each such system discloses to the person that they are interacting with an AI, unless it is obvious from context. | | 2 Aug 2026 | | |
| ☐ B-03 | Place the disclosure at the point of interaction, in clear and accessible language. | | 2 Aug 2026 | | |
| ☐ B-04 | Identify every system that generates or manipulates synthetic image, audio, video, or text. | | 2 Aug 2026 | | |
| ☐ B-05 | Mark AI-generated or manipulated output in a machine-readable format, detectable as artificially generated. | | 2 Aug 2026 | | |
| ☐ B-06 | Label deep-fake image, audio, or video content as artificially generated or manipulated. | | 2 Aug 2026 | | |
| ☐ B-07 | Disclose, for AI-generated text published to inform the public on matters of public interest, that it is artificially generated. | | 2 Aug 2026 | | |
| ☐ B-08 | Confirm reliance on any applicable exception (for example, content forming part of an evidently artistic or creative work) and record the basis. | | 2 Aug 2026 | | |
| ☐ B-09 | Update privacy notices to reflect AI processing of personal data and any automated interaction. | | 2 Aug 2026 | | |
| ☐ B-10 | Update website, product, and customer-facing transparency notices to reflect AI use and the disclosures above. | | 2 Aug 2026 | | |
| ☐ B-11 | Brief customer-facing and content teams on the labelling and disclosure rules so they are applied consistently. | | 2 Aug 2026 | | |
| ☐ B-12 | If you provide a system generating synthetic audio, image, video or text that was placed on the market before 2 August 2026, bring its machine-readable marking (B-05) into line by 2 December 2026 (Art 111(4)). | | 2 Dec 2026 | | |

---

### Checklist C — High-risk Provider

Applies if you build, place on the market, or put into service a high-risk system under your own name or trademark, or if you substantially modify one. The deadline depends on the route: **2 December 2027** for standalone high-risk systems in the Annex III areas; **2 August 2028** for high-risk systems that are, or are a safety component of, products regulated under Annex I. Confirm which route each system follows and apply the corresponding date in the rows below.

The technical and data-governance rows are the long-lead items. Begin them well ahead of the statutory date; conformity assessment cannot be done against documentation that does not yet exist.

| ☐ ID | Task | Owner | Target date | Status | Evidence location |
|---|------|-------|-------------|--------|-------------------|
| ☐ C-01 | Confirm the route for each high-risk system (Annex III standalone or Annex I embedded) and record the governing deadline. | | 2 Dec 2027 / 2 Aug 2028 | | |
| ☐ C-02 | Establish, document, and maintain a risk management system across the system's lifecycle (Art 9). | | 2 Dec 2027 / 2 Aug 2028 | | |
| ☐ C-03 | Identify, estimate, and evaluate foreseeable risks, and adopt risk mitigation measures, recording residual risk. | | 2 Dec 2027 / 2 Aug 2028 | | |
| ☐ C-04 | Apply data governance to training, validation, and test datasets: relevance, representativeness, and examination for bias (Art 10). | | 2 Dec 2027 / 2 Aug 2028 | | |
| ☐ C-05 | Document dataset provenance, collection, and preparation, and record measures taken to detect and correct bias. | | 2 Dec 2027 / 2 Aug 2028 | | |
| ☐ C-06 | Draw up the technical documentation in accordance with Annex IV before the system is placed on the market (Art 11). | | 2 Dec 2027 / 2 Aug 2028 | | |
| ☐ C-07 | Keep the technical documentation current as the system changes, and retain it for the statutory period. | | 2 Dec 2027 / 2 Aug 2028 | | |
| ☐ C-08 | Design the system for automatic logging of events over its lifetime to support traceability (Art 12). | | 2 Dec 2027 / 2 Aug 2028 | | |
| ☐ C-09 | Define a log retention period appropriate to the system's purpose and confirm logs are accessible for audit. | | 2 Dec 2027 / 2 Aug 2028 | | |
| ☐ C-10 | Draft instructions for use that are clear, complete, and accessible to Deployers (Art 13). | | 2 Dec 2027 / 2 Aug 2028 | | |
| ☐ C-11 | State in the instructions the system's characteristics, capabilities, limitations, intended purpose, and required human oversight. | | 2 Dec 2027 / 2 Aug 2028 | | |
| ☐ C-12 | Design the system so that Deployers can exercise effective human oversight, including stop or override capability (Art 14). | | 2 Dec 2027 / 2 Aug 2028 | | |
| ☐ C-13 | Specify the human-oversight measures built into the system and those left to the Deployer to implement. | | 2 Dec 2027 / 2 Aug 2028 | | |
| ☐ C-14 | Design and test for an appropriate level of accuracy, robustness, and cybersecurity, and declare accuracy metrics (Art 15). | | 2 Dec 2027 / 2 Aug 2028 | | |
| ☐ C-15 | Test resilience against errors, faults, inconsistencies, and adversarial manipulation, and record the results. | | 2 Dec 2027 / 2 Aug 2028 | | |
| ☐ C-16 | Establish a quality management system covering the full compliance process, with documented policies and procedures (Art 17). | | 2 Dec 2027 / 2 Aug 2028 | | |
| ☐ C-17 | Carry out the applicable conformity assessment procedure before placing the system on the market. | | 2 Dec 2027 / 2 Aug 2028 | | |
| ☐ C-18 | Draw up the EU declaration of conformity and affix the CE marking. | | 2 Dec 2027 / 2 Aug 2028 | | |
| ☐ C-19 | Register the system in the EU database for high-risk AI systems before placing it on the market or putting it into service. | | 2 Dec 2027 / 2 Aug 2028 | | |
| ☐ C-20 | Establish and document a post-market monitoring system to collect and review performance data in use (Art 72). | | 2 Dec 2027 / 2 Aug 2028 | | |
| ☐ C-21 | Establish a procedure for reporting serious incidents and malfunctioning to the competent authorities within the statutory timeframes (Art 73). | | 2 Dec 2027 / 2 Aug 2028 | | |
| ☐ C-22 | Appoint an EU authorised representative where the Provider is established outside the Union. | | 2 Dec 2027 / 2 Aug 2028 | | |
| ☐ C-23 | Define the corrective-action and withdrawal procedure for systems found not to conform after placing on the market. | | 2 Dec 2027 / 2 Aug 2028 | | |

---

### Checklist D — High-risk Deployer (due 2 December 2027)

Applies if you use a high-risk system in the course of your activity — the position most organisations occupy. Your duties are narrower than a Provider's but are not optional, and several depend on the Provider having done its part. The standalone Annex III date of **2 December 2027** governs; for embedded Annex I systems, align with the **2 August 2028** date.

| ☐ ID | Task | Owner | Target date | Status | Evidence location |
|---|------|-------|-------------|--------|-------------------|
| ☐ D-01 | Identify each high-risk system you deploy and confirm the Provider has supplied instructions for use. | | 2 Dec 2027 | | |
| ☐ D-02 | Use the system strictly in accordance with the Provider's instructions for use (Art 26). | | 2 Dec 2027 | | |
| ☐ D-03 | Assign human oversight to natural persons with the competence, training, authority, and resources to perform it. | | 2 Dec 2027 | | |
| ☐ D-04 | Record the named oversight personnel and the override or stop actions available to them. | | 2 Dec 2027 | | |
| ☐ D-05 | Monitor the operation of the system against the instructions and watch for risks arising in your use context. | | 2 Dec 2027 | | |
| ☐ D-06 | Keep the logs the system generates, where they are under your control, for the statutory retention period. | | 2 Dec 2027 | | |
| ☐ D-07 | Suspend use and inform the Provider and authority where the system presents a risk or a serious incident occurs. | | 2 Dec 2027 | | |
| ☐ D-08 | Inform affected persons that they are subject to a high-risk system's use where this is required. | | 2 Dec 2027 | | |
| ☐ D-09 | Where you deploy in employment or for workers, inform worker representatives and affected workers before putting the system into use. | | 2 Dec 2027 | | |
| ☐ D-10 | Determine whether a Fundamental Rights Impact Assessment is required (Art 27), and record the determination. | | 2 Dec 2027 | | |
| ☐ D-11 | Where required, carry out the Fundamental Rights Impact Assessment covering affected persons, risks, and oversight measures, and notify the authority. | | 2 Dec 2027 | | |
| ☐ D-12 | Ensure input data is relevant and sufficiently representative for the system's intended purpose, where you control the input. | | 2 Dec 2027 | | |
| ☐ D-13 | Confirm whether decisions are solely automated and produce legal or similarly significant effects, engaging GDPR Article 22. | | 2 Dec 2027 | | |
| ☐ D-14 | Where Article 22 applies, implement the safeguards: meaningful human intervention, the right to contest, and an explanation of the decision. | | 2 Dec 2027 | | |
| ☐ D-15 | Confirm a lawful basis and data protection impact assessment under GDPR for personal-data processing by the system. | | 2 Dec 2027 | | |

---

### Checklist E — Importer / Distributor (where relevant)

Applies where you place a high-risk system on the EU market on behalf of a non-EU Provider (Importer) or make one available in the supply chain without changing it (Distributor). Your duty is verification before the system moves, not re-assessment of its design.

| ☐ ID | Task | Owner | Target date | Status | Evidence location |
|---|------|-------|-------------|--------|-------------------|
| ☐ E-01 | Confirm your role for each system (Importer or Distributor) and record it in the register. | | 2 Dec 2027 / 2 Aug 2028 | | |
| ☐ E-02 | Verify the Provider has carried out the relevant conformity assessment before placing the system on the market (Importer, Art 23). | | 2 Dec 2027 / 2 Aug 2028 | | |
| ☐ E-03 | Verify the system bears the CE marking and is accompanied by the EU declaration of conformity. | | 2 Dec 2027 / 2 Aug 2028 | | |
| ☐ E-04 | Verify the technical documentation and instructions for use are present and the system is registered in the EU database. | | 2 Dec 2027 / 2 Aug 2028 | | |
| ☐ E-05 | Confirm the Provider has appointed an EU authorised representative where established outside the Union. | | 2 Dec 2027 / 2 Aug 2028 | | |
| ☐ E-06 | Confirm the Provider's name, registered trade name, and contact address are indicated on the system or its documentation. | | 2 Dec 2027 / 2 Aug 2028 | | |
| ☐ E-07 | Withhold from the market any system you believe does not conform, and inform the Provider and authority (Distributor, Art 24). | | 2 Dec 2027 / 2 Aug 2028 | | |
| ☐ E-08 | Ensure storage and transport conditions do not jeopardise the system's compliance while under your responsibility. | | 2 Dec 2027 / 2 Aug 2028 | | |
| ☐ E-09 | Record that you have not modified the system; note that substantial modification would make you its Provider under Checklist C. | | 2 Dec 2027 / 2 Aug 2028 | | |

---

### Closing the loop

Every row above appears, under the same ID, in the Requirements tab of the toolkit workbook. Raise actions against those IDs in the Actions tab, one per system where the duty falls system by system, and the Requirements tab counts the actions open and complete against each row. The printed checklist is where you decide what applies; the workbook is where owners, dates and evidence are tracked and reported upward. Keep the Evidence location column populated as you go; an obligation marked Green without a pointer to its evidence will not survive scrutiny.

Two distinctions matter when you read the Status column at a glance. A Red on a high-risk row in Checklist C, D, or E is a planning item: the work is dated, the date is in the future, and the task is to close the gap before it arrives. A Red on any prohibited-practice row (P-01 to P-10) is not a planning item. P-01 to P-08 have applied since 2 February 2025, P-09 and P-10 from 2 December 2026, and a prohibited practice in live use once its date has passed is a present breach, not a future one. Stop the system first; document the remediation second.
