# SiliconStone Knowledge System — Wave 3: editorial memory

**Project:** `silicon-and-stone-web`
**Written:** 2026-08-21 · **Baseline:** `f819e597`
**Governing spec:** `siliconstone-knowledge-llm-master-spec.md` §10, wave 3
**Status:** **contract only. No code exists.** Nothing in this document has been
built, and it deliberately does not say how to build it.

Read `knowledge-system-foundation.md` for the schemas and the domain service,
and `siliconstone-knowledge-wave-02-brief.md` — particularly its *What was
built* section, because wave 3 inherits the retrieval-snapshot shape wave 2
introduced and the three defects wave 2 found are the ones most likely to
recur here.

## The goal, in one sentence each

**Approved knowledge must become reachable.** A reviewed knowledge item sits in
Sanity today and nothing in the system can find it. `indexState` exists on every
record, carries nine fields, and has never held any value but `not_eligible`.

**Drafting must be able to consult it.** `/create` retrieves from two lanes —
prior articles and the regulatory corpus. `RETRIEVAL_LANES` already names a
third, `editorial_memory`, and nothing populates or reads it.

Both are named in the programme's definition of done (`§13`).

## What already exists to build on

**Wave 1 built almost the whole state machinery for this and left it
unconsumed.** Check before designing anything new — the temptation here is to
invent a second mechanism beside a complete one.

### The index state machine — `src/lib/knowledge/transitions.ts`

Nine rules, fully tested, zero callers:

```
not_eligible → pending          became eligible
pending      → indexed | error | not_eligible
indexed      → pending          content changed; index is stale
indexed      → error            reconciliation found a problem
indexed      → not_eligible     eligibility withdrawn
error        → pending          (repair) retried
error        → not_eligible
```

Note what this forbids: **`indexed → indexed` is not a legal move.** Re-indexing
changed content has to go through `pending`. A writer that upserts a vector and
patches `indexedAt` without moving the machine is not using the machine.

### The state fields — `knowledgeFields.ts`, `indexStateField()`

`status`, `canonicalHash`, `indexedHash`, `indexedAt`, `embeddingModel`,
`indexVersion`, `lastError`, `lastAttemptAt`, `attempts`. All present on
`knowledgeItem` and `knowledgeSource`; all `readOnly` in Studio except `status`.

`canonicalHash` and `indexedHash` are the staleness signal and **neither is
written by anything**. Deciding what goes into the canonical hash is deciding
what the word "changed" means, and it is not obviously the same as the
`contentHash` the capture path already computes — that one exists for duplicate
detection.

### The eligibility asymmetry — `applyReviewTransition()`

Already implemented, and it is wave 3's entry point:

- **Losing `ready` withdraws eligibility immediately** — the transition patches
  `indexState.status = 'not_eligible'` itself.
- **Gaining `ready` only *proposes* re-evaluation**, by returning an
  `index_evaluation_requested` intent.

The comment in the code states the reason: *removal is safe to do eagerly,
addition is not*. Do not collapse the asymmetry to make the code symmetrical.

### The intents — `KNOWLEDGE_EVENT_INTENTS`

`extraction_requested` and `index_evaluation_requested`, described in the source
as *what a later wave will be asked to do. Recorded, never dispatched.* Wave 3
is that later wave for the second one.

**Where they currently go to die:** `src/app/api/knowledge/review/route.ts`
calls `applyReviewTransition` and returns `{ ok, documentId, status }`. The
`events` array on the result is discarded without being read. That is one line
away from being the trigger, and whether it *should* be is question 2 below.

### The flags — `src/lib/knowledge/features.ts`

`KNOWLEDGE_AUTO_INDEX_ENABLED` and `KNOWLEDGE_DRAFT_RETRIEVAL_ENABLED`. Both
default off, both read by nothing today, both named for exactly this wave. (The
file's own docblock says *nothing in this wave reads them*, which is now stale —
`externalWrites` is read by `ingest-guard.ts`. These two are not.) They are
independent on purpose: indexing and consulting the index are separately
switchable, so the store can be built and inspected before any draft sees it.

### Wave 2's retrieval snapshot — `src/lib/draft-retrieval.ts`

`gatherDraftContext` returns `retrieval: RetrievalLaneSnapshot[]`, one per lane,
including lanes that did nothing. A third lane that returns the same shape gets
provenance for free, and `laneStatus` already distinguishes `ok`, `empty`,
`failed` and `skipped`. **Return the shape.** A lane that reports differently is
a lane whose absence cannot be told from its silence.

### What is actually in the store, as of 2026-08-21

**2 sources eligible, 0 items, 0 records with any index state.** That is the
whole corpus. See question 5 — it is not a footnote, it decides whether a score
floor can be calibrated at all.

## The four parts to connect

### 1. Eligibility

`§7` of the master spec already states the policy. Eligible: reviewed/`ready`
sources and items, explicitly approved reusable research summaries, published
articles (already handled by the article lane). Ineligible: inbox, rejected,
superseded, raw AI synthesis without human approval, failed extraction, and
**private or sensitive records whose policy forbids retrieval**.

Three obstacles worth knowing before designing it:

- **Eligibility reads three fields that can disagree.** `reviewStatus`,
  `extractionState.status` and `sensitivity`. A source has a fourth: the legacy
  `status`, which `effectiveSourceReviewStatus()` maps for pre-foundation
  records. One of the two currently-eligible sources has `reviewStatus: null`
  and `status: 'processed'` — it is eligible only through the legacy mapping.
- **`sensitivity` is `normal | private | confidential` and nothing reads it.**
  Wave 3 is the first code that must, and getting it wrong puts material into a
  retrieval lane that a drafting model will quote.
- **Eligibility is a calculation, and `§6` says the domain owns it** — "eligibility
  calculation" is in the service contract's list. It does not belong in a route.

### 2. Indexing

There is **no event bus in this repo**. The only event-driven precedent is
`/api/vectorize`, a Sanity webhook filtered to `_type == "article"`.

Read `LAUNCH.md` §"Sanity webhooks" before proposing a fourth one. Three exist,
**all configured only in the Sanity dashboard, recorded nowhere in this repo,
and silent when missing** — a fresh environment publishes articles that are
never indexed and nothing fails. Adding a fourth adds a fourth thing that can be
absent without symptom. That is a real cost, and it is question 2.

Whatever triggers it, the writer has to move the state machine, record
`embeddingModel` and `indexVersion` (so a model change is detectable rather than
mysterious), and count `attempts` — the fields exist because the failure modes
were anticipated.

### 3. Reconciliation

`npm run articles:sync` is the precedent and the standard to match: it rebuilds
the article index from Sanity end to end and reports orphans — vectors with no
document. `npm run articles:verify-index` asserts index shape and reports
live-vs-committed record counts **per corpus**, because a namespace total hides
records stranded by a re-chunk.

The drift this wave introduces is different in kind from either: a record whose
`canonicalHash` no longer matches its `indexedHash` is *stale but present*,
which neither existing script would notice. That is what the two hashes are for.

### 4. The retrieval lane

`gatherDraftContext` runs its lanes through `Promise.allSettled` and nothing
throws. Adding a third is mechanically small. What is not small:

- **A score floor cannot be calibrated against one document.**
  `PRIOR_COVERAGE_SCORE_FLOOR = 0.37` was derived from a documented experiment:
  three on-topic queries scoring 0.421 / 0.533 / 0.687, four off-topic topping
  out at 0.318, floor at the midpoint. The editorial corpus has two sources. The
  same method is not available, and inventing a number and calling it calibrated
  would be worse than shipping the lane switched off.
- **What the lane embeds is a decision, not a default.** Prior coverage embeds
  the topic alone; the regulatory lane composes topic + brief + keywords + pain
  points. `CLAUDE.md` is explicit that the asymmetry is deliberate and must not
  be "fixed". A third lane needs its own answer and its own reason.
- **Trust filtering happens at query time as well as index time.** `§7` says
  retrieval filters on trust; eligibility at write time is not sufficient on its
  own, because a record can become ineligible after it was indexed and before
  reconciliation notices.

## The constraint that matters most

**A vector store that answers confidently about nothing is worse than no lane at
all.**

This project has already paid for that lesson once, and it is written into
`CLAUDE.md`: the original article index was created with an integrated `embed`
config, and because both models were 1024-dimensional **nothing ever errored** —
queries just returned confident nonsense, measured at 0.09 and unrelated against
0.54 done properly. Whatever store wave 3 uses must have **no integrated `embed`
config**, and there must be a `verify-index` check that asserts it, in the shape
of `npm run reg:verify-index` and `npm run articles:verify-index`.

The second half of the same constraint is editorial. The drafting model uses
whatever it is given. A weak match is worse than no match — the reasoning
already written above `PRIOR_COVERAGE_SCORE_FLOOR` — and editorial memory is the
lane most exposed to it, because its corpus is small, its records are short, and
a near-miss reads as authoritative because a human approved it.

## Explicitly out of scope

None of this is wave 3, and none of it should be pulled in because it is nearby:

- **Making an idea become an article.** There is no promote action, `/create`
  cannot be seeded from a knowledge item, and `Intended Use → Article seed`
  changes nothing. This is the most visible gap in the whole programme and
  someone will be tempted. It is not this wave: wave 3 makes knowledge
  *retrievable*, not *promotable*.
- The `/knowledge` cockpit (wave 4).
- URL or PDF extraction — its own security surface, its own brief. Wave 3 must
  treat `extractionState: failed` as ineligible and stop there.
- Any change to the article index, to `PRIOR_COVERAGE_SCORE_FLOOR`, or to what
  the two existing lanes retrieve.
- Any change to the regulatory corpus or the rule pack. Editorial memory may
  hold commentary about the law; it never becomes an authority on the law, and
  `scripts/regulatory-index-checks.ts` exists to keep the lanes apart.
- Backfill and cutover (wave 6).
- ChatGPT (parked on a plan gate, not an engineering one).
- Anything touching the fact-check, quotation-audit or publish-preflight guards.

## Open questions — for the owner, not to be guessed

1. **Which store?** A fourth Pinecone index, or a namespace on an existing one.
   Three indexes already exist — articles, regulatory, evidence — and the
   regulatory accessor's own comment records why *it* is separate rather than a
   namespace: index-level embed config is not scoped by namespace, and a separate
   accessor is something a static check can assert the Compliance Checker never
   imports. Both reasons may or may not apply here.

2. **What triggers indexing?** Three shapes, and they are not equally safe:
   inline on the review transition (simplest; makes a Studio review action depend
   on OpenAI and Pinecone being up); a fourth Sanity webhook (matches
   `/api/vectorize`, and adds a fourth dashboard-only configuration that fails
   silently); or a scheduled reconciler that reads `indexState` and needs no
   event at all (slowest to reflect a review, and the only one that cannot be
   silently missing).

3. **Does an approved research run get indexed?** `§7` lists "explicitly
   approved reusable research summaries" as eligible. Wave 2 made `reuseStatus`
   real and nothing has ever set `approved`. Indexing a research summary means
   the drafting model can be handed a previous run's synthesis — which is
   editorial memory in its most literal form, and also the most direct route to a
   model quoting its own earlier output back to itself.

4. **What is the unit of a vector?** A knowledge item is short and is plausibly
   one vector. A `knowledgeSource` carries `extractedText` up to 2 MB and
   plainly is not. Chunking it means a chunking policy, a citation header
   convention like the regulatory corpus's, and a per-record count that
   reconciliation has to check — the regulatory lane's own experience is that a
   namespace total cannot catch records stranded by a re-chunk.

5. **What does the lane do while the corpus is two records?** The floor cannot
   be calibrated, so the honest options are: ship indexing with the retrieval
   flag off until there is enough to calibrate against; ship the lane with a
   deliberately conservative floor and say in the brief that it is a guess; or
   defer the lane to a later wave and make wave 3 indexing-and-reconciliation
   only. This is the question that most changes the shape of the work.

6. **Is `private` retrievable?** `sensitivity` has three values and `§7` says
   only that records "whose policy forbids retrieval" are ineligible — it does
   not say which. `confidential` is obvious; `private` is a judgement.

## Before implementing

**This wave needs its own exploration pass.** The survey behind this brief read
the state machinery, the eligibility inputs, the existing indexes and the
retrieval lane at the level of entry points and field shapes. It did **not**
read: the evidence index's write path (`src/lib/evidence-index.ts`,
`scripts/rebuild-evidence-index.ts`), which is the closest precedent for
chunking and batch upsert; `/api/vectorize`'s failure and retry behaviour; or
`articles:sync`'s orphan reconciliation in detail.

Follow the master spec's per-wave procedure (`§12`): install to the lockfile,
establish a clean baseline with the existing checks, implement only this wave,
then `check` / `test` / `test:security` / `test:knowledge-inbox` /
`test:evidence-index` / `test:regulatory-index` / `build`, and inspect the final
diff.

**Three habits, each earned by a defect in an earlier wave:**

- **Verify a new guard by deliberately breaking it.** Wave 4a had a check that
  matched `env['X']` but not `process.env.X`. Wave 2 had one that used `indexOf`
  where two call sites existed, so it passed however the code was ordered. Both
  would have passed vacuously forever.
- **Probe the running app, not only the suite.** Wave 2 shipped three defects
  past a full green suite, and all three were found by writing to real Sanity: a
  document id that did not exist yet, a `drafts.*` record invisible to the
  default query perspective, and a strong reference the mutation API refuses.
  A stubbed client has no perspective and enforces no reference integrity.
- **Walk the UI.** Wave 4a's three capture defects were found by opening a
  record in Studio. Wave 3 writes `readOnly` fields a reviewer will read; open
  one and look at it.

## Related

- `siliconstone-knowledge-wave-02-brief.md` — provenance, and the retrieval
  snapshot shape this wave must return.
- `knowledge-system-foundation.md` — the schemas, statuses and domain service.
- `siliconstone-knowledge-llm-master-spec.md` — §5.6 index state, §7 trust and
  retrieval policy, §10 waves, §12 verification, §13 definition of done.
- `CLAUDE.md` — the integrated-`embed` trap, the two Pinecone lanes, and the
  separation the regulatory checks enforce.
- `LAUNCH.md` §"Sanity webhooks" — what a fourth webhook would cost.
