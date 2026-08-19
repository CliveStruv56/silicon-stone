# Adding Articles to the rule pack — the record of two completed runs

> **DONE — 2026-08-19 (evening).** All five Articles are in rule pack
> `2026-08-19`, the fetch script exists as `npm run rulepack:fetch-article`, and
> the caveat finding is deleted. This page is kept as the record of what was
> decided and why, not as work outstanding. Current state:
> `docs/compliance-checker-v2-state.md`; what shipped: `project_summary.md` §9.
>
> Three things went differently from the plan below, all recorded there in full:
> the Article 43 question is gated on the point 1 branch **and** a provider
> route, not on the branch alone; the reader-check wrinkle became its own
> findings with their own titles rather than one condition; and the browser
> walk-through found two defects in the first cut, which is the third time it has
> paid for itself.
>
> **The deployer path followed the same evening** (`b4b74fcb`): all eleven
> operative paragraphs of Article 26, with **no pack bump**, because that text
> had been pinned since the first extraction. Check the corpus before assuming
> the next gap of this shape needs a new version.
>
> **Steps 2 to 7 are still the route for adding an Article.** The traps recorded
> in them are real ones somebody hit.
>
> **Second run, same day: Articles 4, 27 and 86, in pack `2026-08-19b`.** The
> owner approved all three together on 2026-08-19, on the reasoning that a pack
> bump costs the same whether it carries one Article or three, and that doing
> them together let the deployer's caveat finding be *deleted* rather than
> narrowed. Four things that run taught, none of them in the steps below:
>
> - **Version strings can collide.** Two packs on one day; the second is
>   `2026-08-19b`, not `2026-08-20`, because a pack version is provenance for a
>   legal claim and should not carry a date nothing happened on. This needed
>   `rulepack.test.ts`'s format assertion relaxed to
>   `^\d{4}-\d{2}-\d{2}[a-z]?$` — the test's real subject is "explicit, not a
>   moving pointer", and a suffix does not threaten that.
> - **Check the application date per Article, from Article 113, not by analogy.**
>   These three do not share one. Article 4 is Chapter I (2 Feb 2025); Article 86
>   is Chapter IX, which none of Article 113's carve-outs reach, so it runs from
>   the general date (2 Aug 2026) — *ahead* of the Chapter III duties on the same
>   systems; only Article 27 waits to 2 Dec 2027. Assuming "new Article, therefore
>   2027" would have been wrong twice out of three.
> - **A duty that applies at every tier changes every scenario.** Article 4 added
>   one binding finding to nearly every shadow row, which silently cancelled the
>   `dutyDelta` that had been the evidence for v1 defect 6. Two things were
>   rewritten as a result: the shadow test now asserts the absence of a binding
>   Article 50 duty rather than a count, and the release script prints every
>   authored note instead of inferring from arithmetic that there is nothing to
>   explain. **Watch for this whenever a finding is added outside a tier gate.**
> - **The browser walk-through paid for itself a third time.** It found the same
>   point stated twice on one card, in two different cards (Articles 4 and 86) —
>   `practicalMeaning` and `action` each carrying the same sentence. No unit test
>   looks for redundancy, and both read badly.

**Written 2026-08-19**, scope settled the same day: **all five Articles are one
job.** Everything below was verified against the repo on that date; paths, script
names and line references are real, not remembered.

---

## The goal

The high-risk **provider** path in the Compliance Checker v2 emits six duties —
Articles 9, 11, 12, 17, 19 and 49 — because those are the Articles the pinned
rule pack carries. A seventh finding,
`high-risk-provider-duties-incomplete`, says in terms that Articles 10, 14, 15,
16 and 43 also apply and are not assessed. That finding is honest, and it is a
worse product than the complete list.

This task adds the missing Articles to the pinned corpus and emits their duties.

## Scope, decided

**All five Articles — 10, 14, 15, 16 and 43 — are one job.** The owner decided
this on 2026-08-19, against a recommendation to split Article 43 out. It is
settled; do not re-open it.

The consequence is that the caveat finding
`high-risk-provider-duties-incomplete` in
`src/lib/compliance-v2/engine/findings.ts` is **deleted**, not narrowed, once all
five ship — along with the assertion in
`src/lib/compliance-v2/release/golden-matrix.test.ts` that its
`practicalMeaning` matches `/Article 43/`.

Replace that assertion rather than dropping it: the useful invariant is that a
high-risk provider receives the Chapter III Section 2 duties, so assert the
Article numbers now emitted.

---

## The five Articles

| Article | Subject | Shape |
|---------|---------|-------|
| 10 | Data and data governance | Self-contained duty. Straightforward. |
| 14 | Human oversight | Self-contained duty. Straightforward. |
| 15 | Accuracy, robustness and cybersecurity | Self-contained duty. Straightforward. |
| 16 | Obligations of providers of high-risk AI systems | An umbrella that mostly cross-references the others. Easy; adds least. |
| 43 | Conformity assessment | Branches, but narrowly. Design below. |

---

## Article 43: the design

Article 43 does not state one duty, and a finding that says "you must undergo a
conformity assessment" without saying **which procedure** is the half-answer the
Article 5 screen used to give. This section specifies the branch so the next
session implements rather than researches it.

> **Scoping note.** The structure below was read from the *editorial* copy at
> `corpus/regulatory/eu-ai-act/2026-07-27/source.txt`, which exists to inform
> drafting and is **never** an authority for anything the checker displays. It
> was used to size the work. The `shortExtract` that reaches the pack must come
> from the Cellar fetch in step 3, like every other extract.

### The routes

Three, and the engine can already tell them apart from answers it collects today:

1. **Annex III point 1 (biometrics)** — Article 43(1). The provider *chooses*
   between Annex VI (internal control) and Annex VII (notified body), **but only
   where harmonised standards under Article 40, or common specifications under
   Article 41, have been applied.** Annex VII becomes mandatory where any of the
   four Article 43(1) triggers holds: no standards exist and no common
   specifications are available; the provider has not applied the standard, or
   applied only part of it; common specifications exist and were not applied; or
   a standard was published with a restriction, and then only for the restricted
   part.
2. **Annex III points 2–8** — Article 43(2). Annex VI internal control, **no
   notified body**. Flat, no question needed.
3. **Annex I Section A (the product route)** — Article 43(3). Follow the
   sectoral procedure under the relevant harmonisation legislation; the Section 2
   requirements form part of that assessment, and the Article 17 quality
   management system assessment is undertaken too. **Where a system is both**
   Annex I Section A and Annex III, the Annex I procedure governs.

Plus Article 43(4), which is not a route but a trigger: a **substantial
modification** requires a new conformity assessment. Pre-determined changes in a
continuously-learning system, already described in the Annex IV technical
documentation, are expressly *not* a substantial modification.

### What the catalogue already knows

- **Which Annex III point applies.** `engine/annex-routes.ts` keys points as
  `'1(a)'`, `'1(b)'`, `'1(c)'`, `'2'`, `'3(a)'` and so on (see
  `ANNEX_III_POINTS`). Point 1 is `point.startsWith('1')`.
- **Whether the Annex I product route applies.** `annex_i_route`, both limbs.
- **Whether the system has been substantially modified.** `material_modification`
  in `questions/role.ts`, already asked of everyone.

### What is genuinely new

**One question**, and it opens only on the Annex III point 1 provider path —
which is the narrowest branch in the catalogue:

```
id: 'art43_harmonised_standards'
prompt: Have you applied harmonised standards, or common specifications,
        covering all of the Section 2 requirements?
options:
  applied_in_full      → the Annex VI / Annex VII choice is open
  applied_in_part      → Annex VII is mandatory (43(1) second subparagraph, (b))
  restricted_standard  → Annex VII for the restricted part (trigger (d))
  none_applied         → Annex VII is mandatory (triggers (a) and (c))
allowUnknown: true     → route cannot be determined; say so, do not guess
importance: 'finding_decisive'
visibleWhen: annex III point 1 selected
```

A second wrinkle is worth a **condition on the finding rather than a question**:
where the system is intended to be put into service by law enforcement,
immigration or asylum authorities, or by a Union institution, the market
surveillance authority acts as the notified body. `intended_use_family` does not
establish this — it describes the use, not the customer — so state it as a
condition the reader checks, rather than inferring it.

### Emitting it

Follow `engine/article-50.ts` rather than the flat `PROVIDER_DUTIES` array: like
Article 50, this is one Article with paragraph-specific outcomes, and the useful
finding names the procedure. Three findings are better than one generic duty:

- the route that applies, and why (`current_obligation` / `future_obligation`
  on `highRiskKind`, as the other provider duties are);
- where the route could not be determined because the standards question is
  unknown — `unresolved_issue`, naming what would settle it. **Never default an
  unknown to internal control**: Annex VI is the cheaper procedure, and guessing
  it is the expensive direction to be wrong in;
- Article 43(4) where `material_modification` is `yes` — a new conformity
  assessment is required regardless of whether the system is redistributed.

### Golden scenarios to add

At minimum, and named for what they test:

- `art43BiometricsStandardsApplied` — Annex III point 1, standards in full: the
  choice is open.
- `art43BiometricsNoStandards` — Annex III point 1, none applied: Annex VII
  mandatory.
- `art43BiometricsStandardsUnknown` — the unknown case; route unresolved, and
  **not** defaulted to Annex VI.
- `art43AnnexIiiPointFour` — an existing employment scenario, asserting Annex VI
  internal control with no notified body.
- `art43ProductRoute` — `regulatedProductBothLimbs`, asserting the sectoral
  procedure governs.
- `art43SubstantialModification` — `material_modification: yes`, asserting the
  re-assessment finding.

`release/golden-matrix.test.ts` already asserts every Annex III family has a
scenario; extend it in the same spirit to assert every Article 43 route has one.

---

## The procedure, verified

### 1. Write an article fetch script

**Already done** — `scripts/rulepack-fetch-article.ts`, wired as
`npm run rulepack:fetch-article -- --version <pack> --article <n>`. Skip to
step 2. The rest of this section is why it is shaped the way it is.

There was **no** article fetcher before 2026-08-19. `npm run rulepack:fetch-annex` exists
(`scripts/rulepack-fetch-annex.ts`) and handles Annexes only; the original 19
Articles arrived with the first extraction commit `6204c347`.

Add `scripts/rulepack-fetch-article.ts` modelled directly on the annex script.
Reuse, unchanged:

- `fetchFromCellar(celex, XHTML_ACCEPT)` from `scripts/regulatory/source-fetch.ts`
  — **never** `eur-lex.europa.eu`, which answers automated clients with a WAF
  challenge that `response.ok` reports as success;
- the consolidation-date assertion the annex script performs, which refuses to
  write if the served document is not the consolidation the manifest pins;
- `extract(html)` from `scripts/regulatory/extract.ts`.

The annex script isolates its section with
`text.split('\n\n\n').find(block => block.startsWith('ANNEX III\n'))`. Articles
need the equivalent slice on `Article N` boundaries. Check the result against an
existing file — `rulepack/versions/2026-08-18/corpus/article-9.txt` begins
`Article 9\n\nRisk management system\n\n1.\n…`, and `article-5.txt` ends by
carrying the interstitial `CHAPTER III` heading, so trailing headings between
Articles are expected and fine.

Add the npm script beside the existing one:

```json
"rulepack:fetch-article": "TSX_TSCONFIG_PATH=scripts/tsconfig.scripts.json tsx scripts/rulepack-fetch-article.ts"
```

### 2. Create the new pack version

**Never edit `rulepack/versions/2026-08-18/` in place.** `prebuild` runs
`scripts/rulepack-check.mjs`, which exits 1 on any hash drift; that is
deliberate, and it is the whole point of the pack.

```bash
cp -R rulepack/versions/2026-08-18 rulepack/versions/2026-08-19
```

Then in the new `manifest.json`: set `version` to `2026-08-19`, update
`lastReviewed`, and add a `changelog` entry saying what was added and what was
checked. **Leave `corpusCutOff` at `2026-07-27`** — the same CELEX
consolidation, just more of it. That matters: `npm run reg:check` asserts the
regulatory corpus's `consolidatedAs` equals the pack's `corpusCutOff`, so
leaving it alone means no regulatory-lane churn and no re-verification of
existing citations.

### 3. Fetch, read, hash — in that order

```bash
for n in 10 14 15 16 43; do
  npm run rulepack:fetch-article -- --version 2026-08-19 --article $n
done
npm run rulepack:hash
```

Read each file before hashing. The hash gate protects against drift, not against
fetching the wrong thing.

### 4. Wire the version into the app

`src/lib/rulepack/index.ts` hardcodes each version — there is no directory scan.
Four edits:

- five `import … from '../../../rulepack/versions/2026-08-19/*.json'` lines at
  the top (manifest, sources, timeline, penalties, rules);
- a `'2026-08-19': { … }` entry in the `PACKS` record (~line 97), with a comment
  saying what changed, as the `2026-08-18` entry does;
- `DEFAULT_RULE_PACK_VERSION` (~line 126) → `'2026-08-19'`;
- nothing else. `PINNED_RULE_PACK_VERSION` reads
  `NEXT_PUBLIC_RULEPACK_VERSION` and falls back to the default.

**`sources.json` entries are optional.** The pack already has no `article17` or
`article57` entry, and the established pattern is that a missing AI Act Service
Desk link is acceptable because the corpus-backed provisions page is the stronger
citation. Adding entries for the new Articles is cheap while the version is being
bumped anyway, but nothing requires it.

### 5. Author the propositions

In `src/lib/compliance-v2/legal-content/propositions.ts`, following the six
provider propositions added on 2026-08-19 (`prop-art-9-risk-management` and its
siblings). Each needs:

- `ruleId: 'high-risk-provider-duties'`;
- `corpusArticle` set to the bare number (`'10'`, `'14'`, …);
- `applicableRoles: ['provider', 'product_manufacturer', 'authorised_representative']`;
- `effectiveFrom: '2027-12-02'`;
- `conditions`, `exceptions`, `plainEnglishSummary`, `practicalMeaning`;
- **`shortExtract`: a contiguous, verbatim run of the consolidated text.** No
  ellipses, no joining non-adjacent sentences, no tidied punctuation. If a
  passage needs cutting to be quotable, quote the shorter part;
- `reviewStatus: 'internal'` — see *What this does not solve*.

`rulepackVersion: PACK_VERSION` is derived from the manifest, so it moves on its
own. `REVIEWED_AT` is a literal: **use the new date for new propositions and do
not blanket-restamp the existing ones** — `reviewedAt` renders on screen as
"last checked", and re-dating a proposition nobody re-read is a false claim.

`npm run test:checker-v2` string-matches every extract against the pinned corpus
and fails the build on a mismatch. It runs in `prebuild`.

### 6. Emit the findings

In `src/lib/compliance-v2/engine/findings.ts`, the `PROVIDER_DUTIES` array
inside `if (held.includes('provider'))`. Add an entry per Article, with `title`,
`why`, `action`, `evidence`, `priority`.

Two constraints that will bite otherwise:

- **`action` must avoid "must", "shall", "required", "prohibited"** unless the
  finding's kind is binding. `report/verify.ts` check 7 strips a non-binding
  finding whose action uses mandatory language. The provider duties *are*
  binding (`highRiskKind`), so this is fine for them — but watch it on anything
  conditional.
- **`practicalMeaning` and `whyItApplies` must exceed 40 characters** and
  `action` 10, or `result.test.ts` fails.

Then **delete the caveat finding** (`high-risk-provider-duties-incomplete`, same
file). Its `practicalMeaning` currently names "Data governance, human oversight,
accuracy and robustness, the provider obligations in Article 16 and the
conformity assessment in Article 43" — with all five shipped it has nothing left
to be about, and a caveat that no longer bites is worse than none.

Keep the *idea* somewhere, though: the pack still does not carry every Article of
Chapter III Section 2's neighbourhood, and a future reader should be able to tell
what is assessed from what is not. Saying so once in the section blurb is enough;
a finding is too loud for it.

### 7. Update what moves

Verified list of things that reference the old version or the old counts:

- `src/lib/compliance-v2/result.test.ts:328` — `expect(result.rulepackVersion).toBe('2026-08-18')`.
- `src/lib/compliance-v2/release/golden-matrix.test.ts` — asserts the caveat
  finding's `practicalMeaning` matches `/Article 43/`. Replace it with an
  assertion that the provider duties now include the Article numbers emitted;
  the invariant worth keeping is that a high-risk provider is told what it owes.
  The same file's `expect(duties.length).toBeGreaterThan(3)` should rise.
- `docs/compliance-checker-v2-state.md` — proposition count and the "six provider
  duties" note.
- `CLAUDE.md` — the "short list of duties must say that it is short" paragraph.
- `project_summary.md` — §9 entry, and the "693/736/847 tests green" line in the
  header.

**Not** hardcoded, and needing no edit: the provisions page count renders
`{coveredArticles().length}`, so 20 static pages becomes 24 or 25 on its own.

---

## Definition of done

```bash
npm run rulepack:check          # hashes clean, no drift
npm run test:checker-v2         # every extract verbatim against the pinned corpus
npx vitest run                  # all suites
npx tsc --noEmit -p tsconfig.json
npx next lint --dir src
npm run checker-v2:release      # §20 criteria + shadow comparison
```

Then look at it. Start a dev server with the flag on and walk a high-risk
provider path:

```bash
NEXT_PUBLIC_COMPLIANCE_CHECKER_V2=true npm run dev
# http://localhost:3000/tools/compliance-checker?v2=1
npm run checker-v2:a11y         # keyboard-only walk + axe, needs the server above
```

The golden scenario to reproduce by hand is `usProviderEmploymentAnnexIii`: EU
market, own-name supply, Annex III point 4(a) recruitment, profiling yes. Every
duty card should carry its Article badge, a verbatim extract, and
"Not reviewed by counsel · last checked …".

Two browser walk-throughs in this project have each caught a defect no unit test
would have. Do not skip it.

---

## What this does not solve

Every proposition remains `reviewStatus: 'internal'` — readings of the
consolidated text by this project, not by counsel. The cards keep saying "Not
reviewed by counsel". **Adding Articles makes the tool more complete, not more
authoritative**, and §22.4's counsel-review decision is still open.

---

## Housekeeping

Another Claude session was active in this repository on 2026-08-19, writing
`src/lib/knowledge/`, `src/sanity/schemaTypes/knowledge*.ts`, `researchRun.ts`
and `.env.example`. **Stage files explicitly; do not `git add -A`.** Its
`src/lib/knowledge/features.test.ts` had TypeScript errors at the time, so a
whole-project `tsc` may fail for reasons that are nothing to do with this work —
filter by path before concluding anything.
