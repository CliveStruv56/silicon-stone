# Compliance Checker v2 — where it is, and what to read first

**Updated:** 2026-08-18. Phases 0–7 built. Flag dark; v1 unchanged.

This is the one-page orientation. The plan of record is
`docs/# EU AI Act Compliance Checker v2 — Impl.md`; per-phase history is
`project_summary.md` §9 and §11; the invariants are in `CLAUDE.md`.

---

## How to see it

```bash
NEXT_PUBLIC_COMPLIANCE_CHECKER_V2=true npm run dev
# then http://localhost:3000/tools/compliance-checker?v2=1
```

Both gates are required. Without the flag there is no offer; without `?v2=1` the
reader gets v1. Nothing is stored, so closing the tab returns you to v1 — which
is right while v2 is unreleased, and sidesteps §22.3's open session-recovery
decision.

## What exists

| Where | What |
|-------|------|
| `src/lib/compliance-v2/types.ts` | §6 contracts. `AnswerState`, `FindingKind` (nine — §4.2's eight plus `enforcement_information`), `FINDING_KIND_FROM_ACTION_KIND` as a total map from v1's vocabulary |
| `conditions.ts` | Branch conditions as **data**, and their evaluator |
| `questions/` | 56 questions: core triage (§7.2), role (§7.3), Annex III branches (§7.4), Annex I + Article 5 screen, transparency + Article 6(3), organisation size, and ten optional data-protection questions (§11.2) |
| `engine/` | `scope`, `roles`, `organisation-size`, `annex-routes`, `article-5`, `article-50`, `classify`, `findings`, `dates`, `gdpr-ai`, `assemble` |
| `legal-content/propositions.ts` | 17 curated propositions, every extract corpus-verified at build time |
| `report/` | `deterministic`, `schema`, `verify` (§14.4), `generate`, `consent` |
| `result-sections.ts` | §12.1's sections, the hide-empties rule, and `resultBlocks()` — which puts the GDPR overlay in §12.1's seventh slot without folding it into a finding-kind bucket |
| `flow.ts` | Questionnaire navigation and answer invalidation |
| `test-fixtures/golden-scenarios.ts` | 27 scenarios |
| `components/tools/checker-v2/` | `ComplianceCheckerV2`, `QuestionCard`, `ResultV2`, `FindingCard`, `GdprOverlayCard` |

`npm run test:checker-v2` validates the catalogue and string-matches every
proposition extract against the pinned corpus. It runs in `prebuild`.

## What is deliberately not done

1. **Article 5's per-practice condition trees** (§7.6). The screen, the
   law-enforcement authorisation exception and Article 5(1a)'s safety-measures
   test exist. The per-practice conditions do not, so every positive screen holds
   at `potentially_prohibited` with an explicit `unresolved` list and low
   confidence. That is the safe direction and what §7.6 requires of an incomplete
   path — but it is not the whole of §7.6. **This is legal-content authoring and
   probably wants counsel.**
2. **No model call and no email send.** The prose contract, the verifier and the
   consent model are built and tested against a stub model; nothing calls a real
   one. There is no mail sender in this codebase, and §22.1's retention decision
   is open — the spec says not to invent one.
3. **The GDPR overlay cites nothing.** Phase 7 is built, but §11.3 permits a
   specific data-protection duty only where "a separately approved GDPR
   proposition" establishes one — and there are none. There is no pinned GDPR
   corpus for this lane (the retrieval corpus that holds the GDPR is
   editorial-only and is never an authority for anything on screen), so an
   overlay finding names no provision, carries no `source`, and quotes nothing.
   Authoring GDPR propositions would need a pinned, hashed corpus first. Until
   then the absence is deliberate, and `verifyReport` enforces it.
4. **Phase 8 (validation and release).** Golden matrix completion, editorial
   review of the legal content, usability and accessibility testing, shadow-mode
   v1/v2 comparison, then the opt-in beta.

## Decisions taken, and decisions still open

Taken (spec §23): the finding vocabulary **extends** v1's `ActionKind` rather
than paralleling it; v2 ships as an **extended opt-in beta**, not a cutover.

Also taken, in Phase 7: the overlay is a **pure function of the answers** —
handed no classification, no roles and no findings — and its findings carry no AI
Act role. Both are how "GDPR cannot change the AI Act classification" is made
structural rather than asserted.

Open (spec §22, four remaining) — **do not guess these**:

1. Session and generated-report retention periods.
2. Whether the report-request email may also be used for marketing. The
   implementation treats it as delivery only, which is the spec's default.
3. Whether anonymous browser-session recovery is wanted.
4. Whether and when external EU AI Act counsel reviews the decision matrix, and
   the final editorial wording of the disclaimer and privacy notice.

## The thing most likely to be got wrong by a new session

**v1 is still live and still what users get.** The six documented defects in
`docs/compliance-checker-v1-known-defects.md` are asserted as *still present* in
`src/lib/compliance-v2/v1-invariants.test.ts`. Those tests failing is not a
regression — it is the signal that v2 fixed something, and the test must be moved
into the v2 suite with its assertion inverted rather than deleted.

The second most likely: **the rule pack is `2026-08-18` now**, and every pack
change is a version bump. `rulepack/versions/2026-08-10/` is still there and
still resolvable by env var; do not edit either in place.
