# EU AI Act Compliance Checker v2 — Implementation Specification

**Status:** Approved for implementation planning  
**Product:** Silicon & Stone Compliance Checker  
**Primary regime:** Regulation (EU) 2024/1689 (EU AI Act), as amended and versioned in the repository rulepack  
**Secondary overlay:** AI-related EU/UK GDPR considerations only  
**Audience:** EU and UK organisations, and organisations elsewhere (including the United States and Canada) whose AI systems are placed on the EU market, put into service in the EU, or whose outputs are used in the EU  
**Account model:** Anonymous assessment; email required only for delivery/access to the full report  
**Legal positioning:** Automated preliminary compliance assessment; not legal advice

---

## 1. Purpose

Rebuild the current Compliance Checker as a legally structured, user-friendly EU AI Act assessment that:

- determines territorial scope, role and likely AI Act classification from the facts supplied;
- distinguishes legal obligations from recommendations, entitlements and supplier responsibilities;
- distinguishes obligations that apply now from future or conditional obligations;
- gives specific answers for the user's organisation, use case and role;
- explains the relevant law inside the result so that following an external source link is optional;
- allows a user to complete the checker when information is unknown;
- treats unknown facts as uncertainty rather than silently assuming either a favourable or adverse answer;
- provides a controlled, traceable full report without allowing an LLM to invent legal conclusions.

This specification replaces the current score-led legal classification design. A score may be retained only as a separate operational-readiness measure and must never determine whether a system is prohibited, high-risk or subject to a transparency duty.

---

## 2. Confirmed product decisions

1. The EU AI Act is the checker’s primary legal regime.
2. GDPR is included only as a separate, limited AI-related overlay when personal data may be involved.
3. The assessment must support organisations established inside and outside Europe.
4. Users do not create accounts and cannot save assessments to an account.
5. A useful core result is shown on screen; the full report may be gated by email.
6. Specialist branches are required, but the checker must retain a general route for all other industries and uses.
7. The interface must not force users to provide financial information they may not possess.
8. Legal source explanations must be embedded in the result. External links are supporting references, not required reading.
9. A “not legal advice” disclaimer remains, but must not be used to excuse inaccurate or vague output.
10. Qualified EU AI Act counsel review is recommended before describing the legal decision matrix as externally validated, but development is not conditional on counsel being appointed.

---

## 3. Goals and non-goals

### 3.1 Goals

- Accurate first-pass EU AI Act classification.
- Exact statutory route for every prohibited or high-risk result.
- Role-specific findings.
- Current, future and conditional applicability.
- High completion rate, including for small organisations with incomplete information.
- Plain-language, fact-specific explanations.
- Deterministic legal findings with auditable source provenance.
- Safe use of AI for intake assistance and prose, not legal decision-making.
- Versioned results that can be reproduced from the recorded answers and rulepack version.

### 3.2 Non-goals

- Providing legal advice or replacing professional review.
- A complete GDPR compliance audit.
- A complete assessment of every national law or sector-specific regime.
- Automatically resolving genuinely disputed legal interpretations.
- Inferring facts that the user did not supply.
- Producing a definitive SME classification from headcount alone.
- Using a general risk score as an AI Act legal category.
- Requiring an account or building a customer dashboard in v2.

---

## 4. Product principles

### 4.1 Facts before conclusions

Every conclusion must identify the answer facts on which it depends. If a decisive fact is unknown, the conclusion must be provisional.

### 4.2 Legal status must be explicit

Every action shown to a user must be labelled as one of:

- current legal obligation;
- future legal obligation;
- conditional legal obligation;
- recommended safeguard;
- supplier/provider responsibility;
- regulatory entitlement or relief;
- adjacent-law consideration;
- unresolved issue requiring confirmation.

### 4.3 Unknown is a valid completion path

Users must be able to select “Not sure” wherever a reasonable non-specialist may not know the answer. The assessment must complete unless the minimum factual description of the AI use is absent.

### 4.4 Explain, then cite

For every legal finding, explain what the law covers, why it matters here, the important conditions and exceptions, and the practical action. Then show the article and official source.

### 4.5 No irrelevant information

Do not show duties, penalty bands, company-size categories, dates or sector material that do not relate to the user’s result.

### 4.6 Fail safely

The rules engine must prefer “possibly applies” or “cannot be determined” over a false definitive conclusion. Report generation must fail closed if a legal proposition cannot be verified.

---

## 5. High-level architecture

Build v2 alongside the existing engine behind a feature flag. Do not delete or directly rewrite the existing engine until the v2 golden test suite passes and the v2 result has been approved for release.

```text
Question catalogue
      ↓
Validated answer record
      ↓
Scope → role → Article 5 → Article 6/Annex routes → Article 50
      ↓
Typed legal findings + readiness findings + GDPR overlay
      ↓
Deterministic on-screen result
      ↓
Controlled report generator
      ↓
Proposition verification + emailed report
```

The LLM may assist with:

- mapping user free text to controlled answer candidates;
- presenting those candidates for user confirmation;
- improving non-legal explanatory prose in the full report.

The LLM must not:

- select the legal classification;
- create a new obligation;
- change a finding’s role, status, date, conditions or exceptions;
- cite a source that was not selected by the deterministic engine;
- infer a missing fact;
- turn a recommendation into an obligation.

---

## 6. Core data contracts

Create a new v2 namespace rather than extending the current string-based result in place.

### 6.1 Answer model

```ts
export type AnswerState =
  | "answered"
  | "unknown"
  | "not_applicable"
  | "declined";

export type AnswerValue = string | string[] | boolean | number | null;

export interface AssessmentAnswerV2 {
  questionId: string;
  state: AnswerState;
  value: AnswerValue;
  source: "manual" | "intake_confirmed";
  answeredAt?: string;
}
```

An explicit `unknown` answer counts as completion of a question. It must not be converted to `false`, an empty string or a default enum value.

### 6.2 Question model

```ts
export type QuestionImportance =
  | "classification_decisive"
  | "finding_decisive"
  | "readiness_only"
  | "context_only";

export interface AssessmentQuestionV2 {
  id: string;
  section: string;
  prompt: string;
  shortPrompt?: string;
  help: string;
  whyAsked: string;
  examples?: string[];
  answerType: "single" | "multi" | "boolean" | "number" | "text";
  options?: Array<{ value: string; label: string; help?: string }>;
  allowUnknown: boolean;
  allowNotApplicable: boolean;
  importance: QuestionImportance;
  visibleWhen?: ConditionExpression;
  validate?: ValidationRule[];
}
```

“Required” in v2 means the user must provide an answer state, not that they must know the substantive answer.

### 6.3 Legal conclusion model

```ts
export type ScopeOutcome =
  | "in_scope"
  | "likely_in_scope"
  | "out_of_scope"
  | "scope_uncertain";

export type LegalClassification =
  | "potentially_prohibited"
  | "likely_high_risk"
  | "possible_high_risk"
  | "specific_transparency_duties"
  | "no_specific_category_identified"
  | "out_of_scope"
  | "insufficient_information";

export type LegalRole =
  | "provider"
  | "deployer"
  | "importer"
  | "distributor"
  | "product_manufacturer"
  | "authorised_representative";

export type FindingKind =
  | "current_obligation"
  | "future_obligation"
  | "conditional_obligation"
  | "recommended_safeguard"
  | "supplier_responsibility"
  | "entitlement_or_relief"
  | "adjacent_law"
  | "unresolved_issue";

export type Applicability =
  | "applies"
  | "likely_applies"
  | "possibly_applies"
  | "does_not_apply"
  | "cannot_determine";
```

### 6.4 Finding model

```ts
export interface LegalSourceReference {
  documentId: string;
  documentTitle: string;
  provision: string;
  officialUrl: string;
  rulepackVersion: string;
  reviewedAt: string;
  shortExtract: string;
  plainEnglishSummary: string;
  conditions: string[];
  exceptions: string[];
}

export interface ComplianceFindingV2 {
  id: string;
  ruleId: string;
  title: string;
  kind: FindingKind;
  applicability: Applicability;
  appliesToRoles: LegalRole[];
  effectiveFrom?: string;
  whyItApplies: string;
  practicalMeaning: string;
  action: string;
  evidenceToKeep: string[];
  triggeringAnswerIds: string[];
  missingAnswerIds: string[];
  source?: LegalSourceReference;
  priority: "urgent" | "high" | "normal" | "low";
  confidence: "high" | "medium" | "low";
}
```

### 6.5 Complete result model

```ts
export interface ComplianceResultV2 {
  schemaVersion: "2";
  checkerVersion: string;
  rulepackVersion: string;
  assessedAt: string;
  scope: {
    outcome: ScopeOutcome;
    explanation: string;
    triggeringAnswerIds: string[];
    missingAnswerIds: string[];
  };
  roles: Array<{
    role: LegalRole;
    applicability: Applicability;
    explanation: string;
    triggeringAnswerIds: string[];
    missingAnswerIds: string[];
  }>;
  classification: LegalClassification;
  classificationExplanation: string;
  statutoryRoutes: string[];
  organisationSize: OrganisationSizeResult;
  legalFindings: ComplianceFindingV2[];
  readinessFindings: ComplianceFindingV2[];
  gdprOverlay?: GdprAiOverlayResult;
  materialUnknowns: MaterialUnknown[];
  reviewTriggers: string[];
  disclaimer: string;
}
```

No API or UI layer may collapse these types into a single unqualified `obligations: string[]` collection.

---

## 7. Questionnaire specification

### 7.1 Interaction rules

- Show one primary question per screen on mobile.
- Show a visible section-based progress indicator, not a misleading fixed question count when branching is dynamic.
- Offer Back without losing answers.
- Permit an explicit Not sure answer where configured.
- Explain legal terms before requiring an answer.
- Do not expose article numbers in the question unless they help the user.
- Show “Why we ask” as optional supporting text.
- Keep free-text entry optional except for the general-use description when no controlled option fits.
- When intake AI proposes an answer, require user confirmation before it is saved.
- Never send names, email addresses or unrelated contact data to the intake model.

### 7.2 Universal triage

The universal triage must establish:

1. `organisation_establishment`
   - EU/EEA member state
   - United Kingdom
   - United States
   - Canada
   - Other
   - Not sure / multinational

2. `ai_market_connection`
   - AI system or model is placed on or offered in the EU market
   - AI system is put into service in the EU
   - AI output is used in the EU
   - Organisation uses AI from an EU establishment
   - None of these
   - Not sure

3. `organisation_activity`
   - Built or commissioned the AI system
   - Supplies it under own name/trademark
   - Imports it into the EU
   - Distributes or resells it
   - Integrates/configures a third-party system
   - Uses a third-party system internally or for customers
   - More than one
   - Not sure

4. `intended_use_family`
   - controlled high-level use families plus “Something else” and “Not sure”

5. `intended_use_description`
   - optional for controlled routes;
   - required as an answer state for “Something else,” but “Not sure how to describe it” remains available.

6. `individual_impact`
   - no decision about individuals;
   - administrative assistance only;
   - informs a human decision;
   - recommends/ranks/scores;
   - automatically determines an outcome;
   - not sure.

7. `personal_data_use`
   - yes;
   - possibly;
   - no;
   - not sure.

8. `employee_band`
   - 1–9;
   - 10–49;
   - 50–249;
   - 250–749;
   - 750 or more;
   - not sure.

The triage must select relevant branches but must not use sector alone to establish high-risk status.

### 7.3 Role branch

Ask only questions relevant to the selected activity:

- Is the system supplied under the organisation’s own name or trademark?
- Was the original intended purpose changed?
- Was the system materially modified?
- If modified, did it remain or become high-risk?
- Is the organisation only configuring normal settings or connecting the system to existing software?
- Does the organisation place the system on the EU market from outside the EU?
- Is it supplied onwards without substantial change?
- Is it incorporated into a regulated product under the organisation’s name?

Integration, configuration, fine-tuning or resale must not automatically create provider status. Provider transition requires the relevant legal conditions to be established or marked uncertain.

### 7.4 Intended-purpose branches

Implement specialist modules for:

- biometrics;
- critical infrastructure;
- education and vocational training;
- employment and worker management;
- essential private and public services;
- credit and insurance;
- emergency dispatch and triage;
- law enforcement;
- migration, asylum and border control;
- justice and democratic processes;
- regulated products and safety components;
- chatbots and direct interaction;
- synthetic content and deepfakes;
- general-purpose AI models.

Each module must distinguish the exact statutory use from ordinary activity in the same sector. For example, healthcare administration must not be classified as high-risk solely because it occurs in healthcare.

### 7.5 General-use route

The general route must remain available for all other uses. Ask:

- What does the system produce, recommend or decide?
- Who is affected?
- Does it determine access, eligibility, selection, treatment or pricing?
- Does it profile, rank or score people?
- Can it produce legal or similarly significant effects?
- Is a human required to review the output?
- Can that person meaningfully disagree and override it?
- Is it part of a product regulated by EU product-safety legislation?
- Does it use biometrics, emotion inference or sensitive attributes?

The intake model may suggest controlled values from free text. It must return evidence phrases from the user text and confidence for each suggestion. Low-confidence suggestions must be left unanswered.

### 7.6 Article 5 branch

Create separate conditions and exception questions for every supported prohibited-practice route. A broad positive screen returns `potentially_prohibited` until all legally material conditions and exceptions have been resolved.

The user-facing output must use “potentially prohibited” unless the complete deterministic rule path has been satisfied and the relevant exceptions have been excluded.

### 7.7 Article 50 branch

Separate branches are required for:

- direct human interaction;
- provider marking of synthetic content;
- deployer use of emotion recognition;
- deployer use of biometric categorisation;
- deepfakes;
- AI-generated or manipulated public-interest text;
- human editorial review and editorial responsibility;
- standard editing and assistive exceptions;
- circumstances where AI interaction is already obvious.

Each finding must identify whether the relevant duty belongs to a provider or deployer. A deployer may receive a recommendation to confirm provider functionality, but a provider duty must not be relabelled as the deployer’s legal obligation.

### 7.8 Governance/readiness branch

Questions on documentation, logs, oversight, vendor evidence, accuracy, monitoring and change control affect:

- readiness findings;
- recommended safeguards;
- evidence gaps;
- confidence where a legal duty depends on the missing evidence.

They must not create high-risk legal status through a numerical score.

---

## 8. Organisation-size handling

### 8.1 Minimum-friction approach

Ask employee band universally. Ask turnover, balance-sheet and group-relationship questions only when:

- SME treatment is relevant to an applicable finding;
- the user requests a more precise size determination; or
- a penalty explanation is legitimately required.

### 8.2 Optional follow-up values

Financial questions must accept:

- an approximate band;
- exact value if voluntarily supplied;
- not sure;
- prefer not to say.

Do not ask users to upload financial documents.

### 8.3 Output states

```ts
export type OrganisationSizeStatus =
  | "confirmed"
  | "provisional_headcount_only"
  | "uncertain_group_relationship"
  | "insufficient_information";
```

Example output:

> Likely microenterprise based on headcount. The formal EU definition also considers financial figures and relationships with linked or partner enterprises. Because those details were not supplied, size-dependent treatment is shown as provisional.

### 8.4 Display rules

- Do not show all organisation-size categories.
- Do not show large-enterprise or small-mid-cap thresholds to a micro user.
- Do not label fine ceilings, sandbox access or simplified procedures as obligations.
- Do not calculate a likely fine from incomplete financial information.
- Size uncertainty must not block the rest of the assessment.

---

## 9. Legal decision engine

### 9.1 Evaluation order

```ts
function evaluateAssessmentV2(answers: AnswerRecord): ComplianceResultV2 {
  validateMinimumAnswerStates(answers);

  const scope = evaluateTerritorialScope(answers);
  const roles = evaluateLegalRoles(answers);
  const article5 = evaluateArticle5(answers, scope, roles);
  const annexI = evaluateAnnexIRoute(answers, scope, roles);
  const annexIII = evaluateAnnexIIIRoutes(answers, scope, roles);
  const exemption = evaluateArticle6Exemption(answers, annexIII);
  const article50 = evaluateArticle50(answers, scope, roles);
  const size = evaluateOrganisationSize(answers);
  const legalFindings = buildLegalFindings({
    answers,
    scope,
    roles,
    article5,
    annexI,
    annexIII,
    exemption,
    article50,
    size,
  });
  const readinessFindings = buildReadinessFindings(answers, legalFindings);
  const gdprOverlay = evaluateGdprAiOverlay(answers);

  return assembleResult(/* deterministic inputs only */);
}
```

### 9.2 Classification precedence

1. Potential Article 5 result.
2. Likely high-risk through a completed Annex I/Article 6(1) route.
3. Likely high-risk through a completed Annex III/Article 6(2) route after evaluating Article 6(3).
4. Possible high-risk where a legally decisive fact is unknown.
5. Specific Article 50 duties.
6. No specific category identified.
7. Out of scope where territorial scope is determinatively absent.
8. Insufficient information where the system/use cannot be described sufficiently to apply the routes.

### 9.3 Scope suppression

If scope is `out_of_scope`:

- do not emit current EU AI Act obligations;
- do not emit EU AI Act penalties;
- do not emit SME relief as if applicable;
- show conditional review triggers explaining what could bring the activity into scope;
- allow optional readiness recommendations, clearly labelled as recommendations.

If scope is `scope_uncertain`, legal findings must be conditional or unresolved.

### 9.4 Dates

Every legal duty must carry an effective date or a rulepack declaration that it is currently applicable. The display layer must calculate status using the assessment date and must never label a future duty “immediate.”

### 9.5 Confidence

Confidence is derived from rule completeness, not a general score:

- **High:** every decisive condition is answered and no material conflict exists.
- **Medium:** conclusion is likely but one non-core fact or interpretation remains.
- **Low:** a decisive fact is unknown, contradictory or dependent on unresolved interpretation.

A result with an unanswered classification-decisive question cannot have high confidence.

---

## 10. Legal content library

For each legal proposition, store:

- stable proposition ID;
- rule ID;
- document and provision;
- applicable roles;
- conditions;
- exceptions;
- effective date;
- approved plain-English summary;
- approved practical meaning;
- short authoritative extract;
- official URL;
- rulepack version;
- date last reviewed;
- review status (`internal`, `counsel_reviewed`, `superseded`).

The user should not need to open the source to understand the finding. The source link remains available for verification and further reading.

Do not generate summaries dynamically from arbitrary retrieved law at assessment time. Legal summaries are curated content and must be tested and versioned.

If an adjacent document or guidance source is cited, label its authority accurately, for example:

- binding EU regulation;
- European Commission guidance;
- harmonised standard;
- regulator guidance;
- internal governance recommendation.

Guidance must not be presented as a statutory obligation.

---

## 11. GDPR-for-AI overlay

### 11.1 Trigger

Show the overlay when `personal_data_use` is `yes`, `possibly` or `unknown`.

### 11.2 Scope

Ask only high-value AI/data-protection questions:

- personal data and special-category data;
- source of the data;
- known purpose and lawful-basis review;
- significant automated decisions;
- genuine human intervention;
- DPIA consideration;
- controller/processor understanding;
- international transfers;
- supplier retention and model-improvement use;
- ability to answer data-subject requests where relevant.

### 11.3 Output

The overlay is headed **Related data-protection considerations** and must state that it is not a complete GDPR audit.

Its findings use the same typed finding model but `kind` must be `adjacent_law`, `recommended_safeguard` or `unresolved_issue` unless a separately approved GDPR proposition establishes a specific duty.

Do not mix GDPR findings into the AI Act legal classification.

Where the available answers permit it, distinguish EU GDPR from UK GDPR. If jurisdiction cannot be determined, explain that both may need consideration rather than selecting one by assumption.

---

## 12. Result experience

### 12.1 Result sections

Render in this order:

1. **Your likely legal position**
2. **What you are required to do now**
3. **Duties applying later**
4. **Conditional duties and facts to confirm**
5. **Recommended safeguards**
6. **Information to request from your supplier**
7. **Related data-protection considerations**
8. **Relevant law explained**
9. **When to reassess**

Hide empty sections.

### 12.2 Finding card requirements

Every legal card shows:

- status label;
- title;
- applicable role;
- why it applies to this user;
- what the law means;
- action to take;
- evidence to retain;
- effective date, if relevant;
- conditions and exceptions;
- material uncertainty;
- short legal extract;
- article/document label;
- optional official-source link.

### 12.3 Personalisation

Use only confirmed or explicitly provisional facts. Do not mention employee bands, industries, roles, technologies or duties unrelated to the user’s answers.

### 12.4 Penalties

Do not show a universal penalty table.

Show penalty information only when:

- the result identifies a relevant obligation or prohibited-practice issue;
- the information helps the user understand the seriousness of that finding;
- it can be explained without implying a likely enforcement outcome.

Penalty information is contextual, not a user obligation or prediction.

### 12.5 Disclaimer

Use this approved concept at entry, results and report:

> This checker provides an automated preliminary assessment based on the information you enter and the legal sources identified in the result. It is not legal advice and does not replace advice on your particular circumstances. Where information is missing or the legal position depends on interpretation, the checker identifies that uncertainty.

Final wording may be editorially refined but must preserve these points.

---

## 13. Anonymous sessions, email and privacy

### 13.1 Session behaviour

- No account is required.
- Do not include assessment answers in URLs.
- Use an opaque session/report identifier.
- A browser-session recovery mechanism may be used without creating an account.
- Session and report retention periods must be configurable, documented and approved before release.
- Do not invent retention periods during implementation; preserve current behaviour until a product/privacy decision is recorded.

### 13.2 Email gate

- Show a useful core result before requesting email.
- Request email only for delivery/access to the expanded report.
- Explain why the email is collected.
- Keep report-delivery consent separate from marketing consent.
- Do not subscribe the user to marketing merely because they request the report.
- Record the consent wording/version used.

### 13.3 Data minimisation

- Warn users not to enter names, health records, employee cases, customer records or other identifiable data in free text.
- Do not send the email address to the intake or report-generation model.
- Pass only assessment facts required for the report.
- Log rule IDs and system errors, not unrestricted answer text, unless explicitly required and approved.
- Ensure analytics do not capture free-text answers or report contents.

---

## 14. Full report generation

### 14.1 Deterministic core

The following report sections are generated directly from `ComplianceResultV2` and the legal content library:

- scope;
- roles;
- classification;
- current/future/conditional legal findings;
- legal extracts and sources;
- material unknowns;
- effective dates;
- review triggers;
- disclaimer and version information.

### 14.2 LLM-supported sections

The LLM may draft:

- executive summary;
- plain-language transition text;
- consolidated practical plan;
- non-legal explanation of the user’s recorded context.

The model input must include the complete validated answer record with human-readable labels, excluding email and unnecessary personal data.

### 14.3 Output constraints

- The report schema must reference proposition IDs for every legal claim.
- The model cannot add proposition IDs.
- Each legal paragraph must be assembled from or explicitly linked to selected findings.
- Unknown facts remain unknown.
- Generated prose must not use “must,” “required,” “prohibited” or equivalent legal language unless supported by a selected proposition with the matching status.

### 14.4 Verification

Verification must check:

- proposition ID exists in the approved library;
- source text/extract matches the pinned corpus;
- the proposition’s role matches the result role;
- all required conditions are satisfied;
- no known exception has been triggered;
- the effective date/status is correct;
- the finding kind matches the wording used.

Any invalid legal proposition is removed. There is no tolerance threshold for unsupported legal claims.

---

## 15. API and validation requirements

### 15.1 Versioning

All v2 requests and stored records include:

- `schemaVersion: "2"`;
- checker version;
- question-catalogue version;
- rulepack version.

### 15.2 Answer validation

Server validation must reject:

- unknown question IDs;
- values outside the question’s allowed enum;
- incorrect value types;
- arrays beyond configured limits;
- free text beyond configured limits;
- a report request without minimum completed answer states;
- answers to hidden branch questions that are incompatible with the active path, unless explicitly retained as historical answers after a user changes an earlier response.

### 15.3 Error behaviour

Return structured, user-safe errors:

- `INVALID_ANSWER`
- `INCOMPLETE_MINIMUM_FACTS`
- `STALE_QUESTION_VERSION`
- `STALE_RULEPACK_VERSION`
- `REPORT_GENERATION_FAILED`
- `LEGAL_VERIFICATION_FAILED`
- `SESSION_EXPIRED`

Do not expose prompts, provider errors, secrets or stack traces to the browser.

### 15.4 Backward compatibility

The current result remains available while v2 is behind a flag. Do not attempt to reinterpret old answer records as v2 records unless a tested migration maps every relevant value. Prefer starting a new v2 assessment.

---

## 16. Analytics and usability measurement

Track only privacy-safe events:

- assessment started;
- section completed;
- assessment completed;
- explicit unknown selected, by question ID;
- branch entered;
- result classification category;
- email report requested;
- report delivered/failed;
- user usefulness rating;
- assessment abandoned at question ID;
- reassessment trigger selected.

Do not send free-text answers, email addresses, legal report content or personal-data selections as analytics payloads.

Primary success measures:

- completion rate;
- abandonment by question;
- proportion of provisional results;
- user-rated clarity and usefulness;
- legal scenario accuracy;
- unsupported legal claims (target: zero);
- irrelevant finding leakage (target: zero).

---

## 17. Testing strategy

### 17.1 Unit tests

Test each evaluator independently:

- territorial scope;
- role determination;
- Article 5 routes and exceptions;
- Annex I routes;
- every Annex III intended-purpose route;
- Article 6(3) exemptions;
- Article 50 routes and exceptions;
- effective dates;
- organisation size;
- GDPR overlay;
- finding classification;
- unknown propagation.

### 17.2 Golden legal scenarios

Create versioned fixtures containing answers and the complete expected result. Every legal branch requires:

- at least one positive case;
- a closely related negative case;
- an unknown/insufficient case;
- an exception case where relevant;
- provider and deployer variants where roles differ;
- in-scope and out-of-scope variants where relevant.

Mandatory regression scenarios include:

1. Microbusiness using third-party general productivity AI.
2. Microbusiness using AI for ordinary medical administration.
3. Out-of-scope organisation using employment profiling.
4. General productivity provider with high operational impact but no Annex route.
5. Third-party chatbot deployer.
6. Human-reviewed public-interest text with an identified responsible editor.
7. US provider placing a system on the EU market.
8. Canadian provider whose system output is used in the EU.
9. UK deployer with EU operations.
10. User who does not know turnover, balance sheet or group status.

### 17.3 Invariants

Add property/invariant tests:

- Out-of-scope result cannot contain current EU AI Act obligations.
- Recommendation cannot render in the legal-obligations section.
- Entitlement cannot render as an obligation.
- Provider-only finding cannot be assigned to a deployer without a provider role.
- Future finding cannot render as current before its effective date.
- High-risk classification must contain an exact statutory route.
- A score cannot change legal classification.
- Unknown decisive answers prevent high confidence.
- An unsupported proposition cannot reach the final report.
- Micro/provisional-size result does not show unrelated size bands.

### 17.4 Integration tests

- Dynamic questionnaire branching.
- Back-navigation and changed answers.
- Intake suggestions and confirmation.
- On-screen result rendering.
- Email gate separation.
- Full report generation.
- Verification failure handling.
- Session expiration.
- Rulepack version mismatch.

### 17.5 Accessibility and usability

- Keyboard-only completion.
- Screen-reader labels and status announcements.
- Mobile viewport completion.
- Plain-language comprehension testing.
- Completion testing with users who do not know legal terminology or company financial values.

---

## 18. Repository implementation map

### 18.1 New modules

Create under `src/lib/compliance-v2/`:

```text
types.ts
questions/
  core.ts
  role.ts
  article-5.ts
  article-50.ts
  gdpr-ai.ts
  branches/
    biometrics.ts
    critical-infrastructure.ts
    education.ts
    employment.ts
    essential-services.ts
    finance-insurance.ts
    healthcare.ts
    law-enforcement.ts
    migration.ts
    justice-democracy.ts
    regulated-products.ts
    general-purpose-ai.ts
    general-use.ts
engine/
  evaluate.ts
  scope.ts
  roles.ts
  article-5.ts
  annex-i.ts
  annex-iii.ts
  article-6-exemption.ts
  article-50.ts
  organisation-size.ts
  readiness.ts
  gdpr-ai.ts
  findings.ts
legal-content/
  propositions.ts
  sources.ts
  dates.ts
validation/
  answers.ts
  result.ts
test-fixtures/
  golden-scenarios.ts
```

File names may be adjusted to match established repository conventions, but the separation of questions, evaluation, legal content and validation must remain.

### 18.2 Existing modules to adapt

- `src/app/(website)/tools/compliance-checker/page.tsx`
  - add v2 questionnaire orchestration and result view behind flag;
  - remove universal timeline/penalty display from v2;
  - render typed sections.

- `src/components/tools/ComplianceIntake.tsx`
  - target v2 controlled vocabulary;
  - retain explicit user confirmation;
  - support unknown rather than forced mapping.

- `src/lib/intake/vocabulary.ts`
  - generate vocabulary from active v2 question catalogue where practical.

- `src/lib/checker-session-schema.ts`
  - add strict v2 enum, branch and completeness validation.

- `src/app/api/tools/compliance-checker/session/route.ts`
  - accept/version v2 answer records.

- `src/app/api/tools/compliance-checker/intake/route.ts`
  - return evidence-grounded v2 suggestions only.

- `src/app/api/tools/compliance-checker/report/route.ts`
  - require a complete validated v2 result and answer record.

- `src/lib/report/generate.ts`
  - accept full answers, typed findings and approved proposition IDs;
  - prevent new legal claims.

- `src/lib/report/schema.ts`
  - add v2 report schema with proposition references.

- `src/lib/report/verify.ts`
  - verify proposition applicability, not quotation presence alone.

- `src/components/tools/ReportView.tsx`
  - render v2 typed sections and accurate verification language.

- `src/lib/tools-markdown.ts`
  - export the same v2 structure without “Immediate obligations” or universal penalties.

- `src/lib/flags.ts`
  - add v2 rollout flag.

### 18.3 Existing modules retained during migration

- `src/lib/ai-act-assessment.ts`
- `src/lib/ai-act-rules.ts`

Keep these as v1 until v2 release gates pass. Mark them legacy in comments only after v2 is functional; do not delete them during early phases.

---

## 19. Implementation phases and exit criteria

### Phase 0 — Safety harness and baseline

Tasks:

- Add the v2 feature flag.
- Capture current scenario outputs as legacy comparison fixtures.
- Add invariant tests for the known failure cases.
- Add schema-version infrastructure.

Exit criteria:

- Existing checker remains unchanged for users.
- All current tests pass.
- Known incorrect v1 outputs are documented as v1 behaviour, not copied as v2 expectations.

### Phase 1 — Types, catalogue and legal proposition framework

Tasks:

- Implement v2 data contracts.
- Implement question catalogue and dependency expressions.
- Implement legal proposition/source model.
- Implement answer validation.

Exit criteria:

- Catalogue can be validated at build time.
- Duplicate question/rule/proposition IDs fail tests.
- Unknown answers survive round trips without coercion.

### Phase 2 — Scope, roles and size

Tasks:

- Implement territorial-scope evaluator.
- Implement evidence-based role evaluator.
- Implement provisional organisation-size evaluator.
- Add golden scenarios for EU, UK, US and Canadian organisations.

Exit criteria:

- Out-of-scope invariant passes.
- Integration/configuration does not automatically create provider status.
- Missing financial information never prevents completion.

### Phase 3 — Article 5, Annex and Article 50 routes

Tasks:

- Implement exact intended-purpose modules.
- Implement Article 5 conditions/exceptions.
- Implement Annex I and Annex III routes.
- Implement Article 6(3) exemptions.
- Implement paragraph- and role-specific Article 50 routes.
- Add current/future applicability dates.

Exit criteria:

- Every high-risk outcome contains a statutory route.
- Sector selection alone cannot create high-risk status.
- Provider and deployer transparency duties remain distinct.
- Known regression scenarios pass.

### Phase 4 — Questionnaire UI

Tasks:

- Implement universal triage and dynamic branches.
- Implement section-based progress.
- Implement back-navigation and answer invalidation when upstream answers change.
- Add help, examples, “Why we ask” and Not sure paths.
- Add data-entry warnings.

Exit criteria:

- Complete keyboard/mobile path works.
- No dead end occurs from an unknown answer.
- Hidden stale answers cannot affect evaluation.

### Phase 5 — Result UI

Tasks:

- Implement personalised result summary.
- Implement typed finding sections/cards.
- Embed legal explanations and excerpts.
- Remove irrelevant penalty/size/timeline content.
- Add version and reassessment information.

Exit criteria:

- All display invariants pass.
- Empty sections are hidden.
- Every legal card answers why it applies and what the user should do.

### Phase 6 — Report and email flow

Tasks:

- Pass full validated answers to report generation.
- Build deterministic legal report sections.
- Restrict AI prose generation.
- Implement proposition applicability verification.
- Show core result before email gate.
- Separate report delivery from marketing consent.

Exit criteria:

- Unsupported legal proposition target is zero.
- Verification failures remove affected claims and fail safely.
- Email is not included in model input.

### Phase 7 — GDPR overlay

Tasks:

- Add conditional GDPR-for-AI questions.
- Implement separate overlay findings.
- Add EU/UK jurisdiction uncertainty handling.
- Add overlay tests and disclaimer.

Exit criteria:

- GDPR cannot change AI Act classification.
- Overlay never claims complete GDPR compliance.
- Personal-data questions do not unnecessarily block the AI Act result.

### Phase 8 — Validation and release

Tasks:

- Complete golden matrix.
- Run legal-content editorial review.
- Conduct completion/usability testing.
- Run accessibility checks.
- Compare v1 and v2 in shadow mode without showing v2 to users.
- Obtain counsel review if commissioned.
- Enable v2 progressively.

Exit criteria:

- All automated checks pass.
- All release acceptance criteria in section 20 pass.
- Product/privacy decisions on retention and consent are recorded.
- Legal-content review status is displayed accurately.

---

## 20. Release acceptance criteria

The v2 checker is not ready for public default until:

1. No score determines legal classification.
2. Every high-risk result identifies an exact Article 6/Annex route.
3. Every legal finding identifies the applicable role.
4. Every legal finding is current, future or conditional.
5. Out-of-scope results contain no current EU AI Act obligations.
6. Recommendations and entitlements cannot render as obligations.
7. Unknown facts are visible and never silently defaulted.
8. Users can finish without turnover or balance-sheet figures.
9. Irrelevant organisation-size and penalty information is suppressed.
10. Each legal finding includes an embedded plain-English explanation and source extract.
11. Every legal proposition is selected from the approved library.
12. Generated reports cannot introduce new legal claims.
13. All golden scenarios and invariants pass.
14. Core result is available before the email gate.
15. Email delivery consent is separate from marketing consent.
16. Privacy-safe analytics and data-minimisation rules are enforced.
17. The result displays assessment date, checker version and rulepack version.
18. The disclaimer is present but does not replace specific uncertainty labels.

---

## 21. Codex execution protocol

Codex should implement this specification in the phase order above.

For every phase:

1. Inspect the affected current files and tests before editing.
2. State the precise files to be changed.
3. Do not infer a new legal interpretation that is absent from the approved rulepack or this specification.
4. If a material legal or product decision is missing, stop and ask the user rather than assuming.
5. Preserve unrelated user changes.
6. Keep v1 operational until the relevant v2 release gate passes.
7. Add or update tests in the same change as behaviour.
8. Run targeted tests, then the complete test, lint, typecheck, rulepack and build checks appropriate to the phase.
9. Report changed files, tests run, known limitations and the next phase.
10. Do not push, deploy, alter production data or change external services without explicit user authority.

Implementation should use small, reviewable changes. Legal-content additions and engine behaviour should not be mixed with unrelated site work.

---

## 22. Decisions that remain open

These must not be guessed during implementation:

1. ~~Session and generated-report retention periods.~~ **Resolved 2026-08-19: v1's periods, adopted explicitly.** See §23.3.
2. ~~Whether the report-request email may also be used for marketing; default implementation must treat it as report delivery only.~~ **Resolved 2026-08-19: delivery only.** See §23.3.
3. Whether anonymous browser-session recovery is desired.
4. Whether and when external EU AI Act counsel will review the decision matrix.
5. The final editorial wording of the disclaimer and privacy notice.
6. ~~Whether v2 replaces v1 immediately after approval or is released through an extended opt-in beta.~~ **Resolved 2026-08-18: extended opt-in beta.** See §23.

None of these blocks Phase 0–5 if the implementation preserves current external behaviour and keeps affected settings configurable.

---

## 23. Decisions taken during implementation

Recorded here as they are made, so a later phase does not reopen them.

### 23.1 The v2 finding vocabulary extends the shipped one (2026-08-18, Phase 1)

§6 requires a new v2 namespace, and §4.2 lists eight legal-status labels. The
shipped v1 result already types every item with a six-value `ActionKind`, added
2026-08-17, with invariants holding it in production.

**Decision: `FindingKind` is `ActionKind` extended, not a parallel vocabulary.**
`FINDING_KIND_FROM_ACTION_KIND` in `src/lib/compliance-v2/types.ts` is a total
map from the six to the nine, typed `Record<ActionKind, FindingKind>` so adding
a v1 kind without deciding its v2 meaning fails to compile. Two consequences:

- **A ninth kind, `enforcement_information`, was added to §4.2's eight.** v1
  types a penalty-ceiling statement as `enforcement`, because how a fine is
  calculated is neither an obligation, a recommendation nor an entitlement —
  which is precisely the confusion the 2026-08-17 work removed. §4.2 has no home
  for it and `adjacent_law` would say it comes from another regime. Having a kind
  for it does not license showing it: §4.5 and defect 4 still forbid penalty
  material unrelated to the user's own result.
- **`conditional` maps to `conditional_obligation`, never `future_obligation`.**
  v1 has no future status and encodes futurity in the condition prose, so the
  map cannot tell which conditionals are really future duties. Phase 3 splits
  them at the source; the map must not guess.

This keeps Phase 8's shadow comparison honest — a v1 result and a v2 result can
be compared without a lossy translation between two sets of words for the same
distinctions.

### 23.3 Retention periods and marketing use (2026-08-19, resolving §22.1 and §22.2)

**Decision: adopt the three periods v1 already runs, explicitly, and keep the
report email to delivery use.** Taken by the owner on 2026-08-19, which unblocked
release criterion 16 — the last criterion that could not be assessed.

| What is kept | Period | Where the behaviour lives |
|---|---|---|
| A generated report and the answers behind it | 30 days | `REPORT_TTL_SECONDS` |
| The email address and its consent record | two years | `CAPTURE_TTL_SECONDS` |
| An in-progress assessment | 24 hours | `CHECKER_SESSION_TTL_SECONDS` |

Marketing is a separate consent, offered separately, defaulting to false, with
the wording shown recorded alongside it. `report/consent.ts` already made the
alternative unrepresentable; what was missing was the decision that the
implementation's default is also the *policy*.

Three consequences worth not undoing:

- **The decision record is not the configuration.** `compliance-v2/retention.ts`
  holds the policy — what a privacy notice promises — and nothing reads it to
  decide how long to keep anything; v1's constants still do that. The two are
  asserted to agree, so the promise and the behaviour cannot drift apart
  silently. This is the same arrangement the regulatory lane uses against the
  rule pack: assert consistency, never share storage.
- **The agreement is checked in two places because it has to be.**
  `retention.test.ts` covers the report and session periods. The email period
  lives in `report/capture.ts`, which is `server-only` and therefore throws under
  vitest, so that one is asserted in `scripts/compliance-v2-check.ts` — which
  `prebuild` runs. The check is not skipped; it is somewhere that can run it.
- **Adopting is not inheriting.** §22.1 was held open precisely because copying a
  constant makes it policy by default, and a period nobody chose is not a promise
  anybody can defend. Each period carries its reasoning in the record.

§22.3 (anonymous session recovery) stays open, and deliberately was not resolved
by lengthening the session period — recovery is a feature to decide on, not a
side effect of a retention number.

### 23.2 v2 ships as an extended opt-in beta (2026-08-18, resolving §22.6)

**Decision: opt-in beta, not a cutover.** v1 remains the default for every user
until §20's release acceptance criteria pass *and* the beta has run. Consequences
for the phases that have not been built yet:

- `COMPLIANCE_CHECKER_V2` stays false by default and gates the route, not the
  build. Both engines ship in the same bundle.
- **Phase 4 must build the v2 questionnaire alongside v1's, not in place of it.**
  This is the phase where the decision costs something, and it is why it was
  worth resolving before Phase 1 finished.
- A beta user must be able to leave. An opt-out returns them to v1 with their v1
  session intact, which is why v2 records carry `schemaVersion` from Phase 0 and
  why §15.4 forbids reinterpreting a v1 record as a v2 one.
- Phase 8's shadow-mode comparison runs before the beta opens, not instead of it.
