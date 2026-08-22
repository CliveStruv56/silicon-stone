# SiliconStone Knowledge System — the `ideas` corpus

**Project:** `silicon-and-stone-web`
**Written:** 2026-08-22 · **Baseline:** `6d24b9f3`
**Governing spec:** `siliconstone-knowledge-llm-master-spec.md` §7 (trust and
retrieval policy), §10 (waves)
**Status:** **brief only — no code, no decision taken.** Seven questions at the
end are the owner's and must not be guessed.

**This is not one of the master spec's seven waves.** The wave list is fixed and
none of it covers this. It sits beside wave 3 and is subordinate to wave 3's
eligibility rule; if it is ever built it should be numbered **3b**, because the
one thing it must not do is loosen what wave 3 established.

## The question, in one sentence

Two hundred and seventy-seven scored, categorised, sourced story ideas about
exactly this publication's subject sit in a Pinecone namespace next door, and
every one of them is ineligible for editorial memory because nobody has read
them — so what, if anything, should happen to them?

The tempting answer is "import them, approve them, and finally have a corpus."
That answer is wrong, and the interesting part of this brief is why.

## What is actually there

Measured 2026-08-22 by reading all 277 records, not from memory. The namespace is
`ideas` in the **retired** `silicon-and-stone` index — the integrated-embed one
the article lane migrated away from on 2026-08-15 and which
[must never be deleted](#explicitly-out-of-scope).

| | |
|---|---|
| Records | **277**, ids `YYYY-MM-DD-NN` |
| Span | 41 days, **2026-06-23 → 2026-08-21**, 4–8 per day, **still being written daily** |
| `text` | present on all 277 · 153–1,163 chars, median **319** |
| `headline` | present on **175** of 277. Of those, only 108 texts open with it |
| `sources` | present on **133** of 277 |
| `score` | all 277 · range 68–94, mean 84.3, **median 85** |
| `slug` | all 277 · semicolon-joined *site category slugs*, 126 distinct combinations |
| `status` | 267 `New`, **10 `Consolidated`** |
| `format` | present on **7**, using the site's own format names (Signal ×4, Deep Dive ×2, Pulse ×1) |

A representative record, whole:

> **id** `2026-06-23-02` · **score** 91 · **slug** `semiconductors`
> **sources** `Bloomberg via Straits Times 19 Jun; ASML denial via Verdict 22 Jun; ChinaTalk MATCH Act 17 Jun`
> **text** *"The export-control endgame: a contested US allegation that an ASML
> EUV machine reached China becomes political leverage for the MATCH Act. Why
> now: Bloomberg reported on 19 June 2026 that Commerce Secretary Lutnick told
> ASML an advanced EUV tool may be in China; ASML denied it on 22 June; the MATCH
> Act would force allies to align export controls within 150 days via the Foreign
> Direct Product Rule and ban ASML's deep-ultraviolet sales to China."*

This is good material. It is dense, dated, attributed, in the publication's
taxonomy and close to its voice. Nothing below is an argument that the corpus is
poor. It is an argument about *where it belongs*.

### Two things in the data that are not what they look like

**`sources` is not a source.** Zero of the 133 source strings contain a URL. They
are publisher-plus-day citations — `"Politico (documents), 29 Jun (via TNW)"` —
one to six of them, semicolon-joined. And 144 records carry none at all.

**`Consolidated` is not a review.** All ten sit between 23 June and 2 July and
none has appeared since; on 23 June five of seven records carry it. Whatever it
meant, the agent or its operator stopped using it within a fortnight. Nothing in
this repo knows what it means, and it must not be read as approval — see
question 2.

## Four facts that should govern the design

### 1. The supply and demand are inverted, by two orders of magnitude

**277 ideas in 41 days. 16 published articles in seven months, one of them since
January.**

The publication is not short of ideas. It is short of *articles*. Any design that
adds 277 records to a queue somebody has to read — plus roughly six a day,
indefinitely — converts a resource into a debt, and does it at a moment when the
existing inbox holds three records and the drafts folder holds ten unpublished
pieces, several of them decaying.

This is the fact most likely to be lost if the work is scoped as "import the
ideas."

### 2. An idea is perishable; editorial memory is for durable thinking

Every record is built around the construction **"Why now:"**. They are news
prompts with a shelf life measured in days. The 23 June AI Act idea turns on a
consultation that closed on 23 July; the Stargate UK idea turns on a Guardian
investigation from 4 July.

The three lanes this system already has are all built the other way round. The
article lane holds published pieces. The regulatory lane holds statute pinned to
a CELEX consolidation with a `reviewBy` date that **fails the build** when it
lapses. Editorial memory was designed for reviewed thinking — a synthesis, an
observation, a claim somebody stood behind.

Nothing anywhere in the system expires an editorial-memory record. Put dated news
prompts in a lane a drafting model quotes and the failure mode is a draft written
in September confidently anticipating a July deadline, with a human approval
somewhere in its lineage.

### 3. The sources will not survive contact with the programme's own rules

`knowledgeItem.sources` is an array of **references to `knowledgeSource`
documents**, and the schema says why in as many words: *"References, not string
IDs — a reference cannot point at a document that was never created, which string
IDs demonstrably could."* That is not theory. `knowledgeItem.51ecac19…` spent
three months carrying two dangling string source IDs, one of which never matched
any record's `sourceId` and one of which named a source that did not exist; both
were repaired by hand on 2026-08-20.

An idea's sources are `"Bloomberg via Straits Times 19 Jun"`. Importing them
faithfully means creating several hundred `knowledgeSource` records with no URL
and no text — which are themselves ineligible for the corpus, because a source
with no text has nothing to embed. Importing them as a string means
reintroducing exactly the shape wave 1 removed. Dropping them means importing
research-grade material stripped of the one thing that made it research.

**There is no third option that is cheap.** Whichever is chosen is a decision, not
an implementation detail.

### 4. The bridge to `/create` is far shorter than the bridge to memory

`/create` takes four inputs: `format`, `personaSlug`, `topic`, `brief`. An idea
has `headline` → topic, `text` → brief, `format` where the agent proposed one,
and `slug` → the article's categories.

That is very nearly a form prefill. Retrieval is the long way round to something
the data is already shaped for, and the seeding gap is the one §11 already calls
*"the gap a reader will notice first"* — today the workflow is reading an idea and
retyping its substance into `/create`.

## Why the eligibility rule cannot simply be waived

Wave 3's whole safety property is one sentence: **unreviewed material never
reaches a drafting model.** It is enforced in three places that agree —
`indexEligibility()` refuses anything not `ready`, `applyReviewTransition()` will
not let any record be *created* ready, and `knowledge:sync` removes the vector of
anything that stops being eligible (which it does correctly only as of
`eb88c141`, and did not before someone pressed the button).

Bulk-importing 277 records and bulk-approving them to make the corpus large
enough to calibrate a score floor would satisfy every one of those checks while
destroying the thing they exist to protect. A human clicking "approve all" has
not reviewed anything; the record would simply carry a lie about having been read.

**And it would be the wrong experiment anyway.** `KNOWLEDGE_SCORE_FLOOR` has to be
measured against the corpus the lane will actually hold. A floor calibrated
against 277 news prompts is a floor for a lane of news prompts. If editorial
memory is later to hold reviewed synthesis, that number is not transferable —
it is worse than no number, because it looks earned.

**Do not do this for the floor.** The floor is a reason to grow the corpus with
records that belong in it, not a reason to admit records that do not.

## Three designs

Each is stated with what it costs and what it risks. The recommendation follows.

### A — Import as inbox items, review by hand

277 `knowledgeItem` records, `kind: 'idea'`, `reviewStatus: 'inbox'`,
`provenance.sourceSystem: 'ideas-agent'`, and a human works the queue.

*Faithful.* It changes no rule, invents no second trust model, and uses a `kind`
the schema already has. The migration precedent exists (`knowledge:migrate-candidates`,
dry-run by default, idempotent, reports unresolved relationships).

*Costs.* A 277-item queue against an inbox that currently holds three, growing by
~6 a day forever unless the flow is also handled (question 5). The corpus then
grows exactly as fast as somebody reads, which given fact 1 is slowly. Every
imported item needs the sources decision from fact 3 resolved first.

*Risks.* The inbox stops meaning "things awaiting a decision" and starts meaning
"the pile", which is how the `knowledgeCandidate` type got into the state wave 1
had to migrate out of. A queue nobody clears is worse than no queue, because it
makes the ones that matter invisible.

### B — A seeding path, not a memory path

Ideas never become knowledge records and never enter a retrieval lane. Instead
they become the thing they already almost are: a prefilled `/create`. A picker
lists them by date and score, and choosing one lands `topic`, `brief`, `format`
and categories in the form. Only the resulting **article** enters a corpus — via
the article lane, which has existed since 2026-08-15 and needs nothing built.

*Costs.* Small. A read-only view over the namespace, `searchParams` seeding on
`/create` (which today seeds from nothing), and a decision about whether the
article records which idea it came from. No import, no migration, no new
eligibility rule, no second trust model.

*Risks.* Almost none to the trust model — nothing unreviewed reaches a model as
*evidence*; it reaches a human as a *prompt*, which is what it already does by
email today, only faster. The real risk is different in kind: it makes drafting
easier without making publishing easier, and publishing is where the ten drafts
are stuck.

### C — A fourth lane with its own trust rules

Ideas retrievable at draft time as *prompts* — fenced, labelled, never quotable,
with their own eligibility calculation and their own floor.

*Costs.* A fifth index (Pinecone is at its five-index cap, so this needs a
namespace in an existing one, which
[`articles:sync` makes hazardous](#explicitly-out-of-scope)) or a re-use of the
ideas namespace with a query-time filter this repo does not own. Plus a second
eligibility model, a second block format, a second calibration.

*Risks.* This is the option the wave-3 brief already argues against in its own
words: *"a vector store that answers confidently about nothing is worse than no
lane at all"*, and *"a weak match is worse than no match… because a near-miss
reads as authoritative"*. It also creates a second answer to "what is trusted
here", which is the failure the two-copies-of-the-AI-Act separation was designed
to avoid.

### The recommendation

**B, and A only for a deliberately small, hand-picked set.**

B matches the data's shape, matches the actual bottleneck, and asks nothing of the
trust model. If ideas should also be *remembered* — and there is a real argument
that a good idea nobody used is worth finding again in six months — then a handful
of them can go through the ordinary inbox as `kind: 'idea'` items, reviewed one at
a time like everything else, which is A at a scale a person can carry.

What should not happen is 277 records entering the system in one movement because
they exist.

## The one thing that is genuinely urgent, and it is not this

Ten drafts are unpublished, several time-sensitive. Sixteen articles are
published and seven lack cover images. One article has gone out since January.
This brief describes an opportunity; those describe a stalled pipeline. If the
question is *"what fixes the publication side"*, the answer is the drafts, and the
ideas corpus is a way of making the *next* draft cheaper — which only pays once
the current ones ship.

## Explicitly out of scope

- **Writing to, altering, or deleting the `ideas` namespace or the
  `silicon-and-stone` index.** The index looks retired from inside this repo —
  nothing references it, no env var points at it — and it is written to daily by
  an agent that lives nowhere in this codebase. Pinecone is at its five-index
  limit, so the temptation to free a slot there is specific and real.
  `verify-article-index.ts` already warns it "must not be assumed safe to
  delete".
- **A namespace inside `silicon-and-stone-articles`.** `articles:sync` deletes
  every id it does not recognise; that hazard is why wave 3 took a fourth index
  rather than a namespace, and it has not changed.
- **Building or modifying the story-idea agent.** It is not in this repo. Do not
  look for it here.
- **Loosening `indexEligibility()` in any way**, including adding a bypass for a
  trusted `provenance.sourceSystem`. Provenance confers no trust; the schema says
  so in the field description.
- **Calibrating `KNOWLEDGE_SCORE_FLOOR` against ideas.** See above.

## Decisions only the owner can make

1. **What is this for?** A faster route from idea to draft (design B), or a
   searchable memory of ideas already had (design A)? They lead to different
   builds and the answer is not derivable from the data.
2. **What does `Consolidated` mean?** Ten records, all between 23 June and 2 July,
   none since. Was it a merge, a "used", a manual approval, or an abandoned
   convention? Nothing in this repo can tell, and it is the only field that even
   resembles a human judgement.
3. **Do ideas ever become `knowledgeItem` records at all**, or do they stay
   outside the canonical store and only ever seed `/create`?
4. **If they are imported, which ones?** All 277; from a date; above a score
   (noting the band is 68–94 with a median of 85, so score discriminates almost
   nothing); or only the ones you actually used?
5. **What happens to the ongoing flow?** Roughly six arrive a day. Either this
   repo *pulls* from the namespace on a schedule, or the external agent *pushes*
   through `/api/knowledge/capture` — which it could already do today, since wave
   4a shipped that endpoint and the MCP tools with it. The second is better in
   every way except that it means changing an agent you did not write.
6. **What happens to the free-text sources?** `knowledgeSource` records with no
   URL and no text (and therefore permanently ineligible themselves), unstructured
   text carried on the item, or dropped. Fact 3 says there is no cheap answer.
7. **Should an idea that produced an article be marked as used, and where?** The
   ideas namespace is not ours to write to, so "used" would have to live on this
   side — which means the mapping is ours to keep.

## What "done" would look like

For **B**: an idea can be chosen from a list and `/create` opens with `topic`,
`brief`, `format` and categories filled in; the operator can still edit every
field; the generated article's provenance records which idea it came from; and
nothing about eligibility, indexing or retrieval has changed. Verified by drafting
one real article from one real idea and reading its lineage.

For **A**: `npm run knowledge:import-ideas` is dry-run by default, idempotent,
reports what it could not resolve, creates nothing as `ready`, and a re-run is a
verified no-op — the same contract `knowledge:migrate-candidates` already meets.
Verified by importing, reviewing one item through Studio, and watching it reach
editorial memory through the path pressed on 2026-08-22.

For **C**: it should not be built without answering why the two arguments quoted
against it in the wave-3 brief no longer apply.

## Related

- `siliconstone-knowledge-wave-03-brief.md` — the eligibility rule, the two
  switches, the absent-by-design floor, and *Pressed — 2026-08-22*, which is where
  the review path was proven end to end.
- `siliconstone-knowledge-wave-02-brief.md` — provenance, and why sources are
  references rather than strings.
- `siliconstone-knowledge-llm-master-spec.md` — §7 trust and retrieval policy,
  §9's confirmation-gated `promote_to_article_draft` (design B's eventual shape),
  §10 waves, §11 migration and rollback rules.
- `CLAUDE.md` — the four Pinecone lanes, the five-index cap, and what must not be
  deleted.
- `project_summary.md` §9, 22 August 2026 — how the `ideas` namespace was found.
