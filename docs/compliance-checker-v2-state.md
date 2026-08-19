# Compliance Checker v2 — where it is, and what to read first

**Updated:** 2026-08-19 (evening). Phases 0–8 built; **release not taken**. Flag
dark; v1 unchanged.

This is the one-page orientation. The plan of record is
`docs/# EU AI Act Compliance Checker v2 — Impl.md`; per-phase history is
`project_summary.md` §9 and §11; the invariants are in `CLAUDE.md`.

> **Landed 2026-08-19 (evening):** Articles 10, 14, 15, 16 and 43 are in the
> pinned corpus (rule pack **`2026-08-19`**) and the high-risk provider path emits
> the whole of Chapter III Section 2. `docs/rulepack-article-expansion-handoff.md`
> was the brief and is now history; the procedure it describes is live as
> `npm run rulepack:fetch-article`.
>
> **And the deployer path followed, same evening** — all eleven operative
> paragraphs of Article 26, with **no pack bump**, because that text had been
> pinned since the first extraction. Check the corpus before assuming a gap of
> this shape needs a new version.
>
> **Then Articles 4, 27 and 86 landed, in pack `2026-08-19b`** — the three the
> deployer's caveat finding named. That finding is now deleted, so **neither role
> path carries a caveat any more**. Note the dates differ: Article 4 has applied
> since 2 February 2025 and Article 86 since 2 August 2026, while Article 27
> waits for 2 December 2027. Article 4 is not gated on a classification at all —
> it reaches every in-scope reader, including the minimal-risk one who was
> previously told there was nothing to do.

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
| `questions/` | 80 questions: core triage (§7.2), role (§7.3), Annex III branches (§7.4), Annex I + Article 5 screen, transparency + Article 6(3), organisation size, 23 Article 5 per-practice condition questions (§7.6), the one Article 43 standards question, and ten optional data-protection questions (§11.2) |
| `engine/` | `scope`, `roles`, `organisation-size`, `annex-routes`, `article-5`, `article-43`, `article-50`, `classify`, `findings`, `dates`, `gdpr-ai`, `assemble` |
| `legal-content/propositions.ts` | 58 curated propositions, every extract corpus-verified at build time |
| `report/` | `deterministic`, `schema`, `verify` (§14.4), `generate`, `consent`, `model` (the Anthropic adapter), `record`, `store` |
| `result-sections.ts` | §12.1's sections, the hide-empties rule, and `resultBlocks()` — which puts the GDPR overlay in §12.1's seventh slot without folding it into a finding-kind bucket |
| `flow.ts` | Questionnaire navigation and answer invalidation |
| `test-fixtures/golden-scenarios.ts` | 67 scenarios — every Annex III family, every Article 5 practice, every Article 43 route, §17.2's ten mandatory shapes |
| `components/tools/checker-v2/` | `ComplianceCheckerV2`, `QuestionCard`, `ResultV2`, `FindingCard`, `GdprOverlayCard`, `ReportRequestV2` |

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
2. **The report lane is wired; there is still no email send.** As of 2026-08-19
   `POST /api/tools/compliance-checker/v2/report` validates, re-runs the engine
   server-side, writes a pending record and generates in `after()`;
   `GET .../v2/report/[id]?token=` polls it. `report/model.ts` is the Anthropic
   adapter. Verified end to end locally: complete, prose generated and verified
   clean, about 35 seconds.

   **There is still no mail sender**, so nothing is emailed. The report is
   delivered on screen through a signed link and the address is kept as the
   consent record. The card says so rather than implying an inbox.

   Two things about the route worth knowing. It is **404 unless the flag is on**,
   because a live endpoint behind an unreleased feature is a way to reach it. And
   **a missing API key is not an error** — `generateReport` treats an absent
   model as "no prose" and returns the deterministic report, which is complete on
   its own. That is the opposite of v1, which 503s, and it is right for v2:
   v1's report *is* the generation, and v2's is not.
3. **The GDPR overlay cites nothing.** Phase 7 is built, but §11.3 permits a
   specific data-protection duty only where "a separately approved GDPR
   proposition" establishes one — and there are none. There is no pinned GDPR
   corpus for this lane (the retrieval corpus that holds the GDPR is
   editorial-only and is never an authority for anything on screen), so an
   overlay finding names no provision, carries no `source`, and quotes nothing.
   Authoring GDPR propositions would need a pinned, hashed corpus first. Until
   then the absence is deliberate, and `verifyReport` enforces it.
4. **Phase 8's harness is built; the release is not taken.** As of 2026-08-19:
   **17 of §20's 18 criteria are automated and passing, and nothing is blocked**
   — §22.1 and §22.2 were decided that day, which is what freed criterion 16.
   Criterion 14 still needs a person to look at a screen. Shadow mode reports no
   unexplained divergence. Accessibility is clean. What remains is not code:
   **counsel review of the decision matrix** and **usability testing with users
   who do not know legal terminology or their own financial figures** (§17.5).
   v2 stays behind the flag until those land.
5. **Both role paths are complete for the Articles the corpus holds; the corpus
   still is not the Regulation.** The provider emits Chapter III Section 2 in
   full (Articles 9, 10, 11, 12, 14, 15, 16, 17 and 19), with Article 49
   registration and Article 43's conformity assessment. The deployer emits all
   eleven operative paragraphs of Article 26 — five of them
   `conditional_obligation` — plus Article 27's fundamental rights impact
   assessment and Article 86's right to an explanation. Article 4's literacy duty
   goes to every in-scope provider and deployer regardless of tier. **Both caveat
   findings are deleted**; what survives is one line in the result footer.
6. **Articles 4, 27 and 86 are done; the next gap is not yet named.** They
   landed in pack `2026-08-19b` and the caveat that named them is deleted. What
   the corpus still does not carry is the whole of Chapter V (general-purpose AI
   models), Article 25's value-chain reallocation, and Article 72's post-market
   monitoring beyond the Article it already holds — none of which the engine
   currently cites, so none is a live inconsistency. Adding any Article is a pack
   version bump; `docs/rulepack-article-expansion-handoff.md` is the procedure,
   and it now records two completed runs.

## Decisions taken, and decisions still open

Taken (spec §23): the finding vocabulary **extends** v1's `ActionKind` rather
than paralleling it; v2 ships as an **extended opt-in beta**, not a cutover.

Also taken, in Phase 7: the overlay is a **pure function of the answers** —
handed no classification, no roles and no findings — and its findings carry no AI
Act role. Both are how "GDPR cannot change the AI Act classification" is made
structural rather than asserted.

Also taken, 2026-08-19 (spec §23.3, resolving §22.1 and §22.2): **retention is
v1's three periods adopted explicitly** — a generated report 30 days, the email
and its consent record two years, an in-progress assessment 24 hours — and **the
report email is delivery-only**, with marketing a separate, unticked consent.
`compliance-v2/retention.ts` is the decision record; it is *not* the
configuration, and tests assert it agrees with the TTLs the code applies. This is
what unblocked release criterion 16.

Open (spec §22, two remaining) — **do not guess these**:

1. Whether anonymous browser-session recovery is wanted. Deliberately not
   resolved by lengthening the 24-hour session: recovery is a feature to decide
   on, not a side effect of a retention number.
2. Whether and when external EU AI Act counsel reviews the decision matrix, and
   the final editorial wording of the disclaimer and privacy notice.

## One unexplained observation

On 2026-08-19, the **first** local end-to-end report run reported `failed` about
fifteen seconds after the POST, carrying the status route's *stale pending*
message — which needs an age of 320 seconds. It did not reproduce across two
further runs, and `record.test.ts` covers the threshold on both sides. **The
cause was not found.** The status route now logs `createdAt`, the computed age
and the threshold whenever it declares a record stale, so a second occurrence
says whether the record, the clock or the store was lying. Do not assume this is
fixed; it is only instrumented.

## The thing most likely to be got wrong by a new session

**v1 is still live and still what users get.** The six documented defects in
`docs/compliance-checker-v1-known-defects.md` are asserted as *still present* in
`src/lib/compliance-v2/v1-invariants.test.ts`. Those tests failing is not a
regression — it is the signal that v2 fixed something, and the test must be moved
into the v2 suite with its assertion inverted rather than deleted.

The second most likely: **the rule pack is `2026-08-19b` now**, and every pack
change is a version bump. `2026-08-10`, `2026-08-18` and `2026-08-19` are still
there and still resolvable by `NEXT_PUBLIC_RULEPACK_VERSION`; do not edit any of
them in place. The `b` suffix is because two packs were cut on the same day —
a version string is provenance for a legal claim, so it should not carry a date
nothing happened on.
`prebuild` fails on hash drift, which is the point.

The third: **`reviewedAt` is per proposition and is not a batch stamp.** It
renders as "last checked" on the card, so the propositions written on 2026-08-19
carry that date and their older neighbours still carry 2026-08-18. Re-dating a
proposition nobody re-read is a false claim about work.
