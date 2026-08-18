# SiliconStone Knowledge Documents — LLM Handoff Review

**Date:** 2026-08-18  
**Review mode:** B — Documented project, scoped to knowledge-system implementation readiness  
**Repository:** `https://github.com/CliveStruv56/silicon-stone`  
**Verified commit:** `9b727aeb15e409424eaaf68615a6799090e7894d`  

> This is a scoped review covering the knowledge architecture and implementation documents. It is not a new full security, dependency, accessibility, or launch review.

## Executive summary

The three existing documents are materially correct and remain aligned with the current repository. No architectural reversal is required: Sanity should be canonical, Pinecone should remain derived retrieval, Git should remain authoritative for regulatory corpora/rules, and a shared knowledge-domain service should sit beneath the admin UI and external integrations.

They should not, however, all be handed to an implementation agent as equal instructions. The architecture assessment is explanatory, while the next-phase brief and implementation plan duplicate the programme with different groupings (four internal waves versus seven delivery waves). An LLM can reconcile that, but it should not have to. A new master specification and bounded Wave 1 brief have therefore been produced as the execution source of truth.

**Overall health:** Healthy and implementation-ready after consolidation.

## 1. Verification basis

The remote repository was refreshed and `origin/main` exactly matches the reviewed commit. The review rechecked the following material claims against code:

- `knowledgeSource` currently requires a manually supplied `sourceId`, extracted text, content hash, and a URL/file; its review and extraction concerns are conflated in `status`.
- `knowledgeCandidate` stores `sourceIds` as strings and contains retired local-filing language.
- generated `ArticleData` does not carry research-run, knowledge-item, canonical source, prior-coverage, or generation-snapshot fields.
- the knowledge-source route deduplicates by `sourceId`, not canonical URL/content hash/idempotency key.
- the evidence rebuild includes processed sources and published articles, not approved derived knowledge or research runs.
- draft retrieval has article and regulatory lanes only.
- fast/deep research results are returned to browser state, and deep job state is transient.
- existing knowledge APIs use the browser admin cookie and do not provide a scoped machine identity.
- Sanity schema registration and Studio structure include `knowledgeSource` and `knowledgeCandidate`, but not the proposed new records.

The repository had no uncommitted changes before or after this review.

Automated checks could not be rerun in the review copy because dependencies are not installed (`tsc` and `tsx` are unavailable). This does not undermine the document/code comparison, but the implementation agent must install dependencies and establish a green baseline before editing.

## 2. Existing document verdicts

| Document | Accuracy | Recommended use |
|---|---|---|
| `siliconstone-knowledge-architecture-assessment.md` | Materially correct | Reference/rationale only. Give it to an agent only when it needs to revisit an architectural decision. |
| `siliconstone-knowledge-next-phase-brief.md` | Correct feature inventory | Superseded as a direct execution brief. Its 14 tasks are programme-level and several are too large for one safe coding pass. |
| `siliconstone-knowledge-implementation-plan.md` | Correct programme roadmap | Keep as the human roadmap and sequencing reference. Do not ask an agent to implement the entire document in one run. |

## 3. Issues corrected by the new execution pack

### A. Duplicate grouping

The phase brief groups the work into four waves; the implementation plan uses seven. The dependency order is consistent, but equal-status documents invite an agent to choose its own interpretation.

**Correction:** the new master specification is canonical. The programme uses seven waves, and only one current-wave brief is executable at a time.

### B. Transitional source statuses were underspecified

The desired model separates editorial review from extraction/indexing, while the current `knowledgeSource.status` mixes `pending`, `processed`, and `error`. The earlier documents did not lock how old records remain valid during migration.

**Correction:** retain legacy `status` during the additive transition; introduce `reviewStatus`, `extractionState`, and `indexState`; read through a compatibility mapping until backfill and cutover are verified.

### C. Agent scope was too broad

Both programme documents could be interpreted as authorization to implement schemas, research persistence, indexing, extraction, UI, MCP, migrations, and production cutover in one autonomous run.

**Correction:** the Wave 1 brief authorizes foundation work only and explicitly forbids production migrations, remote configuration changes, deployment, and removal of legacy records.

### D. Build-time integration details are time-sensitive

The stable architectural decision is a thin MCP/plugin adapter over the same domain service. Exact ChatGPT/Codex plugin packaging and authentication requirements can change.

**Correction:** the master spec fixes the boundary and security properties but requires current official OpenAI documentation to be checked when Wave 5 starts. No provisional MCP detail is allowed to distort the core data/API design.

### E. Estimates are directional

The 26–35 development-day estimate is reasonable for a tested, production-safe build but is not a commitment. Extraction edge cases, Sanity production data repair, and current plugin authentication requirements are the largest variance drivers.

## 4. Which documents to give Codex or Claude Code

### First implementation run

Give the agent exactly:

1. `siliconstone-knowledge-llm-master-spec.md`
2. `siliconstone-knowledge-wave-01-execution-brief.md`
3. `siliconstone-knowledge-agent-handoff-prompt.md` as the opening instruction

The agent should also have repository access. It must read the repository's `AGENTS.md`, `package.json`, and files named in the Wave 1 brief.

### Do not attach by default

- Do not attach the old next-phase brief; the new Wave 1 brief supersedes it for execution.
- Do not attach the architecture assessment unless the agent asks for decision rationale.
- Do not attach the full implementation plan unless the agent is reviewing dependencies or preparing the next wave.

Reducing redundant context makes it less likely that the agent will widen scope or treat a future-wave note as a current requirement.

### Subsequent runs

For each later wave, give the agent:

1. the same master specification;
2. a newly prepared current-wave execution brief;
3. the handoff/result from the preceding wave;
4. the standard agent handoff prompt, updated with the current wave number.

Do not ask an agent to infer the next wave solely from the programme plan. Produce/review the next bounded brief after the preceding wave's actual diff and test results are known.

## 5. Recommendation

Proceed with Wave 1 using the new execution pack. After Wave 1 is implemented and reviewed, generate the Wave 2 brief from the actual schema/service contracts that landed. This preserves the final architecture while keeping each coding run bounded, testable, and easy to audit.

