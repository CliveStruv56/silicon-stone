# Editorial AIOS User Manual

This document explains the full workflow for the editorial knowledge system:

- the `/knowledge` page in the website
- the embedded Sanity Studio inbox
- what is stored in each place

> **Status (August 2026): the local Obsidian vault step is retired.** The author no
> longer keeps an Obsidian vault, so there is no local review store and no
> `npm run knowledge:pull` step in the workflow below. Sanity is now the only
> reviewed store. The `knowledge:pull` script and the `AIOS_VAULT_PATH` env var
> still exist in the codebase but are unused and unsupported — decide whether to
> retire or repoint them before relying on anything they do.

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

There are two separate uses:

- the existing article-level semantic search index
- the separate evidence index for chunk-level source retrieval

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

## The Local Vault Workflow

This is the step where reviewed knowledge is created.

### Step 1: Prepare the vault path

Set this in `.env.local`:

```text
AIOS_VAULT_PATH=/absolute/path/to/your/obsidian-vault
```

The command-line tool checks that the vault contains:

- `AIOS-SCHEMA.md`
- `Sources/`

before it writes anything.

### Step 2: Pull one pending source

Run:

```bash
npm run knowledge:pull
```

This does one thing:

- it finds the oldest pending `knowledgeSource`
- it writes a compact manifest into `Sources/<source-id>.md`
- it leaves the Sanity record as `pending`

The manifest contains the source metadata and review instructions.
It does not duplicate the full source text into the vault.

### Step 3: Review the vault file

Open the generated manifest in Obsidian and review the linked wiki page.

Typical review work:

- correct the source summary
- add or update claim-level citations
- create or update a `Wiki/*.md` page
- add related links
- append the log entry if needed

The goal is not to write a polished article.
The goal is to produce a compact reviewed knowledge note.

### Step 4: Mark the local manifest as processed

When the vault file has been reviewed, change:

```md
status: pending
```

to:

```md
status: processed
```

This is the local proof that the source has been reviewed.

### Step 5: Confirm the reviewed filing back to Sanity

Run:

```bash
npm run knowledge:pull -- --confirm-reviewed <source-id>
```

This updates the Sanity `knowledgeSource` record to `processed`.

It does not commit Git.
It does not push Git.
It only confirms that the local vault review is complete.

## What a Wiki Page Is

A `Wiki/*.md` page is a small reviewed knowledge note.

It is not:

- a published article
- a blog post
- a full report
- a transcript

It is:

- a durable synthesis
- grounded in source claims
- short enough to trust later
- linked to the sources that support it

Good wiki page types include:

- concept
- entity
- comparison
- synthesis

Example:

- source evidence says how sovereignty controls work
- candidate says the stronger pattern is selective sovereignty
- the wiki page stores that conclusion in a short, cited note

That is the synthesis function.

## How Commit and Push Fit In

Confirming a source is not the same as committing it.

There are three separate states:

### Reviewed locally

The vault file has been checked, edited, and marked `status: processed`.

### Confirmed in Sanity

`npm run knowledge:pull -- --confirm-reviewed <source-id>` has updated the Sanity inbox record.

### Committed to Git

You then commit and push the reviewed vault changes like any other repo update.

The normal order is:

1. review locally
2. confirm in Sanity
3. commit and push the vault

## Example End-to-End Flow

Here is the full loop in plain language.

1. You find a good article or report.
2. You open `/knowledge`.
3. You capture the source with title, URL, tags, and extracted text.
4. The source appears in Sanity as pending.
5. You run `npm run knowledge:pull`.
6. The command creates a compact manifest in `Sources/` in the vault.
7. You open the vault file in Obsidian.
8. You update or create the matching `Wiki/*.md` page.
9. You add claim-level citations and related links.
10. You change the manifest to `status: processed`.
11. You run `npm run knowledge:pull -- --confirm-reviewed <source-id>`.
12. You commit and push the reviewed vault changes.

## What You Should Expect to Store

### In Sanity

- captured sources waiting for review
- candidate syntheses waiting for local filing

### In the vault

- source manifests
- reviewed wiki pages
- log entries

### In Pinecone

- searchable evidence chunks
- existing article search vectors

## What Not to Do

- Do not treat `/knowledge` as the final knowledge store.
- Do not skip local review.
- Do not write directly into the vault from Studio.
- Do not assume a candidate is ready to file just because it was saved.
- Do not use a wiki page as a substitute for source evidence.

## When to Use Which Tool

- Use `/knowledge` when capturing or searching.
- Use Studio when checking Sanity inbox records.
- Use the vault when reviewing and filing durable knowledge.
- Use the command line when preparing or confirming the local review state.

## Practical Rule

If the content is still being checked, it belongs in Sanity.

If the content has been reviewed and is meant to last, it belongs in the vault.

If the content is being searched, it may also live in Pinecone.

