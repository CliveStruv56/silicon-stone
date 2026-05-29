name: silicon-stone-brand-voice
description: Voice rules for any text rendered on Silicon and Stone surfaces — homepage, briefings, tools, social cards, error messages, microcopy, alt text. Apply this any time you generate or edit user-facing text. Pair with context/core/voice-dna.json (the structured canonical rules); this skill is the prose extension covering register, vocabulary, punctuation, and three filters for catching drift.
---

# Silicon and Stone — Brand Voice

> **Pair with `context/core/voice-dna.json` and `.agent/rules/style/`** — the
> structured voice file is the machine-readable spec, and the synced style rules
> from the Ideaverse vault are the editorial source of truth for article
> variants. This skill is the prose extension that explains the register, gives
> examples, and provides drift-detection filters. All apply.
>
> **When to use**: Any time you generate or edit user-facing text on a Silicon and Stone surface. If a piece of text doesn't pass these rules, rewrite it.

---

## The publication's positioning, in one sentence

Silicon and Stone is a strategic intelligence service for senior European professionals navigating the 2026 technology power shift — semiconductors, AI policy, supply chains, digital sovereignty. Published from an Outer Orkney isle. Practitioner-grade, calibrated, never glib.

The voice exists to serve that positioning, not to perform a tone for its own sake.

---

## Five rules, in priority order

### 1. Never breathless

No exclamation marks. No rhetorical questions in headlines (the page does not ask the reader if they're "ready"). No superlatives without evidence — never "the best," "world-class," "revolutionary," "game-changing." If a claim is calibrated and earned, state it; otherwise hedge.

**Rejected**: *"AI is transforming everything!" · "Are you ready for the AI revolution?" · "The world's leading intelligence on AI."*
**Accepted**: *"The AI race will be decided by policy, not models." · "Most coverage is at the model layer. The actual battle is one layer up."*

### 2. Never glib

No clever turns of phrase that prioritise wit over weight. The reader is a senior decision-maker; they detect performance instantly. A line that makes the writer look smart at the expense of being useful is a line that should be cut. Particularly distrust mirror constructions, alliteration, or aphorism unless they earn their place.

**Rejected**: *"The future is now." · "From silicon to stone, and back again." · "AI ate the world. Now it's eating itself."*
**Accepted**: *"The 2030 league table is being set at the orchestration layer — not at the model layer where everyone else is looking."*

### 3. Practitioner-grade, not pundit-grade

Anchor every assertion to observable practice — what organisations actually do, what decisions actually get made, what calls Clive has actually been in the room for. The publication's defensible advantage is thirty years inside the technology industry, not theoretical fluency. If a sentence could appear in a McKinsey report, an FT comment piece, AND a Substack post — rewrite it. Make it sound like only Silicon and Stone could have written it.

**Markers of practitioner register**: roadmap, deprecation, posture, cadence, leverage, decision layer, vendor-bound, architecture-bound, downstream of, structural event, swap-cost, league table.

### 4. Calibrated, hedged where the evidence demands

Write in declarative present tense for what's observable now. Hedge ("likely," "by 2030," "structurally") for trajectory claims. Use specific numbers where they exist, ranges where they don't. Never round up or down for rhetorical effect. The reader is going to fact-check; the publication's credibility compounds when the hedges turn out to be calibrated.

**Rejected**: *"AI will replace 50% of jobs by 2030."*
**Accepted**: *"AI is restructuring the senior ranks of European industry. The pace varies by sector; the direction does not."*

### 5. Sober, not grim

The voice is intelligence-briefing register — sober, considered, weighty. It is not depressing, fatalistic, or sermonic. The reader doesn't want to be lectured at any more than they want to be sold to. Stone Briefings end on a "Stone Truth" — a single declarative one-line verdict — but the line lands because the analysis above earned it, not because the line is dramatic.

**Rejected**: *"The future is bleak for those who don't act now." · "Disruption waits for no one."*
**Accepted**: *"Read which side of the orchestration divide your industry is on. The 2030 league table is being set there."*

---

## Vocabulary

### Use freely
- **The Drift** — the structural shifts in policy / capital / supply chains the publication tracks
- **Stone Briefing** — the Tuesday operational briefing
- **Practical Move** — the Friday actionable counterpart
- **The Audit** — the deep-dive (forensic deep-dive)
- **The Pulse** — the 30-second signal
- **Stone Truth** — the closing one-liner of any Stone Briefing
- **The view from the edge** — the brand thesis (clearer than the view from any centre)
- **Forensic Technopolitics** — the methodology
- **Decision-grade**, **Calibrated by default**, **Hedged on purpose**
- **an Outer Orkney isle**, **sixty miles north of mainland Scotland**, **the Atlantic edge**
- **Thirty years inside the industry** (the credential)
- **Senior leaders** / **senior decision-makers** / **senior leaders in European industry** (the audience)

### Avoid (matches `voice-dna.json` `never_uses_phrases` + extends)
- "Career infrastructure," "career readiness," "your career" (as the headline frame)
- "AI literacy" (vague; specify what AI competence)
- "Disruption" used loosely *(already in voice-dna.json)*
- "Game-changing," "revolutionary," "transformative" *(game-changer already in voice-dna.json)*
- "Cutting-edge," "next-generation," "best-in-class" (filler)
- "Future-proof your X"
- "Synergy," "leverage" (as a verb), "actionable insights" (corporate jargon)
- "Easy," "simple," "one-click" (career changes / strategic decisions are not easy)
- "Cut through the noise" (cliché — earn it with the analysis)
- "AI is revolutionising X" (AI-promoter cliché)
- "Welcome to the future of X"

### Career stake — present, but never the headline

Senior leaders' careers are at stake. The publication acknowledges this — it's a real concern. But career stake belongs in the **subhead**, never the H1. The H1 names the structural event; the subhead names the implication for the reader.

**Example pairing (locked for the homepage hero)**:
- H1: *AI. Policy. Power. Leadership.*
- Subhead: *Decision-grade intelligence on the technology power shift — for the senior leaders who'll be defining it, not defined by it.*

The phrase "**defining it, not defined by it**" is the canonical example of how to handle career stake on-brand: gain-framed, structurally precise, no SaaS overtones.

---

## Signature phrases (extends `voice-dna.json`)

`voice-dna.json` already lists openers/transitions/closers. Treat those as canonical; the prose forms here are extensions for longer-form work.

| Function | Examples |
|---|---|
| Open a section | *"Most coverage of [X] fixates on [Y]. The actual structural battle is one layer up." · "The realm at stake is..."* |
| Hand off to the analytical claim | *"The result is..." · "What this means in practice..." · "Here's what most miss..."* (last is from voice-dna.json) |
| Hedge a forecast | *"By 2030, structurally..." · "The pace varies by sector; the direction does not." · "Calibrated against current evidence..."* |
| Land a Stone Truth (closing) | *"Read which side of the [X] divide your industry sits on." · "The bottom line..." (from voice-dna.json)* |

---

## Punctuation conventions

- **Em-dash (—)** for intelligence-briefing pauses. Use freely. Three em-dashes per paragraph is fine.
- **Periods** between short noun phrases for taxonomy-style headlines (`AI. Policy. Power. Leadership.`). Period creates the rhythm.
- **No exclamation marks.** Anywhere.
- **No rhetorical questions** in headlines or subheads.
- **Em-dash** rendered with spaces ` — ` in copy for legibility on web.
- **Smart quotes** ("/", '/') for editorial polish.

---

## Content-typography pairing (for designers / front-end)

- The **H1** is rendered in Inter 700, letter-spacing ~`-0.028em`, line-height ~`1.02`. Reads as a Stone Truth — punchy, declarative.
- The **subhead** is Inter 500 in `silicon-amber`, around 22-26px. Carries the audience signal.
- The **lede** is Inter 400 in `text-muted`, ~16px, line-height ~1.7. Carries the credentials and cadence.
- Stone Truths get their own callout — slim left-border in `silicon-amber`, body text in `text-primary`, italic-amber accent on the most quotable phrase.

---

## Three filters before any text ships

Before any text ships, run it through:

1. **The Stratfor filter**: would a Stratfor analyst say this without scoffing?
2. **The Wired-feature filter**: would a Wired feature writer use this as a pull quote?
3. **The thirty-years-inside filter**: does this sound like someone who's actually been in the rooms, or like someone reading about them?

If the answer to any is "no," rewrite.

---

## Voice-drift smell tests (quick checks)

- Sentence contains "career" + an imperative verb ("secure," "future-proof," "transform") → **drift**, rewrite
- Headline has an exclamation mark → **drift**, rewrite
- Headline asks a question → **drift unless explicitly justified**, rewrite
- Sentence starts with "Are you" or "Want to" → **drift**, rewrite
- Sentence claims a percentage or year without source → **drift**, hedge or remove
- More than one alliteration / mirror construction in 200 words → **drift**, simplify
- Word "literally" appears anywhere → **delete**

---

## Where this skill applies

| Surface | Apply this skill? |
|---|---|
| Homepage copy | Yes |
| Briefings index, individual briefings | Yes |
| Tools (Compliance Checker etc.) UI text | Yes |
| Methodology page | Yes |
| Error messages, 404 / not-found copy | Yes (these are voice surfaces too) |
| Email templates / newsletter copy | Yes |
| Alt text for images | Yes (calibrated, descriptive, never breathless) |
| Sanity Studio field labels & descriptions | No (internal-facing; use clear technical language) |
| API docs / code comments | No (internal-facing) |

---

**Lock owner**: Clive. **Editorial enforcement**: Jane (brand-voice veto rights per project doc).
**Last updated**: 2026-05.
**Pair with**: `context/core/voice-dna.json` for the structured / machine-readable canonical rules.
