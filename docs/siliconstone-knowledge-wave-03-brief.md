# SiliconStone Knowledge System — Wave 3: editorial memory

**Project:** `silicon-and-stone-web`
**Written:** 2026-08-21 · **Baseline:** `f819e597`
**Governing spec:** `siliconstone-knowledge-llm-master-spec.md` §10, wave 3
**Status:** **built 2026-08-21 (`4cbdc475`) — the mechanism ships, the lane
ships dark, nothing is provisioned.** The six questions were answered by the
owner and are recorded under
[Decisions](#decisions--answered-by-the-owner-2026-08-21); what was actually
built is at the end under
[What was built](#what-was-built--2026-08-21-4cbdc475).

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
away from being the trigger, and decision 2 says it should be.

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
whole corpus. See decision 5 — it is not a footnote, it is why the
retrieval lane ships switched off.

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
absent without symptom. That is a real cost, and decision 2 declines to pay it.

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

## Decisions — answered by the owner, 2026-08-21

All six, accepted as recommended. Recorded here so nobody re-opens one by
accident; the reasoning is kept because in two places it is the reasoning, not
the answer, that would be lost.

### 1. A fourth Pinecone index — `PINECONE_KNOWLEDGE_INDEX_NAME`

Not a namespace on the article index, **and the first answer was the other
one.** A namespace looked right: same embedding model, the same 1024 dimensions,
no integrated `embed` config on `silicon-and-stone-articles`, and namespaces
isolate queries so `searchSimilar` could not reach it.

Then `src/scripts/sync-pinecone.ts`. Its orphan pass enumerates the index with
`index.listPaginated(...)` and deletes **every id not in Sanity's article
list**. That runs against the default namespace today, so a knowledge namespace
would survive — *incidentally*, by an SDK default the script never mentions. One
`index.namespace(...)` added later and `articles:sync` silently eats the
editorial corpus.

The blast radius of a rebuild script must not include another lane's records,
and that safety has to be structural rather than accidental. A separate index
also keeps `articles:verify-index`'s counts unambiguous — the regulatory lane
already learned that a shared total hides records stranded by a re-chunk.

Provision it the way the other two were: **no integrated `embed` config**, with
a `knowledge:verify-index` check that asserts it. That trap has been paid for
once already.

### 2. Inline on the review transition, plus a reconciler. No fourth webhook.

The `index_evaluation_requested` intent already exists at exactly that point,
and `src/app/api/knowledge/review/route.ts` discards it one line from where it
would be used.

A review is a human action, so a failure can be **reported to the person who
caused it**. A webhook cannot do that, and a fourth webhook is a fourth
dashboard-only configuration that fails silently — the failure mode `LAUNCH.md`
warns about at length.

The shape that makes inline safe, and it is not optional:

1. Patch `indexState.status = 'pending'` in the **same** patch that sets
   `ready`. The record is now eligible and known to be unindexed.
2. *Then* embed and upsert. If OpenAI or Pinecone is down, the record stays
   `pending` with `lastError` and `attempts` recorded — and **the review still
   succeeds**. Indexing must never cost a reviewer their verdict.
3. `npm run knowledge:sync` sweeps `pending` and `error` and repairs, mirroring
   `articles:sync`.

Step 3 is what makes the eventual consistency honest rather than hopeful.

### 3. Approved research runs are NOT indexed — deferred, with the reason

`§7` permits it. Wave 3 declines it, for two reasons. Nothing has ever set
`reuseStatus: approved`, so there is no corpus to evaluate and no way to tell
whether it helps. And a research summary is raw model synthesis that a human
waved through: indexing it is the shortest path to a drafting model being handed
its own earlier output as evidence. Revisit with a brief of its own.

### 4. One vector per record, with a budget that fails loudly

A knowledge item is short; one vector is right. A `knowledgeSource` carries
`extractedText` up to 2 MB and is not.

Chunking means a chunking policy, citation headers like the regulatory corpus's,
and per-record reconciliation — a wave's worth of work. So: one vector per
record, and a source over the character budget goes to **`error`, naming the
limit**, never silently truncated. Indexing the first few kilobytes and treating
it as the document is the kind of quiet wrongness this system is built to
refuse. When a real oversized source appears, chunking earns its own brief.

### 5. Indexing and reconciliation ship. The lane ships dark.

This narrows the wave, and deliberately.

Build the lane, return the `RetrievalLaneSnapshot` shape, and leave
`KNOWLEDGE_DRAFT_RETRIEVAL_ENABLED` **off**. **Claim no calibrated floor.**
`PRIOR_COVERAGE_SCORE_FLOOR = 0.37` came from a documented experiment over 15
articles — three on-topic queries at 0.421 / 0.533 / 0.687, four off-topic
topping out at 0.318, floor at the midpoint. Two records cannot produce that.

Add `npm run knowledge:calibrate` to run the same experiment, and do not switch
the lane on below roughly **15 records** — the sample the article floor came
from. A number invented now and labelled "calibrated" outlives everyone's memory
of it having been a guess.

### 6. Only `normal` is eligible. `private` is not retrievable.

Fail closed. Excluding `private` costs a smaller corpus; including it risks
material a drafting model quotes into a published article. Widening later is a
policy change; un-publishing a quote is not.

## What the wave is, after those decisions

Smaller than the brief above assumed, and two of the six are deferrals rather
than builds — which is worth seeing now rather than halfway through.

**In:** a fourth index with a verify check; eligibility as a domain calculation
reading `reviewStatus` (with the legacy fallback), `extractionState.status` and
`sensitivity`; the index state machine actually driven; inline indexing on the
review transition behind `KNOWLEDGE_AUTO_INDEX_ENABLED`; `knowledge:sync`
reconciliation including the `canonicalHash` / `indexedHash` staleness check;
the third retrieval lane, built and dark; `knowledge:calibrate`.

**Out, with reasons recorded:** chunking, research-run indexing, any floor
claimed as calibrated, and the retrieval lane being switched on.

**The honest consequence**: with 0 ready items and 2 ready sources, wave 3
indexes two documents. The mechanism is the deliverable, not the corpus.

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

## What was built — 2026-08-21, `4cbdc475`

**Status: the mechanism ships; the lane ships dark.** Everything below is behind
switches that are off, and nothing is provisioned — see *What is not done*.

### Eligibility (`knowledge/eligibility.ts`)

A pure function, because `§6` puts the calculation in the domain's list. Every
verdict carries a reason **including the eligible ones**: a record that is not in
the corpus has to be explicable without reading the implementation, since "not
indexed" is the same observation whether policy excluded it, the text was empty,
or the indexer never ran.

Four judgements, each with a test:

- A pre-foundation source is read through its legacy `status`. One of the two
  currently-eligible records is eligible only that way.
- **Absent `sensitivity` is `normal`.** A source has no such field at all, so no
  policy was ever expressed for one, and an item's schema carries
  `initialValue: 'normal'`. Failing closed on absence would silently exclude
  every record captured before the field existed. Anything actually set and not
  `normal` is refused.
- Extraction that is `queued`, `processing` or `failed` means the text is not
  settled.
- **Size is not judged here.** Too large to embed is *eligible and unindexable*,
  which is `error`, not `not_eligible`. Policy and mechanism are different
  failures and the machine already tells them apart.

`canonicalIndexHash` hashes the text that would be embedded, and is deliberately
not the capture `contentHash` — dedupe and staleness are different questions. The
field order inside `embeddableText` is fixed because that hash is what "changed"
means; reordering it would make every record look stale exactly once.

### The machine, driven (`applyIndexTransition`, `knowledge/indexer.ts`)

The transition does its own field bookkeeping, so a state and the evidence for it
cannot be written apart: `indexed` always stamps hash, model, version and time
and clears a stale error; `error` always records the message, time and count;
losing eligibility forgets the indexed hash, because saying otherwise would make
reconciliation believe the index holds something it does not.

The refusal of self-transitions is kept rather than worked around.

`indexRecord` returns and never throws. Over the embedding budget is an `error`
naming the limit, checked **before** the call — `generateEmbedding` slices
silently, which is right for articles and wrong for a corpus where a source
stored as its first 24,000 characters is a document misrepresented with nothing
on the record to show for it. `MAX_EMBEDDING_CHARS` is now exported and shared so
the two numbers cannot drift.

### The trigger (decision 2)

`pending` is written in the **same patch** as the `ready` verdict, so the record
is eligible and known to be unindexed in one write: a process that dies between
the verdict and the embedding leaves something reconciliation can find, rather
than a `ready` record nothing will look at again. The review route then acts on
the intent it used to discard, behind `KNOWLEDGE_AUTO_INDEX_ENABLED`, after the
verdict is written. A failure costs the vector, never the review.

An already-`indexed` record is **not** re-opened on re-approval. `indexed →
pending` is a legal move, so this would be allowed and wrong: nothing about the
text changed, and pre-empting the hash comparison would re-embed every record
each time somebody pulled one back for a second look.

### Reconciliation (`knowledge:sync`)

Dry run by default. Finds a drift neither `articles:sync` nor
`articles:verify-index` could: a record whose `canonicalHash` no longer matches
its `indexedHash` is **stale but present** — vector there, counts agreeing, text
wrong. Also re-indexes on an `indexVersion` bump, and deletes orphans by
enumerated id rather than by filter, so a surprise is a no-op instead of a wipe.

### The lane, dark (`knowledge/retrieve.ts`)

Returns wave 2's `RetrievalLaneSnapshot`, so provenance covers it unchanged and
`laneStatus` keeps *switched off* apart from *found nothing*. Embeds the topic
alone, matching prior coverage.

**Two switches, and the second is decision 5 made real.** The flag says the lane
may run; `KNOWLEDGE_SCORE_FLOOR` says what counts as a match, and **no default
exists anywhere in the code**. Turning the flag on is deliberately not enough.
`knowledge:calibrate` repeats the experiment that produced 0.37 rather than
describing it, and **refuses to split the difference when the bands overlap** —
something you do not write about scoring as well as something you do means there
is no honest floor yet, which is a real outcome rather than a failure to compute.

The lane's block is fenced like every other retrieved block: a human approving
material makes it trustworthy as *thinking*, not as instructions.

### Two guards were wrong on the first attempt

Both caught by mutation-testing, and both the same failure: **prose satisfying a
check**. The "no hard-coded floor" guard read the raw file and failed on the
lane's own docblock, which cites `PRIOR_COVERAGE_SCORE_FLOOR = 0.37` while
explaining why editorial memory has none; it now strips comments first. Earlier
waves lost a check to `indexOf` finding the wrong call site and to a regex
matching `env['X']` but not `process.env.X`. Prose must not be able to satisfy a
guard, and must not be able to break one either.

### One wave-1 test changed rather than deleted

It asserted the `ready` patch was exactly `{ reviewStatus: 'ready' }`, commented
*"an intent, not an action: nothing here touches an index"*. The assertion is now
the two-field patch, and the comment records what the original was protecting and
why it still holds — `pending` is a claim about the document, not about Pinecone.

### What is not done

- **Nothing is provisioned.** `PINECONE_KNOWLEDGE_INDEX_NAME` is unset, so the
  indexer, the reconciler and the lane are all no-ops that say so. Create it with
  `npm run knowledge:verify-index -- --create`.
- **Nothing has been indexed**, and with 0 ready items and 2 ready sources there
  are two documents to index when it is. The mechanism is the deliverable.
- **No live probe yet**, which by this programme's own record is where the
  defects are. Wave 2 shipped three past a green suite.
- Chunking, research-run indexing, and any calibrated floor — deferred by
  decisions 3, 4 and 5.

## Related

- `siliconstone-knowledge-wave-02-brief.md` — provenance, and the retrieval
  snapshot shape this wave must return.
- `knowledge-system-foundation.md` — the schemas, statuses and domain service.
- `siliconstone-knowledge-llm-master-spec.md` — §5.6 index state, §7 trust and
  retrieval policy, §10 waves, §12 verification, §13 definition of done.
- `CLAUDE.md` — the integrated-`embed` trap, the two Pinecone lanes, and the
  separation the regulatory checks enforce.
- `LAUNCH.md` §"Sanity webhooks" — what a fourth webhook would cost.
