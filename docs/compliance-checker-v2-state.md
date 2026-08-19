# Compliance Checker v2 — where it is, and what to read first

**Updated:** 2026-08-19. Phases 0–8 built; **release not taken**. Flag dark; v1 unchanged.

This is the one-page orientation. The plan of record is
`docs/# EU AI Act Compliance Checker v2 — Impl.md`; per-phase history is
`project_summary.md` §9 and §11; the invariants are in `CLAUDE.md`.

> **Work in flight:** adding Articles 10, 14, 15, 16 (and possibly 43) to the
> pinned corpus so the high-risk provider path is complete. The owner has
> approved it. Read
> **`docs/rulepack-article-expansion-handoff.md`** before starting — it carries
> the verified procedure, and one decision to confirm first.

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
| `questions/` | 79 questions: core triage (§7.2), role (§7.3), Annex III branches (§7.4), Annex I + Article 5 screen, transparency + Article 6(3), organisation size, 23 Article 5 per-practice condition questions (§7.6), and ten optional data-protection questions (§11.2) |
| `engine/` | `scope`, `roles`, `organisation-size`, `annex-routes`, `article-5`, `article-50`, `classify`, `findings`, `dates`, `gdpr-ai`, `assemble` |
| `legal-content/propositions.ts` | 33 curated propositions, every extract corpus-verified at build time |
| `report/` | `deterministic`, `schema`, `verify` (§14.4), `generate`, `consent` |
| `result-sections.ts` | §12.1's sections, the hide-empties rule, and `resultBlocks()` — which puts the GDPR overlay in §12.1's seventh slot without folding it into a finding-kind bucket |
| `flow.ts` | Questionnaire navigation and answer invalidation |
| `test-fixtures/golden-scenarios.ts` | 60 scenarios — every Annex III family, every Article 5 practice, §17.2's ten mandatory shapes |
| `components/tools/checker-v2/` | `ComplianceCheckerV2`, `QuestionCard`, `ResultV2`, `FindingCard`, `GdprOverlayCard` |

| `release/` | §20's criteria as checks (`acceptance.ts`), the v1/v2 shadow comparison (`shadow.ts`), and the golden-matrix coverage assertions |

`npm run test:checker-v2` validates the catalogue and string-matches every
proposition extract against the pinned corpus. It runs in `prebuild`.

`npm run checker-v2:release` prints §20's eighteen criteria and the shadow
comparison. `npm run checker-v2:a11y` runs axe over the questionnaire and result
and walks the whole flow with the keyboard alone — it needs a dev server with
the flag on.

## What is deliberately not done

1. **Article 5's condition trees are built but not counsel-reviewed**
   (done 2026-08-19). All ten practices have limb-by-limb trees, and a flagged
   practice can now be *cleared* by a failing limb or a stated exception. The
   readings of the consolidated text are this assistant's, held at
   `reviewStatus: 'internal'`; §22.4's counsel-review decision is still open. A
   complete path reports `potentially_prohibited` at `medium` confidence and
   never `prohibited` — do not add that classification without counsel.
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
4. **Phase 8's harness is built; the release is not taken.** As of 2026-08-19:
   16 of §20's 18 criteria are automated and passing, criterion 14 needs a
   person to look at a screen, and criterion 16 is *blocked* on §22.1 and §22.2.
   Shadow mode reports no unexplained divergence. Accessibility is clean. What
   remains is not code: **counsel review of the decision matrix**, **usability
   testing with users who do not know legal terminology or their own financial
   figures** (§17.5), and **the retention and marketing decisions**. v2 stays
   behind the flag until those land.
5. **Six provider duties, not the whole of Chapter III Section 2.** Articles 9,
   11, 12, 17, 19 and 49 are emitted and corpus-verified; Articles 10, 14, 15, 16
   and 43 are not in the pinned corpus, so nothing could verify a citation to
   them. A finding says so on screen rather than letting a short list read as a
   complete one. **Approved and next up** — the procedure, the gotchas and the
   one open decision are in `docs/rulepack-article-expansion-handoff.md`.

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
