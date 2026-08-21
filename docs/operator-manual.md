# The Silicon & Stone operator's manual

How an article gets researched, drafted, edited, checked, published, and captured
back into knowledge. Written for the person running the publication.

**Verified against commit `ce037c64`, 21 August 2026.** Every claim here was
checked against the code on that date. Where something could not be checked by
reading code, it is listed in [Appendix D — What has not been verified](#appendix-d--what-has-not-been-verified).
If you are reading this months later, the header is the first thing to distrust.

This manual replaces `authoring-guide.md`, `article-generation-guide.md` and
`editorial-aios-manual.md`. It links to `admin-research-workflow.md` rather than
repeating it.

---

## Contents

1. [What is actually live](#1-what-is-actually-live)
2. [Getting in](#2-getting-in)
3. [Choosing a format](#3-choosing-a-format)
4. [Research](#4-research)
5. [Drafting](#5-drafting)
6. [What the machine did to your draft](#6-what-the-machine-did-to-your-draft)
7. [The three guards — all advisory](#7-the-three-guards--all-advisory)
8. [Finishing the article in Studio](#8-finishing-the-article-in-studio)
9. [Publishing](#9-publishing)
10. [After publishing](#10-after-publishing)
11. [Capturing knowledge from Claude](#11-capturing-knowledge-from-claude)
12. [When it goes wrong](#12-when-it-goes-wrong)
13. [The tools](#13-the-tools)

Appendices: [A — Reference tables](#appendix-a--reference-tables) ·
[B — What was removed and why](#appendix-b--what-was-removed-and-why) ·
[C — Deep dives](#appendix-c--deep-dives) ·
[D — What has not been verified](#appendix-d--what-has-not-been-verified)

Sections marked **⌨ Requires Claude Code** need a terminal with the repo checked
out. Everything else works from a browser.

---

## 1. What is actually live

Read this before anything else. Several parts of the system are built but not
switched on, and a manual that described them as working would be worthless on
first use.

| Thing | State | What that means for you |
|---|---|---|
| Research, drafting, guards, publishing | **Live** | The core pipeline works end to end. |
| Article vector index + related articles | **Live** | Fires automatically on publish. |
| Knowledge capture over MCP | **Live**, behind one flag | Works from Claude Code and `curl`. See §11. |
| Kit (ConvertKit) subscribe | **Live** | Subscribers arrive. |
| Kit **tags** | **Not configured** | The account holds two tags; the code maps ~18. Subscribes succeed but arrive **untagged** — no segmentation. A missing tag ID is skipped by design, so nothing errors. |
| Kit sending address | **Unverified** | You cannot reliably send until this is done. |
| Broadcast / "email this article" | **Does not exist** | There is no route. Sending is manual, in Kit. |
| Substack | **Manual only** | No integration of any kind. |
| Web Push | **Live** (21 Aug 2026) | VAPID keys are configured on production, verified. Publishing an **Audit-tier** article notifies the "New Audit-tier Deep Dives" subscribers, once per article ever. Nothing fires for other tiers, and the AI Act deadline topic is still sent by hand. Subscriber numbers start from zero — nobody could subscribe before the keys existed. |
| Lemon Squeezy / checkout | **No store** | `NEXT_PUBLIC_PRE_LAUNCH` defaults true, which suppresses every checkout link. Product gates link to the product page instead. |
| Compliance Checker v2 | **Dark** | v1 is what every visitor gets. See §13. |
| ChatGPT knowledge capture | **Blocked** | Not an engineering problem — it needs a Business-tier seat. See §11. |

---

## 2. Getting in

### The writer login

Go to **`/login`**. The page is headed **"Writer Access"** with a single password
box (placeholder *"Enter access code"*) and a button reading **"Enter Studio"**.

The access code is the `ADMIN_PASSWORD` environment variable. On success you land
on `/admin`.

Things worth knowing:

- **Five attempts per 15 minutes.** Past that you get *"Too many attempts. Try
  again in N seconds."* A wrong code returns **"Access Denied"** after a short
  deliberate delay.
- **Your session lasts 24 hours** — a cookie named `ai-writer-auth`.
- **It renews as you work.** Every authenticated admin request re-issues the
  cookie, specifically so that using `/create` extends your window right before
  you are dropped into Studio, where the fact-check button needs the same cookie.

### The admin nav

Left rail, in order: **Dashboard · Analytics · Create · Import · Library ·
Research · Context · Knowledge · Studio**.

"Studio" is a full page load rather than a soft navigation — the embedded Sanity
Studio is a separate application.

### Two logins, but only one you have to think about

There are still two credentials, and it is worth knowing which is which:

| Surface | Authenticated by |
|---|---|
| `/admin`, `/create`, `/content`, `/research`, `/knowledge`, `/analytics`, `/import`, `/context`, `/editor` | The `/login` access code |
| `/studio` (Sanity Studio itself) | **Your Sanity account** |
| "Run fact-check" and "Suggest two prompts" **inside Studio** | Either — see below |

**Inside Studio you do not need the access code.** Those two buttons call the
site's own API, which wants the admin cookie rather than your Sanity session.
When that cookie has expired, the button now trades your Sanity login for a fresh
admin session and retries automatically. You see a slightly slower click and
nothing else.

> **This used to be the manual's sharpest warning.** Until 20 August 2026 an
> expired admin session left you signed into Studio and refused by its own
> buttons, with a toast sending you to `/login` in a new tab. That trap is gone.
>
> Verified by driving a real Studio with a deliberately expired admin cookie:
> clicking "Run fact-check" produced `401` → `/api/studio-session 200` →
> `202`, and the fact-check then ran to completion. "Suggest two prompts"
> behaves identically. No login tab was opened.

Two things can still stop it, and they say different things:

- **"Not signed in to Sanity"** — Studio has no session to trade. Reload Studio
  and sign in, or use the access code at `/login`.
- **"Your Sanity account cannot run this"** — you are signed in correctly, but
  your Sanity account is not an **administrator** of the project. Site tools are
  limited to administrators, deliberately: a Sanity account invited as an editor
  or viewer would otherwise inherit the metered Claude, Exa and OpenAI pipeline.
  This one does **not** send you to `/login`, because signing in again would not
  change the answer.

The `/login` access code is still what gets you into `/create`, `/content` and
the rest of the admin area. Nothing about that changed.

---

## 3. Choosing a format

`/create` offers **six** formats. Older guides listed five — **Guide** was missed.

| Format | Length target | Stored as `contentType` | Voice pass | Auto fact-check |
|---|---|---|---|---|
| **Pulse** — 30-second scan | 100–140 words | `signal` | Rewrite | No |
| **Signal** — rapid analysis | 800–1,200 words | `signal` | Rewrite | **Yes** |
| **Deep Dive** — forensic report | 3,000+ words | `deepdive` | **Audit only** | **Yes** |
| **Guide** — how-to | 500–2,000 words | `guide` | Rewrite | No |
| **YouTube Script** | 12–18 min video | `youtube` | Rewrite | No |
| **Research Only** | — no draft — | — | — | — |

### ⚠ "Pulse" means two different things

This is the single most confusing thing in the system, and it caused a
contradiction between two previous guides.

- **Pulse the *format*** drafts **100–140 words**. It is what you pick on `/create`.
- **`pulse` the *intelligence tier*** is a reading-speed label meaning "a
  30-second scan, under about 600 words". It is one of three tiers — `pulse`,
  `briefing`, `audit` — chosen by the metadata pass and shown to readers.

They share a name and are not the same thing. When you draft a Pulse, the tier is
**forced** to `pulse`. For every other format the model picks the tier.

Note also that **Pulse and Signal are both stored as `contentType: signal`.** The
thing that distinguishes them after the fact is the tier.

---

## 4. Research

Research and drafting are two separate button presses. You research first, look at
what came back, and then decide whether to draft.

### The form

**Step 1 — Format.** The six cards above.

**Step 2 — Target Persona.** A dropdown, loaded from your Sanity `persona`
documents.

> *Known cosmetic bug:* each item is meant to show its pain points as a subtitle,
> but the query that loads the list does not fetch that field, so the second line
> is always blank.

**Step 3 — Primary Topic.** One line, max 300 characters. Placeholder: *"e.g. EU
AI Act implications for open source models"*. This is the **search seed** — keep
it specific. Pressing Enter starts research.

**Step 4 — Context / Brief** (optional). Max 2,000 characters, with a live counter
that turns amber at the cap.

**The brief is used twice**, and this is the most useful field on the page: it
steers what the research agent looks for, *and then* guides how the draft is
written — angle, emphasis, what to include or avoid. Unlike the topic line, its
wording is treated as your authoritative instruction.

### There is no category, keyword or pain-point field

Those are derived, not typed:

- **Keywords and pain points** come out of the research synthesis.
- **Categories** are chosen by the metadata pass from your live Sanity category
  list. You confirm or change them in Studio.

### What the button does

The button reads **"Launch Agent"**, and while running shows **"Gathering
Intel…"** — or **"Researching (a few min)…"** for a Deep Dive.

**Standard formats** run a live Exa web search: the last 90 days, 8 results,
news-weighted. If that returns fewer than three usable results it automatically
broadens to all time and de-duplicates by URL. A Claude call then synthesises a
summary.

**Deep Dive** is different. It runs an agentic, multi-step research pass, and the
page tells you so:

> Deep Dive runs an agentic, multi-step research pass (Exa Agent). Expect a few
> minutes and a higher per-run cost than other formats.

Deep Dives are **limited to three starts per hour**. If a backend research service
is configured, the work runs there as a job and your browser polls for it; if not,
the same agent runs in-process as a fallback. Either way you wait, and the page
stays responsive.

Two timeouts are in play and they are deliberately asymmetric: the browser gives up
after **12 minutes**, the backend after **10**. That means a genuine backend
timeout normally reaches you as a clean failure before your browser gets bored.

> **Note:** the Inoreader feed lane never fires from `/create`. It only runs on the
> separate `/research` page, which reads an Inoreader token from a cookie.

### What comes back

A panel headed **"Intelligence Gathered"** — "N sources analysed" — containing:

- **Ready for Action** — the generate button. *Hidden entirely if you chose
  Research Only.*
- **Forensic Summary** — the model's two-or-three-sentence synthesis.
- **Contextual Hooks** — pill chips, the pain points it extracted.
- **Source Index** — clickable source cards.

### The Source Index is recorded, but not published

Those sources are shown to you, fed to the drafting model, and recorded on the
article's **Citation Snapshots** field under *Provenance* — what the draft was
actually written from, as it stood then.

They do **not** go on the reader-facing Sources list. That stays authored by
hand, deliberately: these are what the model was handed, not sources anyone has
checked. When you are ready, the Sources field carries an **"Add N from
research"** button that brings them in for you to keep or delete (§8).

### If research fails

You get a browser alert: **"Failed to gather intelligence."** followed by the
actual reason. The underlying detail is deliberately preserved rather than
flattened into a generic message, because a rate limit, a retired API and a missing
key need three different fixes. Nothing is saved; nothing is broken. Read the
detail and go to §12.

**Deep dive on the mechanism:** [`admin-research-workflow.md`](admin-research-workflow.md)
explains what the research button really does — Exa parameters, the job
architecture, the three Pinecone indexes, and the retrieval scoring.

---

## 5. Drafting

### Which path

**Four ways an article can come into being.** Two of them run the full pipeline,
one reworks something you wrote elsewhere, and one bypasses almost everything.

| Path | What it is | Guards it gets |
|---|---|---|
| **`/create`** | Research → draft, in the browser | All of them |
| **⌨ `/ss-draft-local`** | The same pipeline, run by Claude Code on your Max plan | All but the auto fact-check |
| **`/import`** | Paste an article written elsewhere; it is reworked into house voice and format | Voice edit, metadata, fact-check. No research, so no prior coverage and no statutory corpus |
| **By hand in Studio** | Press Create and type or paste | ⚠ **Only the publish preflight — and its one blocker cannot fire.** See below |

The first two share prompts, personas, research, retrieval and metadata logic —
the difference is which model writes and who pays.

| | **Claude Code (Max plan)** ⌨ | **Website `/create`** |
|---|---|---|
| Cost | Your Max subscription. Only Exa, one embedding, Pinecone and the Sanity write cost anything. | Anthropic **API credits** per article, plus the same few pennies. |
| Where | Claude Code, opened in the `silicon-and-stone-web` repo | Any browser, logged in |
| Model | Whatever Claude Code is running | `claude-sonnet-4-6` |
| Speed | You drive it | Self-serve button |
| Output | A **draft** in Studio | A **draft** in Studio |
| Guards | Quotation audit yes; ⚠ **no auto fact-check** — run it from Studio | All three |
| Use when | Credits are empty, or you want to steer each pass | Quick and self-serve |

### The website path

Press the generate button — labelled for your format: *Generate Pulse*, *Generate
Signal*, *Generate Deep Dive*, and so on. It shows **"Writing Draft…"** while it
works, then navigates you to the Studio article list.

Behind that one press, four model passes run in this order:

1. **Draft** — writes the article.
2. **Voice edit** — humanises it (see §6).
3. **Metadata / SEO** — title, description, categories, tier.
4. **Image prompts** — two suggestions for what the cover image should depict.

> **What steers the draft, besides your brief.** The prompt carries the house
> style, the AI-tells reference, the voice DNA, the persona, and the editorial
> focus areas from `knowledge/company/content-focus.md`. All of them are
> compiled into the build rather than read from disk at run time, because a
> runtime file read works locally and silently returns nothing on Vercel. If you
> edit any of those markdown sources, run `npm run gen:style` — `npm run dev`
> alone will not pick the change up.

**The voice edit deliberately runs before the metadata pass**, so the SEO metadata
describes the edited article rather than the raw draft.

**Passes 2, 3 and 4 are best-effort.** Each is wrapped so that if it fails, the
draft still saves. You can end up with a saved article that has no voice edit
notes, no SEO block, or no image prompts — that is a degraded run, not a lost one.

Before all of that, two retrieval lanes run in parallel:

- **Prior coverage** — searches your own published back catalogue so the draft can
  reference or differentiate from what you have already written, rather than
  repeating it.
- **Regulatory corpus** — if the topic looks regulation-adjacent, pulls the actual
  statutory text of the relevant instrument so the model can quote it accurately
  instead of from memory.

> **Both lanes are invisible.** They fail independently, never block the draft, and
> report nothing to the screen — every outcome goes to the server logs only. The
> one place a failure surfaces to you is the Quotation Audit reading `UNCOVERED`
> (§7a).

On the prior-coverage lane, one design note worth carrying, from
`admin-research-workflow.md`:

> Without [a score floor] every draft received five "related" articles whether or
> not any were related, and it is the 0.33–0.35 tail that produces *"as we have
> covered before"* about a piece that covered nothing of the sort.

And on sources, from the same document:

> `synthesizeContext` used to ask Claude for the `sources` array itself, so every
> title and URL the writer received had passed through a generation step and could
> be silently mutated — a plausible link that 404s, or one resolving somewhere that
> does not support the claim. Now each gathered result is numbered before the model
> sees it and the model returns only `sourceIndexes` […] The model keeps the
> judgement worth asking it for — which sources carry the summary — and loses the
> one it should never have had.

### What lands in Sanity

A **true draft** — never published, no publish date. It carries the title, slug,
excerpt, body, content type and persona; and where the model supplied them, the
Stone Truth, actionable insights, SEO block, categories, intelligence tier,
methodology pillars, voice edit notes, quotation audit and image prompts.

**It never carries citations.** See §7c.

### Importing something you wrote elsewhere

**`/import`** takes an article written anywhere — by hand, in another tool — and
reworks it into house voice and one of the five formats. Use it when the thinking
is already done and you want the system's editorial pass over it.

The form, in order:

1. **Who is the primary target?** — persona, required.
2. **What format?** — Pulse, Signal, Deep Dive, Guide, YouTube Script. Required.
   (No Research Only: there is nothing to research.)
3. **The article** — an optional *Original title*, then either **upload a file**
   (`.docx`, `.md`, `.markdown`, `.txt`) or **paste the text**. A file wins over
   pasted text. Minimum ~200 characters.
4. **Steer the rework (optional)** — 2,000 characters, treated as your
   authoritative instruction, exactly like the brief on `/create`. Plus a
   **"Fact-check the reworked draft"** checkbox, **ticked by default**.

Press **"Rework & Save Draft"**. It runs four model passes — rework, voice edit,
metadata, image prompts — and saves a draft. It never publishes.

What it does **not** do, and this is the important part: **there is no research
step.** No Exa search, no prior coverage from your back catalogue, no statutory
corpus. So an imported piece is written blind to what you have published before,
its Citation Snapshots are empty, and its quotation audit has nothing to check
against — every statutory quotation comes back `UNCOVERED`, which is not a pass.
If the piece quotes law, verify it yourself.

The verbatim original is kept on the article as **Original Source Material**, and
`source` is set to *Imported & Reworked*.

> **One inconsistency worth knowing:** `/import` does not translate Anthropic
> errors the way `/create` does. If credits run out here you get the raw API
> message, not the friendly one in §12.

### ⚠ Writing an article by hand in Studio

You can press Create in Studio and type or paste a body directly. It works, and
it is the weakest path in the system:

- No voice edit, so no house-style pass and **no `[AUTHOR: …]` placeholders**.
- No quotation audit, no Citation Snapshots, no automatic fact-check.
- `source` is left unset unless you pick one.

**Nothing here sets an Intelligence Tier**, and this path used to publish into
invisibility because of it: `/intelligence` listed only articles with a tier, so
a hand-made one went live at its own URL, was indexed, reached the sitemap — and
never appeared on the intelligence hub. Fixed 21 August 2026 (found by
publishing one). The feed no longer filters on the tier, so an untiered article
is listed; what it loses is the PULSE / BRIEFING / AUDIT badge, the tier filter,
and — for Audit — the push notification on publish. The preflight now says so as
a **warning**, "No intelligence tier set". Categories remain the harder rule:
they are required and will block Publish.

**The consequence is worth stating plainly: the publish preflight's only blocker
cannot fire on this path.** Nothing generated placeholders, so there are none to
catch. You will see three warnings — "No fact-check has been run", "No sources
listed" and "No intelligence tier set" — and "Publish anyway" is available.

If you write by hand, the checks are yours: run **Run fact-check** from the
document menu, and add sources yourself.

### ⌨ The Claude Code path

Say any of these to Claude Code with the repo open:

> `draft locally` · `on my Max plan` · `/ss-draft` · `draft an article in Claude Code`

A workable prompt template:

```
Use the ss-draft-local skill to draft a [FORMAT] locally on my Max plan
for the [PERSONA] persona.
Topic: [TOPIC]
Brief: [OPTIONAL — angle, emphasis, what to include or avoid]
```

You do not need to name scripts or steps; the skill handles the sequence. It
imports the repo's own prompt builders, so the prompts stay identical to the
website's.

**⚠ What this path does not get.** It writes to Sanity directly and skips the
finalisation step, so there is **no automatic fact-check** — run "Run fact-check"
from Studio manually. The publish guard still applies.

It *does* get the quotation audit and the research provenance, as of 20 August
2026: the audit is a pure string match with no model call, so it costs nothing
to run here. It checks against the statutory text the prompt step retrieved,
saved alongside your working files. If you skip the `draft-prompt` step the
audit has nothing to check against and reports `UNCOVERED` — which, as always,
is not a pass.

---

## 6. What the machine did to your draft

### The voice edit

Every draft goes through a humanising pass that strips AI tells, enforces house
style (UK English, smart quotes, the em-dash cap, no hype words, take a position
rather than hedge), and — most importantly — **demands concrete specifics**.

- **Pulse, Signal, Guide and YouTube are rewritten** in place.
- **Deep Dives get an audit-only pass.** The prose is untouched; you get notes
  telling you what to fix. Rewriting 3,000+ words is not worth the cost and
  latency, so you do the editing from the notes.

> **On a Deep Dive the placeholders are appended, not woven in.** Because the
> audit pass does not rewrite, it cannot drop an `[AUTHOR: …]` marker at the
> sentence that needs it. Instead the specifics it identified are added to the
> **end of the body** under a heading, *⚠ Author specifics needed*. Resolve each
> one in the prose where it belongs, delete its line, and delete the heading with
> the last of them. Until you do, publishing is blocked (§9).
>
> This was added on 21 August 2026. Before it, a Deep Dive's outstanding work
> existed only in the notes — which the publish guard does not read — so the one
> blocker in the system could not fire on the longest, most claim-dense format.

### The `[AUTHOR: …]` convention

Where only you can supply a fact, figure, name, date or first-hand observation,
the model is instructed to **insert a placeholder rather than invent one**:

```
[AUTHOR: the actual enforcement figure from the Commission's Q2 report]
```

This is the single most important convention in the pipeline. It is mandated in
three separate places in the prompts, and it is the **only thing that blocks
publication** (§9).

Treat every placeholder as a real research task. Do not delete them to clear the
block — deleting one silently removes a claim the article needed.

### Voice Edit Notes

A read-only field on the article (under **Provenance**) written by the voice pass.
It always has the same shape:

```
## Voice Edit Summary
**Edited against** …
### AI tells removed
### House-style corrections
### ⚠ Author specifics needed
### Verdict
```

**The "⚠ Author specifics needed" section is your work list.** It names every
placeholder left in the body, where it is, and what it needs.

The publish check deliberately **excludes** this field from its placeholder scan —
it *lists* the placeholders, so scanning it would block every article that had ever
been through the voice pass.

> If the voice pass fails, the draft saves with **no notes and an un-humanised
> body**. An empty Voice Edit Notes field on a fresh draft is a signal, not a
> reassurance.

### Acronyms and specialist terms

House rules that survive every rebuild, preserved from the old authoring guide:

- Write the full name in full on the **first** reference, with the acronym in
  brackets — `General-purpose AI (GPAI)` — then use the acronym alone thereafter.
  This covers every organisation, company, institution, law, regulation, agency,
  product, model and technical term. Never use an acronym before expanding it.
  AI, EU, UK and US are the house exceptions.
- Do not introduce an acronym that appears only once; use the full term.
- When a specialist institution, law, model, technique or term is central to
  understanding the piece, annotate its first meaningful occurrence with the
  **Glossary term** mark in Studio.
- Keep definitions in the canonical **Glossary Term** document. Do not improvise a
  definition in the annotation.
- The glossary covers organisations and role titles, not individual public figures.

**Where the rules come from.** The canonical rules live at
`.agent/rules/style/house-style.md` and `ai-tells.md`. `npm run gen:style`
generates the bundled module the app imports, so the rules always reach the
production prompt. The same references back the terminal `/voice-edit` skill for
manual passes on any draft.

---

## 7. The three guards — all advisory

Three automated checks run over a draft. **None of them guarantees accuracy.**
Two write a record and block nothing; the third blocks publication on exactly one
condition. **You are the last control.**

### 7a. Quotation audit

**What it does.** Deterministic string matching, no model involved. It finds every
paragraph that claims to be citing statute, extracts the quoted passages, and
checks each one character-for-character against the statutory text the model was
actually given.

**Three verdicts:**

| Verdict | Meaning |
|---|---|
| `verified` | The quotation is in the retrieved text. |
| `UNMATCHED` | Presented as statute, **not found** in what the model was given. It was invented, quoted from memory, or taken from a provision that was never retrieved. |
| `UNCOVERED` | **No statutory text was retrieved at all**, so there was nothing to check against. |

**`UNCOVERED` is not a pass.** It means the check could not run. It is also the one
place the invisible regulatory retrieval lane (§5) shows itself: an `UNCOVERED`
verdict tells you the corpus lane did not fire.

**Known false positives:** an elision the splitter missed, an editorial insertion
in square brackets, and quotations of a *recital* (the corpus holds none).

**What it deliberately does not audit** (since 21 August 2026). A Deep Dive
returned eight "quotations", of which six were not quotations of statute at all —
the piece's own Stone Truth callout, its Forensic Summary, two article titles it
cross-referenced, and two rhetorical questions in its own prose. Five classes are
now excluded: a blockquote opening with a **bold label** (the house callout
convention, which the voice edit itself produces), anything inside an unresolved
`[AUTHOR: …]` placeholder, a quoted span ending in a question mark (statute
states, it does not ask), a mostly-capitalised span that does not end a sentence
(a headline, not a provision), and a reference-list entry's title. If a genuine
quotation ever falls into one of those shapes it will be missed — which is why
this remains advisory and you remain the last control.

The field only appears when at least one quotation was checked. On the Claude Code
path it never runs at all.

### 7b. Automatic fact-check

**When it runs by itself, from `/create`:** only for **Signal** and **Deep Dive**,
immediately after generation. Pulse, Guide and YouTube are excluded deliberately.
Deep Dive is included precisely because it is the one format the voice pass
audits rather than rewrites.

**From `/import` it runs for every format**, gated only by the "Fact-check the
reworked draft" checkbox, which is ticked by default. There is no format
allowlist on that path.

**Running it by hand:** the **"Run fact-check"** action in Studio. This is how you
check a Pulse, a Guide, an imported piece, or anything from the Claude Code path.

**What it does:** extracts checkable claims, searches the live web for primary
sources, and verifies each claim. It writes a full report to the **Fact Check** tab:
an overall verdict (clean / minor issues / major issues / unverifiable), a summary,
counts, and a per-claim breakdown with evidence, source URLs and a **suggested
revision**.

**A useful side effect:** newly discovered primary sources are appended to the
article's citations, de-duplicated by URL. This is currently the main way a
generated article acquires citations at all.

**Limits:** 10 runs per hour. Only one at a time per article. It is **advisory** —
it never blocks anything.

**If Exa is unavailable**, claims degrade to `unverifiable` rather than failing the
run, so you get a completed report with an "unverifiable" verdict. That is a
different thing from a clean one.

### ⚠ Re-running does not carry forward what the last run found

**Which claims get checked is decided fresh each time, by a model reading the
article.** Two runs over the same unchanged text will not extract the same list.
A claim flagged as inaccurate in one run can simply be *absent* from the next —
not cleared, not re-checked, just not picked up.

So **a claim disappearing from the report is not evidence it was fixed.** Only
the run that flagged it knows it was ever a problem, and a later report replaces
the earlier one wholesale.

Observed on 21 August 2026: a BIS quotation flagged `unverifiable` with high
confidence in one run was not extracted at all by the next, on identical text.
Had the first report not been read, the problem would have vanished silently.

Two practical consequences:

- **Act on a flagged claim while you can see it.** Do not re-run hoping for a
  cleaner report — you may get one without having fixed anything.
- **Keep a note of what you resolved**, because the report will not remember.

The counts are trustworthy *within* one run: the verdict, the counts and the
claim list are all written from the same result set in a single patch. Older
reports may not be — one from 10 August claimed 18 claims checked while storing
8. If a report's counts and claim list disagree, it predates the current code:
re-run it rather than trusting either number.

### 7c. Publish preflight

Runs when you click Publish in Studio. On a clean draft you never see it — it
opens the standard publish path silently.

| Check | Severity |
|---|---|
| Unresolved `[AUTHOR: …]` placeholders | **BLOCKER** |
| Fact-check missing, still running, or failed | Warning |
| Fact-check found major issues | Warning |
| Statutory quotations not in the source text | Warning |
| No intelligence tier set | Warning |
| No sources listed | Warning |

**Exactly one thing blocks publication: an unresolved placeholder.** The reasoning,
worth internalising:

> A placeholder in the body is never correct; everything else is an editorial
> judgement. A control the author routinely has to fight is a control they learn to
> route around.

It scans the **body, excerpt, Stone Truth and each actionable insight** — and finds
a placeholder even if bold formatting splits it across several spans.

**"No sources listed" fires until you populate the list.** The reader-facing
Sources list is authored by hand, so a freshly generated article starts empty.
Three ways to fill it: press **"Add N from research"** on the Sources field,
which brings in what the draft was written from (§8); run a fact-check, which
appends the primary sources it verified; or type them.

Until 20 August 2026 the research sources were not saved anywhere, so this
warning fired on every single generated article — which is how a warning trains
you to click past the dialog that also carries the placeholder blocker.

**⚠ The preflight runs entirely in your browser.** It only fires when you press
Publish in Studio, so anything that publishes by another route would bypass it.

As of 20 August 2026 nothing in the repo does. Two paths used to: the **Sync**
button in `/content` and `npm run sync-content` both wrote *published*
documents, so a markdown file with an unresolved `[AUTHOR: …]` placeholder went
straight to the live site — and the script could overwrite a published article's
body. Both now write **drafts only**, which you review and publish in Studio like
anything else. A test holds that line.

What remains true: a Sanity write token bypasses every client-side control by
definition. Anyone editing through sanity.io/manage, the CLI or an MCP with a
write token can publish without the check. That is a property of the token, not
something the app can prevent.

---

## 8. Finishing the article in Studio

### The sidebar

Under **Content**, in order:

1. **Site Settings** (singleton)
2. **Image Library** — browse by collection, all images, manage collections
3. **Knowledge** — see §11
4. **Article · Author · Category · Product · Persona · YouTube Script ·
   Glossary Term**

### The article's three tabs

**Content** — everything you author.
**Fact Check** — the quotation audit and the fact-check report. Read-only except
each claim's suggested revision.
**Provenance (internal)** — where the piece came from. Never shown publicly.

### What is yours and what is the machine's

| Yours | Machine-written (read-only) |
|---|---|
| Title, Slug, Author, Main Image | Voice Edit Notes |
| **Categories** (required) | Quotation Audit |
| Target Personas, Content Type, Intelligence Tier | Fact Check report |
| Impact Score, Stone Truth, Methodology Audit | Image prompt timestamp/model |
| What to do next, End-of-article gate | Citation snapshots, Generation snapshot |
| Excerpt, Body, Sources / Citations, SEO | Related Articles *(editable, but overwritten on publish)* |

### ⚠ Categories are required, and they are not navigation

Studio will not let you publish without at least one. The validation message says
why:

> Tag the article — this drives the end-of-article gate, not just navigation.

**Categories decide what the reader is offered at the end of the piece.** The
resolution runs like this:

1. An explicit gate set on the article wins.
2. Otherwise, the first **product** whose topics overlap the article's categories
   is offered.
3. Otherwise, the first **category** that declares a default gate mode decides —
   newsletter, book-a-call, or none.
4. Otherwise, the newsletter capture.

Two consequences: **the order you arrange categories in matters** (the first one
with a declared mode wins), and adding a category can silently change what the
article sells.

The gate never blocks reading. It sits below the body.

### Cover image

Set **Main Image**. **Alternative text is required** — the image itself is not, but
its alt text is if you add one.

There is no dimension validation; the site crops to 1200×675 for the hero and
1200×630 for social cards. Compose accordingly.

**"Suggest two prompts"** on the *Image generation prompts* field calls Claude to
read the article and describe **what the cover image should depict** — deliberately
not style, colour, medium or camera, because the house style belongs to whatever
image tool you run next. Copy a prompt and take it there.

### Sources: "Add N from research"

Where the draft came from research, the **Sources / Citations** field shows how
many of those sources are not yet on the list, and a button to bring them in.
One click adds them; delete the ones that do not belong.

This is deliberately a copy rather than an automatic write. What the model was
handed is not the same as what a reader should be told supports the piece —
you decide which is which. Nothing reaches the Sources list without passing
through you.

They are deduplicated against what is already there, using the same URL rule the
fact-check uses, so promoting a source and then running a fact-check does not
list the same page twice under different tracking parameters.

### The fact-check controls

- **A badge** on the document: *Fact-check running* / *failed* / *clean* / *minor
  issues* / *major issues* / *unverifiable*.

  **The badge follows what you have addressed** (since 21 August 2026). It counts
  the claims still outstanding, so it reads *"major issues (2 to address)"* and
  drops to *minor issues* as you insert revisions. Address the last one and it
  becomes **"N revisions applied"** — deliberately *not* "clean", because
  inserting a suggested revision does not verify the new sentence against
  anything. Only a fresh run can say clean. The publish dialog says the same
  thing in its own words: *"The fact-check predates your revisions."*

  > Before this, the verdict was frozen at the moment the run finished. An editor
  > who worked through every flagged claim still saw *major issues* with no way to
  > clear it short of paying for another run.
- **"Run fact-check"** — the action described in §7b. It disables itself and reads
  *"Fact-check running…"* while one is in flight.
- **"Insert into article"** — on each claim in the report. Edit the suggested
  revision if you want, then insert it; it replaces the original passage in the
  body and marks the claim as applied. Nothing is published until you press Publish.

  > If the paragraph had inline formatting — links or bold — inserting rebuilds it
  > as plain text and warns you. Give those a quick check: the link is gone, not
  > just restyled.

  **If the button is greyed out**, the original passage could not be found in the
  body — normally because you have since edited that paragraph. Use *Copy
  revision* and apply it by hand. Until 21 August 2026 this also happened on any
  paragraph containing a link, for a reason that had nothing to do with editing:
  the fact-check reads a text view that inserts a space at every span boundary,
  and the match demanded a space the body did not have.

---

## 9. Publishing

Press Publish. One of three things happens.

**Nothing visible** — the draft was clean; it publishes.

**A dialog headed "Publish this article?"** — warnings only. Each item is a card
badged **"Check"**. You get *Cancel* and **"Publish anyway"**. The lead line reads:

> Nothing here prevents publishing. Confirm you have considered each point.

**A dialog headed "Not ready to publish"** — there is a blocker. The item is badged
**"Must fix"**, there is **no "Publish anyway" button**, and your only option is
*"Back to the draft"*.

> This draft is not finished. Publishing is blocked until the item below is
> resolved.

In practice the blocker is always an unresolved `[AUTHOR: …]` placeholder. Go to
Voice Edit Notes, work through the "⚠ Author specifics needed" list, replace each
with the real figure, name, date or observation, and publish again.

---

## 10. After publishing

Two webhooks fire automatically.

**Vectorisation.** The article is embedded and stored in the article vector index.
Then its three nearest neighbours are written back to its **Related Articles**
field, so public page loads never have to call an embedding or search provider.

> This write-back has a loop guard — the patch is skipped entirely when the
> neighbour set has not changed. That guard exists because of a real production
> incident where articles re-published each other in a loop. Do not remove it.

Anything you typed into Related Articles by hand gets overwritten here.

**Revalidation.** The home page, `/intelligence`, and the article's own page are
invalidated so the new piece appears. The sitemap and RSS feed rebuild on their own
schedule.

**The publish audit.** The pre-publish checks run again, server-side. The dialog
you saw in Studio runs in your browser, so anything publishing another way — a
script, the CLI, the Sanity dashboard, an MCP holding a write token — never meets
it. This is the backstop that does.

If it finds nothing, it writes nothing: an empty **Publish Audit** field (Fact
Check tab) is the normal state. If it finds something, the field says what, and
it clears itself once you fix the article and republish. It does **not**
unpublish anything — silently reversing a deliberate publish is worse than a live
article carrying a warning.

**A push notification, for Audit-tier articles only.** Publishing something at
the Audit tier notifies everyone subscribed to "New Audit-tier Deep Dives". Once
per article, ever — a later typo fix does not re-notify. Nothing fires for other
tiers, and the AI Act deadline topic remains something you send by hand.

### How many people are subscribed

**`/api/push/stats`**, signed in as the writer. It returns a count per topic and
nothing else — never the subscriptions themselves, which hold device endpoints
and encryption keys.

```json
{ "configured": true, "canSend": true, "total": 0,
  "topics": [ { "id": "audit-deep-dives", "label": "New Audit-tier Deep Dives",
                "subscribers": 0 } ] }
```

Read `configured` before the numbers. `false` means there is no Redis store to
ask, so the zeroes are structural rather than measured — the two look identical
otherwise, and only one of them is a fact about your audience. `canSend` is a
separate gate: the VAPID keys, without which nothing is ever sent no matter how
many subscribers exist.

### ⚠ Distribution is manual

Nothing announces the article. Specifically:

- **No newsletter is sent.** There is no broadcast endpoint in the codebase at all.
  You send it from Kit by hand.
- **Push fires only for Audit-tier articles**, and only once VAPID keys are set
  (see `LAUNCH.md`). Nothing announces a Pulse, a Signal or a Guide.
- **Substack is entirely manual.** There is no integration.

The intended human sequence is: publish on the site first with its own canonical
URL → confirm it is indexed → then post the Substack teaser → then send the Kit
email. Publishing elsewhere first costs you the canonical.

**Before you can send at all**, two owner setup jobs are outstanding: the Kit tags
do not exist (so nothing is segmented), and the Kit sending address is unverified.
See `LAUNCH.md`.

---

## 11. Capturing knowledge from Claude

An MCP server lets you push ideas, observations, conversation extracts and sources
straight from Claude into a review inbox. **Nothing you capture is ever published.**
Everything arrives as a draft awaiting your review.

### Names

The server publishes itself as **`silicon-and-stone-knowledge`**. If you added it
with `claude mcp add`, the name you type locally may be different — that is your
client alias, not the server's name.

### The six tools

**Writes** (all create new records; none can approve, publish or delete anything):

| Tool | Required | Notes |
|---|---|---|
| `capture_knowledge_item` | `title`, `kind`, `body` | `kind` is one of: idea, observation, conversation extract, article foundation, outline, synthesis, claim, question, note. Optionally link topics, sources, related items, and a confidence or intended use. |
| `capture_source` | `title`, `sourceKind`, and **one of `url` or `text`** | The url-or-text rule is now declared in the tool schema, so Claude should satisfy it first time. If it does not, the error reads: *"Provide a URL, the source text, or declare that extraction is expected."* |
| `link_sources_to_item` | `itemId`, `sourceIds` | The only write to an existing record, and it touches **one field**. Additive — existing links survive. Refuses an item you have already reviewed. |

**Reads:** `list_knowledge_inbox` (what is waiting), `search_knowledge` (text
search, **not** semantic — this lane has no vector index), `get_knowledge_record`
(one record by ID).

All three reads exclude anything marked private or confidential.

### Errors, and what each one means

If the request fails before a tool runs, you get an HTTP code:

| Code | What it means | Fix |
|---|---|---|
| **404** | The feature flag is off. The route deliberately behaves as if it was never deployed. | Set `KNOWLEDGE_EXTERNAL_WRITES_ENABLED` to `true` — **as a non-sensitive variable**. |
| **503** | Flag on, but the access token is missing or too short — or the rate limiter is unavailable. | Set a token of at least 32 characters. |
| **401** | Everything is configured and your credential was refused. | Check the token. *When testing anonymously, a 401 is the success signal — it proves the service is up and refusing strangers.* |
| **429** | Rate limited. | Wait; the response says how long. |
| **413** | The captured body is too large. | Split it. |
| **403** | A browser sent it. | No browser should be calling this. |

> **The flag must be non-sensitive.** A sensitive Vercel variable is write-only,
> so if you set it that way you cannot read it back and a 404 becomes impossible to
> diagnose. The *token* stays sensitive; the *flag* does not.

If a tool itself rejects your input — a bad reference, a missing field, a duplicate
— you get a readable error message back rather than an HTTP failure, so Claude can
correct itself and retry.

### Turning it off

One variable. Unset `KNOWLEDGE_EXTERNAL_WRITES_ENABLED` and every route and method
answers 404 immediately.

### Reviewing what you captured

**Studio → Knowledge → Inbox**, which holds *Items Awaiting Review* and *Sources
Awaiting Review*. Alongside it: **Ready**, All Items, All Sources, **Research
Runs**, **Topics**, **Needs Attention** (index errors, extraction problems), and
**Legacy (pre-foundation)** for records that predate the rebuild.

Review states are **Inbox → Ready / Rejected / Superseded**. Superseded is
terminal.

**Every capture hands back a "Review it here" link that opens the record itself
in Studio.** Follow it and you land on the document, ready to edit. (Until
20 August 2026 that link pointed at `/knowledge`, which never read it and does
not list captured records — it went somewhere real and useless.)

> **Legacy note:** older records use a different status field where `error` meant
> "capture failed", not "rejected". Those two are kept separate on purpose — an
> extraction failure is not an editorial verdict, and collapsing them would
> silently discard records nobody judged.

### Reviewing a record

Open it and use the document actions: **Mark ready**, **Reject**, **Return to
inbox**. Only the moves the state machine allows are offered, so from the inbox
you see *Mark ready* and *Reject*, and a rejected record offers only a return to
the inbox. Superseding is not a button — it has to name the record that replaced
this one, so use the Review Status field and fill in Superseded By.

The actions are **disabled while you have unsaved edits**. The verdict is written
to the published record, and an unpublished draft would shadow it — you would not
see the change in the editor in front of you. Publish or discard first; the
tooltip says so.

> Until 20 August 2026 none of this was wired. The review state machine existed
> but nothing called it, so the Review Status radio let you jump straight to
> Superseded naming nothing, or back out of Superseded, which is forbidden. The
> actions route the verdict through the rules; the radio is still there, and
> still bypasses them.

### Nothing auto-publishes

Confirmed three ways in the code: no tool can move a record out of the inbox; a
capture that tries to arrive pre-approved is rejected outright; and the indexing
and extraction signals are recorded but consumed by nothing. There are tests
asserting the write tools expose no way to approve, publish or delete.

### ChatGPT

Not available, and **not for engineering reasons**. ChatGPT's custom connectors
accept OAuth or no-auth only — there is no static-token option — and write tools
need a Business-tier seat (Plus has no developer mode; Pro is read-only tools).
Zapier does not rescue it: its offering is itself a custom connector needing the
same tier, and it would put a CMS write credential inside a third party.

**The decision is a seat purchase, not a build.**

Claude.ai and Claude Desktop need a gated beta feature for custom request headers.
**Today the working clients are Claude Code and `curl`.**

### What not to do

Preserved from the guide this replaces, because these are editorial principles that
survive any rebuild:

- Do not treat the capture surface as the final knowledge store — it is a capture
  surface.
- Do not skip review; a captured source is not reviewed knowledge.
- Do not assume a record is sound just because it was saved.
- Do not use a synthesis as a substitute for source evidence.

And on search:

> What comes back is filtered before it reaches a drafting model […] so a search
> returning results is not the same as a draft receiving them.

---

## 12. When it goes wrong

Symptom first.

### "Anthropic credits are exhausted (or billing failed)."
Exactly what it says. Top up the Anthropic account and retry. Note that production
and local development **share one API key** — if it runs dry, `/create`, the
fact-check and the image prompts all stop together.

Meanwhile, use the ⌨ Claude Code path (§5), which does not touch API credits.

### "Anthropic rejected the API key (401)."
The key was rotated or revoked. Replace it in the environment.

### "Claude returned a draft that couldn't be parsed."
Usually a truncated or off-format reply. Retry. If it keeps happening, the response
may be hitting the token limit, or the configured model has been changed to
something unexpected.

### "Couldn't save the draft to Sanity — the write token is missing or invalid."
The Sanity write token is absent, read-only, or lacks create permission. It needs
to be an Editor-level token.

### The fact-check badge is stuck on "Fact-check running"
The run was killed mid-flight — a platform timeout or an evicted function — so no
terminal status was ever written. The action stays disabled and the publish check
warns.

**Recovery is time-based: wait 10 minutes.** After that the system treats the run
as crashed and lets you start a fresh one, which overwrites the stuck status. There
is nothing to clear by hand.

### The fact-check badge says "failed" with a message about JSON
You are on a build from before 21 August 2026. The checker used to ask the model
for JSON, and the sentences it copies out of your article routinely quote statute
— so they contain quotation marks, which ended the JSON string early and killed
the run with something like *Expected ',' or '}' after property value in JSON at
position 3184*. It struck the statute-quoting articles hardest, which are the ones
that most need checking. Both halves of the checker now use a line-based format
that needs no escaping. If a run still cannot be read you get **"The fact-checker
could not read its own output — it did not use the expected format. Run the
fact-check again."**, and re-running is the right response.

### "Admin session expired" in Studio
This should now be rare — a lapsed admin session is renewed from your Sanity login
automatically. Seeing it means the renewal itself failed: either Studio's own
session has gone (reload Studio and sign in) or the site could not reach Sanity.
The `/login` access code still works as a fallback and opens in a new tab. See §2.

### A claim I fixed has vanished from the fact-check report
Nothing carried it forward. Extraction is non-deterministic — see §7b. Absence
is not resolution, and a report never remembers what an earlier one found.

### "Your Sanity account cannot run this"
Your Sanity account is not an administrator of the project, and site tools are
restricted to administrators. Signing in again will not help. Either have your
role changed in Sanity, or use the `/login` access code.

### Capture returns 404
The knowledge feature flag is off, or was set as a *sensitive* variable and cannot
be read. See §11.

### Capture returns 503
The flag is on but the access token is missing or shorter than 32 characters.

### Capture returns 401
The service is up and refusing your credential. If you were testing without one,
this is the correct answer.

### Deep research times out
The backend gives up at 10 minutes and your browser at 12. A very broad topic is
the usual cause — narrow the topic line and try again. Remember you only get three
deep starts per hour.

### "Failed to gather intelligence"
Read the detail in the alert; it is preserved specifically so you can act on it.
Common causes: the Exa key is missing or out of quota; you hit the deep-research
rate limit; the research backend is unreachable.

### Every draft warns "No sources listed"
Expected. `/create` does not save the Source Index. Add citations by hand or run a
fact-check to have primary sources appended. See §7c.

### I captured something and cannot find it
Follow the "Review it here" link the capture returned — it opens the record in
Studio. If you no longer have it, go to **Studio → Knowledge → Inbox**. Records
captured before 20 August 2026 were given a link that did not work; the inbox is
the way to those.

### The Quotation Audit says UNCOVERED
No statutory text was retrieved, so nothing could be checked. Either the topic did
not read as regulation-adjacent, the retrieved passages scored too low, or the
regulatory index is unavailable. **Treat every quotation in that article as
unverified** and check it yourself.

---

## 13. The tools

The site publishes four interactive tools — the **Compliance Checker**, **Supply
Chain Mapper**, **Scenario Modeler** and **Policy Stress Test**. They are products,
not part of the publishing pipeline, and they are documented separately.

One thing an operator should know: the **EU AI Act Compliance Checker** has a
rebuilt v2 that is **fully built but dark**. Every visitor gets v1. Release is
blocked on counsel review, usability testing and two retention decisions — not on
engineering.

Its legal content is pinned and versioned, and **editing any of it without bumping
the version fails the build on purpose**. Do not treat it as ordinary content.

Start at [`compliance-checker-v2-state.md`](compliance-checker-v2-state.md), and
read the AI Act rule pack section of `CLAUDE.md` before touching anything under
`rulepack/`.

---

## Appendix A — Reference tables

### Formats

| Format | Words | `contentType` | Tier | Voice pass | Auto fact-check |
|---|---|---|---|---|---|
| Pulse | 100–140 | `signal` | forced `pulse` | rewrite | no |
| Signal | 800–1,200 | `signal` | model's choice | rewrite | yes |
| Deep Dive | 3,000+ | `deepdive` | model's choice | audit only | yes |
| Guide | 500–2,000 | `guide` | model's choice | rewrite | no |
| YouTube Script | 12–18 min | `youtube` | model's choice | rewrite | no |
| Research Only | — | — | — | — | — |

### Intelligence tiers (reader-facing, not formats)

| Tier | Meaning |
|---|---|
| `pulse` | 30-second scan; under ~600 words |
| `briefing` | 5-minute read; 800–2,000 words |
| `audit` | forensic long-form; 2,000+ words |

### Personas — two namespaces

⚠ The same people have two sets of slugs and both are correct in their own place.
Values are normalised automatically on write.

| Person | Stored on the article | Used in the prompt builders |
|---|---|---|
| Compliance Clara | `clara` | `compliance-clara` |
| Industrial Ian | `ian` | `industrial-ian` |
| Sovereign Sofia | `sofia` | `sovereign-sofia` |
| Global Citizen | `citizen` | `global-citizen` |
| Transatlantic Troy | `troy` | `transatlantic-troy` |

**`positional` is a sixth persona — for readers, not for articles.** It routes to
WaymarkPath, has no content of its own, and is deliberately excluded from the
content feed. The article schema does not accept it. Its absence from an authoring
table is correct.

### Limits and timeouts

| | |
|---|---|
| Login attempts | 5 per 15 minutes |
| Admin session | 24 hours, renewed on each admin request |
| Topic field | 300 characters |
| Brief field | 2,000 characters |
| Deep research starts | 3 per hour |
| Deep research timeout | 10 min (backend) / 12 min (browser) |
| Fact-checks | 10 per hour |
| Stuck fact-check recovery | 10 minutes |
| Related articles written back | 3 |
| Knowledge captures | 60 per 15 min (capture) / 120 per 15 min (MCP) |

### Prices

**Not listed here on purpose.** Every price on the site comes from one module, and
a figure written into a document is a figure that will go stale and contradict the
site. See `project_summary.md` §5 for the catalogue, and the products themselves
for the numbers.

---

## Appendix B — What was removed and why

**The Obsidian vault is retired.** Knowledge no longer syncs to, or is sourced
from, an external vault. Do not cite it as a source of truth. There is a test
asserting the puller stays deleted.

**The old `/generate` route is gone**, merged into `/create`. Everything it did
well — its brand-voice prompt builder — is now the prompt engine for *every*
format, and every draft is research-backed. If you want intel without a draft, use
**Research Only**.

**`knowledgeCandidate` is legacy.** It was the pre-rebuild "reviewed knowledge"
record. Its replacement is the knowledge **item**. One older page still writes
candidates, deliberately, until a cutover wave retires it — but it is no longer the
path to use. In Studio they live under *Legacy (pre-foundation)*.

**Two caveat findings were deleted from the Compliance Checker**, on the principle
that a caveat which no longer bites is worse than none at all.

---

## Appendix C — Deep dives

| Document | For |
|---|---|
| [`admin-research-workflow.md`](admin-research-workflow.md) | What the research button really does — Exa parameters, the job architecture, the three vector indexes, retrieval scoring. Reference, not instruction. |
| [`knowledge-system-foundation.md`](knowledge-system-foundation.md) | The knowledge system's data model, states and dedup rules. |
| [`compliance-checker-v2-state.md`](compliance-checker-v2-state.md) | How to run the checker rebuild, what is deliberately unfinished. |
| [`editorial-assurance.md`](editorial-assurance.md) | The authority on retrieval thresholds. Do not restate them elsewhere. |
| [`../LAUNCH.md`](../LAUNCH.md) | Owner setup — Kit tags, the store, discount codes. What is setup rather than operation. |
| [`../CLAUDE.md`](../CLAUDE.md) | The invariants. Nothing in this manual may contradict it. |

---

## Appendix D — What has not been verified

This manual was written from the code. Every claim traces to a file. What reading
code **cannot** establish is how the system behaves in use, and this section is
honest about the gap rather than writing around it.

Not confirmed by running it:

- **The MCP capture round-trip.** Tool contracts and error codes are read from
  source; no capture was performed against production.
- **Whether the Inoreader lane is ever live.** The `/research` page reads a token
  from a cookie; whether one is ever present is not evidenced in code.
- **Which Deep Dive path production takes.** Whether the research backend is
  configured — and therefore whether Deep Dives run as a polled job or as an
  in-process fallback — was not checked against the live environment.
- **The Audit-tier push notification (§10), end to end.** Narrowed, not closed.
  `/api/push/stats` reports **0 subscribers on both topics with
  `configured: true`** — the store answered, so that is a measured zero, and
  publishing an Audit-tier article on 21 August sent to nobody while consuming
  its one-shot marker. Nothing is broken: the public VAPID key is what the
  *browser* needs to create a subscription, so there has never been a window in
  which anyone could. What remains untested is the send itself and the marker,
  and only a real subscriber can settle them — subscribe a device, then publish
  the next Audit-tier piece or POST `/api/push/send`.
- **The non-administrator refusal in §2.** Both ends are unit-tested — a
  non-admin role is refused, and the client is held to *not* sending that person
  to `/login` — but it has not been exercised with a real non-administrator
  Sanity account, because there isn't one on this project. The four lines wiring
  those two together in the route are the untested seam.

**Settled on 21 August 2026, and struck from this list.** A run of
`docs/test-spec-article-flows.md` generated seven drafts across Pulse, Signal and
Deep Dive and removed them again, so: a complete `/create` run is no longer
hypothetical (research 21–22s on the fast lane, 212–280s agentic for a Deep Dive;
the four passes 71s to 259s); Citation Snapshots were observed on every draft and
the **"Add N from research"** button in §8 was clicked in a real Studio, including
delete-and-reoffer; and Studio's rendered labels, dialogs and claim controls were
driven rather than read. That run found eight defects, seven now fixed — see
`project_summary.md` §9.

Each remaining line is something one real run would settle. When you next take an
article from `/create` to publish, note anything that differs and correct this
document.
