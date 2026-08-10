# CLAUDE.md

Guidance for Claude Code in this repo. See also `project_summary.md` (session
handoff) and the persistent auto-memory in `MEMORY.md`.

## Dependency constraints (load-bearing — do not break)

These ceilings are required for the build to work on the current Next.js 15 /
React 19 bundle. Do NOT run a blind `npm update` / `npm install <pkg>@latest`:

- **Do NOT upgrade `sanity` past v4** — v5 needs `useEffectEvent`, absent from
  Next.js 15's React bundle.
- **Do NOT upgrade `next-sanity` to v12** — it requires Next.js 16.
- **Upgrade path:** wait for Next.js 16 stable, then upgrade all Sanity packages
  together.
- The Sanity `apiVersion` is sourced from `NEXT_PUBLIC_SANITY_API_VERSION`
  (default `2026-01-13`); keep all clients/scripts on that single value.

## AI Act rule pack (load-bearing — do not break)

The Compliance Checker's legal payload lives in `rulepack/versions/<version>/`,
not in TypeScript constants. Two rules:

- **Never edit a corpus file without bumping the pack version.** `prebuild` runs
  `scripts/rulepack-check.mjs`, which exits 1 on any hash drift — that is
  deliberate. Corpus text and pack version move together, or every citation
  previously verified against that text is silently invalidated. Intentional
  change: bump the version directory, then `npm run rulepack:hash`.
- **Every figure in the pack is a legal claim.** Dates, penalty ceilings and
  Article anchors are traceable to the EUR-Lex consolidated text at CELEX
  `02024R1689-20260727`. Verify against that before changing one; do not take a
  date from a summary, a blog post, or a build spec.

Three invariants the tool promises on screen and must keep:

- **The model never decides the tier.** Agentic intake proposes answers the user
  confirms; classification is the deterministic engine's alone. The report route
  re-runs the engine server-side rather than trusting a browser-supplied verdict,
  and a generation that restates tier, role or confidence differently is
  discarded whole (`src/lib/report/schema.ts`).
- **Confidence is categorical, never a percentage.**
- **No generated legal quotation reaches a screen unverified.** Every claim in a
  generated report is string-matched against the pinned corpus
  (`src/lib/report/verify.ts`); an unmatched claim renders an explicit note in
  place of the quote, and three failures withhold the whole report.

Corpus coverage is partial (19 Articles). `verifyCitation()` returns
`uncovered` for anything else — treat that as unverifiable, never as a pass.
The report generator only supplies Articles the pack covers, so an `uncovered`
verdict means the model cited outside its evidence, not merely that coverage is
thin.

## Model routing

You normally choose the tool yourself (Claude Code vs Codex). Two optional
helpers exist in Claude Code if you want the agent to assist with that choice:

- **`/auto-route`** — classifies the task and either keeps it in Claude Code or
  delegates it to a sub-agent (Codex via `codex:codex-rescue`, Gemini via
  `cc-gemini-plugin:gemini-agent`) without leaving the terminal.
- **`/model-routing`** — gives a one-line recommendation only, no delegation.

Reference docs: `AGENTS.md` (auto-loaded by Codex CLI) and
`.agent/rules/model-routing.md` (for Antigravity) explain the task→tool
rationale.

**Verify model specifics before trusting them — from any source.** The two
skills above *and* those reference docs all name particular model versions and
benchmarks (specific Opus / Gemini / Codex releases). Any of these can lag the
models actually available now and may post-date this assistant's knowledge
cutoff. Do not treat the skills or the docs as authoritative on which model is
newest or "best," and do not repeat their version numbers as current fact. When
it matters, check the live model list in your tool and decide from there. The
Antigravity dropdown matrix in `AGENTS.md` applies only inside Antigravity.
