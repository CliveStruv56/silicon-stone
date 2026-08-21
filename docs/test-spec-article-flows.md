# Test specification — the article flows, end to end

A set of tasks to work through in order. Each one is self-contained: what it
proves, what it costs, what to do, and what you should see.

**Written 20 August 2026, current at 21 August**, against commit `ce037c64`. Companion to
[`operator-manual.md`](operator-manual.md) — the manual says how the system
works, this says how to prove it still does.

---

## Before you start

### The five ways an article can exist

There are **four creation paths** and one capture path, and they are not equal.
The spec tests all five because the differences are exactly where things break.

| # | Path | Research | Voice edit | Quotation audit | Auto fact-check | Provenance |
|---|---|---|---|---|---|---|
| A | **`/create`** | ✅ Exa + prior coverage + statute | ✅ | ✅ | Signal & Deep Dive only | ✅ snapshots |
| B | **`/import`** | ❌ none | ✅ | runs, but always `UNCOVERED` | ✅ **every format** | ❌ empty |
| C | **⌨ `ss-draft-local`** | ✅ same as A | ✅ (you run it) | ✅ | ❌ — run it from Studio | ✅ snapshots |
| D | **By hand in Studio** | ❌ | ❌ | ❌ | ❌ | ❌ |
| E | **MCP capture** | — | — | — | — | produces a *knowledge record*, **not an article** |

### Two things to understand before testing

**Nothing publishes itself.** Every path above produces an unpublished Sanity
draft. Publishing is always a separate act by you in Studio. That is why the
Pinecone question has a simple answer (Task 9).

**E does not become an article by itself.** An idea captured from Claude lands in
a review inbox and stays there. There is no "promote to article" — you read it
and retype the substance into `/create`. Task 8 tests what actually exists, not
what the field names imply.

### Cost per task

Rough, and worth knowing before you re-run something.

| Task | Cost |
|---|---|
| 1 Preflight | free |
| 2 Research Only | 1 Exa search + 1 small Claude call |
| 3 Pulse | + 1 draft + 3 support passes |
| 4 Signal | as Pulse, plus a fact-check (~12 claims × Exa) |
| 5 Deep Dive | **the expensive one** — agentic research (minutes), 8k output tokens, fact-check up to 18 claims |
| 6 Import | 4 Claude passes, no search |
| 7 Hand-made | free |
| 8 ⌨ Claude Code draft | Max plan; only Exa + 1 embedding + Pinecone cost money |
| 9 MCP capture | free |
| 10 Publish + chain | 1 embedding |
| 11 Teardown | free |

If credits are tight, run 1, 2, 3, 6, 7, 9, 10, 11 and skip the Deep Dive.

### Ground rules

- **Prefix every test title with `TEST — `.** The teardown script finds them that
  way. Do not skip this.
- **Task 10 publishes to the live site.** It is briefly real: in the sitemap, the
  RSS feed and the vector index. Do it when you can complete the teardown in the
  same sitting — or do it on an article you genuinely want published.
- Record what you see. Where a step says *expected*, a difference is the finding.

---

## Task 1 — Preflight

**Proves:** the environment can do any of this at all.

1. `npm run prebuild` — should end `operator-manual checks passed`.
2. `npx vitest run` — all green.
3. `npm run draft:local -- selftest` — prints `imports ok`.
4. `npm run articles:verify-index` — note the **record count**. You will compare
   against it in Task 10.
5. Count published articles, for the same comparison:
   ```
   npx sanity documents query 'count(*[_type=="article" && !(_id in path("drafts.**")) && defined(slug.current)])'
   ```
6. Sign in at `/login`. Confirm you land on `/admin`.

**Expected:** steps 4 and 5 agree. If the index count is lower, some published
article is not indexed — see Task 9's note on the webhook, which is the usual
cause.

---

## Task 2 — Research Only

**Proves:** the research half works, independently of drafting.

1. `/create` → format **Research Only** → pick a persona.
2. Topic: something current and specific, e.g.
   *"EU AI Act Article 6 classification for credit scoring"*.
3. Leave the brief empty. Press **Launch Agent**.

**Expected:**
- Button reads *"Gathering Intel…"*, then a panel headed **"Intelligence
  Gathered — N sources analysed"**.
- **Forensic Summary**, **Contextual Hooks** (pill chips) and a **Source Index**
  of clickable cards.
- **No generate button** — it is hidden for this format.
- Nothing is written to Sanity. Check: no new draft appears in Studio.

**Then repeat with a brief**, e.g. *"Focus on deployers, not providers."*
Confirm the summary and hooks shift accordingly — this is the field that steers
both research and drafting, and it is the highest-leverage input on the page.

**If it fails:** you get a browser alert *"Failed to gather intelligence"* plus
the real reason. Read the reason; see manual §12.

---

## Task 3 — Pulse via `/create`

**Proves:** path A end to end, cheapest format.

1. `/create` → **Pulse** → persona → topic → **Launch Agent**.
2. When the panel appears, press **Generate Pulse**. It reads *"Writing Draft…"*.
3. You are taken to the Studio article list. Open the new draft.
4. **Rename the title to start `TEST — `.**

**Expected in Studio:**

| Check | Expected |
|---|---|
| Document state | **Draft** (no publish date) |
| Body length | ~100–140 words. *Not* 600 — that is the tier, not the format |
| Content Type | **Signal** — Pulse and Signal share it |
| Intelligence Tier | **Pulse**, forced |
| Voice Edit Notes (Provenance) | Populated, with a "⚠ Author specifics needed" section if any placeholders were left |
| Citation Snapshots (Provenance) | Populated with the research sources |
| Sources / Citations (Content) | **Empty**, with an **"Add N from research"** button |
| Fact Check tab | **Empty** — Pulse is not auto-checked |
| Categories | Assigned by the metadata pass |

5. Press **"Add N from research"**. Confirm the sources appear in the Sources
   list and the button count drops to zero. Delete one; confirm the button
   offers it again.
6. If there are `[AUTHOR: …]` placeholders, leave one in place for Task 7.

---

## Task 4 — Signal (the Brief) via `/create`

**Proves:** path A with the auto fact-check.

Same as Task 3, format **Signal**. Prefix the title `TEST — `.

**Expected, in addition to Task 3:**
- Body ~800–1,200 words.
- Intelligence Tier chosen by the model (likely *Briefing*).
- **A fact-check starts by itself.** Within a few minutes the document badge
  reads *Fact-check running*, then a verdict.
- The **Fact Check** tab fills with a summary, counts and per-claim rows.
- **Citations may appear**: the fact-check appends primary sources it verified.

**Then test the claim controls:**
1. Open a claim with a suggested revision.
2. Edit the revision text.
3. Press **"Insert into article"**. Confirm the body changes and the claim is
   marked applied.
4. If the paragraph had a link or bold text, confirm you get the warning that
   formatting was simplified — and check that paragraph. The link is flattened,
   not restyled.
5. **Watch the badge count down** (since 21 August 2026). It reads
   *major issues (N to address)* and drops a grade as you apply the inaccurate
   ones. With every flagged claim addressed it reads **"N revisions applied"** —
   deliberately not *clean*, because inserting a revision verifies nothing.

**Watch for:** the badge stuck on *Fact-check running*. Recovery is time-based —
wait 10 minutes, then run it again from the document menu.

---

## Task 5 — Deep Dive via `/create`

**Proves:** the agentic research path and the audit-only voice pass. **This is
the expensive one.**

1. `/create` → **Deep Dive** → persona → topic → **Launch Agent**.
2. The button reads *"Researching (a few min)…"* and a note explains the agent
   runs for minutes. **Wait.** Do not refresh.
3. Generate, then prefix the title `TEST — `.

**Expected:**
- Research takes minutes, not seconds. The backend gives up at 10 minutes, your
  browser at 12 — so a genuine failure normally arrives as a clean error first.
- Body 3,000+ words. Content Type **Deep Dive**.
- **Voice Edit Notes read as an audit, not a rewrite.** Deep Dives are too long
  to rewrite economically, so the pass tells you what to fix and leaves the prose
  alone. This is the one format where you do the editing from the notes.
- **The author specifics are appended to the END of the body** (since 21 August
  2026), under a heading *⚠ Author specifics needed*, each written as an
  `[AUTHOR: …]` placeholder. The audit pass cannot drop a marker at the sentence
  that needs it, so it lists them where the guard can see them.
- **Press Publish: you should get "Not ready to publish"**, no "Publish anyway".
  Before this change a Deep Dive could not raise the blocker at all — the
  outstanding work lived only in the notes, which the preflight does not scan.
  Resolve each item in the prose where it belongs, delete its line, delete the
  heading, and the block clears.
- A fact-check starts automatically.

**Also test the limit:** start three Deep Dives within an hour. The fourth should
be refused with *"Too many deep research starts. Try again in N seconds."*
(Only do this if you can afford three runs — otherwise take it on trust.)

---

## Task 6 — Import an article written elsewhere

**Proves:** path B, the "I wrote it somewhere else" case.

1. Write ~400 words anywhere — or reuse something you already have. Include
   **one statutory-looking quotation**, e.g.
   *Article 6 provides that "high-risk AI systems shall be designed to allow
   effective human oversight."*
2. `/admin` → **Import**.
3. Persona, then format **Signal**.
4. Paste the text (or upload a `.docx` / `.md` / `.txt`).
5. Brief: *"Keep every figure exactly as written."*
6. Leave **"Fact-check the reworked draft"** ticked. Press **Rework & Save Draft**.

**Expected:**
- Button reads *"Reworking…"*, then a green **"Draft created"** panel with an
  **"Open in Sanity Studio"** button.
- A fact-check starts — **note that it runs even though this is not gated by
  format the way `/create` is.**
- In Studio: `source` = **Imported & Reworked**; **Original Source Material**
  holds your verbatim text.
- **Citation Snapshots empty** and **Quotation Audit shows `UNCOVERED`** (or is
  absent). This is correct and important: `/import` does no research, so there
  was no statutory text to check your quotation against. `UNCOVERED` is not a
  pass — verify the quotation yourself.

**Also test the refusals.** Two of the three are app-level panels; the first is
not, and that surprised the person who wrote this.
- Paste under 200 characters → a red panel: *"Provide the article — upload a file
  or paste at least a couple of paragraphs."*
- Upload a `.pdf` → a red panel: *"Unsupported file type. Upload a .docx, .md,
  .markdown, or .txt file."*
- Submit with no persona → **the browser refuses first**, with its own bubble
  reading *"Please select one of these options."* The persona radios are
  `required`, so the form never reaches the server action and its
  *"Select a target persona."* message is defence in depth you cannot see.
  Confirmed 21 August 2026.

---

## Task 7 — By hand in Studio, and the publish guard

**Proves:** path D, and — more importantly — the guard's limits.

**Part 1: the blocker fires where it should.**
1. Open the Task 3 Pulse draft, which still has an `[AUTHOR: …]` placeholder.
2. Press **Publish**.
3. **Expected:** a dialog headed **"Not ready to publish"**, the item badged
   **"Must fix"**, and **no "Publish anyway" button**. Only *"Back to the draft"*.
4. Open **Voice Edit Notes**, read the "⚠ Author specifics needed" list, replace
   the placeholder with real text.
5. Press Publish again. **Expected:** the dialog is now headed *"Publish this
   article?"*, with warnings only and **"Publish anyway"** available.
6. **Cancel.** Do not publish yet.

**Part 2: the blocker cannot fire at all.**
1. In Studio, press **Create** → **Article**.
2. Title: `TEST — hand-made article`. Add a slug, a category (required), and
   paste a couple of paragraphs into the body. **Include the literal text
   `[AUTHOR: something]` in the body.**
3. Press **Publish**.

**Expected — and this is the finding to internalise:** you get warnings ("No
fact-check has been run", "No sources listed", "No intelligence tier set")
**and the placeholder IS caught**, because the preflight scans the body
regardless of origin.

**But** now delete the placeholder and publish again: it goes through with no
voice edit, no quotation audit, no fact-check, no provenance and no `source`.
Nothing generated a placeholder for you, so on a real hand-written article the
blocker has nothing to find. **On this path the checks are yours.**

4. **Check `/intelligence`.** The article **will** be there — untiered, with no
   PULSE / BRIEFING / AUDIT badge, and invisible to the tier filter. Until
   21 August 2026 it was not: the listing required `defined(intelligenceTier)`,
   nothing on this path sets one, and no guard mentioned it, so a hand-made
   article could publish successfully, be live at `/analysis/<slug>`, be indexed
   in Pinecone and enter the sitemap while never appearing anywhere a reader
   browses. The feed no longer filters on the tier and the preflight warns when
   it is unset. **On production, check it a few seconds after load, not on
   first paint:** the same query lives in four places, and the Railway backend
   `/api/briefings` proxies to is the one the client refreshes from. An article
   that appears and then disappears means the two halves disagree — Vercel and
   Railway deploy independently. Categories remain required at error level; the tier is a
   warning, not a blocker — set it unless you mean the piece to sit outside the
   tiers.

5. **Unpublish it** from `/content` when done.

---

## Task 8 — ⌨ Draft in Claude Code (`ss-draft-local`)

**Proves:** path C, the Max-plan route.

In Claude Code, in the repo:

```
Use the ss-draft-local skill to draft a Signal locally on my Max plan
for the Compliance Clara persona.
Topic: [your topic]
Brief: [optional steer]
```

The skill runs: `research` → you synthesise → `draft-prompt` → you write →
`voice-prompt` → `metadata-prompt` → `save`.

**Expected:**
- `save` prints a draft id and a Studio link.
- In Studio: a normal draft, `source` = **AI-Generated**.
- **Quotation Audit is populated** — this path gets it as of 20 August 2026.
- **Citation Snapshots populated** — from `researchSources` at the **top level**
  of the payload. This is the one field whose home differs between steps: the
  research JSON nests the same array under `research.sources`, which is what the
  draft prompt reads. Following the template alone once wrote the draft with no
  provenance at all, silently (confirmed 21 August 2026: 0 snapshots following
  the template, 8 once the field was added). Fixed the same day — the Step 7
  template now carries `researchSources`, and `save` warns on stderr when it is
  absent. If you see that warning, the copy was missed.
- **No fact-check** — run it from the document menu.

**Test the failure mode that matters:** skip the `draft-prompt` step (go straight
to `save`). The quotation audit should report `UNCOVERED`, because the statutory
text it audits against is retrieved during `draft-prompt` and parked beside your
payload. Again: `UNCOVERED` is not a pass.

---

## Task 9 — Capture an idea from Claude

**Proves:** path E, and the honest limits of it.

**Part 1: capture.** In Claude (Claude Code, or any client with the MCP):

> Capture this as a knowledge item: an idea about [something], kind `idea`.

**Expected:**
- A confirmation with a **"Review it here"** link.
- **Follow the link.** It should open the record itself in Studio. (Before
  20 August 2026 it went to a page that ignored it.)
- The record is a **knowledgeItem**, review status **Inbox**, visible under
  **Knowledge → Inbox → Items Awaiting Review**.

**Part 2: capture a source.**

> Capture this URL as a source: [any article URL].

Then try it **wrong** — ask for a source with a title but no URL and no text.
**Expected:** a readable error — *"Provide a URL, the source text, or declare
that extraction is expected."* — not a crash. (The tool schema now declares the
rule, so Claude should usually get it right first time.)

**Part 3: review.** Open the item in Studio and use the document actions.
- From **Inbox** you should see exactly **Mark ready** and **Reject**.
- Press **Mark ready**. Confirm the status changes.
- Now the offered actions should be **Return to inbox** and **Reject**.
- Try typing in the document first: the actions should **grey out**, with a
  tooltip telling you to publish or discard your edits. The verdict is written
  to the published record, so a draft would hide it from you.

**Part 4 — the important negative test. How does an idea become an article?**

It does not, by itself. Confirm for yourself:
- There is no "promote to article" action anywhere.
- `/create` cannot be seeded from an item — it takes only a format in the URL.
- The `Intended Use → Article seed` dropdown value changes nothing.

**The actual workflow:** open the item, read it, and retype or paste the
substance into `/create`'s **Topic** and **Brief** boxes. The article will carry
no link back to the item; nothing writes that reference.

### The `kind` convention — yours to set

**Where you actually meet this.** `kind` is a *required* field on every capture,
and the tool description gives Claude no guidance beyond "what sort of thinking
this is". So **if you do not say which, Claude picks one** — and different
conversations will label the same sort of thing differently.

You see the result as the subtitle on every inbox row:

```
Some captured thought — idea · inbox · claude
Another one          — note · inbox · claude
```

That is `kind · reviewStatus · sourceSystem`, and it is the only thing
distinguishing one row from another apart from the title. With five records it
does not matter. With forty it is the difference between a queue you can triage
and a list you scroll past. There is also a **Kind** dropdown on the item in
Studio, so you can correct whatever Claude chose.

Two ways to make it reliable, and you only need one:

1. **Say it in the capture request** — "capture this as an idea", "capture this
   as an article foundation".
2. **Let Claude choose and fix it in Studio** when you review.

**No code branches on any of the nine values.** They are labels for your own
triage, so nothing breaks if you are inconsistent — the inbox just stops being
scannable. If you are never going to triage by kind, ignore this section
entirely; the fixed nine-value list looks like it means something enforced, and
it does not.

Proposed convention. Adopt it, amend it, but write it down somewhere and stick
to it:

| `kind` | Use it for | Test capture |
|---|---|---|
| `idea` | A thought worth developing. No evidence attached yet. "This could be an article." | ✅ Task 9 |
| `observation` | Something you noticed, tied to a moment. Not yet a claim. | |
| `conversation_extract` | A passage from a chat worth keeping verbatim. | ✅ |
| `article_foundation` | Enough thinking that you could start drafting from it. **The one you would paste into `/create`.** | ✅ |
| `outline` | A structure, not prose. | |
| `synthesis` | A conclusion drawn across several sources. Link the sources. | |
| `claim` | A specific assertion you may have to defend. Should carry sources. | |
| `question` | Something open, to answer later. | |
| `note` | Anything else. If you reach for this often, a kind is missing. | |

**The only operational distinction that matters** is `idea` (not ready) versus
`article_foundation` (ready to draft from). Everything else is about finding
things again.

**Capture three during Task 9** — one `idea`, one `conversation_extract`, one
`article_foundation` — and confirm they all land in the same inbox list and are
told apart only by the label under the title. That is the system working as
designed; the sorting is your discipline, not its.

> `Intended Use → Article seed` looks like it does the same job. It does not do
> any job — nothing reads it. If you want to mark something ready to draft from,
> `kind: article_foundation` is the label to use, and it is equally inert. Both
> are for your eyes.

**Also worth knowing:** a captured item is **not semantically searchable**.
`search_knowledge` is a literal word match, not a vector search. If you cannot
remember roughly what you wrote, you will not find it.

---

## Task 10 — Publish, and the Pinecone chain

**Proves:** the post-publish half — and answers "are all the paths integrated
with Pinecone?"

**The answer is yes, and for a simple reason: none of the creation paths
publish.** Indexing is triggered by the *publish event*, not by how the article
was made. So all four paths converge here.

1. Take the Task 4 Signal draft. Resolve any placeholders. Add a cover image
   with alt text. Confirm categories are set.
2. Press **Publish** and go through the dialog.
3. Wait ~10 seconds.

**Verify all three. Any one alone is insufficient.**

**(a) The index count went up by exactly one:**
```
npm run articles:verify-index
```
Compare against Task 1.

**(b) The article's own vector exists.** Get the id, then fetch it:
```
npx sanity documents query '*[_type=="article" && slug.current=="<slug>"]{_id}'
```
```
TSX_TSCONFIG_PATH=scripts/tsconfig.scripts.json npx tsx -e "
  import('dotenv').then(d=>d.config({path:'.env.local'}));
  import('@pinecone-database/pinecone').then(async ({Pinecone})=>{
    const idx = new Pinecone({apiKey:process.env.PINECONE_API_KEY})
      .index(process.env.PINECONE_INDEX_NAME);
    console.log(JSON.stringify((await idx.fetch(['<THE_SANITY_ID>'])).records, null, 2));
  });
"
```
The metadata's `slug` and `publishedAt` should be current.

**(c) Related articles were written back:**
```
npx sanity documents query '*[_type=="article" && slug.current=="<slug>"][0]{"related": relatedArticles[]->{title}}'
```

> **Why all three:** an empty `relatedArticles` is *also* the correct output when
> no other article scores above the 0.37 floor. On a small catalogue that is
> common. Checking only (c) cannot tell a working webhook from a dead one.

**(d) The publish audit ran.** Check the **Publish Audit** field on the Fact
Check tab. **Empty is the pass** — it is only written when something is wrong.
To prove it is actually running rather than silently absent, publish something
with a known warning (no citations) and confirm the field fills in; then fix it,
republish, and confirm it clears.

**(e) The push notification**, only if the article is **Audit** tier and VAPID
keys are configured. Nothing fires for other tiers. It fires **once per article
ever**, so a later edit will not re-notify — that is the intended behaviour, not
a failure.

4. Confirm the article is live at `/analysis/<slug>` and appears on
   `/intelligence`.

**⚠ The one thing most likely to be wrong:** the Sanity webhook that triggers all
of this **is configured in the Sanity dashboard, not in this repo**. There is no
checklist item for it and no repo-side probe. If (a) and (b) fail while the
article is definitely published, check Sanity → API → Webhooks and its delivery
log — that is the only place a failure surfaces.

**What is *not* in Pinecone, so do not go looking:**
- Captured **knowledge items** — not indexed at all, by design for now.
- Captured **sources** — they can reach the *evidence* index, but only after a
  human sets their status to `processed` **and** someone runs
  `npm run evidence:rebuild` by hand. It is as stale as the last rebuild.

---

## Task 11 — Teardown

**Proves:** nothing. Do it anyway.

```
npm run test:cleanup -- --dry-run     # list what would go
npm run test:cleanup                  # delete it
```

It finds articles and knowledge records whose title starts `TEST — `, unpublishes
anything published, deletes the documents, and removes their Pinecone vectors.

Then reconcile and confirm you are back where you started:
```
npm run articles:sync
npm run articles:verify-index
```

The count should match Task 1.

**By hand, if you prefer:** unpublish from `/content` first (which removes the
vector), then delete in Studio. Order matters — deleting a published document
without unpublishing leaves an orphan vector until the next `articles:sync`.

Also clear `.local-draft/` if you ran Task 8.

---

## What this spec does not cover

- The four tools (Compliance Checker, Supply Chain Mapper, Scenario Modeler,
  Policy Stress Test) — separate concern, own state doc.
- Distribution — largely not wired. See the manual's §1 table.
- The markdown sync (`npm run sync-content`). It now writes drafts only, and is
  covered by a unit test rather than a manual pass.

## Findings to record

Keep a note against each task. The ones worth flagging immediately:

- Any path producing a **published** document without you pressing Publish.
- A quotation audit reading `verified` where you know the quotation was invented.
- A fact-check stuck on `running` for more than 10 minutes after a retry.
- The index count not matching after Task 10 — that is the webhook.
