# Adding Articles 10, 14, 15, 16 (and 43) to the rule pack

**Written 2026-08-19** to hand this to a new session. Everything below was
verified against the repo on that date; paths, script names and line references
are real, not remembered.

---

## The goal

The high-risk **provider** path in the Compliance Checker v2 emits six duties —
Articles 9, 11, 12, 17, 19 and 49 — because those are the Articles the pinned
rule pack carries. A seventh finding,
`high-risk-provider-duties-incomplete`, says in terms that Articles 10, 14, 15,
16 and 43 also apply and are not assessed. That finding is honest, and it is a
worse product than the complete list.

This task adds the missing Articles to the pinned corpus and emits their duties.

## Confirm this before starting

**Does Article 43 go in this piece of work, or a later one?**

The owner said "go ahead" without answering. The recommendation on the table,
and the default if nobody says otherwise, is:

> **Articles 10, 14, 15 and 16 now. Article 43 as its own piece of work.**

Ask, then proceed. The reason it matters is in *Why Article 43 is different*
below — it is plausibly more work than the other four combined, and doing it
badly is worse than not doing it.

If Article 43 is deferred, **narrow the caveat finding to name Article 43 alone**
rather than deleting it.

---

## The five Articles

| Article | Subject | Shape |
|---------|---------|-------|
| 10 | Data and data governance | Self-contained duty. Straightforward. |
| 14 | Human oversight | Self-contained duty. Straightforward. |
| 15 | Accuracy, robustness and cybersecurity | Self-contained duty. Straightforward. |
| 16 | Obligations of providers of high-risk AI systems | An umbrella that mostly cross-references the others. Easy to add, adds least. |
| 43 | Conformity assessment | **Branches.** See below. |

### Why Article 43 is different

Article 43 does not state one duty. Which procedure applies depends on:

- whether the system is Annex III **point 1** (biometrics) or another Annex III
  point — different default procedures;
- whether the provider applied **harmonised standards**;
- Annex VI (internal control) versus Annex VII (notified-body involvement);
- and separately for the Annex I product route.

A finding that says "you must undergo a conformity assessment" without saying
which procedure is the kind of half-answer this tool is built to avoid — the
same failure the Article 5 screen had before its condition trees. Doing it
properly probably means one or two new questions and a small branch evaluator,
on the pattern of `engine/article-5.ts`.

---

## The procedure, verified

### 1. Write an article fetch script

There is **no** article fetcher today. `npm run rulepack:fetch-annex` exists
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
npm run rulepack:fetch-article -- --version 2026-08-19 --article 10
# …14, 15, 16, and 43 if it is in scope
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

Then **narrow or remove the caveat finding**
(`high-risk-provider-duties-incomplete`, same file). Its `practicalMeaning`
currently names "Data governance, human oversight, accuracy and robustness, the
provider obligations in Article 16 and the conformity assessment in Article 43".

### 7. Update what moves

Verified list of things that reference the old version or the old counts:

- `src/lib/compliance-v2/result.test.ts:328` — `expect(result.rulepackVersion).toBe('2026-08-18')`.
- `src/lib/compliance-v2/release/golden-matrix.test.ts` — asserts the caveat
  finding's `practicalMeaning` matches `/Article 43/`. If Article 43 ships, this
  assertion has to change; if it is deferred, it still passes.
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
