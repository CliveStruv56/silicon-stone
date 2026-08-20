# Brief — the Silicon & Stone operator's manual

**Written:** 2026-08-20 · **Baseline:** `e048109b`
**Status:** **contract only. The manual does not exist yet.**
**For:** the next session. This says what to write and what not to; it is not
the manual and deliberately contains none of its content.

## What is being asked for

A manual for running the publication: how an article gets researched, drafted,
edited, checked, published and captured back into knowledge — written for the
person operating it, not the person who built it.

## Read this first: four guides already exist and overlap

The manual is a **consolidation**, not a greenfield document. Writing a fifth
overlapping guide would make the situation worse. What is on disk today:

| Doc | Lines | Covers | Problem |
|---|---|---|---|
| `authoring-guide.md` | 210 | `/create`, research → draft → publish, for admins | the closest thing to the manual; unclear when last true |
| `article-generation-guide.md` | 178 | Claude Code (Max plan) vs website `/create` | "_Last reviewed: 22 June 2026_" — two months stale |
| `admin-research-workflow.md` | 381 | what the research button actually does, Exa vs Pinecone | reference, not instruction; explains one step in depth |
| `editorial-aios-manual.md` | 276 | `/knowledge`, Studio inbox, what is stored where | **partly obsolete** — describes the pre-foundation world |

**Decide the disposition of each before writing a word.** Options per doc:
fold in, keep as a deep-dive the manual links to, or retire with a pointer.
`editorial-aios-manual.md` is the urgent one: the knowledge system was rebuilt
underneath it in waves 0–1 and 4a, and a reader following it today will be
told about a world that has moved.

## What the manual has to cover

Sketched from what exists, not prescriptive about structure:

1. **Getting in** — `/login`, the admin password, what the route groups mean.
2. **Research** — `/create`, standard vs Deep Dive (Railway job, polled), what
   Exa does and what Pinecone does *not* do at that step.
3. **Drafting** — the five formats (Pulse, Signal, Deep Dive, Research Only,
   YouTube Script), personas, and the two paths: the website button (Anthropic
   API credits) versus Claude Code on the Max plan (`/ss-draft-local`).
4. **Editing** — the `/voice-edit` skill, the `[AUTHOR: …]` placeholder
   convention, what "voice DNA" actually constrains.
5. **The three draft-time guards, and that all three are advisory** — quotation
   audit, auto fact-check, publish preflight. None blocks generation; preflight
   blocks *publish* on an unresolved placeholder and warns on the rest. A
   reader must not come away thinking the machine guarantees accuracy.
6. **Publishing** — Studio, categories (they drive the gate), cover images,
   the publish dialog and what its warnings mean.
7. **After publishing** — vectorisation on publish, related articles, prior
   coverage, and what the newsletter/Substack step is.
8. **Capturing knowledge** — the six MCP tools, the inbox, and the review
   states. Everything captured is a draft awaiting review; nothing publishes.
9. **When it goes wrong** — the failure a reader will actually hit, with the
   symptom first: draft generation 400s (Anthropic credit), fact-check stuck on
   `running`, capture returns 404/503/401 (flag, token, success respectively).

## Constraints worth stating up front

- **Write for the operator, in the order they act.** The existing docs are
  organised by system; the manual should be organised by what you are trying to
  do. `admin-research-workflow.md` is the model of what the manual is *not* —
  it is excellent reference and the wrong shape for instruction.
- **Say what is advisory.** The guards warn; a human is the last control. A
  manual that implies otherwise is worse than no manual.
- **Do not restate prices.** Every figure comes from `src/lib/offering.ts`, and
  a price written into a doc is a price that will go stale and contradict the
  site. Point at the products, not at the numbers.
- **Do not document the Compliance Checker's internals here.** It has its own
  state doc and its own invariants in `CLAUDE.md`. One paragraph and a link.
- **Screenshots age badly**; prefer naming what the reader is looking for.
- **Mark what is not yet live.** Kit tags do not exist, Lemon Squeezy has no
  store, v2 of the checker is dark. A manual describing them as working is a
  manual that gets distrusted on first use.

## Open questions for the owner

1. **Who is the reader?** Only you, or someone you would hand this to — a
   freelance writer, an assistant? That changes how much is assumed about the
   admin password, Sanity access and the Max-plan path.
2. **One document or several?** A single manual is easier to keep true; a set
   is easier to read. Given four guides already drifted, the argument for one
   is strong.
3. **Does it live in `docs/`, or somewhere you would actually open it** — the
   Notion command centre, or a published Artifact?
4. **Does it cover the tools** (Compliance Checker, Supply Chain Mapper,
   Scenario Modeler, Policy Stress Test) as things to operate, or only the
   publication?

## Before writing

**Walk the pipeline once, end to end, and write down what actually happens.**
Three defects on 2026-08-20 were found by opening a record in Studio rather than
by running the suite; a manual written from the code rather than from use will
document the intended system instead of the real one. Generating one throwaway
draft and taking it to the point of publish is the research for this document.

## Related

- `project_summary.md` §5 (what is on sale), §8 (file locations), §9 (history).
- `CLAUDE.md` — the invariants any instruction here must not contradict.
- `LAUNCH.md` — what is owner setup rather than operation.
- `docs/knowledge-system-foundation.md` and the wave briefs — the capture half.
