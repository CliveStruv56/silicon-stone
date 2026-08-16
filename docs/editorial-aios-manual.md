# Editorial AIOS User Manual

This document explains the full workflow for the editorial knowledge system:

- the `/knowledge` page in the website
- the embedded Sanity Studio inbox
- what is stored in each place

> **Status (August 2026): the local Obsidian vault step is retired and its code
> is deleted.** There is no local review store, no `npm run knowledge:pull`, and
> no `AIOS_VAULT_PATH`. Sanity is now both the operational queue and the reviewed
> store. See `editorial-aios-inbox.md` for exactly what was removed.

The system is additive. It does not replace the existing article pipeline, draft flow, publishing flow, or article-level semantic search.

## The Short Version

Use the system in this order:

1. Capture a source in `/knowledge`.
2. Triage it in the Sanity Studio inbox.
3. Save a useful synthesis as a knowledge candidate in Sanity.

The website captures inputs. Sanity stores inbox records, candidates, and the reviewed synthesis. Pinecone stores evidence chunks and article search vectors.

## What Lives Where

### Website

The website hosts the `/knowledge` page and the embedded Sanity Studio.

Use it to:

- capture a new source
- inspect the source inbox
- search deep evidence
- save a knowledge candidate
- open the existing article search
- open Studio for structured review

It does not write anywhere outside Sanity and Pinecone.

### Sanity

Sanity stores the live inbox and candidate records.

Two new document types matter here:

- `knowledgeSource`: a source that has been captured but not yet filed locally
- `knowledgeCandidate`: a useful synthesis worth keeping after review

Sanity is both the operational queue and — since the vault was retired — the reviewed store.

### Local Vault (retired)

This system was originally designed around a local Obsidian vault as the durable
knowledge store, with `Sources/*.md` manifests and `Wiki/*.md` synthesis pages
filed by hand. **That vault is no longer used.** Nothing files locally any more;
treat any surviving `AIOS_VAULT_PATH` wiring as dead configuration.

### Pinecone

Pinecone is used for retrieval.

There are three separate uses, one index each — they never share storage:

- `PINECONE_INDEX_NAME` (`silicon-and-stone-articles`) — article-level semantic
  search, related articles, and prior-coverage RAG
- `PINECONE_EVIDENCE_INDEX_NAME` (`silicon-and-stone-evidence`) — chunk-level
  source retrieval
- `PINECONE_REGULATORY_INDEX_NAME` (`silicon-and-stone-regulatory`) — primary
  statutory text quoted at `/create`. Editorial only: it is never an authority
  for anything the Compliance Checker renders

Pinecone is not the final knowledge store. It is a search layer.

## The `/knowledge` Page

The `/knowledge` page is the main operational screen for the new system.

It has five parts.

### 1. Capture Source

Use this section when you have a URL, PDF, image, or pasted note that should enter the knowledge workflow.

Fill the fields like this:

- `sourceId`: a stable lower-case kebab-case ID
- `title`: the source title
- `sourceType`: `url`, `pdf`, `image`, `note`, or `published_article`
- `brandTags`: one or more of `silicon-and-stone`, `waymark-path`, `shared`
- `topicTags`: short topic labels such as `ai-sovereignty`, `governance`, `agentic-ai`
- `originalUrl`: the canonical source URL, if there is one
- file upload: use this for the original PDF or image, if applicable
- `extractedText`: pasted source text or extracted text from the file

Example:

```text
sourceId: mittr-2026-05-14-ai-sovereignty
title: Establishing AI and data sovereignty in the age of autonomous systems
sourceType: url
brandTags: silicon-and-stone
topicTags: ai-sovereignty, data-sovereignty, agentic-ai, enterprise-ai
originalUrl: https://www.technologyreview.com/2026/05/14/1137168/establishing-ai-and-data-sovereignty-in-the-age-of-autonomous-systems/
extractedText: paste the article text here
```

What happens after you submit:

- Sanity gets a `knowledgeSource` record with `status: pending`
- the record appears in the source inbox
- the source is ready for review in the Studio inbox

### 2. Source Inbox

This section shows captured sources waiting for review.

Use it to check:

- status
- source title
- source type
- brand tags
- capture date
- original URL

This list is informational. It does not file anything by itself.

### 3. Deep Evidence Search

This section searches the separate evidence index.

Use it when you want cited source chunks rather than article-level search results.

Example query:

```text
AI sovereignty governance controls
```

What you get back:

- source ID
- locator
- chunk text
- source title
- brand tags

Use this when you need evidence for a synthesis or want to check whether a claim is actually supported.

### 4. Save Knowledge Candidate

This section stores a useful synthesis in Sanity as a candidate.

Use it when you have a conclusion that is worth keeping, but is not yet ready to become a reviewed wiki page.

Example:

```text
Title: Selective sovereignty is the practical operating model

Proposed synthesis:
Enterprises do not need to isolate every system to achieve meaningful AI sovereignty. The stronger pattern is selective sovereignty: apply strict controls to sensitive data, regulated workflows, and autonomous agent actions; use lighter controls for low-risk workloads; and define explicit monitoring, audit, and decision rights for systems that can act on the business's behalf.

Source IDs:
mit-technology-review-insights-edb-2026-05-ai-data-sovereignty-report, gov-uk-2026-05-25-uk-australia-ai-security-pact

Brand tags:
silicon-and-stone, shared
```

What happens after you save:

- Sanity gets a `knowledgeCandidate` record with `status: pending`
- the candidate can be reviewed later
- nothing is written into `Wiki/*.md` automatically

### 5. Published Article Search

This is the existing semantic search for published articles.

It remains unchanged.

It is separate from deep evidence search.

## The Embedded Studio

The embedded Sanity Studio is the structured review interface.

Use it to:

- inspect `knowledgeSource` records
- inspect `knowledgeCandidate` records
- review pending inbox items
- confirm what is sitting in Sanity before it is worked on

Studio is where review happens.
Studio is the inbox and editing surface for Sanity records.

The main Studio section for this workflow is **Knowledge Inbox**.

It contains:

- Pending Sources
- All Sources
- Candidates Awaiting Filing
- All Candidates

## The Review Workflow

Review happens in the embedded Sanity Studio, under **Knowledge Inbox**.

1. A captured source arrives with `status: pending`.
2. Read it, check the extracted text and locators, and decide whether it earns a place.
3. If it does, write the synthesis as a `knowledgeCandidate` and set the source to `processed`.
4. If it does not, set the source to `error` with a note, or leave it pending.

> **Retired (August 2026).** This step used to happen in a local Obsidian vault:
> `npm run knowledge:pull` wrote a `Sources/<id>.md` manifest, you updated a
> `Wiki/*.md` page by hand, then confirmed the filing back to Sanity. The vault is
> gone and so is that script — there is no local filing step, no manifest, and
> nothing to commit. Existing `manifestId` values on old records are historical.


## Example End-to-End Flow

Here is the full loop in plain language.

1. You find a good article or report.
2. You open `/knowledge`.
3. You capture the source with title, URL, tags, and extracted text.
4. The source appears in Sanity as pending.
5. You open Studio under **Knowledge Inbox** and read it.
6. You write the synthesis as a knowledge candidate, with claim-level citations.
7. You set the source to `processed`.

## What You Should Expect to Store

### In Sanity

- captured sources waiting for review
- reviewed candidate syntheses

### In Pinecone

- searchable evidence chunks
- existing article search vectors

## What Not to Do

- Do not treat `/knowledge` as the final knowledge store — it is a capture surface.
- Do not skip review; a captured source is not reviewed knowledge.
- Do not assume a candidate is sound just because it was saved.
- Do not use a candidate synthesis as a substitute for source evidence.

## When to Use Which Tool

- Use `/knowledge` when capturing or searching.
- Use Studio when reviewing inbox records and writing candidates.

## Practical Rule

If the content is still being checked, it is a pending source in Sanity.

If it has been reviewed and is meant to last, it is a candidate in Sanity.

If it is being searched, it may also live in Pinecone.

