## Section 2 — The Risk Classification Decision Tree

Classification is the hinge on which every other obligation turns. Get it wrong and you either over-comply — pouring conformity-assessment effort into a spreadsheet macro — or, more dangerously, under-comply and discover the gap during an enforcement action. This section gives you a repeatable procedure for taking one system at a time and assigning it a definite role and a definite risk tier, with the correct staged deadline attached.

Two principles govern everything that follows.

**Classification is per-system.** You classify each distinct system in your AI Systems Register on its own merits. A single vendor platform may contain several systems — a CV-parser, a candidate-ranking model, and a chatbot — and these can land in three different tiers. Resist the urge to classify "the HR software" as a single object. Decompose it into the functional systems that actually do the inferring.

**Classification is per-role.** The same system can place you under different obligations depending on what you do with it. The firm that builds and sells a credit-scoring model is a Provider; the bank that runs it on its own applicants is a Deployer; the reseller in between may be a Distributor. Each carries a distinct obligation set. You must therefore fix your role before you can read off your duties — and, as Stage 2 explains, your role is not always the obvious one.

Work the three stages in order. Stage 1 asks whether the Act applies at all. Stage 2 fixes your role. Stage 3 assigns the risk tier through an ordered sequence of gates. Only when all three are settled do you turn to Section 3 for the obligations.

### Stage 1 — Is it in scope?

Two questions decide scope: is the thing an "AI system" as the Act defines it, and does it reach people in the EU?

**Is it an AI system?** The Act's definition (Art 3(1)) is deliberately functional. An AI system is a machine-based system that operates with some degree of autonomy, may show adaptiveness after deployment, and — the load-bearing phrase — *infers, from the input it receives, how to generate outputs* such as predictions, content, recommendations, or decisions that influence physical or virtual environments.

The word that does the work is "infers". The definition is intended to capture systems that derive outputs through learning, statistical reasoning, or modelling, and to exclude software that simply executes rules a human wrote out in full. The Commission's guidance is explicit that plainly deterministic, rule-based software — a tool whose outputs are fully fixed by human-defined logic, with no inference — falls outside the definition.

In practice, draw the line like this:

- A spreadsheet that applies `IF income > X AND age > Y THEN approve` is deterministic rule-based logic. **Not an AI system.**
- A model trained on past lending outcomes that produces a default-probability score is inferring. **An AI system.**
- A regex that flags emails containing certain words is deterministic. **Not an AI system.**
- A classifier that predicts whether an email is spam from learned features is inferring. **An AI system.**

The hard cases sit on the boundary — a "scoring" tool with hand-tuned weights, or a hybrid of rules plus a model. Where a component genuinely infers, treat the system as in scope and classify it properly; do not argue your way out of scope on a technicality you would not want to defend to a regulator.

**Does it reach the EU?** The Act applies extraterritorially (Art 2). It is not enough to ask where your company is incorporated. The Act bites where:

- you are a provider placing a system on the EU market or putting it into service in the EU, regardless of where you are established; or
- you are a deployer with your place of establishment or location *in* the EU; or
- the **output produced by the system is used in the EU**, even if both provider and deployer sit outside it.

That last limb is the one firms miss. A US-based recruiter that screens candidates located in the EU, or an analytics vendor whose scores are acted upon inside the EU, is within reach. The question is not "where are we?" but "where does the output land?".

**The GDPR Article 22 intersection.** The AI Act sits alongside, not instead of, data-protection law. Where your system produces a *solely automated* decision that has a legal or similarly significant effect on a person — refusing credit, rejecting a job application, terminating a service — GDPR Art 22 already constrains you, independently of the AI Act's tier. That means a right to human intervention, to contest the decision, and to an explanation, plus a lawful basis for the automated processing. Flag any system that makes consequential decisions with no meaningful human in the loop: it carries GDPR obligations from day one, whatever the AI Act says, and the two regimes must be satisfied together.

> If the output is used inside the EU, you are in scope — your head office postcode is irrelevant.

If the system is genuinely not an AI system, or has no EU nexus on any limb, record that conclusion and its reasoning in the register and stop. Everything below assumes you cleared Stage 1.

### Stage 2 — What is your role?

The Act assigns obligations by role, not by ownership. Four roles matter.

**Provider** — the actor that develops an AI system (or has one developed) and places it on the market or puts it into service *under its own name or trademark*, whether for payment or free. Providers carry the heaviest load for high-risk systems: conformity assessment, technical documentation, the risk and quality-management systems, registration, and post-market monitoring.

**Deployer** — an actor using an AI system under its own authority in the course of its professional activity. The bank running a bought-in credit model, the HR team running a third-party CV-screener, the clinic running a diagnostic tool — all deployers. Deployer duties for high-risk systems are real but lighter: use the system per the provider's instructions, ensure human oversight, monitor operation, keep logs, and inform affected people where required.

**Importer** — an actor in the EU placing on the market a system that bears the name or trademark of a provider established *outside* the EU. Importers must verify, before placing the system, that the provider did the conformity assessment, drew up the documentation, and affixed the CE marking.

**Distributor** — an actor in the supply chain, other than provider or importer, that makes a system available on the EU market. Distributors must check that the CE marking and required documentation are present and act if they learn a system is non-compliant.

Most reading this manual will be **deployers** — and that is the comfortable assumption to avoid, because of Article 25.

**When a deployer becomes a provider (Art 25).** A deployer (or any importer or distributor) is treated as the **provider** of a high-risk system, and inherits the full provider obligation set, if it:

1. **puts its own name or trademark on** a high-risk system already on the market (white-labelling someone else's tool as your own product);
2. **makes a substantial modification** to a high-risk system in a way that keeps it high-risk — materially changing what it does or how, beyond the provider's intended use; or
3. **modifies the intended purpose** of a system — including one not previously classified as high-risk — such that it now *becomes* high-risk.

The practical traps are everyday ones. Fine-tuning a bought-in model on your own data so its behaviour materially changes can be a substantial modification. Repurposing a general analytics tool to screen job applicants changes the intended purpose into a high-risk one. Re-badging a vendor's product under your brand makes you the provider on the label. In each case you have quietly promoted yourself from the light deployer obligations to the full provider regime — and you should know that *before* it happens, not after. For each high-risk system in your register, record explicitly whether any Art 25 trigger is in play.

### Stage 3 — Which risk tier?

Run the tiers as an ordered sequence of gates. Test the system against each gate in turn and stop at the first that catches it. Prohibited beats high-risk; high-risk beats limited; everything else is minimal. Always start at Gate 1, because a prohibited practice is prohibited no matter how useful or well-intentioned.

**Gate 1 — Prohibited (Art 5).** A short list of practices is banned outright; these have been unenforceable in the EU since **2 February 2025**. If your system does any of the following, it cannot be deployed at all — there is no conformity assessment that rescues it:

- **Subliminal, manipulative or deceptive techniques** that materially distort behaviour and cause, or are likely to cause, significant harm.
- **Exploiting vulnerabilities** of a person or group owing to age, disability, or a specific social or economic situation, to distort behaviour and cause significant harm.
- **Social scoring** — evaluating or classifying people over time based on behaviour or personal characteristics, leading to detrimental treatment that is unjustified or disproportionate, or detached from the context in which the data was collected.
- **Emotion inference in the workplace and in education** — except for narrow medical or safety purposes. Software that infers employees' or students' emotional states from face or voice is banned.
- **Untargeted scraping** of facial images from the internet or CCTV to build or expand facial-recognition databases.
- **Biometric categorisation** that infers sensitive attributes — race, political opinions, trade-union membership, religious or philosophical beliefs, sex life, or sexual orientation (with limited lawful-processing exceptions).
- **Real-time remote biometric identification in publicly accessible spaces for law-enforcement purposes**, save for narrowly defined, authorised exceptions.

If any of these fit, classification is over: the answer is "do not deploy". Record it and move on.

**Gate 2 — High-Risk.** A system is high-risk by one of two routes.

*Route A — Annex III, standalone systems.* The system is intended to be used in one of the listed sensitive domains:

- **Biometrics** — remote biometric identification, biometric categorisation, emotion recognition (where not already prohibited).
- **Critical infrastructure** — safety components in the management and operation of digital infrastructure, road traffic, and utilities such as water, gas, heating, and electricity.
- **Education and vocational training** — admissions, evaluating learning outcomes, assigning people to courses, proctoring exams.
- **Employment and worker management** — recruitment and selection (advertising posts, screening applications, evaluating candidates), and decisions on promotion, termination, task allocation, and performance monitoring.
- **Access to essential services** — creditworthiness and credit scoring; risk assessment and pricing in life and health insurance; eligibility for public assistance benefits; emergency-services dispatch and triage.
- **Law enforcement** — risk assessments, evidence evaluation, profiling.
- **Migration, asylum and border control** — risk assessments, application examination, verification of documents.
- **Administration of justice and democratic processes** — assisting judicial authorities in researching and interpreting facts and law.

A narrow filtering provision (Art 6(3)) lets a system that falls within an Annex III domain escape high-risk status where it performs only a narrow procedural task, improves the result of completed human activity, detects decision-making patterns without replacing human judgement, or does purely preparatory work — *but never* where it profiles people. Treat this exemption as the exception it is. If you rely on it, document the reasoning, because the system stays high-risk if profiling is involved, and the burden of justifying the exemption sits with you.

*Route B — Annex I, embedded / product-safety systems.* The system is a safety component of a product, or is itself a product, already covered by EU product-safety legislation that requires third-party conformity assessment — machinery, medical devices, in-vitro diagnostics, lifts, toys, radio equipment, vehicles, aviation, and the rest. Here the AI Act layers onto an existing CE-marking regime rather than standing alone.

The deadlines differ by route, and this is where the staged timeline matters most:

- **Annex III standalone** high-risk obligations apply from **2 December 2027**.
- **Annex I embedded** high-risk obligations apply from **2 August 2028**.

Note carefully: **high-risk duties do not bite in August 2026.** What arrives on 2 August 2026 is the transparency regime (Art 50), the penalties, and the governance framework — not the high-risk obligations. Anyone planning to a single "August 2026 cliff" for high-risk systems is working from the superseded timeline.

**Gate 3 — Limited Risk (Art 50 transparency).** If the system is neither prohibited nor high-risk, test it against the transparency triggers. These attach regardless of tier, but for an otherwise-unremarkable system they are the only AI Act duties that apply:

- **Chatbots and conversational systems** — people must be told they are interacting with an AI, unless it is obvious to a reasonably informed person.
- **Generative and synthetic content** — AI-generated audio, image, video, or text must be marked as artificially generated in a machine-readable form.
- **Deepfakes** — image, audio, or video content that appreciably resembles real people, places, or events must be disclosed as artificially generated or manipulated.
- **Emotion-recognition and biometric-categorisation systems** (where not prohibited and not already caught as high-risk) — people exposed to them must be informed.

The Art 50 transparency duties apply from **2 August 2026**.

**Gate 4 — Minimal.** Everything that clears all three gates is minimal risk. The Act imposes no mandatory obligations on these systems beyond the cross-cutting AI-literacy duty (Art 4, in force since 2 February 2025) and good practice. Most enterprise AI — demand forecasting, spam filtering, route optimisation, document classification — lives here. Record it as minimal and move on; do not gold-plate it.

### The decision flow, in plain steps

Follow these in order for one system. Stop the moment a step gives you a tier.

1. **Is it an AI system?** Does it *infer* outputs, or is it fully deterministic rule-based software? If deterministic → out of scope. If it infers → continue.
2. **Does it reach the EU?** Are you a provider placing it on the EU market, a deployer established in the EU, or is the output used in the EU? If no EU nexus → out of scope. Otherwise → continue. (Flag GDPR Art 22 if the system makes solely automated, significant decisions.)
3. **Fix your role.** Provider, Deployer, Importer, or Distributor? Then check the Art 25 triggers — name/trademark, substantial modification, change of intended purpose. If any fires, your role is **Provider**.
4. **Gate 1 — Prohibited?** Does it match any Art 5 practice? If yes → **Prohibited. Do not deploy.** Stop.
5. **Gate 2 — High-Risk?** Is it an Annex III standalone use (and not validly exempt under Art 6(3)), or an Annex I product-safety case? If Annex III → **High-Risk, applies 2 Dec 2027.** If Annex I → **High-Risk, applies 2 Aug 2028.** Stop.
6. **Gate 3 — Limited Risk?** Is it a chatbot, generative/synthetic-content, deepfake, or (non-prohibited, non-high-risk) emotion/biometric system? If yes → **Limited Risk: transparency duties, apply 2 Aug 2026.** Stop.
7. **Otherwise → Minimal.** AI-literacy duty (Art 4) and good practice only.

Record the path you took and the answer at each gate. The reasoning is as important as the result — it is what you will show a regulator, and what a colleague will need when the system changes.

### Classification reference table

Indicative only. The tier turns on the specific intended purpose and how the system is used; treat this as a starting point, not a substitute for working the gates.

| Common SME system | Likely tier | Basis | Applies from |
|---|---|---|---|
| CV-screening / candidate ranking | High-Risk | Annex III — employment | 2 Dec 2027 |
| Credit decisioning / scoring | High-Risk | Annex III — essential services | 2 Dec 2027 |
| Insurance risk pricing (life/health) | High-Risk | Annex III — essential services | 2 Dec 2027 |
| Exam proctoring / admissions scoring | High-Risk | Annex III — education | 2 Dec 2027 |
| AI in a regulated medical device | High-Risk | Annex I — product safety | 2 Aug 2028 |
| Customer-service chatbot | Limited Risk | Art 50 — disclose it is AI | 2 Aug 2026 |
| Marketing copy / image generator | Limited Risk | Art 50 — mark synthetic content | 2 Aug 2026 |
| Demand forecasting | Minimal | No trigger | — (Art 4 literacy only) |
| Fraud / anomaly detection (internal) | Minimal* | No Annex III trigger | — |
| Meeting summariser / transcription | Minimal | No trigger | — |
| Workplace emotion-tracking | Prohibited | Art 5 — emotion inference at work | Banned since 2 Feb 2025 |

\* Fraud detection is usually minimal, but watch the edges: if a model is repurposed to screen individuals for access to an essential service, or feeds a creditworthiness decision, it can cross into Annex III. The use, not the label "fraud", decides.

### Four worked examples

**Example 1 — AI CV-screener (High-Risk).** A 200-person firm licenses a third-party tool that parses applications and ranks candidates for shortlisting.

- *Stage 1:* The ranking model infers a suitability score — an AI system. Candidates are in the EU and the output (the shortlist) is used in the EU. In scope. Because shortlisting materially affects individuals, flag GDPR Art 22 if no meaningful human reviews the ranking.
- *Stage 2:* The firm uses a vendor's tool in its own hiring — a **Deployer**. It runs the tool as supplied and does not re-badge it, so no Art 25 trigger. (Had it fine-tuned the model on its own historic hiring data so behaviour changed materially, it would risk becoming a Provider.)
- *Stage 3:* Gate 1 — not prohibited. Gate 2 — Annex III, employment and worker management; the Art 6(3) exemption does not apply because the tool evaluates and ranks people. **High-Risk.**
- *Obligations & date:* As deployer — use per the provider's instructions, ensure human oversight of shortlisting, monitor operation, keep logs, and inform candidates that an automated system is used. The provider must have done the conformity assessment and CE marking. These duties apply from **2 December 2027**.

**Example 2 — Customer-service chatbot (Limited Risk).** A retailer deploys a conversational assistant to answer order queries on its website.

- *Stage 1:* The chatbot generates responses through inference — an AI system. It serves EU customers — in scope.
- *Stage 2:* The retailer uses a vendor's chatbot in its own service operation — a **Deployer**, no Art 25 trigger.
- *Stage 3:* Gate 1 — not prohibited. Gate 2 — handling order queries is not an Annex III domain; not high-risk. Gate 3 — it is a chatbot, so Art 50 applies. **Limited Risk.**
- *Obligations & date:* Tell users they are interacting with an AI unless that is already obvious; if the bot produces synthetic media, mark it machine-readably. Apply from **2 August 2026**. (Note: if the same bot were extended to decide eligibility for a financial service, re-run Stage 3 — it could climb into Annex III.)

**Example 3 — Demand-forecasting tool (Minimal).** A wholesaler runs a model that predicts weekly stock demand per SKU.

- *Stage 1:* The model infers demand from historical and seasonal data — an AI system, used in the EU. In scope.
- *Stage 2:* The wholesaler operates the tool internally — a **Deployer**, no Art 25 trigger.
- *Stage 3:* Gate 1 — not prohibited. Gate 2 — forecasting stock is not an Annex III domain and is not an Annex I product-safety case; not high-risk. Gate 3 — no chatbot, synthetic content, deepfake, or emotion/biometric function; no Art 50 trigger. **Minimal.**
- *Obligations & date:* No mandatory AI Act obligations beyond the AI-literacy duty (Art 4, since 2 February 2025) and sensible governance. Record it as minimal in the register and move on.

**Example 4 — Workplace emotion-tracking (Prohibited).** A contact-centre operator considers software that infers agents' emotional states from voice tone to score "engagement".

- *Stage 1:* The system infers emotional state — an AI system. Agents are in the EU. In scope.
- *Stage 2:* The operator would be the **Deployer** — but the role question is moot, because the practice itself is banned.
- *Stage 3:* Gate 1 — Art 5 prohibits inferring emotions of people in the workplace, outside narrow medical or safety purposes. Engagement-scoring is neither. **Prohibited.**
- *Obligations & date:* There is no compliant way to deploy this. The ban has been in force since **2 February 2025**. The correct outcome is not to procure it; if already in use, it must be withdrawn. Record the decision and the Art 5 basis.

### Where this feeds

Each completed classification is a row in your AI Systems Register: the system, its scope determination, your role (including any Art 25 promotion), its tier, the legal basis, and the date its obligations apply. That register is the spine of the whole programme — it tells you how many high-risk systems you carry, when each clock starts, and where to direct effort first. Section 3 takes the tier and role you have just fixed and sets out, obligation by obligation, what each one actually requires you to do.
