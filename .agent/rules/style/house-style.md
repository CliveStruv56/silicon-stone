---
type: style
scope: global
canonical: true
updated: 2026-06-08
---

# House Style (canonical)

> **This file is the single source of truth.** The website repo consumes these
> rules via sync — it never edits them. After changing this file, run
> `sync-style.sh` (or update the submodule).

## Non-negotiables

- **UK English** spelling and idiom throughout.
- **Present tense** as the default for published content.
- Clive's voice — see `context/core/voice-dna.json`.

## Conventions

- First names after first introduction (guest/profile content).
- Close longer pieces with a notable quote where it fits naturally.
- **Headings & Rhythm**: Periods between short noun phrases in headlines (e.g., `AI. Policy. Power. Leadership.`). No rhetorical questions in headlines or subheads.
- **Sentence & Paragraph Length**: Short, punchy, declarative sentences. Keep paragraphs concise and focused.
- **Oxford Comma & Numerals**: [TODO — Oxford comma stance and numeral rules if you have preferences].
- **Links & Citations**: Substantiate claims by linking to primary sources where possible. Cite retrieved work explicitly (e.g., note the source article when pulling from Pinecone). A claim with no source is an `[AUTHOR: source needed]` placeholder — never invent the figure, name, or quote.
- **Formatting**:
  - Main markdown file layout requires: `# Title of the Article`, followed by `**Subject Line:**`, `**Preview Text:**`, then `## Article` for the body.
  - The closing Stone Truth verdict gets its own callout (slim left-border, italicised accent).
  - Bold text is used for emphasis; avoid over-formatting.
- **Variant mapping:** Use [[variant-map]] when translating draft variants
  into website `contentType` and `intelligenceTier` fields.

## What to avoid

- Hype, breathless framing, unearned superlatives (e.g. no exclamation marks, clickbait, or sensationalist framing).
- **Banned Words & Phrases**: "game-changer", "disruption", "game-changing", "revolutionary", "transformative", "cutting-edge", "next-generation", "best-in-class", "future-proof", "synergy", "leverage" (as verb), "actionable insights", "easy", "simple", "one-click", "cut through the noise", "AI is revolutionising X", "literally".
- **Artificial urgency and vague value claims**: Avoid "the clock is ticking", "act now before it is too late", "cut through complexity", "unlock", "empower", "seamless", and "full enforcement" unless the legal meaning is precise and sourced.
- **US Spellings**: Avoid US spellings (e.g., use *organisation*, *programme*, *optimise*).
- **Em-dashes**: Space-padded em-dash habits (` — `) for pauses, up to three per paragraph.
- **Smart Quotes**: Always use smart quotes (`"`, `'`) for editorial polish.

## Operational language

Silicon & Stone is measured, forensic, and practical. Prefer verbs that describe
real analytical work:

`catalogue`, `classify`, `trace`, `map`, `evidence`, `monitor`, `compare`,
`stress-test`, `prepare`, `reassess`, `verify`, `identify`.

Use these verbs particularly in product pages, service descriptions, tool calls
to action, executive summaries, and Practical Move sections. The aim is not to
make the voice mechanical. It is to show what the reader can actually do next.

## Regulatory writing

- Separate fact, inference, and scenario. Label the status of a regulatory
  change explicitly: current law, political agreement, proposal, guidance, or
  inference.
- Use exact dates where dates materially affect a decision. Add a
  `Last reviewed` date to regulatory tools, product pages, and service pages.
- Link to primary sources where possible. Do not use a countdown as a
  substitute for analysis.
- Prefer calibrated formulations such as: "The timetable is moving. The
  evidence gap remains."
- Do not dilute the sober register, short declarative paragraphs, Stone Truth
  convention, Digital Realism, 3 x 2 methodology, or the "view from the edge"
  identity.

## Variant-specific rules

These global rules apply to all three variants. For length, structure, and
purpose of each, see:
- [[pulse]]
- [[briefing]]
- [[deep-dive]]
- [[variant-map]]

## Removing AI tells

These house rules take precedence, but a draft also needs the general
AI-register tics removed (hedging, rule-of-three, summarising kickers, empty
connectives, false balance, generality). See [[ai-tells]] for the full
detection-and-removal reference.
