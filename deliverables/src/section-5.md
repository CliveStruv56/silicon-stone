## Section 5 — Template Documents

The four documents below are working tools, not specimens. Each is intended to be lifted into your own systems, populated with your own facts, and maintained. The Register is a field schema you replicate in the companion spreadsheet; the remaining three are bracketed templates where every `[placeholder]` marks a decision you must make rather than text you can leave as-is. Adapt the wording to your sector and house style, but do not delete obligations to make the documents shorter. An incomplete policy is harder to defend than an honest one that admits gaps.

### AI Systems Register (field schema)

**Purpose:** Defines the columns of the central inventory you maintain of every AI system your organisation builds, buys, or embeds. This schema mirrors the companion spreadsheet and is the single document a market-surveillance authority will ask for first.

The Register exists because almost every obligation in the AI Act is conditional on three facts: what the system is, what tier it falls into, and what role you play in relation to it. You cannot answer a regulator, a customer, or your own board on any of those without a list. The schema below is deliberately flat — one row per system — so that it can live in a spreadsheet and be filtered, sorted, and exported without specialist tooling.

| Field | What to record | Why it matters |
|---|---|---|
| System ID | A short stable identifier you assign (e.g. `AI-014`). Never reuse a retired ID. | Lets you reference a system in policies, tickets, and DPIAs without ambiguity when names change. |
| System name | The product or internal name as staff actually call it (e.g. "GitHub Copilot", "Claims Triage Model v3"). | The human-readable handle. Mismatches between the name here and the name staff use are how shadow AI hides. |
| Vendor | The legal entity supplying the system, or "In-house" if you built it. | Determines who, if anyone, is the upstream Provider and who owes you conformity documentation. |
| Vendor HQ | The country of the vendor's controlling legal entity (e.g. "United States — Delaware"). | First input to jurisdictional and concentration risk; signals which legal regime governs the vendor's conduct. |
| Data storage region | Where the data you send is stored and processed at rest (e.g. "EU — Frankfurt", "US multi-region", "Unknown — under query"). | Drives data-sovereignty exposure and intersects with GDPR transfer obligations. "Unknown" is a valid and important entry. |
| Our role | One of: Provider, Deployer, Importer, Distributor — your role for this specific system. A single organisation holds different roles for different systems. | Role determines which obligations attach to you. Misclassifying a Deployer as a passive user is a common and costly error. |
| Department | The business function that owns and uses the system (e.g. "HR", "Customer Operations"). | Locates accountability and tells you which staff need AI-literacy training under Art 4. |
| Primary use case | One plain sentence on what the system decides, generates, or assists with. | The use case — not the technology — determines risk tier. "Ranks job applicants" and "drafts marketing copy" sit in different tiers. |
| Data inputs | The categories of data fed in (e.g. "CV text, employment history", "customer support transcripts"). Flag special-category or biometric data. | Special-category, biometric, and emotion data raise the tier and may touch Art 5 prohibitions. |
| Data outputs | What the system produces and whether a human or an automated process consumes it (e.g. "shortlist score, reviewed by recruiter"). | Distinguishes decision-support from automated decision-making, which changes the human-oversight burden. |
| Risk classification | One of: Prohibited, High-Risk, Limited Risk, Minimal. | The master field. Everything downstream — obligations, documentation, training — keys off it. |
| Annex (III / I / N/A) | If High-Risk, whether it qualifies under Annex III (standalone) or Annex I (safety component embedded in a regulated product). `N/A` otherwise. | Determines the applicable date: Annex III bites 2 Dec 2027, Annex I bites 2 Aug 2028. The two are not interchangeable. |
| Key obligations trigger | The headline duties this row creates (e.g. "Art 50 transparency notice", "Annex III logging + human oversight", "vendor conformity assessment on file"). | Turns a classification into a task list. This is the column that drives your remediation backlog. |
| Compliance status | One of: Compliant, In progress, Gap, Not started, Not yet in force. | Honest status reporting. "Not yet in force" records a known future duty so it is not mistaken for an oversight. |
| System owner | A named individual (role plus person), not a team. | Accountability collapses without a name. The owner answers for the row at review. |
| Evidence location | A path or link to where the supporting documents live (DPIA, vendor pack, instructions for use, conformity declaration). | A classification you cannot evidence is an assertion. This field is what makes the Register auditable. |
| Review date | The date this row was last verified and the date it is next due (e.g. "Verified 2026-05-01 / Next 2026-11-01"). | A Register reviewed once is a snapshot, not a control. Stale rows are the default failure mode. |

Treat the Register as the source of truth, which means it must be current rather than complete-on-paper. Assign one owner for the Register as a whole, set a fixed review cadence (quarterly is defensible for most mid-sized organisations; monthly where high-risk systems are present), and make a new row a mandatory step in your procurement and project-approval process so that no system enters use without one. When a market-surveillance authority makes contact, the Register is the document that converts a panicked fortnight of discovery into a single export. Its credibility rests on the "Evidence location" and "Review date" columns: a regulator distinguishes an organisation that governs its AI from one that has merely listed it by whether the claims in each row can be opened and read.

### AI Transparency Notice (customer-facing template)

**Purpose:** A short public statement that tells the people interacting with your organisation when they are dealing with AI, so that you satisfy the Art 50 transparency duties that take effect on 2 August 2026.

Publish this where users will actually meet it — a footer link, a chatbot's opening message, a labelled banner on generated content — not buried in a privacy policy. The tone should match the rest of the document below: plain, specific, and free of reassurance you cannot back. Replace every bracketed field; delete any row that does not apply to you rather than leaving an empty promise.

---

**How [organisation] uses artificial intelligence**

*Last updated: [date]*

[organisation] uses artificial intelligence in some of the services we provide. This notice explains where, so that you always know when you are interacting with an automated system or seeing content it produced.

**Where you may encounter AI with us**

- **[System or feature, e.g. "Our website chat assistant"]** — [what it does in one sentence, e.g. "answers common questions about our products and routes you to a person when needed"]. You are speaking with an automated system, not a member of staff, unless you are told otherwise.
- **[System or feature, e.g. "Automated content summaries"]** — [what it does, e.g. "some article summaries on this site are generated by AI"]. Where this is the case, the content is labelled "[your label, e.g. AI-generated summary]".
- **[System or feature, e.g. "Application screening"]** — [what it does, e.g. "we use an automated tool to help sort job applications"]. A member of our team reviews the outcome before any decision affecting you is made.

**Speaking to a person**

You can ask to deal with a human at any point. [Describe the route plainly, e.g. "Type 'agent' in the chat, or contact us using the details below, and a member of staff will take over."] Where an automated system contributes to a decision that affects you, you may [state the right you offer, e.g. "ask for that decision to be reviewed by a person"].

**AI-generated and AI-altered content**

Where we publish images, audio, video, or text that has been generated or materially altered by AI, we label it clearly. [State your labelling convention, e.g. "Such content carries the tag 'Made with AI' or an equivalent note in the caption."]

**Questions**

If you are unsure whether you are interacting with AI, or you want to know more about how we use it, contact [contact name or team] at [email / phone / address]. We will tell you plainly.

---

A genuine transparency notice is judged by accuracy, not polish. Do not claim human review you do not perform, and do not list a system you have quietly retired. The notice and the Register must agree: if a system in the Register triggers Art 50, it should appear here, and if it appears here, it should carry an Art 50 trigger in the Register.

### Internal AI Governance Policy (template)

**Purpose:** The internal rulebook that states how your organisation decides which AI systems it will use, who is accountable, and how it meets its obligations. This is the document that turns the Register and the notice from artefacts into a governed process.

Adopt it at board or executive level, give it a version number and an owner, and circulate it to every department that touches AI. The placeholders mark organisation-specific decisions; the structure should survive intact.

---

**[organisation] — Artificial Intelligence Governance Policy**

*Version [x.x] — Approved [date] — Owner: [role] — Next review: [date]*

**1. Purpose and scope**

This policy sets out how [organisation] adopts, operates, and oversees artificial intelligence systems, and how we meet our obligations under the EU AI Act and related law. It applies to all staff, contractors, and departments, and to every AI system we build, buy, embed, or access — including systems reached through a third-party product or a general-purpose AI service. It covers [state any explicit inclusions, e.g. "AI features bundled inside existing software, and tools accessed through a personal account for work purposes"]. Where this policy is stricter than a local practice, this policy prevails.

**2. Roles and responsibilities**

- **AI Governance Owner: [named role, e.g. "Head of Risk", and named person].** Accountable for this policy, for maintaining the AI Systems Register, for the classification process, and for reporting AI risk to [the board / executive committee]. This is a named individual, not a committee.
- **System owners.** Each system in the Register has a named owner responsible for its correct classification, its evidence, and its day-to-day compliant use.
- **Department heads.** Responsible for ensuring no AI system enters use in their function without going through the approval gate in section 5, and that their staff hold the required AI literacy (section 8).
- **All staff.** Responsible for using approved systems only, for not feeding restricted data into AI tools, and for reporting suspected incidents under section 9.
- **[Legal / DPO].** Consulted on classification edge cases, prohibited-practice questions, and the intersection with data-protection law.

**3. The AI Systems Register**

[organisation] maintains a single AI Systems Register as the authoritative record of every AI system in use. No AI system may operate in production without a current Register entry. The Register follows the field schema in [reference, e.g. "Section 5 of the AI Compliance Manual"] and is reviewed [cadence, e.g. "quarterly"] by the AI Governance Owner. The Register is the document we produce on request to a market-surveillance authority, customer, or auditor.

**4. Risk classification process**

Every AI system is classified into one of four tiers — **Prohibited, High-Risk, Limited Risk, Minimal** — before it is approved for use. Classification is decided by the use case, not the technology. The process is:

1. The proposing system owner drafts a classification using [reference, e.g. "the decision flow in Section 2"].
2. The AI Governance Owner reviews and confirms or revises it.
3. Any system assessed as potentially **Prohibited** is escalated to [role] and may not proceed pending a written ruling.
4. Any system assessed as **High-Risk** is recorded with its Annex basis (III standalone or I embedded) and its applicable date, and triggers the full high-risk obligation set.
5. Classifications are revisited whenever the use case, data, or vendor materially changes, and at each scheduled review.

**5. Approval gate before adopting a new AI system**

No new AI system — including a new AI feature within existing software, and any free or trial tool — may be adopted for organisational use until:

- a Register entry has been drafted;
- a provisional risk classification has been assigned and confirmed by the AI Governance Owner;
- a vendor assessment (section 6) has been completed where the system is externally supplied;
- the data inputs have been checked against our data-protection and confidentiality rules; and
- [approver role] has signed off.

Adopting an AI system outside this gate ("shadow AI") is a breach of this policy and must be remediated on discovery by bringing the system through the gate or withdrawing it.

**6. Vendor assessment**

Every externally supplied AI system is assessed before adoption and re-assessed at [cadence or trigger, e.g. "renewal, or on a material change"]. The assessment uses the Vendor Assessment Questionnaire in [reference] and records the vendor's role, its conformity documentation, its data-handling and hosting arrangements, and our dependency exposure. Vendor responses are filed at the Register's "Evidence location" for the system. A vendor's inability or refusal to answer scope, documentation, or data-location questions is itself a risk finding and is recorded as such.

**7. Human oversight for high-risk systems**

Where a system is classified High-Risk, a competent person must be able to understand its output, monitor its operation, and intervene in or override its decisions. For each high-risk system we record: who provides oversight, what they are able to see, the circumstances requiring escalation, and the route to halt the system. Automated outputs from high-risk systems must not be the sole basis of a decision that produces legal or similarly significant effects on a person without a meaningful human review.

**8. AI literacy and training (Art 4)**

[organisation] ensures that staff who operate or rely on AI systems have a sufficient understanding of how those systems work, what they can and cannot do, and the risks they carry, proportionate to their role. We deliver [describe, e.g. "a baseline AI-literacy module to all staff on induction and annually, with role-specific training for system owners and for staff operating high-risk systems"]. Completion is tracked by [role] and recorded against the relevant departments in the Register. This obligation has applied since 2 February 2025.

**9. Incident handling**

An AI incident is any event in which an AI system behaves in a way that causes, or risks causing, harm, an unlawful outcome, a breach of this policy, or a serious malfunction. Staff report suspected incidents to [route, e.g. "the AI Governance Owner via incidents@organisation"] without delay. The AI Governance Owner [logs, assesses, and where required escalates] each incident, determines whether a regulator or affected individuals must be notified, and records the outcome. Incident records are retained for [period].

**10. Review cadence**

This policy is reviewed at least [annually] and whenever the regulatory position materially changes — including at each staged AI Act milestone that affects our systems (notably the 2 August 2026 transparency and governance provisions, the 2 December 2027 standalone high-risk provisions, and the 2 August 2028 embedded high-risk provisions). The AI Governance Owner reports on AI risk to [the board] at least [quarterly].

---

> A governance policy is not evidence that you are compliant; it is evidence of the standard against which your own gaps can be measured. Regulators read the distance between what your policy says and what your Register shows. Write a policy you can actually meet, then close the gap — an aspirational policy you breach is worse than a modest one you keep.

### Vendor Assessment Questionnaire (template)

**Purpose:** A structured set of questions to send a prospective or incumbent AI vendor before you adopt their system. The answers populate the Register, evidence your classification, and feed the Vendor Dependency Scorecard. Send it as a written request and keep the replies on file.

Issue this before signing, not after. The questions are grouped into four areas. Several are annotated with the Vendor Dependency Scorecard dimension they inform — **Data Sovereignty**, **Contractual Lock-In**, **Regulatory Risk**, **Concentration Risk**, **Alternative Availability** — so that the same exercise both checks compliance and scores your dependency. A vendor that cannot or will not answer the scope, documentation, and data-location questions has told you something material; record the non-answer as a finding.

**A. Scope and role**

1. Does your system fall within the scope of the EU AI Act? If you consider it out of scope, on what basis?
2. In relation to this system, are you the **Provider** within the meaning of the AI Act? If not, who is, and what is your role (Distributor, Importer, or other)?
3. Is the system, or any component of it, a general-purpose AI model, or does it incorporate one? If so, whose model, and what is its provider's compliance status?
4. Do you supply the conformity documentation and the **instructions for use** required for systems in scope? *(Regulatory Risk)*
5. Will you commit contractually to notify us of changes to the system's classification, capabilities, or compliance status during the term?

**B. Data and sovereignty**

6. Where is your controlling legal entity headquartered, and under which jurisdiction's law is the contract governed? *(Data Sovereignty, Regulatory Risk)*
7. In which regions is the data we provide stored, processed, and backed up at rest? *(Data Sovereignty)*
8. Is our data used to train or fine-tune your models, or any shared model? If so, can this be disabled, and is it disabled by default? *(Data Sovereignty)*
9. Do you offer an EU-hosted or EU-only data-residency option? At what cost and with what feature differences? *(Data Sovereignty)*
10. List your sub-processors and any further AI providers in your supply chain, with their locations. *(Concentration Risk, Data Sovereignty)*
11. How would our service be affected if one of those upstream providers became unavailable or changed its terms? *(Concentration Risk)*

**C. Risk and compliance**

12. What risk tier do you assess this system to fall into — Prohibited, High-Risk, Limited Risk, or Minimal — and on what reasoning?
13. If High-Risk, is it High-Risk under **Annex III** (standalone) or **Annex I** (embedded safety component), and what applicable date follows? *(Regulatory Risk)*
14. Is your technical documentation available to us on request, and will you keep it current for the life of the contract? *(Regulatory Risk)*
15. Does the system generate and retain logs of its operation? What is logged, for how long, and can we access our logs? *(Regulatory Risk)*
16. What human-oversight features does the system provide — the ability to monitor outputs, to intervene, and to override or halt automated decisions?
17. For high-risk systems: what is the system's CE-marking and EU-database registration status, and on what timeline? *(Regulatory Risk)*
18. Where the system is subject to Art 50, what transparency features does it provide (e.g. labelling of AI interactions or AI-generated content)?
19. How do you handle and notify us of incidents, malfunctions, and serious risks arising from the system?

**D. Commercial and dependency**

20. What are the exit terms? On termination, how is our data returned or deleted, in what formats, and over what period? *(Contractual Lock-In)*
21. Can we export our data and any derived configurations in an open, portable format during and at the end of the contract? *(Contractual Lock-In, Alternative Availability)*
22. What is the realistic cost and effort of migrating away from your system to an alternative, and are there contractual or technical barriers to doing so? *(Contractual Lock-In, Alternative Availability)*
23. Which credible alternative providers exist for this capability, and how readily could a comparable service be substituted? *(Alternative Availability)*
24. What share of this capability, across our organisation, would depend on you alone if we proceed? *(Concentration Risk)*
25. What indemnities and contractual warranties do you offer in respect of AI Act non-compliance, third-party IP claims, and data breaches? *(Regulatory Risk, Contractual Lock-In)*
26. What is your own continuity position — financial stability, and what happens to the service in the event of acquisition or wind-down? *(Concentration Risk, Alternative Availability)*

Score each Scorecard dimension from the answers and carry the result into the Register's "Key obligations trigger" and "Evidence location" fields. The questionnaire is most useful comparatively: run two or three vendors through the same questions and the dependency profile that looks acceptable in isolation often looks different beside an alternative that will commit to EU hosting, open data export, or a straight answer on its model supply chain.
