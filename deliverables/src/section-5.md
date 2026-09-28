## Section 5 — Using the Register and Templates

This section explains the Register the workbook holds and the four editable templates supplied with this handbook as Word documents, each with a PDF reference copy: the **Internal AI Governance Policy**, the **AI Transparency Notice**, the **Vendor Assessment Questionnaire** and the **Board-Ready Risk Summary**. They are working tools, not specimens. Every `[bracketed field]` — highlighted in the Word files — marks a decision you must make rather than text you can leave as it is. Adapt the wording to your sector and house style, but do not delete obligations to make a document shorter. An incomplete policy is harder to defend than an honest one that admits gaps.

### AI Systems Register (field schema)

**Purpose:** Defines the columns of the central inventory you maintain of every AI system your organisation builds, buys, or embeds. These are the columns of the workbook’s Register tab, and the Register is the single document a market-surveillance authority will ask for first.

The Register exists because almost every obligation in the AI Act is conditional on three facts: what the system is, what tier it falls into, and what role you play in relation to it. You cannot answer a regulator, a customer, or your own board on any of those without a list. The schema below is deliberately flat — one row per system — so that it can live in a spreadsheet and be filtered, sorted, and exported without specialist tooling.

| Field | What to record | Why it matters |
|---|---|---|
| System ID | A short stable identifier. The workbook pre-assigns them (`SYS-014`). Never reuse a retired ID. | Lets you reference a system in policies, tickets, and DPIAs without ambiguity when names change. |
| System name | The product or internal name as staff actually call it (e.g. "GitHub Copilot", "Claims Triage Model v3"). | The human-readable handle. Mismatches between the name here and the name staff use are how shadow AI hides. |
| Vendor | The legal entity supplying the system, or "In-house" if you built it. | Determines who, if anyone, is the upstream Provider and who owes you conformity documentation. |
| Vendor ID | The supplier's `VEN-` ID from the workbook's Suppliers tab, or "In-house". The Register looks up the vendor's name and HQ from it. | One supplier record, however many systems it supplies — so a dependency score is made once and applies everywhere. |
| Vendor HQ | The country of the vendor's controlling legal entity (e.g. "United States — Delaware"). | First input to jurisdictional and concentration risk; signals which legal regime governs the vendor's conduct. |
| Data storage region | Where the data you send is stored and processed at rest (e.g. "EU — Frankfurt", "US multi-region", "Unknown — under query"). | Drives data-sovereignty exposure and intersects with GDPR transfer obligations. "Unknown" is a valid and important entry. |
| Our role | One of: Provider, Deployer, Importer, Distributor — your role for this specific system. A single organisation holds different roles for different systems. | Role determines which obligations attach to you. Misclassifying a Deployer as a passive user is a common and costly error. |
| Department | The business function that owns and uses the system (e.g. "HR", "Customer Operations"). | Locates accountability and tells you which staff need AI-literacy training under Art 4. |
| Primary use case | One plain sentence on what the system decides, generates, or assists with. | The use case — not the technology — determines risk tier. "Ranks job applicants" and "drafts marketing copy" sit in different tiers. |
| Data inputs | The categories of data fed in (e.g. "CV text, employment history", "customer support transcripts"). Flag special-category or biometric data. | Special-category, biometric, and emotion data raise the tier and may touch Art 5 prohibitions. |
| Data outputs | What the system produces and whether a human or an automated process consumes it (e.g. "shortlist score, reviewed by recruiter"). | Distinguishes decision-support from automated decision-making, which changes the human-oversight burden. |
| Risk classification | One of: Unassessed, Prohibited, High-risk, Limited risk, Minimal — with the reasoning recorded beside it. | The master field. Everything downstream — obligations, documentation, training — keys off it. |
| Annex (III / I / N/A) | If High-Risk, whether it qualifies under Annex III (standalone) or Annex I (safety component embedded in a regulated product). `N/A` otherwise. | Determines the applicable date: Annex III bites 2 Dec 2027, Annex I bites 2 Aug 2028. The two are not interchangeable. |
| Key obligations trigger | The headline duties this row creates (e.g. "Art 50 transparency notice", "Annex III logging + human oversight", "vendor conformity assessment on file"). | Turns a classification into a task list. This is the column that drives your remediation backlog. |
| Compliance status | One of: Compliant, In progress, Gap, Not started, Not yet in force. | Honest status reporting. "Not yet in force" records a known future duty so it is not mistaken for an oversight. |
| System owner | A named individual (role plus person), not a team. | Accountability collapses without a name. The owner answers for the row at review. |
| Evidence location | A path or link to where the supporting documents live (DPIA, vendor pack, instructions for use, conformity declaration). | A classification you cannot evidence is an assertion. This field is what makes the Register auditable. |
| Review date | The date this row was last verified and the date it is next due (e.g. "Verified 2026-05-01 / Next 2026-11-01"). | A Register reviewed once is a snapshot, not a control. Stale rows are the default failure mode. |

Treat the Register as the source of truth, which means it must be current rather than complete-on-paper. Assign one owner for the Register as a whole, set a fixed review cadence (quarterly is defensible for most mid-sized organisations; monthly where high-risk systems are present), and make a new row a mandatory step in your procurement and project-approval process so that no system enters use without one. When a market-surveillance authority makes contact, the Register is the document that converts a panicked fortnight of discovery into a single export. Its credibility rests on the "Evidence location" and "Review date" columns: a regulator distinguishes an organisation that governs its AI from one that has merely listed it by whether the claims in each row can be opened and read.

### The workbook fields that are calculated for you

The Register tab adds calculated columns to the schema above. **Location flag** marks data held outside the EU/EEA, a vendor headquartered outside it, or a location nobody has recorded. **Checklists that apply** reads the role and tier and names the Section 4 checklists to work through. **Applicable from** gives the statutory date for the tier and Annex route. **Checks** lists what is missing from the row — role, reasoning, owner, evidence location, review date — so that an incomplete row cannot pass for a finished one. The *Register examples* tab shows ten fictitious systems reasoned through; two repay attention: a fraud-detection tool cleared from high-risk by the express exclusion in Annex III point 5(b), and an in-house machinery safety component on the Annex I route.

### Internal AI Governance Policy

**Purpose:** the internal rulebook that states how your organisation decides which AI systems it uses, who is accountable, and how it meets its obligations. It turns the Register and the transparency notice from artefacts into a governed process.

**Adopt it** at board or executive level, give it a version number and an owner, and circulate it to every department that touches AI. The ten sections run: purpose and scope; roles and responsibilities; the Register; the classification process; the approval gate before a new system is adopted; vendor assessment; human oversight for high-risk systems; AI literacy (Art 4); incident handling; and review cadence. The approval gate (section 5 of the policy) is the control that keeps the Register complete — no system enters use without an entry — and it is the one most often left out.

> A governance policy is not evidence that you are compliant; it is evidence of the standard against which your own gaps can be measured. Regulators read the distance between what your policy says and what your Register shows. Write a policy you can actually meet, then close the gap — an aspirational policy you breach is worse than a modest one you keep.

### AI Transparency Notice

**Purpose:** a short public statement telling people where they may meet AI in your services, supporting the Article 50 duties that have applied since 2 August 2026.

Publish it where people will actually meet it — a footer link, a chatbot's opening message, a labelled banner on generated content — not only inside a privacy policy. The notice does not replace the disclosure Article 50 requires at the point of interaction (checklist B-02, B-03) or the labelling of generated content (B-05 to B-07); it is the page those disclosures can point to.

A genuine transparency notice is judged by accuracy, not polish. Do not claim human review you do not perform, and do not list a system you have quietly retired. The notice and the Register must agree: every system whose Register row lists Checklist B should appear in the notice, and every system in the notice should have a Register row.

### Vendor Assessment Questionnaire

**Purpose:** twenty-six questions to send a prospective or incumbent AI vendor before you adopt its system, in four groups: scope and role, data and sovereignty, risk and compliance, and commercial dependency. The answers populate the Register, evidence your classification, and give you the facts to score the vendor on the workbook's Suppliers tab.

Issue it **before signing, not after**. Each question is annotated with the dependency dimension it informs — Data Sovereignty, Contractual Lock-In, Regulatory Risk, Concentration Risk, Alternative Availability — and the workbook's Scoring key lists the same question numbers against each dimension, so the same exercise both checks compliance and scores your dependency. The workbook shows no dependency band until all five dimensions are scored: an average of two scores reads as a finished assessment.

A vendor that cannot or will not answer the scope, documentation and data-location questions has told you something material; record the non-answer as a finding. The questionnaire is most useful comparatively: run two or three vendors through the same questions, and a dependency profile that looks acceptable in isolation often looks different beside an alternative that will commit to EU hosting, open data export, or a straight answer on its model supply chain.

### Board-Ready Risk Summary

**Purpose:** one printed page that puts your AI Act exposure in front of leadership: the position in one line, the estate by tier, the top three gaps, the top vendor dependencies and the ask for the next ninety days.

Fill it from the workbook's **Dashboard** tab, which calculates every count on the page. Include what has not yet been classified — a board should know what has not been looked at — and present readiness as what it is, a measure of what you can show, never as a compliance conclusion.

> The board does not need the regulation explained. It needs the size of the exposure, what is already covered, and what you are asking for. One page, three minutes.
