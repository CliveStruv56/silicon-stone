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
