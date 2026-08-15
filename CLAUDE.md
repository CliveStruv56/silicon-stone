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

- **Never edit a corpus file without bumping the pack version.** `prebuild` runs
  `scripts/rulepack-check.mjs`, which exits 1 on any hash drift — that is
  deliberate. Corpus text and pack version move together, or every citation
  previously verified against that text is silently invalidated. Intentional
  change: bump the version directory, then `npm run rulepack:hash`.
- **Every figure in the pack is a legal claim.** Dates, penalty ceilings and
  Article anchors are traceable to the EUR-Lex consolidated text at CELEX
  `02024R1689-20260727`. Verify against that before changing one; do not take a
  date from a summary, a blog post, or a build spec.

Three invariants the tool promises on screen and must keep:

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

Corpus coverage is partial (19 Articles). `verifyCitation()` returns
`uncovered` for anything else — treat that as unverifiable, never as a pass.
The report generator only supplies Articles the pack covers, so an `uncovered`
verdict means the model cited outside its evidence, not merely that coverage is
thin.

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
- Every chunk carries its citation header *inside* the embedded text, so a
  quotation can never reach the model separated from its locator.
- This lane does **not** carry the Compliance Checker's "no unverified
  quotation" guarantee. Drafts pass human review in Studio before publish; that
  is the control.
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

`npm run reg:drift` asks EUR-Lex whether the law has moved. The non-obvious part
is why it does not simply diff the text: every `sourceUrl` is pinned to one
consolidation, so when an instrument is amended the pinned URL keeps returning
the **old** text forever and hashes identically. A content-diff watcher would
report "no drift" indefinitely while the law changed. The real check is *"does a
newer consolidation exist than the one I pinned"*, read off the base act's
EUR-Lex page; the hash comparison is only a tamper check on the pinned text.

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
