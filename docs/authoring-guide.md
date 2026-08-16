# Authoring & Research Guide
*For Silicon & Stone Admins & Authors*

This guide outlines the workflows for researching topics, generating drafts, and publishing content to the Silicon & Stone platform.

## 1. Unified Content Creation (`/create`)
**Best for:** End-to-end workflow from research query to draft article in Sanity.

1.  **Access the Pipeline:**
    *   Navigate to `/create` (e.g., `https://siliconandstone.com/create`).
    *   Enter the deployment **Admin Password** if prompted.

2.  **Enter a Research Query:**
    *   Type a natural language query in the search bar.
    *   *Example:* "European battery passport implementation timeline and blockers"
    *   The system runs a live **Exa.ai** web search (Deep Dive uses the agentic Exa Agent API pass), then Claude synthesises a **Forensic Summary**. It also surfaces semantically similar **prior articles** from the Pinecone index so the draft extends rather than repeats past coverage.
    *   *(Note: `/create` does **not** read your Inoreader subscriptions — that is the `/research` route. In practice you browse Inoreader yourself, pick a story, and type its topic here. See `docs/admin-research-workflow.md`.)*

3.  **Review Intelligence:**
    *   **Summary:** High-level overview of the topic.
    *   **Sources:** Cited articles and reports.
    *   **Context:** Suggested keywords and persona pain points.

4.  **Choose Output Format** — the five canonical brand formats, plus Research-Only:
    | Format | Description |
    |--------|-------------|
    | **Pulse** | 100-140 word, 30-second intelligence scan |
    | **Signal** | 800-1,500 word breaking analysis (default) |
    | **Deep Dive** | 3,000-6,000 word forensic report (agentic Exa Agent API) |
    | **Guide** | 500-2,000 word how-to for a tool or technique |
    | **YouTube Script** | Tiered Intelligence structure (Pulse/Briefing/Audit CTA) |
    | **Research Only** | Gather intelligence without generating a draft |

    Every draft format is **research-backed**: `/create` always runs the research pass first, then drafts on that evidence. All formats share one data-driven prompt builder (`buildDraftPrompt` in `src/lib/prompts.ts`) that carries the brand voice DNA, business profile, and the full persona record.

5.  **Generate Draft:**
    *   Select format and click generate.
    *   For a **Pulse**, choose `Pulse`, launch research, then click **Generate Pulse**. The draft is saved as `contentType: signal` with `intelligenceTier: pulse` because Sanity separates editorial format from reading-speed tier.
    *   Claude produces the draft at temperature 0.4 (controlled, on-brand output).
    *   A new **unpublished article** is created in Sanity CMS.
    *   The app redirects to Sanity Studio so you can review, add a cover image, and publish.

### Pulse end-to-end flow

1.  Go to `/create`.
2.  Select **Pulse** and a target persona.
3.  Enter the topic and click **Launch Agent**.
4.  Review the forensic summary and source list.
5.  Click **Generate Pulse**.
6.  Review the draft in Sanity Studio. Confirm:
    *   **Content Type:** `Signal`
    *   **Intelligence Tier:** `Pulse`
    *   **Body:** 100-140 words
    *   **Stone Truth:** one short bottom-line sentence
    *   **Methodology Audit:** one matrix cell
7.  Add a cover image if needed, then publish.

### `/generate` has been removed

The old no-research quick generator has been **merged into `/create` and deleted** (route and middleware entries removed; it was never in the admin menu). Everything `/generate` did well — its data-driven, brand-voice prompt builder — is now the prompt engine for *every* `/create` format, and every draft is research-backed. There is no longer a prompt-only path: if you want intel without a draft, use **Research Only**.

### Voice & house style (applied automatically to every draft)

#### Acronyms and specialist terms

- Always write the full name in full on the **first** reference, immediately followed by the acronym in brackets — `General-purpose AI (GPAI)` — then use the acronym alone for every later mention. This applies to every organisation, company, institution, law, regulation, agency, product, model and technical term. Never use an acronym before it has been expanded. AI, EU, UK and US are the house exceptions.
- Do not introduce an acronym that appears only once; use the full term instead.
- When a specialist institution, law, model, technique or technical term is central to understanding the article, annotate its first meaningful occurrence with the **Glossary term** mark in Studio.
- Keep definitions in the canonical `Glossary Term` document. Do not duplicate or improvise a definition in the article annotation.
- The glossary covers organisations and role titles, not individual public figures.

Tone is enforced by the pipeline itself — you no longer rely on the draft "happening" to sound on-brand. Two things run on every `/create` and `/import` draft:

- **Pass 1 — house-style guardrail (in the draft prompt).** Before drafting, the prompt now carries a condensed house-style guardrail: UK English, smart quotes, the em-dash cap, no hype/banned words, take a position rather than hedge, and demand concrete specifics. Built by `getStyleGuardrail()` and injected by `buildDraftPrompt` (`src/lib/prompts.ts`).
- **Pass 3 — voice edit (the humanising final pass).** After drafting, `runVoiceEditPass` runs the full voice-edit procedure against the complete house-style and AI-tells references: it strips AI tells, enforces the mechanics, and demands the specifics only a human can supply.
  - **Pulse / Signal / Guide / YouTube** are **rewritten** in place.
  - **Deep Dives** get an **audit-only** pass — too long to rewrite economically, so it reports what to fix rather than rewriting the 3,000+ words. You rewrite from the notes.
  - Where only you can supply a fact, figure, name, or anecdote, it inserts an inline **`[AUTHOR: …]`** placeholder rather than inventing one, and writes a summary (tells removed, house-style fixes, and the full `[AUTHOR: …]` list) to the article's **Voice Edit Notes** field in Studio.
  - The pass is best-effort: if it fails, the Pass-1 draft still saves.

**Where the rules come from.** The canonical rules live in this repo at `.agent/rules/style/house-style.md` + `ai-tells.md`. `npm run gen:style` codegens the bundled module the app imports (`src/lib/style-rules.generated.ts`) so the rules always reach the production prompt. See *House style* below. The same references back the terminal **`/voice-edit`** skill for manual passes on any draft.

## 2. Research Portal (`/research`)
**Best for:** Exploring topics without immediately generating a full draft.

1.  Navigate to `/research`.
2.  Deploy a forensic agent with a natural language query.
3.  Review the summary, sources, and context.
4.  Optionally click **"Draft"** to create a Signal-type draft in Sanity.

## 3. Markdown Content Sync (Bulk/External Authoring)
**Best for:** Writing long-form content in an external editor (VS Code, or any Markdown editor) and syncing in bulk.

### File Format
Create markdown files (`.md`) in your content directory (default: `../content/substack`).

**Required Structure:**
```markdown
# Title of the Article

**Subject Line:** The snappy subtitle for email/preview.
**Preview Text:** A short teaser for the card view.

## Article

This is the main body of the article. You can use:
*   **Bold text**
*   Headings (###)
*   > Blockquotes

Content continues here...
```

### Sync Commands
```bash
npm run sync-content       # Standard sync (only changed files)
npm run sync-content:dry   # Preview what would change
npm run sync-content:force # Overwrite ALL articles (use with caution)
```

## 4. Final Polish & Publishing (Sanity Studio)
**Best for:** Final editing, image selection, and publishing.

### Sanity URLs

| Purpose | URL |
|---------|-----|
| Embedded Studio | `https://siliconandstone.com/studio` |
| Sanity Manage / project settings | `https://www.sanity.io/manage/project/3q59mpd7` |

1.  **Go to Studio:**
    *   Navigate to `/studio` (e.g., `https://siliconandstone.com/studio`).

2.  **Locate Drafts:**
    *   Look for the **"Articles"** list.
    *   Drafts (from `/create`, `/research`, or sync) will appear here.

3.  **Enhance Content:**
    *   **Main Image:** Upload the cover image (articles without images show a branded placeholder on the site).
    *   **Content Type:** Set to `Signal`, `Deep Dive`, `Guide`, or `YouTube`.
    *   **Intelligence Tier:** Set to `Pulse`, `Briefing`, or `Audit` for the briefings page display.
    *   **Personas:** Tag relevant personas (Clara, Ian, Sofia, Citizen).
    *   **Impact Score:** Set 1-10 for the briefings page impact bar.
    *   **Stone Truth:** Add a one-line forensic insight (displayed in italics on briefings cards).

4.  **Resolve the Voice Edit Notes (before publishing):**
    *   Open the read-only **Voice Edit Notes** field. It lists the AI tells removed, the house-style corrections, and — most importantly — every **`[AUTHOR: …]`** placeholder the voice edit left in the body.
    *   Search the body for `[AUTHOR:` and replace each placeholder with the real specific (a figure, a name, a date, a first-hand take). **Publishing is blocked while any placeholder remains** — the guard lists each one and offers no way past it (see step 6).
    *   For a **Deep Dive** (audit-only), the notes describe what to fix; apply the rewrite yourself. You can also run the terminal **`/voice-edit`** skill on the draft for a full hands-on pass.

5.  **Read the two machine reports (both read-only, both advisory):**
    *   **Quotation Audit** — every quotation the piece presents as statute, string-matched against the verbatim legal text the drafting model was given. `UNMATCHED` means it is not in that text: invented, recalled from memory, or taken from a provision retrieval did not return. Check it against the primary source. `UNCOVERED` means no statutory text was retrieved for this draft, so it could not be checked at all. Exact matching cannot always tell an elided or bracketed quotation from a fabricated one, so read before you act.
    *   **Fact Check** — for a **Signal** or **Deep Dive** this starts automatically when the draft is saved, so the report is usually waiting by the time you open the piece. For other formats, use the **Run fact-check** action. Apply a suggested revision with **Insert into article**; it patches the draft only.

6.  **Publish:**
    *   Click the green **Publish** button to make the article live on the site.
    *   **The publish guard runs first.** It *blocks* on an unresolved `[AUTHOR: …]` placeholder. It *asks for confirmation* — which you can give — when no fact-check has completed, when the verdict is "major issues", when the quotation audit found an unmatched quotation, or when a Signal, Deep Dive or Guide has an empty Sources list. On a finished draft you will not see it at all.
    *   Sanity's own validation still applies underneath: an article needs a title, a slug and **at least one category** before Publish is even enabled.
    *   The site uses ISR — published changes appear after revalidation.

## 5. Content Types Reference

| Type | Slug | Length | Turnaround | Use When |
|------|------|--------|------------|----------|
| **Pulse** | `pulse` intelligence tier | 100-140 words | Same day | One verified shift, one consequence, one watchpoint |
| **Signal** | `signal` | 800-1,500 words | 24-72 hours | Breaking regulatory news, quick analysis |
| **Deep Dive** | `deepdive` | 3,000-6,000 words | 1-2 weeks | Comprehensive forensic report on a topic |
| **Guide** | `guide` | 500-2,000 words | As needed | How to use interactive tools or products |
| **YouTube** | `youtube` | Variable | As needed | Script outline for video content |

## 6. Persona Reference

| Persona | Slug | Target Audience |
|---------|------|----------------|
| Compliance Clara | `clara` | Legal/compliance counsel at tech firms |
| Industrial Ian | `ian` | Supply chain and operations directors |
| Sovereign Sofia | `sofia` | Policy analysts at think tanks and government |
| Global Citizen | `citizen` | Informed general public, journalists, educators |
| Transatlantic Troy | `troy` | US/Canadian founders and CEOs entering the European market |

## 7. House Style (source of truth)

**This repo is the single source of truth for house style and variant rules.** Edit them here.

> Until August 2026 the canonical copies lived in an Obsidian vault and were rsynced in by a `sync-style.sh` script living in the vault root. **That vault is retired — do not sync from it, and do not treat any copy outside this repo as canonical.**

```
.agent/rules/style/house-style.md, ai-tells.md, variant-map.md   ← edit here
  ├─ codegen → src/lib/style-rules.generated.ts (npm run gen:style — bundled, what the web app imports)
  └─ copy    → .agent/skills/voice-edit/references/  (and the .claude/ mirror, which is gitignored)
```

After editing any file in `.agent/rules/style/`, run `npm run gen:style` and commit both the rule file and the regenerated module. (`gen:style` also runs on `prebuild`, so a deploy can never ship stale rules.)

`gen:style` also mirrors `house-style.md` and `ai-tells.md` into `.agent/skills/voice-edit/references/` — the job the old vault script did — so the manual `/voice-edit` pass can never enforce different rules from the automated one. Commit those copies along with the rule change.

**Why a bundled module and not a runtime file read?** Reading repo `.md` at runtime is unreliable on Vercel (the file may not be traced into the serverless bundle). Importing a generated module is reliable — the same mechanism that makes `context/core/voice-dna.json` dependable.

### The voice/style files

| File | Role |
|------|------|
| `context/core/voice-dna.json` | Structured voice spec (traits, banned phrases) — also injected into the draft prompt |
| `.agent/rules/style/house-style.md` | Canonical house style (UK English, banned words, punctuation, regulatory discipline) — **edit here** |
| `.agent/rules/style/ai-tells.md` | AI-register tells to strip (hedging, rule-of-three, false balance, the absence test) — **edit here** |
| `src/lib/style-guardrail.ts` | Hand-curated condensed guardrail for Pass 1 (keep in step with the canonical rules) |
| `src/lib/style-rules.generated.ts` | Auto-generated full rules the web app imports — do not edit by hand |
| `.agent/skills/voice-edit/` | Committed, versioned `/voice-edit` editorial skill (manual passes) |
| `.claude/skills/voice-edit/` | Local, Claude-Code-discoverable mirror of the same skill (`.claude/` is gitignored) |
| `.agent/skills/silicon-stone-brand-voice/` | Prose voice skill — register, vocabulary, drift filters |
