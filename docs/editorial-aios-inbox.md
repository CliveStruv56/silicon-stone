# Editorial AIOS Inbox

The AIOS inbox is additive. It does not change the existing `article` schema,
draft-generation path, publishing workflow, or article-level Pinecone index.

For the full user-facing walkthrough, see [Editorial AIOS User Manual](./editorial-aios-manual.md).

## Sanity Documents

- `knowledgeSource`: captured originals and extracted text awaiting reviewed
  local filing.
- `knowledgeCandidate`: portal-generated synthesis awaiting reviewed local
  filing.

Both appear in the embedded Sanity Studio under **Knowledge Inbox**.

## Local Vault Workflow (retired)

This document previously described a command-line loop that pulled each pending
`knowledgeSource` out of Sanity, wrote a `Sources/<source-id>.md` manifest into a
local Obsidian vault at `AIOS_VAULT_PATH`, and patched the record back to
`processed` once you confirmed the local filing.

**That workflow is retired (August 2026) — the author no longer keeps an Obsidian
vault.** Review happens in the Sanity Studio inbox instead; there is no local
filing step and nothing to commit.

The `npm run knowledge:pull` script and the `AIOS_VAULT_PATH` env var still exist
in the codebase (`scripts/pull-knowledge-source.ts`) but are unused and
unsupported. Retire or repoint them before relying on them.

## Separate Pinecone Evidence Index

Set a second Pinecone index name in `.env.local`:

```text
PINECONE_EVIDENCE_INDEX_NAME=your-separate-evidence-index
```

The evidence index is separate from `PINECONE_INDEX_NAME`, which remains the
published-article semantic-search index used by `/knowledge`.

Preview a rebuild:

```bash
npm run evidence:rebuild:dry
```

After creating a Pinecone index with 1024 dimensions, rebuild it:

```bash
npm run evidence:rebuild
```

Evidence chunks use `text-embedding-3-small` with 1024 dimensions and
deterministic IDs:

```text
${sourceId}:chunk:${chunkIndex}
```

Each source replacement deletes all evidence chunks matching `sourceId`
before upserting the new deterministic chunk set. The rebuild indexes
processed `knowledgeSource` documents and published Sanity articles. The
existing article index and semantic search route are unchanged.
