# Compliance Checker v1 — known defects

**Recorded:** 2026-08-18, as Phase 0 of the v2 specification
(`docs/# EU AI Act Compliance Checker v2 — Impl.md`).
**Status of v1:** live and serving users. Nothing here is fixed yet.

Phase 0's exit criterion is that "known incorrect v1 outputs are documented as
v1 behaviour, not copied as v2 expectations". This is that document. Each defect
below is also asserted, as still present, in
`src/lib/compliance-v2/v1-invariants.test.ts` — a characterisation test, so the
defect cannot be quietly forgotten, and so that fixing it in v2 forces the test
to be moved and inverted rather than deleted.

The findings came from running the ten mandatory regression scenarios of §17.2
through the live v1 engine, not from reading the code. The scenarios and the
recorded outputs are in `src/lib/compliance-v2/legacy-baseline.ts` and its test.

---

## The six defects

### 1. An out-of-scope result still renders AI Act duties

**Scenario 3** — an organisation with no EU connection, using employment
profiling.

v1 returns the headline **"Out of EU scope"** and then renders, in the same
result, a `duty` under Article 6(3) and three conditional duties including
Article 26(6) log retention and Article 26(2) human oversight. The engine
suppresses the *classification* when the scope rule fires and nothing else. The
comment in `pickClassification` describes the content findings as "signals to
revisit if the EU connection later changes", which is a defensible thing to show
a user — but the result card presents them under "Actions to take", which is
not what a signal is.

Sharpest of the six, because the two halves of the screen contradict each other.

**v2:** §20.5 — an out-of-scope result contains no current EU AI Act obligation
of any kind. If the "revisit later" material is worth keeping, it needs its own
status, not the obligations section.

### 2. A score alone produces a high-risk classification

**Scenario 4** — a provider of a general-productivity tool, adverse automated
decisions, no human oversight.

Score 7, classified **"Likely high-risk"**, with **no classification rule fired
at all**. `pickClassification` returns `Likely high-risk` on `score >= 5`
regardless of what produced the score, and the result then hands the user
provider documentation duties (Articles 11, 13 and 72) on the strength of an
arithmetic total. No Article 6 or Annex route appears anywhere in the result,
because there is none — the tier was not derived from one.

This is the defect the v2 specification is built around: §1 says the rebuild
"replaces the current score-led legal classification design", and §20.1 makes
"no score determines legal classification" the first release gate.

**v2:** the score survives only as a separate operational-readiness measure.

### 3. Ticking a sector alone produces a high-risk classification

**Scenario 2** — a microbusiness using AI for ordinary medical administration:
appointment scheduling, billing.

The only way to describe the context in v1 is to tick `healthcare` under
sensitive domains, and doing so classifies the system **"Likely high-risk"**.
Ordinary practice administration is not an Annex III use: in the health context
Annex III point 5 reaches evaluation, by or on behalf of public authorities, of
eligibility for essential public assistance benefits and services including
healthcare, and emergency call triage and dispatch. Neither is scheduling.

The anchor v1 produces gives it away — `Article 6(2) and (3)`, which names the
classification *mechanism* rather than an Annex III point, because there is no
point to name.

**v2:** Phase 3's exit criterion, "sector selection alone cannot create
high-risk status", plus §20.2's requirement of an exact Article 6 / Annex route
behind every high-risk result. This needs the intended-purpose modules, not a
sector list.

### 4. A minimal-risk micro business is shown penalty and sandbox material

**Scenario 1** — a microbusiness using a third-party productivity tool.

The result carries no duties at all, and still shows an Article 57 regulatory
sandbox measure and an Article 99(6) penalty ceiling. The markdown export goes
further: it prints the complete penalty table and the complete AI Act timeline
on every result, whatever the classification.

**v2:** §4.5 — do not show duties, penalty bands, company-size categories, dates
or sector material that do not relate to the user's result. §17.3's size-band
invariant is the test.

### 5. An unknown data-type answer is silently treated as "none"

Answering **"not sure"** to the personal-data question produces a result
byte-identical to answering **"no personal data"**: same rules fired, same
confidence, same adjacent risks, no missing fact recorded. The unknown is
resolved to the favourable answer and then discarded.

The four decisive unknowns — territorial scope, role/origin, the Article 5
screen, human oversight — are handled properly, and there is a passing test
asserting each keeps confidence below High. So this is a hole in one question
rather than a systemic failure. It fails in the direction that matters, though:
a user who does not know whether the system touches personal data is told that
it does not.

**v2:** §4.3 and §20.7 — an unknown is a state the engine carries, never a value
it resolves. §4.6 — prefer "cannot be determined" to a false definite.

### 6. The Article 50 published-text exception is not modelled

**Scenario 6** — AI-generated text published to inform the public on a matter of
public interest, human-reviewed, with an identified person holding editorial
responsibility.

v1 emits a flat Article 50 disclosure `duty`. Article 50(4) does not require
disclosure in exactly this case. v1 has no exception handling on the
transparency route at all, and the human-oversight answer changes nothing.

**v2:** Phase 3 — paragraph- and role-specific Article 50 routes, with their
exceptions, and provider and deployer duties kept distinct.

---

## Two representational gaps

Not wrong answers — things v1 cannot express, which the v2 question catalogue
has to.

**No establishment country.** Scenarios 7, 8 and 9 distinguish a US provider
placing a system on the EU market, a Canadian provider whose outputs are used in
the EU, and a UK deployer with EU operations. v1 has no country question:
`eu_scope` records the *connection* to the Union and never where the
organisation sits. Scenarios 7 and 8 produce identical results, which
`legacy-baseline.test.ts` asserts so the gap is visible rather than assumed.

**No Annex III point.** v1 records a sensitive *domain* — employment,
healthcare, credit — where the Regulation classifies by intended purpose within
an Annex III point. Defect 3 is the consequence, and no amount of rule tuning
closes it without new questions.

---

## What v1 already gets right

Worth recording, because Phases 2–5 are where these would be lost by accident.
All are asserted as passing tests in the same file.

- **Recommendations never render as obligations.** The typed-item work of
  2026-08-17 groups `good-practice` under "Recommended governance", and
  concessions, support measures and enforcement information under their own
  headings. §17.3's second and third invariants already hold.
- **Provider-only findings never reach a pure deployer.** The Article 11/17
  reliefs, the Article 19(1) retention duty and the Article 6(4) documentation
  duty are all gated on `hasProviderDuties()`, and the size reliefs additionally
  on being in an Annex III domain.
- **Unknown decisive answers keep confidence below High** — see defect 5 for the
  exception.
- **A user who will not state organisation size still reaches a result.** v1
  never asks for turnover, balance sheet or group status; `org_size` is
  headcount bands plus "prefer not to say". §20.8 is satisfied today, and Phase
  2's size evaluator is where it could regress.

---

## How to use this file

When v2 fixes a defect, the corresponding test in `v1-invariants.test.ts` will
fail. That is the signal to move it into the v2 suite with the assertion
inverted, and to strike the entry here — leaving the record of what was wrong in
git history rather than in a stale document.
