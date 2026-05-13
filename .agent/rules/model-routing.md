# Model Routing Guide

**Last updated:** 2026-05-10. Recommendations age fast — re-check when a major model ships.

## ROUTING DIRECTIVE — read this before answering any task

Before responding to any user task, do this two-step check:

1. **Classify the task** against the categories in the matrix below (code review, code generation, debugging, refactoring, architecture, market research, planning, writing docs, long-context, quick Q&A).
2. **Compare to the active model.** If the active model is one of the matrix's *primary* or *fallback* choices for this task category, proceed silently. If misaligned, **open your response with one sentence** stating which model would be a stronger fit and why, then ask whether to continue with the current model or pause for the user to switch.

Example flag (active: Gemini 3 Flash, task: security review):
> *Routing note: Claude Opus 4.6 (Thinking) is a stronger fit — lower hallucination rate, catches subtler trust-boundary issues. Pause to switch, or proceed with Flash?*

Don't skip this check. Don't bury the routing note at the bottom. The user loaded this rule because they want misroutes flagged — silent execution defeats the file's purpose.

If the user already accepted a misroute this session, suppress further routing notes.

## How to install

Drop this file at one of these locations in your Antigravity workspace:

- `.agents/rules/model-routing.md` — set activation to **Always On** in the Customizations panel so it's loaded with every task. Recommended.
- `AGENTS.md` (project root) — merge this content into your existing AGENTS.md if you want it shared across Antigravity, Claude Code CLI, and Cursor.
- `~/.gemini/GEMINI.md` — for global activation across every workspace.

Antigravity v1.20.3+ enforces a 12,000-character limit per rules file; this file fits.

## Scope

You have three tools installed: **Antigravity** (multi-model IDE), **Claude Code CLI**, and **OpenAI Codex CLI**. This guide tells you, per task, (a) which model to pick from Antigravity's dropdown, and (b) when it's worth leaving Antigravity for one of the CLIs instead.

Note: Antigravity's dropdown does **not** expose GPT-5/Codex — it only ships `GPT-OSS 120B` as its OpenAI-side option. To use OpenAI's flagship coding model (GPT-5.3-Codex), you must invoke Codex CLI directly.

## TL;DR routing matrix

| Task | Primary | Fallback | Switch to CLI when… |
|---|---|---|---|
| Code review | Claude Opus 4.6 (Thinking) | Claude Sonnet 4.6 (Thinking) | — |
| Code generation / scaffolding | Claude Sonnet 4.6 (Thinking) | Gemini 3.1 Pro (High) | Codex CLI for ≥5 parallel scaffolds |
| Debugging / root-cause | Claude Opus 4.6 (Thinking) | Gemini 3.1 Pro (High) | — |
| Refactoring / multi-file edits | Claude Opus 4.6 (Thinking) | Gemini 3.1 Pro (High) for ≥500K-token repos | Codex CLI for terminal-heavy refactors |
| Architecture / system design | Claude Opus 4.6 (Thinking) | Gemini 3.1 Pro (High) for diagram/multimodal input | — |
| Market research | Gemini 3.1 Pro (High) | Claude Opus 4.6 (Thinking) for the write-up | — |
| Planning | Claude Opus 4.6 (Thinking) | Claude Sonnet 4.6 (Thinking) | — |
| Writing docs / READMEs / PRs | Claude Sonnet 4.6 (Thinking) | Claude Opus 4.6 (Thinking) for highly technical | — |
| Long-context (huge repos, big PDFs) | Gemini 3.1 Pro (High) | Claude Opus 4.6 (Thinking) when retrieval accuracy beats capacity | — |
| Quick Q&A / autocomplete | Gemini 3 Flash | Claude Sonnet 4.6 (Thinking) | — |

## Model cards (Antigravity dropdown)

### Claude Sonnet 4.6 (Thinking)
**Use for ~80% of coding work.** SWE-bench Verified 79.6%, Aider Polyglot ~82%, GPQA Diamond 74.1%. ~40–60 tok/s, $3/$15 per M tokens. Best prose quality of any model in the dropdown — preferred 47% in blind human evals vs 29% GPT-5.4 / 24% Gemini. Weak at MRCR v2 long-context (51.2%) — don't push it past 200K tokens of code if retrieval accuracy matters.

### Claude Opus 4.6 (Thinking)
**Use when reasoning depth pays for the cost.** Tops SWE-bench Verified at 80.8%, Aider Polyglot at ~85%, GPQA Diamond 91.3%, MRCR v2 long-context 76% (best in class). ~20–30 tok/s, $15/$75 per M tokens — 5× Sonnet's price. Lowest hallucination rate of frontier models. Use it for: deep debugging, multi-file refactors, architecture decisions, long-context retrieval where accuracy matters.

### Gemini 3.1 Pro (High reasoning)
**Use for multimodal, long-context, and high-volume coding.** SWE-bench Verified 80.6% (≈Claude), Aider Polyglot 94.2% (leader, March 2026), GPQA Diamond 94.3% (leader), MMMU 85.1%, Video-MME 78.2% (leader). 2M-token context. $2/$12 per M tokens — cheapest frontier model. **Two known weaknesses:** (1) tool-calling can fail in multi-turn agentic flows due to a `thoughtSignature` echo requirement that breaks scaffolds — Antigravity handles it natively but third-party flows hit 400 errors; (2) MRCR v2 8-needle at 1M tokens is only 26.3% — large context window does not equal accurate retrieval at the edges.

### Gemini 3.1 Pro (Low reasoning)
Same model, lower thinking budget. Faster, cheaper. Use for routine queries where High-reasoning latency isn't justified — quick Q&A, single-file edits, autocomplete-adjacent tasks.

### Gemini 3 Flash
Speed-optimised Gemini 3 variant. Sub-second responses, lowest cost. Use for: autocomplete, inline suggestions, throwaway one-shot questions, high-frequency calls inside loops.

### GPT-OSS 120B
Open-weight model hosted via Vertex. **Not** GPT-5 or Codex. Useful when you specifically want an open-weight model (audit, no-vendor-lock-in policy, fine-tune downstream). For most coding work, Claude or Gemini will outperform it. Don't reach for this expecting OpenAI flagship behaviour — it isn't.

## When to leave Antigravity for a CLI

### Claude Code CLI
- **Anthropic's Opus 4.7** (released April 2026) is one minor version ahead of Antigravity's Opus 4.6: SWE-bench Verified 87.6% vs 80.8% (+6.8pp), self-verification loops, 3.3× higher vision resolution, xhigh effort level, stricter literal instruction-following.
- Reach for Claude Code when: you need a very long autonomous coding session (>1 hour, >100K tokens of work), the task benefits from self-verification (security-sensitive code, code generation that must compile first try), or you specifically want strict literal instruction-following.

### OpenAI Codex CLI
- **GPT-5.3-Codex** (Feb 2026) leads Terminal-Bench 2.0 at 77.3% (vs Opus 4.6's 65.4%), is roughly 3× more token-efficient than Claude Code on equivalent TypeScript work, and supports 7+ parallel Codex instances without context loss.
- Reach for Codex CLI when: you want to fire 5+ independent tasks in parallel (scaffold a service + fix a flaky test + write a migration + draft a doc, all in one session), the work is terminal-native (lots of `npm test`, `git`, file ops), or token cost dominates and you need raw throughput.

## Per-task notes and rationale

### Code review
**Default: Opus 4.6 (Thinking).** Code review rewards low hallucination, holistic understanding, and calibrated criticism — Opus leads SWE-bench Verified, has the lowest false-claim rate, and writes more nuanced critiques than Gemini (which tends to "state things with false confidence"). Drop to Sonnet 4.6 for routine PRs under ~500 lines.

### Code generation / scaffolding
**Default: Sonnet 4.6 (Thinking).** Sonnet delivers 98% of Opus's coding quality at 20% of the cost and 2× the speed — ideal for the iterative loop of "scaffold, run, tweak". Switch to Gemini 3.1 Pro (High) when generating across many languages in one go (Aider Polyglot 94.2% leader). Switch to Codex CLI when you want to scaffold 5+ services in parallel.

### Debugging / root-cause analysis
**Default: Opus 4.6 (Thinking).** Debugging rewards careful reasoning and low false claims. Opus's 91.3% GPQA Diamond and lowest-in-class hallucination rate pay off when chasing intermittent bugs. Switch to Gemini 3.1 Pro (High) when the bug requires ingesting massive log dumps or multimodal inputs (screenshots, recorded sessions).

### Refactoring / large multi-file edits
**Default: Opus 4.6 (Thinking).** Top SWE-bench Verified, top MRCR v2 long-context retrieval. Switch to Gemini 3.1 Pro (High) for repos exceeding ~500K tokens — Gemini's 2M context lets you load the whole repo at once. Switch to Codex CLI when the refactor is heavy on terminal ops (Terminal-Bench 2.0 lead).

### Architecture / system design
**Default: Opus 4.6 (Thinking).** Architecture demands trade-off analysis, calibrated nuance, and careful instruction-following. Switch to Gemini 3.1 Pro (High) when the design includes diagrams, screenshots, or video walk-throughs of existing systems (multimodal lead by 7+ points on Video-MME).

### Market research
**Default: Gemini 3.1 Pro (High).** Research benefits from ingesting PDFs, web pages, video, and audio in one call — Gemini's native multimodal at 1M input tokens is unmatched. Hand off the polished write-up to Claude Sonnet 4.6 or Opus 4.6 — Claude wins blind human prose evals 47% vs Gemini's 24%.

### Planning
**Default: Opus 4.6 (Thinking).** Planning rewards calibrated reasoning, attention to constraints, and following complex instructions across many sub-steps. Sonnet 4.6 (Thinking) is fine for plans of <10 steps; Opus pays off for more complex sequencing.

### Writing docs / READMEs / PR descriptions
**Default: Sonnet 4.6 (Thinking).** Best prose quality at the cost tier — preferred 47% in blind human evals. Tone consistency over long outputs is its strongest writing trait. Switch to Opus 4.6 only for highly technical RFCs or formal architecture docs where reasoning depth changes the output.

### Long-context tasks (huge repos, big PDFs)
**Default: Gemini 3.1 Pro (High).** 2M-token context, native multimodal. **Caveat:** if the task requires accurately *retrieving* multiple specific facts from the long context, switch to Opus 4.6 — Gemini's MRCR v2 8-needle at 1M tokens is only 26.3% vs Opus's 76%. Rule of thumb: Gemini for "summarise this whole thing", Opus for "find these 5 specific details across all of this".

### Quick Q&A / autocomplete
**Default: Gemini 3 Flash.** Sub-second, cheap, quality is fine for inline help. Sonnet 4.6 if the question requires reasoning beyond pattern-matching.

## Heuristics for unclear cases

- **Cost dominates the decision** → Gemini 3.1 Pro (High) (cheapest frontier) or Gemini 3 Flash.
- **Latency dominates the decision** → Gemini 3 Flash, then Sonnet 4.6, then Gemini 3.1 Pro (Low).
- **Correctness dominates the decision** → Opus 4.6 (Thinking).
- **Context size > 500K tokens** → Gemini 3.1 Pro (High).
- **Need accurate retrieval at the far end of long context** → Opus 4.6 (Thinking).
- **Output will be read by humans as prose** → Sonnet 4.6 or Opus 4.6.
- **Output is structured code or a diff** → any of the three; benchmark gaps are small.
- **Multimodal input (image, video, PDF, audio)** → Gemini 3.1 Pro (High).

## Caveats

1. **This is guidance, not enforcement.** Antigravity does not auto-route — you (or the agent reading this file) still pick from the dropdown.
2. **Recommendations age fast.** A new flagship can flip the matrix overnight. Re-evaluate when any of the three providers ships a major version.
3. **Cost and rate limits are out of scope** beyond the rough $/M figures. Check your billing tier before assuming Opus 4.6 is affordable for your workload.
4. **Benchmarks disagree.** Terminal-Bench numbers in particular vary by scaffold and run. Treat differences under ~3 points as noise.
5. **Antigravity is one minor version behind on Claude.** It ships Opus/Sonnet 4.6, not 4.7. If a task is at the edge of Claude's published 4.7 capabilities, use Claude Code CLI directly.
