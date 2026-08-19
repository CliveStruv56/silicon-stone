# SiliconStone Knowledge System — Wave 0–1 Execution Brief

**Project:** `silicon-and-stone-web`  
**Prepared:** 2026-08-18  
**Baseline:** `9b727aeb15e409424eaaf68615a6799090e7894d`  
**Governing spec:** `siliconstone-knowledge-llm-master-spec.md`  
**Authorized scope:** Contracts, additive canonical schemas, Studio structure, knowledge-domain foundation, compatibility tests, and migration dry run only

## 1. Outcome

At the end of this wave, the repository has an additive, backward-compatible Sanity model for sources, derived knowledge, research runs, topics, and article lineage, plus a shared server-side domain layer that future adapters can call. Existing source/candidate/article workflows still work. No production data is migrated, no external endpoint is exposed, and no new content is added to Pinecone.

## 2. Hard boundaries

Do not implement future waves in this brief.

Specifically, do not:

- persist live Exa/Inoreader research yet;
- alter draft retrieval or prompts;
- add automatic Pinecone indexing/webhooks;
- build the universal external ingestion route;
- implement URL/PDF extraction;
- redesign `/knowledge`;
- build an MCP/plugin server;
- run a live Sanity migration or delete/rename legacy documents/fields;
- change production Sanity/Pinecone/Railway/Vercel configuration;
- deploy, push, create a pull request, or commit unless the user explicitly asks.

Preserve all current article generation, fact-check, quotation-audit, regulatory, auth, and publish-preflight behaviour.

## 3. Pre-build gate

### BASE-001 — Inspect and establish the baseline

**Read first:** `AGENTS.md`, `package.json`, `src/sanity/schemaTypes/`, `src/sanity/structure.ts`, `src/lib/sanity.ts`, `src/lib/knowledge-inbox.ts`, `src/app/api/knowledge/sources/route.ts`, `src/app/api/knowledge/candidates/route.ts`, relevant checks in `scripts/`.

**Actions:**

1. Check the working tree and preserve all pre-existing user changes.
2. Confirm the current commit/branch and compare the relevant files with the brief.
3. Install dependencies using the lockfile if absent.
4. Run and record:
   - `npm run check`;
   - `npm test`;
   - `npm run test:knowledge-inbox`;
   - `npm run test:evidence-index`;
   - `npm run build` if the environment supports required configuration.
5. If baseline failures exist, distinguish environment/configuration failures from code failures. Do not repair unrelated failures without authorization.

**Acceptance:** Baseline results are recorded before editing. Any material repository drift or blocking test failure is reported before the affected task continues.

## 4. Milestone A — Contracts and shared types

### FND-001 — Add knowledge constants and types

**Files:** new `src/lib/knowledge/types.ts`, optionally new `src/lib/knowledge/index.ts`

**Action:** Define typed constants/unions for:

- knowledge item kinds;
- knowledge item/review statuses;
- source extraction statuses;
- index statuses;
- research-run statuses and reuse statuses;
- trust/source classes needed by the schemas;
- source systems/origins;
- shared reference and index-state shapes.

Use `as const` arrays plus derived union types so runtime validation and TypeScript share one source. Avoid `any` and broad string types for controlled values.

**Acceptance:** Types compile; invalid enum values fail at compile time; no existing export changes break current code.

### FND-002 — Add explicit state-transition helpers

**Files:** new `src/lib/knowledge/transitions.ts`, new `src/lib/knowledge/transitions.test.ts`

**Action:** Implement pure transition guards for knowledge-item review, source review, research-run status, extraction status, and index status. Do not connect them to routes yet. Terminal states must not silently return to active states except through an explicit allowed repair/retry transition.

**Acceptance:** Tests cover valid progress, rejection/supersession, retry from error/failed states, and invalid backwards transitions.

### FND-003 — Add feature configuration without activating behaviour

**Files:** new `src/lib/knowledge/features.ts`, `.env.example`

**Action:** Add server-side feature readers for:

```text
KNOWLEDGE_V2_UI_ENABLED
KNOWLEDGE_AUTO_INDEX_ENABLED
KNOWLEDGE_DRAFT_RETRIEVAL_ENABLED
KNOWLEDGE_EXTERNAL_WRITES_ENABLED
```

All default to false. Do not wire them to future-wave behaviour. Ensure no secret values are exposed to client bundles.

**Acceptance:** Unit tests or a deterministic check prove absent/false values disable features and only explicit true enables them.

## 5. Milestone B — Additive Sanity schemas

Follow the record semantics in the master specification. Reuse schema components where that improves consistency, but do not over-abstract Sanity definitions.

### FND-004 — Add `knowledgeTopic`

**Files:** new `src/sanity/schemaTypes/knowledgeTopic.ts`

**Action:** Add title, slug, aliases, description, optional parent topic, and optional article-category mapping. Prevent a topic from selecting itself as its parent where practical.

**Acceptance:** Sanity schema validation succeeds; required title/slug rules exist; parent/category fields use real references.

### FND-005 — Add `knowledgeItem`

**Files:** new `src/sanity/schemaTypes/knowledgeItem.ts`

**Action:** Add the initial kinds and required concepts in the master spec. Use Sanity references for sources, topics, items, research runs, and downstream articles. Set initial review status to `inbox`. Model provenance separately from the body. Include index state but do not trigger indexing.

**Acceptance:** A valid idea/article foundation/conversation extract can be represented; AI-derived records cannot default to ready; lineage uses references rather than string IDs.

### FND-006 — Add `researchRun`

**Files:** new `src/sanity/schemaTypes/researchRun.ts`

**Action:** Model fast/deep/Inoreader run identity, query/brief, status, timestamps, provider/job data, result fields, canonical source references, retrieval snapshots, model/rule metadata, reuse status, retry/parent relationship, and resulting item/article references. Allow partial documents for running/failed jobs without requiring completed-result fields.

**Acceptance:** Queued, running, completed, failed, and cancelled examples validate; completed-only fields are conditionally validated where appropriate.

### FND-007 — Extend `knowledgeSource` compatibly

**Files:** `src/sanity/schemaTypes/knowledgeSource.ts`

**Action:** Add provenance/publisher/date/language, trust/source class, topic references, `reviewStatus`, extraction state, index state, external reference, canonical URL, capture identity, and supersession relationship. Keep current `sourceId`, `status`, `extractedText`, URL/asset, tags, hash, and legacy manifest fields intact.

Do not make new fields required for existing documents. Document the temporary mapping:

- `processed` → ready;
- `pending` → inbox;
- `error` → requires review/repair.

**Acceptance:** Existing source fixtures remain valid and editable; a new source can express review, extraction, and indexing independently.

### FND-008 — Extend `article` compatibly

**Files:** `src/sanity/schemaTypes/article.ts`

**Action:** Add optional research-run, knowledge-item, canonical source, and prior-article references plus optional citation/generation snapshots. Keep existing public citation display and current `source`/`sourceMaterial` behaviour intact. Mark internal provenance fields so public queries do not expose them accidentally.

**Acceptance:** Existing article documents validate/render unchanged; new lineage fields use references; no public query projection changes in this wave.

### FND-009 — Register schemas and Studio views

**Files:** `src/sanity/schemaTypes/index.ts`, `src/sanity/structure.ts`

**Action:** Register the new types. Extend the Knowledge area with Inbox, Ready, Sources, Research Runs, Topics, Index Errors, and legacy candidates. Keep legacy lists accessible and clearly labelled; do not remove them.

**Acceptance:** Studio compiles/boots; every new type is reachable; legacy candidates/sources remain reachable; filters use valid fields and account for legacy records where required.

## 6. Milestone C — Domain-service foundation

### FND-010 — Add canonical helpers

**Files:** new `src/lib/knowledge/ids.ts`, `src/lib/knowledge/normalize.ts`, `src/lib/knowledge/hash.ts`, tests alongside them

**Action:** Add server-only helpers for canonical document IDs, stable external/idempotency keys, canonical URL normalization, normalized-text hashing, and Sanity reference construction. Do not include secrets or client-side dependencies.

**Acceptance:** Deterministic inputs produce deterministic normalized values/hashes; URL normalization does not collapse materially different URLs without an explicit rule; tests cover fragments, casing, tracking parameters only where safely defined, Unicode text, and empty input.

### FND-011 — Add typed input parsers

**Files:** new `src/lib/knowledge/schema.ts`, new `src/lib/knowledge/schema.test.ts`

**Action:** Centralize explicit parsing/validation for source and knowledge-item capture inputs and internal research-run creation inputs. Use current project conventions; do not add a validation dependency in this wave. Return typed validation errors suitable for later route adapters.

**Acceptance:** Tests cover valid note/source/item inputs, invalid kind/status/URL, excessive/empty fields at reasonable domain limits, and unresolved relationship identifiers.

### FND-012 — Add deduplication and repository functions

**Files:** new `src/lib/knowledge/repository.ts`, tests with a mocked/injected Sanity client

**Action:** Encapsulate Sanity queries/writes for canonical documents. Add lookup primitives for idempotency key, source-system/external-ID pair, canonical URL, and content hash. Return explicit duplicate-match information. Do not mutate production data during tests.

**Acceptance:** Queries are parameterized; duplicate precedence is deterministic; tests cover zero, one, and conflicting multiple matches.

### FND-013 — Add the service facade

**Files:** new `src/lib/knowledge/service.ts`, new `src/lib/knowledge/service.test.ts`

**Action:** Compose validation, normalization, IDs, deduplication, references, repository calls, and transition guards behind typed functions. At minimum define functions for source capture, knowledge-item capture, research-run creation/update, and review transitions. Keep side effects injectable/testable. Indexing/extraction may be represented as future event intents but must not execute.

**Acceptance:** Tests cover successful creation, duplicate/idempotent response, invalid input, failed reference resolution, allowed/forbidden transition, and Sanity write failure. The return shape includes canonical ID, status, duplicate outcome, and future review URL.

### FND-014 — Route existing writes through the service without changing UX

**Files:** `src/app/api/knowledge/sources/route.ts`, `src/app/api/knowledge/candidates/route.ts`, `src/lib/knowledge-inbox.ts`, service modules

**Action:** Refactor only where the new service can preserve the current API contracts and document types. The source route may use shared validation/normalization/deduplication while still creating a legacy-compatible `knowledgeSource`. The candidate route must continue creating `knowledgeCandidate` until the later migration/cutover wave unless the current API response and workflow can be preserved exactly.

Do not change browser auth, response codes, form fields, or `/knowledge` UI in this wave.

**Acceptance:** Existing knowledge-inbox checks pass unchanged or are updated only to reflect equivalent centralized behaviour; current UI requests receive compatible responses; note the source route's current URL/file requirement rather than silently changing it before the capture wave.

## 7. Milestone D — Migration rehearsal and documentation

### FND-015 — Add a dry-run-first candidate migration

**Files:** new `scripts/migrate-knowledge-candidates.ts`, `package.json`, optional script helpers/tests

**Action:** Read legacy candidates and report the proposed `knowledgeItem(kind=synthesis)` output. Resolve string source IDs to references where unique; report missing/ambiguous IDs; preserve legacy candidate identity and timestamps; use deterministic replacement IDs; make reruns idempotent. Default to dry-run. Require an explicit flag for writes, but do not run that flag in this wave.

**Acceptance:** Dry run performs no mutations; output includes total candidates, convertible records, missing/ambiguous references, and would-create/would-update/unchanged counts; rerun produces the same plan.

### FND-016 — Add the foundation operations note

**Files:** new `docs/knowledge-system-foundation.md`, `.env.example`

**Action:** Document canonical stores, new record types/statuses, legacy compatibility, feature flags, migration dry-run command, and explicit future-wave boundaries. Link to existing regulatory/editorial assurance documentation instead of duplicating it.

**Acceptance:** A new developer can identify which store is authoritative, why regulatory data is separate, how legacy sources/candidates remain valid, and how to run the dry migration safely.

## 8. Final verification gate

Run, where supported:

```text
npm run check
npm test
npm run test:security
npm run test:knowledge-inbox
npm run test:evidence-index
npm run build
```

Also:

- run the migration in dry mode only;
- verify the working-tree diff contains no generated secrets/assets or production data;
- inspect public Sanity queries to confirm internal provenance was not accidentally exposed;
- confirm no Pinecone, Sanity production, Railway, Vercel, or Git remote writes occurred;
- compare final behaviour with the master spec and record deviations.

## 9. Wave definition of done

- [ ] Baseline results recorded.
- [ ] Shared types, transitions, and disabled feature controls exist.
- [ ] `knowledgeTopic`, `knowledgeItem`, and `researchRun` schemas are registered.
- [ ] `knowledgeSource` and `article` are extended additively.
- [ ] Studio exposes new and legacy views.
- [ ] Knowledge helpers, parsers, repository, and service facade are tested.
- [ ] Existing knowledge routes/UX remain compatible.
- [ ] Candidate migration dry run is deterministic and non-mutating.
- [ ] Foundation documentation exists.
- [ ] Relevant checks pass or every pre-existing/environmental failure is documented.
- [ ] No future-wave feature or remote/production change was made.

## 10. Required handoff

At completion, report:

1. files added/changed and the purpose of each group;
2. schema decisions and any deviation from the master spec;
3. baseline and final test/build results;
4. migration dry-run totals and unresolved references, if credentials/data access were available;
5. confirmation that no live migration/deploy/remote config change occurred;
6. known risks or questions that must shape the Wave 2 brief;
7. a concise suggested Wave 2 starting contract, but no Wave 2 implementation.

