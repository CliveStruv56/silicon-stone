# SiliconStone Central Knowledge System — LLM Master Specification

**Status:** Canonical implementation specification  
**Prepared:** 2026-08-18  
**Repository:** `https://github.com/CliveStruv56/silicon-stone`  
**Baseline:** `9b727aeb15e409424eaaf68615a6799090e7894d`  
**Project package:** `silicon-and-stone-web`  

## 1. Purpose and precedence

This document is the durable source of truth for implementing SiliconStone's central knowledge system. It describes the target, constraints, decisions, data boundaries, delivery waves, and system-wide acceptance criteria.

Use one separate current-wave execution brief for the work authorized in a coding session.

If instructions conflict, use this order:

1. The user's latest explicit instruction.
2. The current-wave execution brief.
3. This master specification.
4. The repository's current code and tests as evidence of existing behaviour.
5. The architecture assessment as historical rationale.

Do not silently resolve a material conflict. Preserve current behaviour, report the conflict, and stop the affected task until it is resolved.

## 2. Product outcome

The owner can save an idea, source, research result, conversation extract, or article foundation from ChatGPT, Codex, Claude, the SiliconStone admin UI, or another approved adapter in one action. The captured record enters a reviewable inbox, retains its provenance and relationships, can become an article draft, and—only after approval—can inform future research and drafting.

The lifecycle is:

```text
Capture → extract → classify → review → index → retrieve → research → draft → publish → reuse
```

The daily workflow must not require manual IDs, manual Pinecone operations, or routine switching to Sanity Studio. Studio remains available for advanced editing.

## 3. Architecture decisions that are already settled

1. **Sanity is the canonical knowledge and lineage store.** Originals, derived items, research runs, topics, review state, and article relationships live there.
2. **Pinecone is a derived retrieval layer.** No text or provenance may exist only in Pinecone.
3. **Git is authoritative for legal corpora and deterministic rules.** The EU AI Act, GDPR, other statutes, corpus manifests/hashes, compliance rule packs, voice rules, and prompt/rule code remain version-controlled.
4. **Regulatory retrieval remains isolated.** Verified statutory chunks never share an index or trust treatment with general editorial memory.
5. **Redis/Railway holds transient operational state only.** Completed research and durable results must be copied to Sanity before expiry.
6. **One knowledge-domain service owns canonical writes.** Admin routes, research persistence, REST ingestion, extraction completion, migrations, and MCP/plugin tools reuse it.
7. **Evidence and synthesis are distinct.** Externally authored/original material is a `knowledgeSource`; SiliconStone/AI-derived thinking is a `knowledgeItem`.
8. **No Supabase or second primary database is introduced.** This decision can be revisited only if SiliconStone becomes a multi-user transactional application.
9. **Existing publishing safety controls are preserved.** Fact-checking, quotation audit, publish preflight, regulatory rule packs, and current publication behaviour are out of scope for weakening or replacement.
10. **External capture is untrusted by default.** It enters `inbox` and is never automatically ready, approved, published, or eligible for draft retrieval.

## 4. Existing system summary

- Next.js 15 App Router, React 19, strict TypeScript, Tailwind 4.
- Sanity v4/Content Lake with embedded Studio.
- FastAPI service on Railway with Redis-backed jobs where configured.
- Exa standard and deep research; optional Inoreader ingestion.
- Anthropic/Claude drafting, voice, metadata, image-prompt, and fact-check flows.
- OpenAI `text-embedding-3-small` embeddings at 1,024 dimensions.
- Separate Pinecone article, evidence, and regulatory indexes.
- One-owner admin login using a signed HTTP-only cookie; separate Sanity Studio identity.

Important current gaps:

- `ResearchResult` is transient and not linked durably to articles.
- generated sources are not persisted through draft creation as canonical references/citations.
- `knowledgeCandidate` uses string source IDs and retired local-filing semantics.
- approved derived knowledge is not indexed or retrieved by drafting.
- knowledge indexing is a manual rebuild.
- source capture requires manual IDs and extracted text.
- browser-cookie APIs cannot support ChatGPT/Claude/Codex machine capture.

## 5. Canonical record contracts

The exact Sanity field syntax may evolve during implementation, but these semantics are required.

### 5.1 `knowledgeSource`

Represents original or externally authored evidence: web pages, PDFs, reports, transcripts, uploaded documents, manual source notes, and regulatory commentary/guidance.

Required concepts:

- server-generated canonical identity;
- title and source type;
- original URL and/or Sanity asset;
- extracted text and content hash;
- source system and external reference;
- publisher/author/publication date/language when known;
- trust tier/source class;
- topic references;
- editorial review state;
- extraction state and method/version;
- index state and hashes;
- capture identity/timestamp;
- supersession/replacement relationship when applicable.

Transitional compatibility:

- Retain the existing `sourceId` and legacy `status` fields during migration.
- Add `reviewStatus`: `inbox | ready | rejected | superseded`.
- Add `extractionState.status`: `not_required | queued | processing | succeeded | failed`.
- Add `indexState.status`: `not_eligible | pending | indexed | error`.
- Until backfill is complete, treat legacy `processed` as `ready`, legacy `pending` as `inbox`, and legacy `error` as an extraction/index problem requiring review. Do not rewrite or delete legacy values in the schema-only wave.

### 5.2 `knowledgeItem`

Represents derived thinking. Initial `kind` values are:

```text
idea
observation
conversation_extract
article_foundation
outline
synthesis
claim
question
note
```

Required concepts:

- title, summary, and full body;
- `status`: `inbox | ready | rejected | superseded`;
- source, topic, research-run, and derived-item references;
- originating system/conversation/external reference;
- capture identity/time and optional idempotency key/hash;
- intended use, sensitivity, confidence, and editor notes;
- downstream article references;
- index state and content hash.

AI-derived content may not enter `ready` automatically.

### 5.3 `researchRun`

Represents a durable Exa or Inoreader investigation.

Required concepts:

- query, brief, research mode, provider, and job identifier;
- `status`: `queued | running | completed | failed | cancelled`;
- timestamps and retry/parent relationship;
- result summary, keywords, selected sources, and deep report;
- canonical source references;
- retrieval snapshots for prior articles, editorial memory, and regulatory chunks, including IDs/scores/versions;
- model/provider/rule versions and available cost/usage data;
- resulting knowledge-item and article references;
- `reuseStatus`: `pending | approved | excluded` for any optional indexing of curated run output.

Raw completed research runs are not automatically indexed. Only reviewed reusable sections may become eligible.

### 5.4 `knowledgeTopic`

Required concepts:

- title, slug, aliases, and description;
- optional parent topic;
- optional mapping to a public article category;
- active/retired state if needed later.

Article categories remain a publishing/navigation taxonomy and are not replaced.

### 5.5 `article` additions

Required concepts:

- research-run reference;
- knowledge-item and canonical source references;
- prior-coverage article references;
- citation snapshots with title, URL, publisher/date/locator where known and optional source reference;
- generation snapshot with models/rules and retrieval record IDs used.

References provide current lineage; citation/generation snapshots preserve what was actually used at generation/publication time.

### 5.6 Shared index state

Where a document can be indexed, track:

- eligibility/status;
- canonical content hash;
- indexed content hash;
- indexed timestamp;
- embedding model and schema/index version;
- last error and retry metadata.

The canonical document must make stale or failed indexing observable.

## 6. Knowledge-domain service contract

Create a focused `src/lib/knowledge/` domain layer. Route handlers and adapters must not duplicate the following behaviour:

- typed parsing/validation;
- server-generated IDs;
- canonical URL normalization;
- content hashing;
- idempotency-key handling;
- duplicate detection by external reference, canonical URL, content hash, and idempotency key;
- creation/update of canonical documents;
- reference resolution;
- allowed state transitions;
- audit/capture identity;
- eligibility calculation;
- canonical response mapping.

Prefer existing project conventions. Do not add a new validation dependency merely for the schema wave; centralize explicit parsers and validators first. A later external-ingestion task may introduce a well-justified validation dependency if it materially improves untrusted-input safety.

## 7. Trust and retrieval policy

### General editorial memory

Eligible:

- reviewed/ready original sources;
- reviewed/ready knowledge items;
- explicitly approved reusable research summaries;
- published articles as already supported.

Ineligible:

- inbox/unreviewed content;
- rejected or superseded content;
- raw AI synthesis without human approval;
- failed/incomplete extraction;
- private or sensitive records whose policy forbids retrieval.

### Regulatory material

- Verified statute text is versioned in Git and ingested into the separate regulatory index.
- Commentary, guidance, articles, and reports may be captured as `knowledgeSource`, labelled accurately, and indexed only in general editorial memory after review.
- The compliance checker continues to use deterministic Git rule packs/exact checks, not vector commentary.

### Draft retrieval

Article, regulatory, and editorial-memory lanes fail independently. Each lane has its own filters, top-K, score floor, and token budget. Retrieval IDs/scores are retained in the research/generation snapshot. A weak or failed optional lane must degrade transparently rather than break draft generation.

## 8. External ingestion and extraction boundary

The eventual universal ingestion endpoint must:

- use a versioned envelope;
- accept typed knowledge items, conversation extracts, URL sources, pasted source text, and supported files;
- authenticate with a dedicated, revocable integration identity;
- apply strict size/type/URL validation and rate limits;
- support idempotency;
- return canonical ID, status, duplicate outcome, and review URL;
- never expose/reuse the Sanity token, admin password, or broad Railway backend key.

URL/file extraction is queued and recoverable. It must enforce content type/size/time/redirect limits and SSRF protection, preserve original supported assets in Sanity, and expose extraction failures in the inbox.

## 9. ChatGPT, Codex, and Claude integration boundary

The external conversation integration is a thin adapter over the same knowledge-domain service/API. It does not own data modelling, deduplication, indexing, or promotion logic.

Desired tools:

- `capture_knowledge`;
- `capture_source`;
- `search_knowledge`;
- `get_knowledge_item`;
- `list_knowledge_inbox`;
- confirmation-gated `promote_to_article_draft`.

Exact plugin/MCP packaging and authorization must be verified against current official product documentation when that wave starts. Preserve the service boundary so auth can evolve without rewriting knowledge storage.

## 10. Delivery waves

0. **Contracts and safeguards:** baseline, state/ingestion contracts, fixtures, feature controls, rollback assumptions.
1. **Canonical foundation:** additive schemas, Studio views, shared types/domain service, candidate migration dry run.
2. **Provenance:** durable research runs, canonical research sources, article lineage/citation snapshots.
3. **Editorial memory:** event-driven indexing, eligibility/reconciliation, independent draft retrieval lane.
4. **Frictionless capture:** universal endpoint, extraction jobs, `/knowledge` cockpit.
5. **Conversation integration:** thin ChatGPT/Codex/Claude-compatible MCP/plugin adapter.
6. **Cutover:** copy migration, backfill, feature-flag rollout, reconciliation, runbooks.

## 11. Migration and rollback rules

- All schema changes are additive first.
- `knowledgeCandidate` records are copied into `knowledgeItem`; they are not initially moved or deleted.
- Migration scripts must default to dry-run, be idempotent, and report unresolved relationships.
- Legacy source fields remain readable until backfill and consumer cutover are verified.
- Pinecone changes are rebuildable and must not alter the regulatory index.
- Feature flags independently control new UI, automatic indexing, editorial-memory retrieval, and external writes.
- No production migration, webhook/configuration change, deployment, or record deletion occurs without explicit approval in the active implementation session.

## 12. System-wide verification

Minimum required coverage across the programme:

- schema validation and backward compatibility;
- domain validation, idempotency, URL/hash duplication, and transition rules;
- research-run success/failure/retry persistence;
- canonical source/citation/lineage preservation;
- index eligibility, replace/delete, retry, and drift reconciliation;
- retrieval trust filtering and independent failure behaviour;
- API/plugin authentication, authorization, rate and size limits;
- extraction SSRF, redirect, MIME, and size controls;
- candidate migration and unresolved-reference reporting;
- end to end: conversation capture → inbox review → index → search → promote → linked draft.

Before each implementation wave:

1. install dependencies according to the lockfile;
2. establish a clean baseline with the relevant existing checks;
3. implement only the current wave;
4. run focused tests plus lint, type-check, test, and build as proportionate;
5. inspect the final diff and report any deviations.

## 13. Programme definition of done

- Sanity holds the durable knowledge/provenance graph.
- Existing candidates have verified replacement items without data loss.
- Research survives page reload and transient job expiry.
- Generated articles retain sources, citations, prior coverage, and retrieval snapshots.
- Approved knowledge enters Pinecone automatically; stale/ineligible vectors are removed.
- Drafting can use reviewed editorial memory without weakening regulatory isolation.
- URLs, text, and supported files can be captured with minimal manual work.
- Routine inbox work can be completed in `/knowledge` without Studio.
- ChatGPT/Codex/Claude can securely save/search through the shared adapter boundary.
- Regulatory corpora and rule packs remain authoritative in Git.
- Rebuild, rollback, credential rotation, and recovery are documented and tested.
