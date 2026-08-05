# Evidence Gap Report — Template

> **What this is:** the core client deliverable for a technical AI Act readiness engagement.
> It answers one question in plain language: *can this organisation actually prove what the law
> requires of its AI systems — and if not, what must it fix, in what order?*
>
> **How to use:** copy this file per engagement, fill the bracketed `[…]` fields, delete the
> *italic guidance notes*, and remove rows marked `(example)`. Keep the boundary statement and
> the "Referred to counsel" section in every version — they are what make this safe to be
> referred by a law firm.
>
> **Companion docs:** `docs/legal-partner-scope-leaflet.md`, `docs/legal-partnership-plan-prd.md`

---

## Cover

| | |
|---|---|
| **Prepared for** | [Client legal name] |
| **Client contact** | [Name, role — e.g. Head of Compliance] |
| **Referring adviser** | [Law firm, partner name — if a referral] |
| **Prepared by** | Silicon & Stone — [your name] |
| **Engagement** | Technical AI Act Readiness — Evidence Gap Review |
| **Report version / date** | v[0.1] · [DD Month YYYY] |
| **Status** | [Draft for review / Final] |
| **Distribution** | [Confidential — client + referring adviser only] |

---

## Boundary statement *(keep in every report — do not delete)*

This is a **technical and operational** assessment of whether the organisation's AI systems can
evidence the controls and documentation the EU AI Act calls for. **It is not legal advice and
does not constitute a legal opinion.** Risk classification, statutory interpretation, and
liability remain matters for the organisation's legal adviser. Where a finding turns on a legal
question, it is **flagged to counsel** in Section 7 and is not answered here. All risk-tier
views in this report are a **preliminary technical reading to be confirmed by counsel.**

---

## 1. Executive summary *(for leadership — one page, plain language)*

*Guidance: write this last. A semi-technical leadership team should be able to read only this
section and know where they stand and what to do Monday morning.*

**Overall readiness position:** [🔴 Significant gaps / 🟠 Partial / 🟢 Largely ready]

**In one paragraph:** [The organisation operates [N] AI systems. [X] fall into a preliminary
high-risk view (to be confirmed by counsel), [Y] carry transparency obligations, and [Z] are
lower concern. Evidence exists for [..], is partial for [..], and is absent for [..]. The most
material exposure is [..], because [..].]

**The five things that matter most:**

| # | Finding | Why it matters | Deadline pressure |
|---|---|---|---|
| 1 | [e.g. No technical documentation for the CV-screening tool] | [Preliminary high-risk; deployer can't evidence Art 13/26 expectations] | [High-risk obligations] |
| 2 | [e.g. AI chatbot does not disclose it is AI] | [Transparency obligation, near-term] | [2 Aug 2026] |
| 3 | [..] | [..] | [..] |
| 4 | [..] | [..] | [..] |
| 5 | [..] | [..] | [..] |

**Recommended first move:** [the single highest-leverage action — usually completing the system
inventory + closing the nearest-deadline transparency gaps].

---

## 2. Scope & method

**What was assessed:** [systems, business units, time period]. AI systems in scope were
identified through [interviews with X, system/SaaS inventory review, procurement records,
shadow-AI discovery].

**What was explicitly out of scope:** [e.g. cybersecurity penetration testing, model accuracy
benchmarking, vendors' own internal compliance, legal interpretation].

**Method:** systems were inventoried, each assigned a **preliminary** regulatory role and tier
(to be confirmed by counsel), then mapped against the documentation and controls the AI Act
calls for. Gaps were rated by severity and remediation effort to produce a prioritised roadmap.
*(Where useful, note the Forensic Technopolitics lens: this is the Supply Chain / dependency
domain applied at the system level — what the organisation actually runs, and what it can
prove about it.)*

**Sources reviewed:** [list — DPIA/records, vendor DPAs, model cards, existing policies,
architecture docs, contracts]. **Key limitation:** findings reflect evidence made available by
[date]; systems or documentation not disclosed are not assessed.

---

## 3. AI System Inventory

*Guidance: this is the spine of the whole report. Mid-size companies are usually **deployers**
of third-party AI, but become **providers** if they put their name on a system or substantially
modify it — flag that distinction, it changes the obligations. Include shadow AI.*

| ID | System / tool | Purpose | Source (vendor / in-house) | Role *(prelim — confirm w/ counsel)* | Preliminary tier *(confirm w/ counsel)* | Personal / sensitive data? | Business owner |
|----|---------------|---------|----------------------------|--------------------------------------|------------------------------------------|----------------------------|----------------|
| S-01 | [CV-screening tool] *(example)* | [Shortlisting candidates] | [Vendor X] | [Deployer] | [High-risk — Annex III employment] | [Yes] | [HR Director] |
| S-02 | [Customer chatbot] *(example)* | [Tier-1 support] | [Vendor Y] | [Deployer] | [Limited — transparency] | [Yes] | [Head of CX] |
| S-03 | [Internal GPAI assistant] *(example)* | [Drafting / analysis] | [Vendor Z, GPAI] | [Deployer] | [Minimal + GPAI usage terms] | [Varies] | [COO] |
| S-… | [..] | [..] | [..] | [..] | [..] | [..] | [..] |

**Shadow-AI note:** [systems found in use but not formally adopted — e.g. staff using public
GenAI tools with company data]. *This is usually where the real exposure hides.*

---

## 4. Obligation mapping

*Guidance: only map the obligations that apply given each system's preliminary role/tier — don't
dump the whole Act on a minimal-risk tool. Use one block per in-scope system, or the matrix
below if there are many. Status: 🟢 evidenced · 🟠 partial · 🔴 absent · ⚪ n/a.*

### Reference — common obligations by preliminary category

*(Verify article references and dates against the current consolidated AI Act text before
issuing — implementation timing has moved more than once; confirm the live position with
counsel. Indicative staged timeline used here: prohibited practices already in force;
transparency obligations and penalties around **2 Aug 2026**; high-risk obligations phasing to
**2 Dec 2027** (standalone) / **2 Aug 2028** (embedded in regulated products).)*

| If preliminary category is… | Typical evidence the law calls for |
|---|---|
| **Prohibited practice** | Confirmation the practice is not in use; decommissioning record if it was. |
| **High-risk (deployer)** | Use in line with provider instructions; human oversight assignment; input-data relevance; monitoring + incident process; **log retention**; worker information; DPIA/FRIA where applicable; record that the provider's conformity evidence was obtained. |
| **High-risk (provider / "deemed provider")** | Risk-management system; data governance; technical documentation (Annex IV); record-keeping/logging; transparency + instructions for use; human-oversight design; accuracy/robustness/cybersecurity; quality-management system; conformity assessment; EU database registration. |
| **Transparency / limited risk** | Clear disclosure that users are interacting with AI; labelling of AI-generated/manipulated content and deepfakes; notice for emotion-recognition/biometric categorisation. |
| **GPAI usage** | Vendor's GPAI documentation obtained; acceptable-use and data-handling terms understood and respected; downstream-use records. |
| **All AI use** | AI inventory kept current; clear internal ownership; basic AI-use policy; staff AI-literacy measures. |

### Per-system mapping

**System [S-01 — CV-screening tool]** *(example block — duplicate per system)*

| Obligation (applicable only) | Evidence required | Evidence found | Status |
|---|---|---|---|
| Human oversight assigned | [Named reviewer, override process] | [Informal only, undocumented] | 🟠 |
| Use per provider instructions | [Instructions-for-use on file, followed] | [Not obtained from vendor] | 🔴 |
| Log retention | [Decision logs kept for required period] | [Logs exist, retention undefined] | 🟠 |
| Worker information | [Affected staff/candidates informed] | [Not done] | 🔴 |
| Provider conformity evidence obtained | [CE/conformity record from vendor] | [Not requested] | 🔴 |

*(Repeat for each in-scope system.)*

---

## 5. Gap Register

*Guidance: every 🔴/🟠 above becomes a numbered gap here. Severity = regulatory + business
exposure if unaddressed. Effort = rough remediation cost/time. Priority is derived: high
severity + near deadline + low effort rises to the top.*

**Severity:** S1 critical · S2 high · S3 moderate · S4 low  ·  **Effort:** E (easy) / M / H (hard)

| Gap ID | System | Obligation gap | What's missing | Severity | Effort | Priority | Counsel flag? |
|--------|--------|----------------|----------------|----------|--------|----------|---------------|
| G-01 | S-01 | Provider instructions/conformity | Vendor evidence never requested | S1 | E | **P1** | — |
| G-02 | S-02 | AI disclosure | Chatbot doesn't state it's AI | S2 | E | **P1** | — |
| G-03 | S-01 | Worker information | Candidates/staff not informed | S2 | M | **P2** | ⚑ (legal basis) |
| G-04 | S-03 | Shadow-AI / data handling | Staff pasting client data into public GenAI | S1 | M | **P1** | ⚑ (data/confidentiality) |
| G-… | … | … | … | … | … | … | … |

---

## 6. Remediation roadmap

*Guidance: sequence by priority and deadline, not by system. Give each action an owner and a
"done looks like" so the client can self-verify. Tie phases to the nearest regulatory dates.*

### Phase 1 — Now → [date] · close the cheap, near-deadline gaps
- [ ] **[G-02] Add AI-disclosure to the chatbot.** Owner: [Head of CX]. Done = [visible "you're chatting with an AI" notice live]. Target: [before 2 Aug 2026 transparency obligations].
- [ ] **[G-01] Request instructions-for-use + conformity evidence from all AI vendors.** Owner: [Procurement]. Done = [evidence on file per system].
- [ ] **[G-04] Issue interim shadow-AI rule + safe-tool guidance.** Owner: [COO]. Done = [policy circulated, staff acknowledged]. *(Counsel to confirm wording.)*

### Phase 2 — [date] → [date] · structural controls
- [ ] **[G-03] Stand up the human-oversight + worker-information process for high-risk systems.** Owner: [..]. Done = [..].
- [ ] **Define log-retention standard across in-scope systems.** Owner: [..]. Done = [..].
- [ ] **Establish and maintain the AI inventory as a living register.** Owner: [..]. Done = [..].

### Phase 3 — [date] onward · sustaining readiness
- [ ] **Pre-2 Dec 2027 high-risk programme** for systems carrying a high-risk view. Owner: [..].
- [ ] **AI-literacy / staff training measures.** Owner: [..].
- [ ] **Periodic re-review** as systems, vendors, and the regulation move *(natural entry point for an ongoing Drift Retainer)*.

---

## 7. Referred to legal counsel *(keep in every report — do not delete)*

*Guidance: this section is the demarcation made visible. Anything that is a legal judgement goes
here, not into our findings. It protects the client, the referring firm, and us.*

The following require a **legal** determination and are referred to the organisation's adviser —
they are **not** concluded in this report:

1. **Confirmation of regulatory role and risk tier** for each system in Section 3 (our view is
   preliminary and technical only).
2. **[G-03] Lawful basis and notice obligations** for informing affected workers/candidates.
3. **[G-04] Confidentiality / data-protection exposure** from shadow-AI use of client data.
4. **Whether any deployment risks "deemed provider" status** (e.g. re-branding or substantial
   modification of a third-party system).
5. **[Any other legal question surfaced during the review.]**

---

## 8. Appendices

**A. Evidence checklist** — *(per applicable obligation, what a complete evidence pack contains;
reusable as the client's standing checklist.)*

**B. Documents & sources reviewed** — *(dated register of everything examined.)*

**C. Assumptions & limitations** — *(what we relied on the client to disclose; what would change
the findings; the date evidence was current as of.)*

**D. Glossary** — *(plain-language definitions: deployer, provider, GPAI, high-risk, conformity
assessment, FRIA, transparency obligation — for the non-technical reader.)*

---

*Silicon & Stone · Forensic Technopolitics. This report is a technical and operational
assessment, is confidential to the named recipients, and is not legal advice. © [YYYY].*
