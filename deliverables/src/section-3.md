## Section 3 — Compliance Requirements by Risk Category

This section is the obligations reference behind the decision tree in Section 2. What you must do under the EU AI Act — as amended by the 2026 Digital Omnibus — is determined by two variables in combination, not one: the **risk tier** of the system (Prohibited, High-Risk, Limited Risk, Minimal) and your **role** in respect of it (Provider, Deployer, Importer, Distributor). The same model can place light duties on one organisation and heavy duties on another. A bank that buys a credit-scoring system off the shelf and runs it unchanged is a deployer with deployer duties; the vendor that built it is the provider and carries the bulk of the engineering burden. If that bank then re-trains the model on its own data, re-badges it, or repurposes it for a use the vendor never intended, Article 25 can convert it into a provider — and the full provider stack in this section lands on it.

Two further points frame everything below. First, **timing**. The Omnibus replaced the single August 2026 cliff with a staged schedule. The transparency and penalty machinery switches on in August 2026; the substantive high-risk obligations do not. Standalone high-risk systems listed in Annex III become enforceable on **2 December 2027**, and high-risk systems embedded in regulated products under Annex I on **2 August 2028**. Building the evidence now is prudent; treating August 2026 as the high-risk deadline is a category error. Second, **evidence**. Every obligation here is satisfied not by intention but by documentation a regulator or notified body can inspect. Throughout, we state what a given duty actually requires you to be able to *show*.

The entries below are an operational aid, not legal advice. Use them to scope work and brief counsel, not to replace either.

### 3.1 Prohibited practices — confirm absence and document the check

The eight prohibited practices in **Article 5** have been enforceable since **2 February 2025**. They include, among others, subliminal or purposefully manipulative techniques that cause significant harm, exploitation of vulnerabilities (age, disability, socio-economic situation), social scoring leading to unjustified detrimental treatment, certain predictive-policing-by-profiling uses, untargeted scraping of facial images to build recognition databases, emotion inference in the workplace and education (outside narrow medical or safety cases), and most real-time remote biometric identification in publicly accessible spaces for law-enforcement purposes.

For the overwhelming majority of commercial organisations, the obligation here is short and negative: **you must satisfy yourself that none of your AI systems fall within Article 5, and you must be able to evidence that you checked.** This is not optional housekeeping. Where a prohibited use is found, no amount of documentation or oversight cures it — the system must be withdrawn. The penalties attached to Article 5 breaches are the highest in the regime (up to €35 million or 7% of total worldwide annual turnover, whichever is greater).

**What evidence demonstrates compliance:** a dated screening record covering each system in your inventory, mapping its actual function against the eight categories, signed off by a named accountable owner, and refreshed when a system's purpose materially changes. A one-line "no prohibited uses" assertion is not evidence; a structured screen that shows the reasoning is. Keep it with the system inventory described in Section 2.

> The prohibited-practice screen is the cheapest compliance artefact you will ever produce and the most expensive one to be caught without. It costs a morning. Its absence, after an incident, reads as wilful blindness.

### 3.2 High-Risk — Provider obligations

Provider obligations are the heaviest in the Act. They apply to whoever places a high-risk system on the EU market or puts it into service under their own name or trade mark — including, via Article 25, deployers who modify or re-badge. The duties below apply in full to **standalone Annex III systems from 2 December 2027** and to **embedded Annex I product-safety systems from 2 August 2028**. Provider obligations are not a menu; they are cumulative, and conformity assessment (3.2.8) depends on all of the others being in place.

#### 3.2.1 Article 9 — Risk management system

**What it requires.** A continuous, documented risk-management process running across the entire lifecycle of the system: identify and analyse the known and reasonably foreseeable risks to health, safety and fundamental rights; estimate and evaluate those risks in both intended use and reasonably foreseeable misuse; adopt mitigation measures; and re-run the cycle in light of post-market data. It is iterative, not a one-off sign-off at launch.

**Who owes it.** Provider. **When.** 2 Dec 2027 (Annex III) / 2 Aug 2028 (Annex I).

**What evidence demonstrates it.** A living risk-management file: a risk register tied to specific system functions, the methodology used to evaluate severity and likelihood, the mitigations chosen and the residual risk accepted, and a version history showing the cycle has actually been repeated — not a single document dated at release and never touched again.

#### 3.2.2 Article 10 — Data and data governance

**What it requires.** Training, validation and testing datasets must meet quality criteria appropriate to the intended purpose: relevant, sufficiently representative, and to the best extent possible free of errors and complete. Providers must apply data-governance practices covering data collection, preparation, and — critically — examination for possible biases that could affect health, safety or fundamental rights, or lead to prohibited discrimination, together with measures to detect, prevent and mitigate those biases.

**Who owes it.** Provider. **When.** 2 Dec 2027 / 2 Aug 2028.

**What evidence demonstrates it.** Data sheets describing the provenance, composition and limitations of each dataset; a documented bias assessment with the representativeness checks performed and the remediation taken; and a record of the governance controls applied during data preparation. Where special-category data was processed specifically to detect and correct bias, document the lawful basis and the safeguards.

#### 3.2.3 Article 11 and Annex IV — Technical documentation

**What it requires.** A technical documentation pack, drawn up before the system is placed on the market and kept up to date, demonstrating conformity with all the high-risk requirements. **Annex IV** sets the minimum contents: a general description of the system and its intended purpose; design specifications and system architecture; the data requirements; the human-oversight measures; the validation and testing procedures and their results; and the risk-management arrangements.

**Who owes it.** Provider. **When.** 2 Dec 2027 / 2 Aug 2028.

**What evidence demonstrates it.** The Annex IV pack itself. This is the single document set a notified body or market-surveillance authority will ask for first. It is the spine to which the Article 9, 10, 14 and 15 artefacts attach. Proportionality relief for SMEs applies specifically here — see 3.9.

#### 3.2.4 Article 12 — Record-keeping (automatic logging)

**What it requires.** High-risk systems must technically allow for the automatic recording of events ("logs") over their lifetime, to a degree appropriate to the intended purpose. Logging must support the identification of situations that may present a risk or trigger a substantial modification, and must facilitate post-market monitoring.

**Who owes it.** Provider (to design and enable the logging capability). The deployer's duty to *retain* the logs sits under Article 26 — see 3.3. **When.** 2 Dec 2027 / 2 Aug 2028.

**What evidence demonstrates it.** A specification of what the system logs, at what granularity, and how those logs are protected and exported; sample log output; and confirmation that the logging cannot be silently disabled by an ordinary deployer.

#### 3.2.5 Article 13 — Transparency and instructions for use

**What it requires.** High-risk systems must be sufficiently transparent to enable deployers to interpret output and use it appropriately, and must be accompanied by **instructions for use**. Those instructions must state the provider's identity, the system's intended purpose, its level of accuracy (including the metrics), its known limitations and the conditions that may lead to risks, the human-oversight measures the deployer must implement, and the expected lifetime and maintenance arrangements.

**Who owes it.** Provider. **When.** 2 Dec 2027 / 2 Aug 2028.

**What evidence demonstrates it.** The instructions-for-use document itself. Note the dependency running downstream: a deployer cannot discharge its Article 26 duty to use the system "in accordance with the instructions" if the provider has not supplied adequate ones. Article 13 is where provider and deployer obligations interlock.

#### 3.2.6 Article 14 — Human oversight

**What it requires.** High-risk systems must be designed so that they can be effectively overseen by natural persons during use. The provider must build in the oversight measures — interfaces, stop functions, the ability to disregard or override output — and the system must support the human's capacity to understand its capacities and limits, remain alert to automation bias, and intervene or halt operation. Note the division of labour: the provider *designs the capability*; the deployer *assigns competent people to exercise it* (Article 26).

**Who owes it.** Provider (design); Deployer (operation). **When.** 2 Dec 2027 / 2 Aug 2028.

**What evidence demonstrates it.** Design documentation showing the oversight controls built into the interface, the override and stop mechanisms, and how the system surfaces the information a human needs to intervene meaningfully rather than rubber-stamp.

#### 3.2.7 Article 15 — Accuracy, robustness and cybersecurity

**What it requires.** Systems must achieve an appropriate level of accuracy, robustness and cybersecurity, and perform consistently across their lifecycle. Accuracy metrics must be declared in the instructions for use. Robustness covers resilience to errors, faults and inconsistencies, including from interaction with humans or other systems, with technical redundancy where appropriate. Cybersecurity covers resilience to attempts to alter use or behaviour, including adversarial attacks on the model itself — data poisoning, model evasion, and exploitation of model confidentiality.

**Who owes it.** Provider. **When.** 2 Dec 2027 / 2 Aug 2028.

**What evidence demonstrates it.** Declared accuracy metrics and the test methodology behind them; robustness and stress-testing results; a security assessment addressing AI-specific attack vectors, not merely conventional IT security; and a record of how the declared performance is maintained after deployment.

#### 3.2.8 Articles 16 and 17 — Quality management, conformity assessment, CE marking, registration

**What it requires.** **Article 16** sets out the provider's overarching obligations, including operating a **quality management system (QMS)** under **Article 17** — a documented set of policies, procedures and responsibilities covering regulatory compliance, design control, data management, post-market monitoring and incident reporting. Before placing the system on the market the provider must complete the applicable **conformity assessment** (internal control under Annex VI for most Annex III systems, or third-party assessment via a notified body where required), draw up the **EU declaration of conformity**, affix the **CE marking**, and **register the system in the EU database** maintained by the Commission.

**Who owes it.** Provider. **When.** 2 Dec 2027 / 2 Aug 2028.

**What evidence demonstrates it.** The QMS documentation; the completed conformity-assessment record (and the notified body's certificate where third-party assessment applies); the signed EU declaration of conformity; evidence of CE marking; and the EU-database registration entry. The QMS is the management wrapper that demonstrates the other articles are operated as a system rather than assembled once for audit.

#### 3.2.9 Post-market monitoring and serious-incident reporting (Articles 72 and 73)

**What it requires.** Providers must operate a documented **post-market monitoring** system (Article 72) that proactively collects and reviews performance data across the system's life, feeding findings back into the Article 9 risk cycle. They must **report serious incidents** (Article 73) to the relevant market-surveillance authority — including any malfunction leading to death or serious harm to health, serious and irreversible disruption of critical infrastructure, breach of fundamental-rights obligations, or serious environmental harm — within the deadlines set in Article 73 once a causal link, or its reasonable likelihood, is established.

**Who owes it.** Provider (with deployers obliged to inform the provider, and in defined cases the authority, of incidents they observe). **When.** 2 Dec 2027 / 2 Aug 2028.

**What evidence demonstrates it.** A post-market monitoring plan and the data it generates; an incident-classification procedure mapped to the Article 73 thresholds and deadlines; and a reporting log. This closes the lifecycle loop: Article 72 output should be visibly returning to the Article 9 file.

### 3.3 High-Risk — Deployer obligations

Deployers carry a lighter but non-trivial set of duties. They apply on the same staged dates — **2 December 2027** for Annex III, **2 August 2028** for Annex I.

#### 3.3.1 Article 26 — Deployer duties in operation

**What it requires.** Deployers of high-risk systems must:

- **use the system in accordance with the provider's instructions for use** (the direct downstream counterpart to Article 13);
- **assign human oversight to natural persons who are competent, trained and have the authority** to exercise it — having the override button is not enough if no qualified person is watching the screen;
- **ensure input data is relevant and sufficiently representative** for the intended purpose, to the extent the deployer controls that data;
- **monitor operation** against the instructions and suspend use and inform the provider where the system presents a risk or a serious incident occurs;
- **keep the automatically generated logs** (those enabled under Article 12) for an appropriate period, at least six months unless other law requires longer;
- **inform affected persons** where the system is used to make or assist decisions about them, and — for natural persons — inform them that they are subject to the use of a high-risk system where relevant.

**Who owes it.** Deployer. **What evidence demonstrates it.** Named oversight personnel with training records; a monitoring log; retained system logs; and the notice or disclosure given to affected individuals.

#### 3.3.2 Article 27 — Fundamental Rights Impact Assessment (FRIA)

**What it requires.** Before first use, certain deployers must carry out a **fundamental-rights impact assessment**: a structured analysis of the processes in which the system will be used, the categories of persons affected, the specific risks of harm to them, the human-oversight measures, and the steps to take if those risks materialise. The duty applies to **public bodies and bodies providing public services**, and to **private deployers in specific high-risk categories** — notably creditworthiness/credit-scoring and certain insurance (life and health) risk-assessment and pricing uses. Where a data protection impact assessment (DPIA) is also required, the two can be combined to avoid duplication.

**Who owes it.** Deployer (defined subset). **When.** 2 Dec 2027 (the Annex III categories that trigger it). **What evidence demonstrates it.** The completed FRIA, notified to the market-surveillance authority where required, and reviewed when the use materially changes.

#### 3.3.3 Interaction with GDPR Article 22

**What it requires.** The AI Act does not displace data-protection law; it sits on top of it. Where a high-risk system produces a **decision based solely on automated processing** that has legal or similarly significant effects on a person, **GDPR Article 22** independently applies: the individual generally has the right not to be subject to such a decision, and the controller must provide one of the lawful bases (explicit consent, contractual necessity, or authorising law) plus safeguards — at minimum the right to human intervention, to express a point of view, and to contest the decision.

**Who owes it.** The GDPR controller, which in most deployment scenarios is the deployer. **What evidence demonstrates it.** The Article 22 lawful-basis analysis, the meaningful-human-intervention mechanism (which should be the *same* competent person assigned under Article 26, not a separate paper exercise), and the contestation route offered to data subjects. Treat Articles 26, 27 and GDPR 22 as one connected obligation set for any solely-automated decision affecting individuals.

### 3.4 Limited Risk — Article 50 transparency

Limited-risk systems are not subject to the high-risk engineering stack. Their single obligation is **transparency**, and it is the first substantive duty most organisations will actually feel, because **Article 50 takes effect on 2 August 2026** — the same date as the penalty and governance framework, and well before any high-risk obligation bites.

**What it requires.**

- **AI systems that interact directly with natural persons** (chatbots, voice agents) must be designed so the person is **informed they are interacting with an AI**, unless that is obvious from the context. This is a **provider** design duty.
- **Providers of generative AI** must ensure synthetic audio, image, video or text output is **marked in a machine-readable format and detectable as artificially generated or manipulated**, as far as technically feasible. This is a **provider** duty.
- **Deployers** of systems that generate or manipulate **deep fakes** must disclose that the content is artificially generated or manipulated; deployers using AI to generate or manipulate **text published to inform the public on matters of public interest** must likewise disclose it (subject to editorial-control and legitimate-use carve-outs). This is a **deployer** duty.

**Who owes it.** Provider and deployer respectively, as above. **When.** 2 Aug 2026. **What evidence demonstrates it.** The disclosure UI or label as actually presented to users; the technical marking/watermarking applied to generated output; and a record of the deployer-side disclosures for deep-fake or public-interest content.

> Article 50 is the obligation that will surprise most organisations, because it arrives in August 2026 while attention is fixed on a high-risk deadline that does not land until December 2027. If you run a customer chatbot or publish AI-generated content, your first real EU AI Act compliance task is a disclosure line, not a conformity assessment.

### 3.5 Minimal Risk

The majority of AI systems — spam filters, recommendation engines, inventory forecasting, most internal productivity tooling — fall here. They carry **no mandatory obligations** under the Act's tiered requirements. The Commission encourages **voluntary codes of conduct** by which providers may apply high-risk-style requirements proportionately, but adoption is discretionary.

One cross-cutting duty does, however, apply **regardless of tier**: the **Article 4 AI-literacy** obligation, enforceable since **2 February 2025**. Providers and deployers must take measures to ensure a sufficient level of AI literacy among their staff and others operating systems on their behalf, calibrated to those persons' technical knowledge, experience and the context of use. A minimal-risk classification removes the system-specific obligations; it does not remove Article 4. **Evidence:** a proportionate training record covering the relevant staff.

### 3.6 GPAI note

If you do not merely deploy a general-purpose model but **build, train or substantially fine-tune one**, the **GPAI rules in force since 2 August 2025** can apply to you as a model provider. These bring provider-style obligations distinct from the high-risk stack above: maintaining technical documentation of the model, supplying information to downstream providers who integrate it, publishing a sufficiently detailed summary of training content, and putting in place a copyright policy. Models presenting **systemic risk** carry additional model-evaluation, adversarial-testing and incident-reporting duties. Most organisations consuming a frontier model via API are *not* GPAI providers; the threshold question is whether your fine-tuning is substantial enough to make you the provider of a modified model. Where that is plausible, scope it with counsel before assuming the consumer-only position.

### 3.7 Summary matrix

Obligations, who owes them, the tier that triggers them, and the date each is in force. Read this against the role and tier you established in Section 2.

| Obligation | Article | Applies to | Tier | In force |
|---|---|---|---|---|
| No prohibited practices; document the screen | Art 5 | Provider & Deployer | Prohibited | 2 Feb 2025 |
| AI-literacy of staff | Art 4 | Provider & Deployer | All tiers | 2 Feb 2025 |
| Risk management system | Art 9 | Provider | High-Risk | 2 Dec 2027 (III) / 2 Aug 2028 (I) |
| Data & data governance, bias | Art 10 | Provider | High-Risk | 2 Dec 2027 / 2 Aug 2028 |
| Technical documentation | Art 11 + Annex IV | Provider | High-Risk | 2 Dec 2027 / 2 Aug 2028 |
| Automatic logging capability | Art 12 | Provider | High-Risk | 2 Dec 2027 / 2 Aug 2028 |
| Transparency & instructions for use | Art 13 | Provider | High-Risk | 2 Dec 2027 / 2 Aug 2028 |
| Human oversight (design) | Art 14 | Provider | High-Risk | 2 Dec 2027 / 2 Aug 2028 |
| Accuracy, robustness, cybersecurity | Art 15 | Provider | High-Risk | 2 Dec 2027 / 2 Aug 2028 |
| Quality management system | Art 16/17 | Provider | High-Risk | 2 Dec 2027 / 2 Aug 2028 |
| Conformity assessment, CE marking, EU-database registration | Art 16/17 (+ Annex VI) | Provider | High-Risk | 2 Dec 2027 / 2 Aug 2028 |
| Post-market monitoring | Art 72 | Provider | High-Risk | 2 Dec 2027 / 2 Aug 2028 |
| Serious-incident reporting | Art 73 | Provider (Deployer informs) | High-Risk | 2 Dec 2027 / 2 Aug 2028 |
| Use per instructions; assign oversight; monitor; retain logs; inform affected persons | Art 26 | Deployer | High-Risk | 2 Dec 2027 / 2 Aug 2028 |
| Fundamental Rights Impact Assessment | Art 27 | Deployer (public bodies + defined categories) | High-Risk | 2 Dec 2027 |
| Solely-automated decision safeguards | GDPR Art 22 | Deployer (controller) | High-Risk (in effect) | In force (GDPR) |
| Re-badge/modify converts deployer to provider | Art 25 | Deployer → Provider | High-Risk | 2 Dec 2027 / 2 Aug 2028 |
| Chatbot / AI-interaction disclosure | Art 50 | Provider | Limited Risk | 2 Aug 2026 |
| Synthetic-content marking | Art 50 | Provider | Limited Risk | 2 Aug 2026 |
| Deep-fake / public-interest-text disclosure | Art 50 | Deployer | Limited Risk | 2 Aug 2026 |
| Voluntary codes of conduct | — | Provider & Deployer | Minimal | Voluntary |
| GPAI model documentation & copyright duties | GPAI rules | Model Provider | GPAI | 2 Aug 2025 |

Where two dates appear, the earlier applies to standalone Annex III systems and the later to high-risk systems embedded in Annex I regulated products.

### 3.8 A note on sequencing

The matrix repays one observation. The obligations that arrive **first** — Articles 4 and 5 (already live) and Article 50 (August 2026) — are the cheapest to satisfy and the ones most organisations overlook because the conversation has fixated on high-risk engineering. The obligations that arrive **last** — the Article 9–17 stack — are expensive but do not bite until December 2027 at the earliest. A defensible programme front-loads the screening, literacy and transparency work that is already enforceable or imminent, and uses the runway to 2027–2028 to build the high-risk evidence base in order. Inverting that sequence — polishing a risk-management file while the chatbot still fails to disclose itself — is a common and avoidable error.

### 3.9 SME and Small Mid-Cap proportionality

The Act, reinforced by the Digital Omnibus, recognises that identical paperwork burdens fall unequally on a multinational and a fifty-person vendor. Specific, bounded relief is provided for **SMEs, including start-ups, and small mid-cap companies (SMCs)**:

- **Simplified technical documentation.** SMEs and SMCs may satisfy the **Annex IV** technical-documentation requirement (3.2.3) in a **simplified form** provided through a standard template the Commission makes available. The *substance* of the high-risk requirements is unchanged; the documentation format is lightened.
- **Proportionate quality-management and conformity-assessment processes**, and **priority, reduced-cost access** to regulatory sandboxes and to notified-body assessment where third-party assessment applies. Conformity-assessment fees are to be reduced in proportion to company size and market share.
- **Tailored guidance and channels** from the AI Office and national authorities.

Two cautions. First, proportionality lightens **how** you document and assess — it does **not** exempt you from the underlying Article 9–17 obligations, and it does not touch Articles 4, 5 or 50 at all. An SME still needs a real risk-management system; it may simply record it on a shorter template. Second, eligibility turns on the EU's formal size definitions, and benefits flow through mechanisms (the simplified template, sandbox access) that must actually be in place when you rely on them. Treat the relief as a reduction in administrative weight, not as a reduction in obligation — and confirm current eligibility thresholds and templates before scoping any programme around them.
