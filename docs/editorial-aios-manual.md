# Editorial AIOS manual — retired

**Retired 20 August 2026.** This document described the knowledge system as it
existed *before* the rebuild, and following it today would take you to lists that
no longer exist and set fields that no longer mean what it says.

👉 **[`docs/operator-manual.md`](operator-manual.md)** — see §11 *Capturing
knowledge from Claude*.

## What it got wrong

The knowledge system was rebuilt underneath this document in waves 0–1
(19 August 2026) and wave 4a (20 August 2026). Specifically:

- **The Studio section is called "Knowledge", not "Knowledge Inbox"**, and it
  contains Inbox / Ready / All Items / All Sources / Research Runs / Topics /
  Needs Attention / Legacy — not the four lists this document names.
- **The review verdicts are `inbox` / `ready` / `rejected` / `superseded`.** This
  document tells you to set a source to `processed` or `error`. Those are the
  legacy status values, and `error` means *capture failed*, not *rejected* —
  following the old instruction literally files a technical failure where an
  editorial judgement belongs.
- **`knowledgeCandidate` is legacy.** Its replacement is the knowledge *item*,
  which this document never mentions, along with capture, provenance,
  deduplication and the six MCP tools.

## What survived

Its editorial principles were right and are preserved verbatim in the manual —
the "What not to do" list (§11) and the point that a search returning results is
not the same as a draft receiving them (§11).

The `/knowledge` page it describes still exists and still works as described; it
is simply no longer the primary route. `admin-research-workflow.md` §5 covers it.

This file is kept as a pointer so existing links do not break.
