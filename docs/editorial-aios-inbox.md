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

## Local Vault Configuration

Set the absolute reviewed-vault path in `.env.local`:

```text
AIOS_VAULT_PATH=/absolute/path/to/your/obsidian-vault
```

The command validates that the directory contains `AIOS-SCHEMA.md` and
`Sources/` before writing.

## Process One Pending Source

Prepare one compact pending manifest:

```bash
npm run knowledge:pull
```

The command:

1. Fetches the oldest pending `knowledgeSource`.
2. Writes `Sources/<source-id>.md` in the reviewed local vault.
3. Leaves Sanity status as `pending`.
4. Does not copy extracted source text into the vault.

Process the source locally according to `AIOS-SCHEMA.md`: update the manifest,
compiled wiki, and append-only log, then review the diff.

After review, change the local manifest to `status: processed` and run:

```bash
npm run knowledge:pull -- --confirm-reviewed <source-id>
```

The confirmation command refuses to patch Sanity unless the reviewed local
manifest exists and says `status: processed`. It then stores the `manifestId`
and updates the Sanity inbox record to `processed`.

The portal has no Git commit or push path. Vault review remains local.

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
