# CLAUDE.md

Guidance for Claude Code in this repo. See also `project_summary.md` (session
handoff) and the persistent auto-memory in `MEMORY.md`.

## Dependency constraints (load-bearing — do not break)

These ceilings are required for the build to work on the current Next.js 15 /
React 19 bundle. Do NOT run a blind `npm update` / `npm install <pkg>@latest`:

- **Do NOT upgrade `sanity` past v4** — v5 needs `useEffectEvent`, absent from
  Next.js 15's React bundle.
- **Do NOT upgrade `next-sanity` to v12** — it requires Next.js 16.
- **Upgrade path:** wait for Next.js 16 stable, then upgrade all Sanity packages
  together.
- The Sanity `apiVersion` is sourced from `NEXT_PUBLIC_SANITY_API_VERSION`
  (default `2026-01-13`); keep all clients/scripts on that single value.

## AI Act rule pack (load-bearing — do not break)

The Compliance Checker's legal payload lives in `rulepack/versions/<version>/`,
not in TypeScript constants. Two rules:

- **Never edit ANY pack file without bumping the pack version.** `prebuild` runs
  `scripts/rulepack-check.mjs`, which exits 1 on any hash drift — that is
  deliberate. Pack content and pack version move together, or every citation
  previously verified against it is silently invalidated. Intentional change:
  bump the version directory, then `npm run rulepack:hash`.
- **Every figure in the pack is a legal claim.** Dates, penalty ceilings and
  Article anchors are traceable to the EUR-Lex consolidated text at CELEX
  `02024R1689-20260727`. Verify against that before changing one; do not take a
  date from a summary, a blog post, or a build spec.
- **Both halves of the pack are hashed** (since 2026-08-16). `manifest.corpus`
  covers `corpus/*.txt` — verbatim statute, folded through the legal-text
  normaliser. `manifest.files` covers every other `.json` in the version
  directory: `rules`, `penalties`, `timeline`, `sources`. Those were unhashed
  until then, so a penalty ceiling could change with no build failure. The two
  maps are separate so the error says which kind of drift happened. Data files
  are hashed by *content* — parsed, object keys sorted, re-stringified — so
  reformatting is not a change and an edited figure is. Files are discovered,
  not listed: a new pack file is covered the day it appears.
- **The normaliser exists twice and a test holds it together.**
  `src/lib/rulepack/normalise.ts` is the runtime copy;
  `scripts/rulepack-normalise.mjs` is the build-time mirror, plain `.mjs`
  because `prebuild` runs before any TypeScript. `src/lib/rulepack/normalise.test.ts`
  asserts they agree across every typographic fold and every corpus file. If
  they drift, the build gate and the citation verifier compute different hashes
  for the same text, and the symptom appears nowhere near the cause.

Four invariants the tool promises on screen and must keep:

- **The model never decides the tier.** Agentic intake proposes answers the user
  confirms; classification is the deterministic engine's alone. The report route
  re-runs the engine server-side rather than trusting a browser-supplied verdict,
  and a generation that restates tier, role or confidence differently is
  discarded whole (`src/lib/report/schema.ts`).
- **Confidence is categorical, never a percentage.**
- **No generated legal quotation reaches a screen unverified.** Every claim in a
  generated report is string-matched against the pinned corpus
  (`src/lib/report/verify.ts`); an unmatched claim renders an explicit note in
  place of the quote, and three failures withhold the whole report.
- **A result item is never presented as a duty unless it is one** (since
  2026-08-17), **and no result item asserts a citation it cannot link** (since
  2026-08-18). `RuleFinding.actions` is `RuleItem[]`, not `string[]`, and each
  item carries a `kind`: `duty`, `conditional`, `concession`, `support`,
  `enforcement` or `good-practice`. The card was once headed "Immediate
  obligations" over a list that mixed an Article 26(6) retention duty with an SME
  concession, a support measure whose sandboxes need not exist until 2027, and a
  statement about how fines are calculated. Invariants in
  `src/lib/ai-act-rules.test.ts` hold the line: no `-proportionate-relief` item
  may be a duty, every duty carries an `article`, and every item carries a
  substantive `basis`.

  `RuleFinding.vendorQuestions` is `VendorQuestion[]` on the same pattern, with
  `why` in place of `basis`. Seven of those questions used to open
  "Article 13 — …" inside the prose and eight carried no anchor at all, so a
  reader could not tell a citation from a sentence and the card could not link
  either. The tests forbid the prefix, require an anchor on every question
  outside a **named** two-item exception list (`vendor-evidence-data-terms`,
  which is GDPR rather than the AI Act; `vendor-gpai-documentation`, whose
  chapter is outside the corpus), and hold `article` and `corpusArticle` in
  agreement exactly as they do for actions. Both exceptions render a "No AI Act
  anchor" badge — a blank where every neighbour shows a citation reads as an
  omission rather than a decision.

Three consequences of that shape worth not undoing:

- **The Article anchor is a field, not prose.** `article` and `corpusArticle` are
  per *item*, where the pack's `ruleAnchors` are per *rule* and can hold only one
  provision each — `sme-proportionate-relief` is anchored to the lump
  "Articles 11, 17, 57 and 99(6)". A test asserts every `corpusArticle` is a key
  of `RULE_PACK.manifest.corpus`, so an explainer link can never 404, and that
  `articleNumberFrom(article)` agrees with it, so an anchor cannot be
  copy-pasted onto the wrong provision. Do not put citations back in the prose.
- **`basis` and per-item anchors live in TypeScript, deliberately.** They are
  authored explanation, the same class of content as the obligation prose that
  already sat there, and `src/lib/rulepack/index.ts` scopes the pack to dates,
  ceilings, anchors, citations and corpus. Keeping them out of the pack is what
  let this ship without a version bump. Note the pack has **no `article17` or
  `article57` entry in `sources.json`**, so per-item Service Desk links would
  force the full bump procedure — the corpus-backed provisions page does not, and
  is the stronger citation anyway.
- **Reliefs scoped to high-risk providers are gated on that path.**
  Articles 11(1) and 17(2) relieve *provider* duties on *high-risk* systems.
  `sizeReliefActions()` gates them on `hasProviderDuties() && inAnnexIIIDomain()`;
  firing them on organisation size alone told an SME deploying a minimal-risk
  chatbot it could simplify Annex IV documentation it never owed.

The paid report is handed these items in three labelled prompt blocks
(`src/lib/report/generate.ts`), never one flat list. **The citation verifier
cannot catch a promoted concession** — a model writing "you must use the
simplified form" can quote Article 11(1)'s genuine "*it shall use the form
referred to in this paragraph*" and verify clean, because that sentence is
mandatory once you opt in. The structural split and the labelling are the whole
mitigation; do not assume `verifyReport()` covers this.

`/tools/compliance-checker/provisions/[article]` renders the pinned corpus for a
reader: 20 statically prerendered server pages, because `rulepack/corpus.ts` is
`server-only` and the checker is a Client Component. Each sets its **own**
canonical — the parent layout hard-codes one pointing at the checker, which
inherited would deindex all 19. Statute published on a commercial site carries the
EUR-Lex "consolidated text, no legal value, only the OJ is authentic" notice and
the EU source acknowledgement; that is not decoration.

Corpus coverage is partial: **19 Articles plus Annex III** (added 2026-08-18 in
pack `2026-08-18`, from the same CELEX). Annex III is keyed `annex-iii`, not a
number — `corpusPath()` and `coveredArticles()` branch on that prefix, and
`provisionLabel()` exists so no page is ever headed "Article annex-iii". A
numeric sort over a mixed key set yields NaN comparisons, which is an unstable
order rather than an error, so annexes are sorted separately and appended.
`verifyCitation()` returns
`uncovered` for anything else — treat that as unverifiable, never as a pass.
The report generator only supplies Articles the pack covers, so an `uncovered`
verdict means the model cited outside its evidence, not merely that coverage is
thin.

## Compliance Checker v2 (in build, behind a flag)

**Read `docs/compliance-checker-v2-state.md` first** — one page on how to run it,
what exists, what is deliberately unfinished, and which decisions are open.
`docs/# EU AI Act Compliance Checker v2 — Impl.md` is the plan of record — 23
sections, 8 phases. **Phases 0–6 are built** under `src/lib/compliance-v2/` and
`src/components/tools/checker-v2/`; v1 is untouched and remains what every user
gets. Reaching v2 needs `NEXT_PUBLIC_COMPLIANCE_CHECKER_V2=true` **and** `?v2=1`
on the checker URL. Progress and per-phase state live in `project_summary.md` §11.

Its central move: **no score decides a legal classification.** v1 returns
"Likely high-risk" on `score >= 5` with no rule having classified anything —
that and five other defects are documented in
`docs/compliance-checker-v1-known-defects.md` and asserted as *still present* in
`src/lib/compliance-v2/v1-invariants.test.ts`. Those are characterisation tests:
when v2 fixes one, the test fails and must be moved and inverted, never deleted.

Five things not to undo:

- **An unknown is a state, never a value.** `AnswerState` is
  `answered | unknown | not_applicable | declined`, and `evaluateCondition`
  refuses to satisfy a value test from a non-answered state. v1's defect 5 is
  that "not sure" about personal data produced a result byte-identical to "no".
- **Branch conditions are data, not closures.** That is what lets
  `validateCatalogue()` reject a condition referencing a question that does not
  exist *or one asked later* — a forward reference means the branch never opens
  and nothing errors.
- **Every high-risk result cites an exact route.** `classify.ts` contains no
  arithmetic; `statutoryRoutes` is empty exactly when nothing was cited, and
  `hasStatutoryRoute()` is asserted across every golden scenario.
- **Legal content is curated, versioned and corpus-verified.**
  `legal-content/propositions.ts` holds every quotable extract;
  `npm run test:checker-v2` (in `prebuild`) string-matches all of them against
  the pinned pack and fails the build on a mismatch. A finding may only cite a
  proposition, and a report may only cite what its own findings carry.
- **The model writes prose, never law.** `report/schema.ts` gives generated
  output no field for an obligation, a citation or a date;
  `report/verify.ts` implements §14.4 with no tolerance threshold. The email
  address is not in `AnswerRecordV2` at all, so it cannot reach a prompt.

Two carve-outs recorded rather than hidden: **Article 5's per-practice condition
trees are unwritten** (every positive screen holds at `potentially_prohibited`
with an explicit unresolved list), and **no model call or email send is wired** —
there is no mail sender, and §22.1's retention decision is open.

## Regulatory retrieval corpus (editorial only — do not blur)

`corpus/regulatory/`, `src/lib/regulatory/` and the Pinecone index named by
`PINECONE_REGULATORY_INDEX_NAME` give the drafting model at `/create` primary
statutory text to quote and cite. They are **never** an authority for anything
the Compliance Checker shows on screen — that remains the pinned rule pack under
`rulepack/versions/`. Two copies of the AI Act exist on purpose; the separation
is the safety property.

- `npm run test:regulatory-index` fails if any file under `src/lib/report/`,
  `src/lib/rulepack/` or `src/app/api/tools/compliance-checker/` so much as
  references the regulatory lane — and also if the generator stops consuming it,
  if the prompt stops forbidding quotation from memory, or if a silent
  `catch {}` reappears anywhere in the retrieval path.
- `npm run reg:check` runs in `prebuild` and blocks the build on corpus hash
  drift, on a lapsed `reviewBy` date, **or** if the corpus consolidation date
  stops matching the rule pack's `corpusCutOff`. The lanes assert consistency
  with each other; they never share storage.
- Corpus text is committed so an amendment is a reviewable `git diff` rather
  than a silent re-embed. To change it: `npm run reg:fetch -- --corpus <id>`,
  read the diff, then `npm run reg:hash` and write what you checked into the
  manifest `changelog`.
- **Statutory text is fetched from the EU Publications Office ("Cellar"), not
  from `eur-lex.europa.eu`.** Since 2026-08-16 the human web rendering sits
  behind an AWS WAF bot challenge that answers automated clients with `HTTP 202`
  and an empty body — and `response.ok` is TRUE for 202, which is how both fetch
  paths once read a challenge page as an empty instrument. All upstream reads go
  through `scripts/regulatory/source-fetch.ts`, which requires status `200`,
  detects the `x-amzn-waf-action` header by name, and rejects a body too small
  to be an instrument. The URL is derived from `meta.celex`, never from
  `meta.sourceUrl`, so the text and the identifier claimed for it cannot
  disagree. Cellar serves the same XHTML dialect, so `extract.ts` is unchanged.
- Every chunk carries its citation header *inside* the embedded text, so a
  quotation can never reach the model separated from its locator.
- **Quotations in drafts are audited** (since 2026-08-16). `src/lib/quotation-audit.ts`
  string-matches every quotation the draft presents as statute against the
  retrieved block the model was actually given, reusing `corpusContainsQuote()`.
  The retrieved block is the right target because it is what the prompt's
  promise refers to — "quote only from the passages below" — so a quotation
  absent from it violates the instruction by definition. Results land on the
  article's `quotationAudit` field and raise a publish-guard warning. This is
  still weaker than the Compliance Checker's guarantee: it warns rather than
  withholds, and it cannot verify a quotation from a provision retrieval never
  returned. Human review in Studio remains the final control.
- The index must have **no integrated `embed` config** — this app writes OpenAI
  vectors, and Pinecone's integrated text path would embed queries with a
  different model. `npm run reg:verify-index` asserts this against the live
  index; `--create` provisions one correctly. It also reports live-vs-committed
  record counts per corpus, which is what catches records stranded by a
  re-chunk; a namespace total cannot.

Six instruments share one namespace (`eu-ai-act`, `gdpr`, `eu-chips-act`,
`eu-data-act`, `nis2`, `eu-cyber-resilience-act`). Three consequences:

- **Routing is not optional.** Statutory prose is self-similar enough that
  similarity alone hands the model the right words from the wrong instrument.
  `looksRegulatory()` reports which instruments a topic names and retrieval
  filters on it. Adding a corpus means adding its terms to `INSTRUMENT_TERMS` in
  `gate.ts` — the guard fails if an ingested corpus has no routing terms,
  because text nothing can route to is text nobody can reach.
- **`instrumentType` is required and load-bearing.** A Directive (NIS2) binds
  Member States, not companies; the block header says so above every passage,
  because the quotation will be accurate even when the obligation it appears to
  create is addressed to a Member State. `applicationNote` does the same job for
  obligations that apply from a future date (the CRA's main body: 11 Dec 2027).
- **Two dialects.** EUR-Lex serves consolidated texts and original acts with
  different CSS vocabularies. An instrument that has never been amended has no
  consolidated version at all (Chips Act, Data Act), so `fetch.ts` reads both.
  Resolve the current CELEX from EUR-Lex at fetch time — never from a summary;
  one asserted a Data Act consolidation that does not exist.

Use `npm run reg:probe -- "<topic>"` to exercise the full routed path before
trusting a change. `reg:ingest --probe` only measures raw vector similarity.

### Keeping it current

`npm run reg:drift` asks upstream whether the law has moved. The non-obvious part
is why it does not simply diff the text: every instrument is pinned to one
consolidation, so when it is amended the pinned CELEX keeps returning the **old**
text forever and hashes identically. A content-diff watcher would report "no
drift" indefinitely while the law changed. The real check is *"does a newer
consolidation exist than the one I pinned"*, read off the base act's metadata
notice; the hash comparison is only a tamper check on the pinned text.

Two things it now does that it did not before 2026-08-16, both fixing a
fail-**open**: it reads through `source-fetch.ts` (see above), and it treats "no
consolidation found" as an `error` rather than `current` for any instrument
pinned to a consolidated CELEX — such an instrument must at minimum discover its
own version, so finding none proves the lookup broke rather than that nothing
changed. Only the original-act instruments (Chips Act, Data Act) may legitimately
return none.

It runs weekly in `.github/workflows/regulatory-drift.yml` and opens (or
comments on) an issue labelled `regulatory-drift`. The fail-closed backstop
remains `reviewBy` in `reg:check`, which fails the **build** 90 days after each
instrument's last review — automation can break silently, `prebuild` cannot. The
watcher exists to make that review a two-minute "nothing changed, restamp"
rather than a research task, which is what makes six instruments sustainable.

A new **AI Act** consolidation is not a simple re-fetch: `reg:check` asserts its
`consolidatedAs` equals the rule pack's `corpusCutOff`, so the pack version must
move with it and every pinned citation be re-verified. `reg:drift` says so in
its output rather than implying all six are equal work.

## Article vectors (the other Pinecone lane)

`PINECONE_INDEX_NAME` names the index behind semantic search, related articles
and the prior-coverage RAG at `/create`. It holds one OpenAI vector per
published Sanity article in the default namespace, written by
`/api/vectorize` on publish.

- **It must also have no integrated `embed` config.** The original index
  (`silicon-and-stone`) was created with one, and because both models are
  1024-dimensional nothing ever errored — a text-path query just returned
  confident nonsense (measured 0.09 and unrelated, against 0.54 done properly).
  Migrated to `silicon-and-stone-articles` on 2026-08-15.
  `npm run articles:verify-index` asserts the shape; `--create` provisions one.
- **The index is rebuildable from Sanity.** Every embedded field and every
  metadata value derives from the document, so `npm run articles:sync` restores
  it end to end and reconciles orphans. There is nothing to back up.
- Do not rename `getPineconeIndex()` or `searchSimilar` — `evidence-index-checks`
  (CI-blocking) and `regulatory-index-checks` grep for those literals, and a
  rename makes one assertion vacuously pass rather than fail.
- **`PRIOR_COVERAGE_SCORE_FLOOR = 0.37`** (`src/lib/draft-retrieval.ts`), applied
  per result and shared with the related-articles write-back in
  `/api/vectorize`. Calibrated 2026-08-16 against the live index: on-topic
  queries scored 0.421 / 0.533 / 0.687 on their best match, off-topic queries
  topped out at 0.318. The floor is the midpoint. **Re-measure it as the back
  catalogue grows** — it was calibrated against 15 articles, and a larger index
  produces stronger matches across the board.
- **Prior coverage embeds the topic alone**, while the regulatory lane composes
  topic + brief + keywords + pain points. Do not "fix" that asymmetry: the
  keywords come from the research pass and carry its news vocabulary, which is
  the mirror image of why `retrieve.ts` excludes the research summary.

## Draft-time editorial guards

Three checks run on generated drafts. All are advisory by design — they inform a
human, none blocks generation.

- **Quotation audit** — see the regulatory-corpus section above. Writes
  `quotationAudit` on the article.
- **Auto fact-check** — a Signal or Deep Dive POSTs to `/api/fact-check` from
  the browser once the draft is saved (`src/lib/auto-fact-check.ts` decides
  which formats). Client-triggered on purpose: `/create` has `maxDuration = 300`
  and has already spent most of it on five sequential model calls, so running a
  90–180s check in the same invocation risks the function dying and leaving
  `factCheck.status` stuck on `running`. The route already owns auth, the
  10/hour limit, the re-entrancy guard and its own background run — do not
  reimplement any of that at the call site.
- **Publish guard** — `src/sanity/actions/publishPreflight.tsx` wraps Studio's
  own publish action (wraps, never replaces, so the built-in validation and
  disabled states survive). It **blocks** on an unresolved `[AUTHOR: …]`
  placeholder and **warns** on a missing or adverse fact-check, an unmatched
  quotation, or an empty sources list. `src/lib/publish-preflight.ts` holds the
  checks as a pure function so they are testable and cannot drift from what the
  dialog claims. It deliberately does **not** scan `voiceEditNotes` — that field
  lists the outstanding placeholders, so scanning it would block every
  voice-passed article forever. There is a test for that.

## Pricing (load-bearing — do not break)

Every price the site shows comes from `src/lib/offering.ts`. `AMOUNTS` is the
only place a figure is typed; `DERIVED` computes the ones that are arithmetic
on others (the "£83 for both rather than £103" line is a sum of two prices, not
a third price). Components interpolate `gbp(AMOUNTS.x)` — **never** write a `£`
literal in a page or component, prose included.

Two checks enforce this, and both are meant to be annoying:

- `src/lib/offering.test.ts` walks `src/` and fails on any `£` outside a
  four-file allowlist. Add to the allowlist only with a reason.
- `npm run test:sanity-prices` fails CI when a published Sanity `product`
  document's `priceLabel` / `name` / `productPath` disagrees with
  `SANITY_PRODUCTS`. Those three documents are the one copy code cannot import,
  and the end-of-article gate renders them, so changing a product price means
  changing `AMOUNTS` **and** the document in Studio.

A price is a commercial claim. `project_summary.md` §5 is the written record of
what is on sale, at what, and why.

## CLI scripts and `server-only`

Several `src/lib` modules start with `import 'server-only'`, which throws under
plain `tsx`. Any script reusing them must run with
`TSX_TSCONFIG_PATH=scripts/tsconfig.scripts.json`, which maps that specifier to
an empty shim. Forgetting it is not subtle — the script dies on import.

## Model routing

You normally choose the tool yourself (Claude Code vs Codex). Two optional
helpers exist in Claude Code if you want the agent to assist with that choice:

- **`/auto-route`** — classifies the task and either keeps it in Claude Code or
  delegates it to a sub-agent (Codex via `codex:codex-rescue`, Gemini via
  `cc-gemini-plugin:gemini-agent`) without leaving the terminal.
- **`/model-routing`** — gives a one-line recommendation only, no delegation.

Reference docs: `AGENTS.md` (auto-loaded by Codex CLI) and
`.agent/rules/model-routing.md` (for Antigravity) explain the task→tool
rationale.

**Verify model specifics before trusting them — from any source.** The two
skills above *and* those reference docs all name particular model versions and
benchmarks (specific Opus / Gemini / Codex releases). Any of these can lag the
models actually available now and may post-date this assistant's knowledge
cutoff. Do not treat the skills or the docs as authoritative on which model is
newest or "best," and do not repeat their version numbers as current fact. When
it matters, check the live model list in your tool and decide from there. The
Antigravity dropdown matrix in `AGENTS.md` applies only inside Antigravity.
