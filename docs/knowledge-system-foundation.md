# Knowledge system — the canonical foundation

**Status:** wave 1 of the programme in `siliconstone-knowledge-llm-master-spec.md`.
**Shipped:** 2026-08-19 (`8b0032b4`, schema manifest `d614cfcf`).
**Behaviour changed for users:** none. The only live difference is a new
**Knowledge** section in Studio.

**The candidate migration has been run** (2026-08-19): one `knowledgeItem`
created, the candidate untouched, a repeat `--write` a no-op. Re-running it is
safe.

This wave laid a foundation and wired almost nothing to it. The schemas exist,
the domain service exists, the feature controls exist and are all off. The
`/knowledge` page, the article generator, draft retrieval and every Pinecone
index behave exactly as they did before.

## Which store is authoritative for what

Three stores, and the separation is the safety property — not an accident of
history.

| Store | Holds | Authoritative for |
|---|---|---|
| **Sanity** | sources, derived items, research runs, topics, articles, review state, lineage | everything editorial. The knowledge graph lives here and nowhere else. |
| **Git** | `rulepack/versions/`, `corpus/regulatory/`, prompt and rule code | legal text and deterministic rules. Hash-pinned, and `prebuild` fails on drift. |
| **Pinecone** | vectors | nothing. Every index is derived and rebuildable from the two above. |

Two consequences worth stating plainly.

**No text or provenance may exist only in Pinecone.** If deleting an index
would lose something, that something was stored in the wrong place.

**The regulatory lane is separate on purpose.** Verified statutory text is
version-controlled and ingested into its own index; the Compliance Checker
reads the pinned rule pack and never a vector. Commentary and guidance about
the law may be captured as a `knowledgeSource` — labelled `commentary` or
`regulator_guidance`, never confused with the statute — and may be indexed into
general editorial memory once reviewed. The rules are in `CLAUDE.md` under
"Regulatory retrieval corpus" and "AI Act rule pack"; nothing in this wave
touches either, and nothing in a later wave may blur them.

## The record types

| Type | Is | New in this wave |
|---|---|---|
| `knowledgeSource` | evidence somebody else authored | no — extended |
| `knowledgeItem` | thinking SiliconStone or a model produced | yes |
| `researchRun` | one durable Exa or Inoreader investigation | yes |
| `knowledgeTopic` | internal grouping, distinct from public categories | yes |
| `article` | unchanged, plus optional internal lineage | no — extended |
| `knowledgeCandidate` | **legacy.** Nothing writes one; the migration reads them | no |

The source/item split is the one distinction to hold on to: evidence and
synthesis are different kinds of thing, and collapsing them makes "what did we
establish, and what did we infer?" unanswerable.

### Statuses

`reviewStatus` — `inbox | ready | rejected | superseded`. **Everything enters at
`inbox`.** There is no parameter, adapter or migration flag that creates a
record as `ready`, including for content a model wrote. Only `ready` records are
eligible for editorial memory.

`extractionState.status` — `not_required | queued | processing | succeeded |
failed`. Whether text had to be fetched. Independent of the review verdict: a
failed fetch is not a rejection.

`indexState.status` — `not_eligible | pending | indexed | error`, plus a
canonical hash and an indexed hash. Drift is `canonicalHash !== indexedHash`.

`researchRun.status` — `queued | running | completed | failed | cancelled`, and
`reuseStatus` — `pending | approved | excluded`. A completed run is not
automatically reusable.

The permitted moves between all of these are in `src/lib/knowledge/transitions.ts`,
as data with a test over every state pair. Terminal states do not drift back
into active ones except through an edge explicitly marked `repair`.

## Legacy compatibility

Nothing has been backfilled and no legacy field has been rewritten.

- **Every new field is optional.** An existing document validates unchanged.
- **`knowledgeSource.status` is still written and still read.** Read it with
  `effectiveSourceReviewStatus()` in `src/lib/knowledge/types.ts`, which prefers
  `reviewStatus` where it exists and otherwise maps legacy `pending → inbox` and
  `processed → ready`. Legacy `error` maps to **`requires_review`**, not
  `rejected`: it described a capture or extraction failure, never an editorial
  verdict, and treating it as a rejection would discard records nobody judged.
- **Studio lists ask both questions.** A filter on `reviewStatus` alone would
  empty the inbox of every record captured before this wave, which is most of
  them. See the filters at the top of `src/sanity/structure.ts`.
- **`extractedText` is still required** — except where extraction is queued,
  processing or failed, which are states that did not exist before. The rule was
  only ever loosened.
- **`topicTags` (strings) and `topics` (references) coexist.** So do the legacy
  `knowledgeCandidate` records and their `knowledgeItem` copies.

## Feature controls

Four, all server-side, all default **off**, and nothing reads them yet. Only
`true` or `1` turns one on; anything else — including a typo — reads as off.

```text
KNOWLEDGE_V2_UI_ENABLED            the rebuilt /knowledge cockpit (wave 4)
KNOWLEDGE_AUTO_INDEX_ENABLED       event-driven Pinecone indexing (wave 3)
KNOWLEDGE_DRAFT_RETRIEVAL_ENABLED  the editorial-memory retrieval lane (wave 3)
KNOWLEDGE_EXTERNAL_WRITES_ENABLED  the universal ingestion endpoint (wave 4)
```

Deliberately **not** `NEXT_PUBLIC_`: they gate server writes, indexing and
retrieval, and a `NEXT_PUBLIC_` name is inlined into the browser bundle.
`src/lib/knowledge/features.ts`, asserted by both a unit test and
`npm run test:knowledge-inbox`.

## The domain service

`src/lib/knowledge/` — one place composes validation, normalisation, identity,
deduplication, reference resolution, transition guards and Sanity access.
Routes, the research pipeline, migrations and the eventual MCP adapter call in;
none of them re-implements any of it.

| File | Holds |
|---|---|
| `types.ts` | every controlled value, as `as const` arrays with derived unions |
| `transitions.ts` | which state moves are allowed, as data |
| `features.ts` | the four controls above |
| `normalize.ts` | canonical URL and text normal forms |
| `hash.ts` | `sha256:<hex>` content hashing |
| `ids.ts` | server-generated and deterministic IDs, references, review URLs |
| `schema.ts` | explicit input parsers returning typed errors |
| `repository.ts` | parameterised Sanity queries and writes, client injected |
| `service.ts` | the facade: capture, run lifecycle, review transitions |
| `sanity-client.ts` | the only file here that imports `server-only` |

Deduplication runs four probes in a fixed precedence — idempotency key, then
external reference, then canonical URL, then content hash — and **reports a
conflict rather than choosing** when they disagree or one matches several
documents. A duplicate returns the existing record; it never overwrites it.

Indexing and extraction are represented as *intents* on the result and are
never executed. That seam is visible now and cannot start working by accident.

No validation dependency was added. The external-ingestion wave, which is the
one that has to survive untrusted input, gets to make that choice.

## The candidate migration

```bash
npm run knowledge:migrate-candidates              # dry run — the default
npm run knowledge:migrate-candidates -- --verbose # dry run, printing each document
npm run knowledge:migrate-candidates -- --write   # writes. Not run in this wave.
```

Copies each legacy `knowledgeCandidate` into a `knowledgeItem` with
`kind: synthesis` and `reviewStatus: inbox`.

- **Copy, never move.** The candidate is left exactly as it is. Retiring the
  legacy records is the cutover wave's job, after the copies are verified.
- **Deterministic IDs**, derived from the candidate's own identity, so a rerun
  proposes an identical plan and a second write updates rather than duplicates.
- **The legacy identity and `createdAt` survive** on the copy.
- **Unresolvable references are reported, not guessed.** A candidate's
  `sourceIds` are strings; where one matches exactly one source it becomes a
  reference, where it matches none or several it is reported and left out.
- **Rejected candidates are skipped.** They were reviewed and declined; copying
  them would ask the same question twice.
- Reading needs `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`
  and `SANITY_API_WRITE_TOKEN`. Missing configuration exits non-zero rather
  than reporting an empty plan.

## What this wave deliberately did not do

Everything below is a later wave, and none of it should be inferred from the
schemas existing:

- persisting live Exa or Inoreader research;
- any change to draft retrieval or the generation prompts;
- automatic Pinecone indexing, webhooks, or any vector write;
- the universal external ingestion endpoint, or URL/PDF extraction;
- a redesigned `/knowledge`;
- an MCP or plugin server;
- a live migration, or the deletion or renaming of any legacy record or field;
- any change to production Sanity, Pinecone, Railway or Vercel configuration.

## Related

- `siliconstone-knowledge-llm-master-spec.md` — the programme, and why.
- `CLAUDE.md` — the regulatory corpus and rule-pack rules this must not blur,
  and the draft-time editorial guards (quotation audit, fact-check, publish
  preflight) that this wave leaves untouched.
