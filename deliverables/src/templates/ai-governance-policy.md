---
title: "Internal AI Governance Policy"
subtitle: "An internal policy template: accountability, the Register, classification, the approval gate, vendors, oversight, literacy, incidents and review."
author: "Silicon and Stone"
version: "AI Act Compliance Toolkit · Edition 1 · editable template"
---

## How to use this template

*Delete this page before the policy is approved.*

This is the internal rulebook that states how your organisation decides which AI systems it uses, who is accountable, and how it meets its obligations. It is what turns the Register and the transparency notice from artefacts into a governed process.

- Adopt it at board or executive level, give it a version number and an owner, and circulate it to every department that touches AI.
- Every **[bracketed field]** marks a decision only you can make. Keep the structure intact; adapt the wording to your house style.
- Do not delete obligations to make the policy shorter. An honest policy that admits gaps is easier to defend than a short one that omits them.
- Point section 3 at the Register tab of your toolkit workbook and section 6 at your Vendor Assessment Questionnaire.

> Regulators read the distance between what your policy says and what your Register shows. Write a policy you can meet, then close the gap.


<div class="pagebreak"></div>

# [organisation] — Artificial Intelligence Governance Policy
*Version [x.x] — Approved [date] — Owner: [role] — Next review: [date]*

## 1. Purpose and scope
This policy sets out how [organisation] adopts, operates, and oversees artificial intelligence systems, and how we meet our obligations under the EU AI Act and related law. It applies to all staff, contractors, and departments, and to every AI system we build, buy, embed, or access — including systems reached through a third-party product or a general-purpose AI service. It covers [state any explicit inclusions, e.g. "AI features bundled inside existing software, and tools accessed through a personal account for work purposes"]. Where this policy is stricter than a local practice, this policy prevails.

## 2. Roles and responsibilities
- **AI Governance Owner: [named role, e.g. "Head of Risk", and named person].** Accountable for this policy, for maintaining the AI Systems Register, for the classification process, and for reporting AI risk to [the board / executive committee]. This is a named individual, not a committee.
- **System owners.** Each system in the Register has a named owner responsible for its correct classification, its evidence, and its day-to-day compliant use.
- **Department heads.** Responsible for ensuring no AI system enters use in their function without going through the approval gate in section 5, and that their staff hold the required AI literacy (section 8).
- **All staff.** Responsible for using approved systems only, for not feeding restricted data into AI tools, and for reporting suspected incidents under section 9.
- **[Legal / DPO].** Consulted on classification edge cases, prohibited-practice questions, and the intersection with data-protection law.

## 3. The AI Systems Register
[organisation] maintains a single AI Systems Register as the authoritative record of every AI system in use. No AI system may operate in production without a current Register entry. The Register follows the field schema in [reference, e.g. "the Register tab of our AI Act workbook"] and is reviewed [cadence, e.g. "quarterly"] by the AI Governance Owner. The Register is the document we produce on request to a market-surveillance authority, customer, or auditor.

## 4. Risk classification process
Every AI system is classified into one of four tiers — **Prohibited, High-Risk, Limited Risk, Minimal** — before it is approved for use. Classification is decided by the use case, not the technology. The process is:

1. The proposing system owner drafts a classification using [reference, e.g. "the decision tree in our AI Act handbook"].
2. The AI Governance Owner reviews and confirms or revises it.
3. Any system assessed as potentially **Prohibited** is escalated to [role] and may not proceed pending a written ruling.
4. Any system assessed as **High-Risk** is recorded with its Annex basis (III standalone or I embedded) and its applicable date, and triggers the full high-risk obligation set.
5. Classifications are revisited whenever the use case, data, or vendor materially changes, and at each scheduled review.

## 5. Approval gate before adopting a new AI system
No new AI system — including a new AI feature within existing software, and any free or trial tool — may be adopted for organisational use until:

- a Register entry has been drafted;
- a provisional risk classification has been assigned and confirmed by the AI Governance Owner;
- a vendor assessment (section 6) has been completed where the system is externally supplied;
- the data inputs have been checked against our data-protection and confidentiality rules; and
- [approver role] has signed off.

Adopting an AI system outside this gate ("shadow AI") is a breach of this policy and must be remediated on discovery by bringing the system through the gate or withdrawing it.

## 6. Vendor assessment
Every externally supplied AI system is assessed before adoption and re-assessed at [cadence or trigger, e.g. "renewal, or on a material change"]. The assessment uses our Vendor Assessment Questionnaire [reference or location] and records the vendor's role, its conformity documentation, its data-handling and hosting arrangements, and our dependency exposure. Vendor responses are filed at the Register's "Evidence location" for the system. A vendor's inability or refusal to answer scope, documentation, or data-location questions is itself a risk finding and is recorded as such.

## 7. Human oversight for high-risk systems
Where a system is classified High-Risk, a competent person must be able to understand its output, monitor its operation, and intervene in or override its decisions. For each high-risk system we record: who provides oversight, what they are able to see, the circumstances requiring escalation, and the route to halt the system. Automated outputs from high-risk systems must not be the sole basis of a decision that produces legal or similarly significant effects on a person without a meaningful human review.

## 8. AI literacy and training (Art 4)
[organisation] ensures that staff who operate or rely on AI systems have a sufficient understanding of how those systems work, what they can and cannot do, and the risks they carry, proportionate to their role. We deliver [describe, e.g. "a baseline AI-literacy module to all staff on induction and annually, with role-specific training for system owners and for staff operating high-risk systems"]. Completion is tracked by [role] and recorded against the relevant departments in the Register. This obligation has applied since 2 February 2025.

## 9. Incident handling
An AI incident is any event in which an AI system behaves in a way that causes, or risks causing, harm, an unlawful outcome, a breach of this policy, or a serious malfunction. Staff report suspected incidents to [route, e.g. "the AI Governance Owner via incidents@organisation"] without delay. The AI Governance Owner [logs, assesses, and where required escalates] each incident, determines whether a regulator or affected individuals must be notified, and records the outcome. Incident records are retained for [period].

## 10. Review cadence
This policy is reviewed at least [annually] and whenever the regulatory position materially changes — including at each staged AI Act milestone that affects our systems (the Article 50 transparency duties, applying since 2 August 2026; the further prohibitions and generative-content marking deadline of 2 December 2026; the standalone high-risk provisions from 2 December 2027; and the embedded high-risk provisions from 2 August 2028). The AI Governance Owner reports on AI risk to [the board] at least [quarterly].
