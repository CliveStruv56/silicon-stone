# Compliance Checker v2 — where it is, and what to read first

**Updated:** 2026-08-18. Phases 0–6 built. Flag dark; v1 unchanged.

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
| `questions/` | 46 questions: core triage (§7.2), role (§7.3), Annex III branches (§7.4), Annex I + Article 5 screen, transparency + Article 6(3), organisation size |
| `engine/` | `scope`, `roles`, `organisation-size`, `annex-routes`, `article-5`, `article-50`, `classify`, `findings`, `dates`, `assemble` |
| `legal-content/propositions.ts` | 17 curated propositions, every extract corpus-verified at build time |
| `report/` | `deterministic`, `schema`, `verify` (§14.4), `generate`, `consent` |
| `result-sections.ts` | §12.1's sections and the hide-empties rule |
| `flow.ts` | Questionnaire navigation and answer invalidation |
| `test-fixtures/golden-scenarios.ts` | 23 scenarios |
| `components/tools/checker-v2/` | `ComplianceCheckerV2`, `QuestionCard`, `ResultV2`, `FindingCard` |

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
3. **Phase 7 (GDPR overlay) and Phase 8 (validation and release).** Phase 7 is
   unblocked: `ComplianceResultV2` already has a `gdprOverlay` field and the
   result already has a "Related data-protection considerations" section waiting
   for it.

## Decisions taken, and decisions still open

Taken (spec §23): the finding vocabulary **extends** v1's `ActionKind` rather
than paralleling it; v2 ships as an **extended opt-in beta**, not a cutover.

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
