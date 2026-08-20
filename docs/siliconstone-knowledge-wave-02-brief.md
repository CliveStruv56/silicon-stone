# SiliconStone Knowledge System — Wave 2: provenance

**Project:** `silicon-and-stone-web`
**Written:** 2026-08-20 · **Baseline:** `573ff212`
**Governing spec:** `siliconstone-knowledge-llm-master-spec.md` §10, wave 2
**Status:** **contract only. No code exists.** Nothing in this document has been
built, and it deliberately does not say how to build it.

Read `knowledge-system-foundation.md` first — it describes the schemas and the
domain service this wave consumes. This brief exists so the next session starts
from a contract rather than a blank page.

## The goal, in one sentence each

**Research must survive job expiry.** Today an investigation exists only in
browser state — plus, for a Deep Dive, a Railway job that ages out. A standard
run has no job at all: it returns from a server action and is held in React
state or lost. Close the tab and it is gone, with no record that it ever ran.

**A generated article must be able to say what it was written from.** Today it
cannot. The public "Sources / Citations" list is authored by hand and is what
the reader sees; there is no internal record of the run, the retrieved
passages, the prior coverage, or the model and prompt versions in force.

Both are named in the programme's definition of done (`§13`): *research survives
page reload and transient job expiry*, and *generated articles retain sources,
citations, prior coverage, and retrieval snapshots*.

## What already exists to build on

Almost all of it shipped in wave 0–1 and **the research-run and article-lineage
halves have no caller at all.** This wave is mostly wiring, not schema work —
check before designing anything new. (The capture functions *are* called, by
`/api/knowledge/capture` and the MCP tools; `linkSourcesToItem` is wave 4a's.)

### Domain service — `src/lib/knowledge/service.ts`

| Function | Does | Notes |
|---|---|---|
| `createResearchRun` | opens a run | dedupes on `jobId` as the idempotency key, so recording the same provider job twice returns the first record |
| `updateResearchRun` | moves a run to its next status | goes through the transition guard; carries `summary`, `deepReport`, `keywords`, `error` |
| `linkSourcesToItem` | attaches `knowledgeSource` references to an **inbox** item | additive, `sources` only — see the wave 4a brief |
| `captureSource` / `captureKnowledgeItem` | the capture path | everything lands at `reviewStatus: 'inbox'` |

`researchRun.status` is `queued | running | completed | failed | cancelled`;
`reuseStatus` is `pending | approved | excluded`. The permitted moves are data in
`transitions.ts`. **A completed run is not automatically reusable** — that is a
separate human verdict, and this wave must not collapse the two.

### Schema — `src/sanity/schemaTypes/researchRun.ts`

Already carries: `query`, `brief`, `mode`, `provider`, `jobId`, `status`,
`error`, `requestedAt` / `startedAt` / `completedAt`, `retryOf`, `summary`,
`keywords`, `deepReport`, `selectedSources[]` (title, url, publisher,
publishedDate, snippet, score), `sources[]` (references), `reuseStatus`,
`retrievalSnapshots[]` (lane, index, namespace, corpus/pack version, score
floor, lane status, and `entries[]` of recordId / score / title / locator),
`modelSnapshot` (model, embedding model, provider version, rules version, token
counts, cost), and back-references to `knowledgeItems` and `articles`.

### Schema — `src/sanity/schemaTypes/article.ts`, provenance group

Six optional fields, **all unused today**: `researchRun` (reference),
`knowledgeItems[]`, `knowledgeSources[]`, `priorCoverage[]` (article
references), `citationSnapshots[]` (title, url, publisher, publishedDate,
locator, and an optional resolved `source` reference), and `generationSnapshot`
(generatedAt, model, embeddingModel, rulesVersion, rulePackVersion,
`retrievalRecordIds[]`, notes). The last two are `readOnly` in Studio.

## The two halves to connect

### The research path

- `src/app/(admin)/create/actions.ts` — `startResearch`, `pollResearchJob`,
  `createDraftFromResearch`.
- `src/lib/research.ts` — `performResearch` (in-process Exa + Inoreader),
  `synthesizeDeepReport`.
- `src/lib/research-backend.ts` — the Railway client for Deep Dives, whose Exa
  run outlives a Vercel function. Started with `startDeepResearchJob`, polled by
  `jobId`.
- `src/types/research.ts` — `ResearchResult` is `{ summary, sources[],
  suggestedContext: { keywords, pain_points }, deepReport? }`.

**Where it leaks today:** the `ResearchResult` is returned to the browser and
held in React state (`create-form.tsx`) until the user chooses to draft. Nothing
server-side remembers the run. The `jobId` is a Railway handle, and the browser
holds the only reference to it.

Two shape notes. `ResearchSource` maps almost cleanly onto
`researchRun.selectedSources`, but has no `publisher` and no `score` — do not
invent either; an absent field is honest and a guessed one is not.
`suggestedContext` has no home in the schema yet; decide whether it belongs on
the run or is genuinely transient.

### The draft-creation path

- `createDraftFromResearch` in the same actions file, which calls
  `gatherDraftContext` (`src/lib/draft-retrieval.ts`), then `buildDraftPrompt`,
  then `finalizeDraft` (`src/lib/draft-pipeline.ts`), then
  `createArticleInSanity` (`src/lib/sanity.ts`).
- `createArticleInSanity` is the single funnel: `/create`, `/import` and the
  local-draft `save` command all land there. That makes it the obvious place to
  write lineage and also the place where writing it blindly would attach
  provenance to articles that have none.

**The obstacle worth knowing before planning:** `DraftContext` is
`{ priorCoverage?: string, regulatoryCorpus?: string, notes: string[] }` — prose
blocks. The record IDs, scores and score floor exist inside
`gatherPriorCoverage` and the regulatory lane and are discarded before the
caller sees them. `article.priorCoverage[]` and
`generationSnapshot.retrievalRecordIds[]` cannot be filled without the retrieval
lane returning structured data alongside the block it already returns. That is
an additive change to a return type, not a change to what is retrieved — and it
must stay that way.

## The constraint that matters most

**References follow their targets; snapshots must not.**

The article schema already states this, in a comment above the provenance
group, and it is the reason the block is split the way it is. `researchRun`,
`knowledgeSources[]`, `knowledgeItems[]` and `priorCoverage[]` answer *what does
this article relate to now* and are expected to move as their targets are
edited, superseded or rejected. `citationSnapshots[]` and `generationSnapshot`
answer *what was this actually written from*, which is the question a correction
or a fact-check asks, and they must read the same in a year as they did on the
day. Keeping only references would quietly rewrite history; keeping only
snapshots would orphan the article from the graph.

Practical consequences: a snapshot is written once and never patched; a source
later corrected does not change what the snapshot says it said; and a snapshot
may carry a resolved `source` reference *as well as* its literal values, but
never instead of them.

## Explicitly out of scope

None of this is wave 2, and none of it should be pulled in because it would be
convenient:

- Pinecone indexing of anything, automatic or otherwise (wave 3).
- Any change to what retrieval retrieves, to `PRIOR_COVERAGE_SCORE_FLOOR`, or to
  the deliberate topic-only / composed-query asymmetry between the two lanes.
- Any change to a generation prompt.
- URL or PDF extraction (its own security surface, its own brief).
- The `/knowledge` cockpit.
- Anything touching the fact-check, quotation-audit or publish-preflight guards.
  They are advisory by design and this wave gives them nothing new to say.
- The regulatory corpus and the rule pack. Wave 2 records *which* corpus version
  was in force; it never becomes a second authority for what the law says.

## Open questions — for the owner, not to be guessed

1. **Is a failed research run persisted?** It is evidence too — an Exa run that
   returned nothing is worth knowing about when the same topic is tried again —
   and the schema supports it (`status: 'failed'`, `error`). But persisting
   every abandoned exploration fills the store with noise. The `reuseStatus`
   field exists partly to answer this and partly does not.
2. **Which articles get lineage?** Only ones generated through `/create`, or
   also imported and hand-written ones, which would carry an empty provenance
   block that reads as "we do not know" rather than "there was none"?
3. **Is anything backfilled?** The 12 published and 9 draft articles predate all
   of this. Leaving them blank is honest; a partial backfill from whatever
   survives is not obviously better. Wave 6 owns cutover, so the default answer
   is probably "no, and say so".

## Before implementing

**This wave needs its own exploration pass.** The research and drafting paths
were surveyed for this brief at the level of entry points and type shapes, not
read in detail. In particular: the deep-job polling loop, the failure and retry
behaviour around `pollResearchJob`, and everything `finalizeDraft` does between
the prompt and `createArticleInSanity` are unexamined here.

Follow the master spec's per-wave procedure (`§12`): install to the lockfile,
establish a clean baseline with the existing checks, implement only this wave,
then `check` / `test` / `test:security` / `test:knowledge-inbox` /
`test:evidence-index` / `build`, and inspect the final diff.

Two habits from wave 4a worth carrying over. **Verify a new guard by
deliberately breaking it** — one check there matched `env['X']` but not
`process.env.X` and would have passed vacuously forever. And **probe the running
app**, not only the suite: the routes import `server-only` and cannot be unit
tested, and the one real leak found in wave 4a was found by curl.

## Related

- `knowledge-system-foundation.md` — the schemas, statuses and domain service.
- `siliconstone-knowledge-wave-04-execution-brief.md` — external capture, and
  the credential and tool-annotation rules any new write must match.
- `siliconstone-knowledge-llm-master-spec.md` — §10 waves, §11 migration rules,
  §12 verification, §13 definition of done.
