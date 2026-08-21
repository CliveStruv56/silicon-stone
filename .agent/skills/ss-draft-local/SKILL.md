---
name: ss-draft-local
description: >
  Generate a Silicon & Stone article draft locally in Claude Code on the user's
  Max plan instead of the website's paid Anthropic API, then save it as a draft
  in Sanity. Replicates the site's /create pipeline exactly (voice DNA, persona,
  Exa research, Pinecone RAG, voice edit, SEO metadata, Sanity write) by reusing
  the repo's own prompt builders — Claude Code performs the model steps so they
  bill against the Max subscription, not API credits. Trigger when the user says
  "draft locally", "generate a draft on my Max plan", "write a Silicon & Stone
  draft without API credits", "/ss-draft", "draft an article in Claude Code", or
  asks to produce a S&S article without using the website generator. NOT for
  editing an existing draft (use /voice-edit) and NOT the website button.
---

# ss-draft-local — local article generation on the Max plan

This mirrors the website's `/create` flow, but **you (Claude Code) are the model**
for every reasoning step, so the work bills against the user's Max subscription
instead of the paid API. A helper CLI handles only the non-model I/O by reusing
the exact `src/lib` functions the site uses, so output matches the site's voice
and structure.

CLI (run from repo root): `npm run draft:local -- <subcommand> [flags]`
Scratch dir for intermediate JSON: `.local-draft/` (gitignored — `mkdir -p` it).

**What hits paid APIs:** Exa (research), OpenAI embeddings + Pinecone (RAG),
the Sanity write token. All small. The four Claude steps (synthesis, draft,
voice edit, metadata) are done by you and cost nothing beyond the Max plan.

## Inputs to collect first

- **format** — one of `signal`, `deep_dive`, `pulse`, `guide`, `youtube`
  (matches the site; `research`-only is not a drafting format).
- **persona** — a Sanity persona *slug*. If unknown, list options:
  `npx sanity documents query '*[_type=="persona"]{ "slug": slug.current, role }'`
  (or via the Sanity MCP). Common slugs mirror the /create dropdown.
- **topic** — the primary topic line (the search seed).
- **brief** *(optional)* — free-text steer (angle, emphasis, what to include or
  avoid). Treated as authoritative author guidance, same as the site's Step-4 box.

Ask the user for any you don't have. Then `mkdir -p .local-draft`.

## Step 1 — Research (Exa, same source selection as the site)

```
npm run draft:local -- research --topic "<topic>"          # signal/pulse/guide/youtube
npm run draft:local -- research --topic "<topic>" --deep    # deep_dive (Exa Research Pro; slower, costs more)
```

Save the JSON it prints to `.local-draft/raw-research.json`. It contains
`{ topic, deep, sources: [{title,url,snippet,publishedDate?}], deepReport }`.

The `sources` are built by the same `exaToSources()` the website uses, so the
snippets lead with the search's own highlights and run to 1,200 characters, and
each carries its publication date where the search reported one. **Pass
`publishedDate` through** — the draft prompt renders it beside each source and
instructs on recency, and dropping it here means the local draft is written from
undated evidence while the site's is not.

## Step 2 — Synthesise (YOU are the model)

From `raw-research.json`, produce the research object the draft prompt expects.
For a deep dive, mine `deepReport` (it carries inline sources) as well as the
`sources` array. Write `.local-draft/research.json`:

```json
{
  "topic": "<topic>",
  "format": "<format>",
  "persona": "<persona-slug>",
  "brief": "<brief or omit>",
  "research": {
    "summary": "2–3 sentence forensic summary of the situation.",
    "sources": [ /* pass through, keeping publishedDate: {title,url,snippet,publishedDate?} */ ],
    "painPoints": ["specific ICP anxiety", "..."],
    "keywords": ["term", "..."],
    "deepReport": "<verbatim deepReport if present, else omit>"
  }
}
```

## Step 3 — Draft prompt (RAG + buildDraftPrompt)

```
npm run draft:local -- draft-prompt --in .local-draft/research.json
```

This runs the Pinecone "prior coverage" lookup and prints the **exact** site
draft prompt as `===SYSTEM===` / `===USER===` (brand voice DNA, business
profile, the full Sanity persona, research, prior coverage, deep report, brief).

## Step 4 — Write the draft (YOU are the model)

Follow that system+user prompt precisely and produce the delimiter output the
site parser expects, verbatim markers each on their own line:

```
===TITLE===
...
===EXCERPT===
...
===KEYWORDS===
comma, separated, keywords
===CONTENT===
<full markdown body>
```

Parse your own output; keep `title`, `excerpt`, and the markdown `content`.

## Step 5 — Voice edit (Pass-3)

Write `.local-draft/voice.json` = `{ "title": "...", "body": "<content>", "format": "<format>" }`, then:

```
npm run draft:local -- voice-prompt --in .local-draft/voice.json
```

It prints the mode on stderr (`rewrite` for most formats, `audit` for
`deep_dive`) and the system+user prompt. Follow it:
- **rewrite** → emit `===EDITED ARTICLE===` (new body) then `===EDIT SUMMARY===`.
- **audit** → keep the body unchanged; emit only `===EDIT SUMMARY===`.

Replace `body` with the edited version; keep the summary as `voiceEditNotes`.
(Equivalent alternative: the `/voice-edit` skill — but the printed prompt matches
the site's `runVoiceEditPass` exactly, so prefer it.)

## Step 6 — Metadata (Pass-2)

Write `.local-draft/meta.json` = `{ "title": "...", "body": "<edited body>", "persona": "<slug>", "format": "<format>" }`, then:

```
npm run draft:local -- metadata-prompt --in .local-draft/meta.json
```

It injects the live Sanity category list and all constraints. Follow it and
produce the metadata JSON object: `seoTitle` (≤60), `metaDescription` (≤160),
`stoneTruth` (≤160), `actionableInsights` (3–5), `categorySlugs` (1–2 from the
listed slugs only), `intelligenceTier` (`pulse`|`briefing`|`audit`), and
`methodologyPillars` (only the six valid matrix-cell slugs the prompt lists).
Honour every hard constraint exactly.

## Step 7 — Save to Sanity (draft)

Assemble `.local-draft/save.json` and write it:

```json
{
  "title": "...",
  "body": "<edited markdown body>",
  "excerpt": "<excerpt>",
  "format": "<format>",
  "persona": "<slug>",
  "seoTitle": "...",
  "metaDescription": "...",
  "stoneTruth": "...",
  "actionableInsights": ["..."],
  "categorySlugs": ["..."],
  "intelligenceTier": "...",
  "methodologyPillars": ["..."],
  "voiceEditNotes": "<edit summary>",
  "researchSources": [ /* copy research.research.sources verbatim: {title,url,snippet,publishedDate?} */ ]
}
```

**`researchSources` is top-level here, and it is not optional in practice.** It
is the same array you nested under `research.sources` at Step 2 — `save` reads
it at the top level, so following the shape of `research.json` writes the draft
with no `citationSnapshots` at all and says nothing about it. Copy the array
across. `save` warns on stderr if it is missing.

```
npm run draft:local -- save --in .local-draft/save.json
```

The CLI converts the markdown body to Portable Text and writes a **draft**
`article` document (it does not publish). Report the Studio link it prints so the
user can review and publish.

### What this path does NOT get

`save` writes to Sanity directly and skips `finalizeDraft`. One check the
website's `/create` runs does not happen here:

- **no automatic fact-check** — `/create` starts one for Signals and Deep Dives;
  this path does not.

Tell the user so, and suggest running **Run fact-check** from the Studio document
action once the draft lands. The publish guard still applies: an unresolved
`[AUTHOR: …]` placeholder blocks publishing wherever the draft came from.

**It DOES get the quotation audit** (since 2026-08-20). `auditQuotations` is
pure — no model call, no network — so `save` runs it against the statutory text
`draft-prompt` retrieved, which it parks in `regulatory-corpus.txt` beside the
payload. Skip the `draft-prompt` step and the audit has nothing to check
against and reports `UNCOVERED`, which is not a pass.

It also records the research sources on the article's internal
`citationSnapshots` when `save` is given `researchSources` (see Step 7 — the
field is top-level in `save.json`, not nested under `research`) — provenance
only, never the reader-facing Sources list.

## Notes / caveats

- Not byte-identical to the website: same context and prompts, but the inference
  runs through Claude Code (Opus-tier on the Max plan) rather than the site's
  Sonnet 4.6. Usually an upgrade in quality, not a literal reproduction.
- Single source of truth: the prompts come from `src/lib/prompts.ts` and the
  research/RAG/write from `src/lib/{exa,research,embeddings,pinecone,sanity}.ts`,
  so this stays in lockstep with the site automatically.
- `.local-draft/*.json` are scratch; clean up when done.
- Requires `.env.local` (EXA, OpenAI, Pinecone, `SANITY_API_WRITE_TOKEN`) — the
  same secrets the site uses.
