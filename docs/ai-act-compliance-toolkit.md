# AI Act Compliance Toolkit — where it lives

**This is a pointer, not the document.** The Toolkit is a generated deliverable, so it has no copy in `docs/`.

- **Sources (committed):** `deliverables/src/` — `_sections-1-6-7.md` (sections 1, 6 and the appendix) plus `section-2.md` … `section-5.md`. Edit these.
- **Build:** `node deliverables/src/assemble-toolkit.mjs`
- **Output (gitignored, regenerable):** `deliverables/dist/AI Act Compliance Toolkit.md`, rendered to `.pdf` via the [markdown-to-PDF pipeline](markdown-to-pdf-pipeline.md).

The PDF and its two companion workbooks are the £79 / £275 product attached to the Lemon Squeezy listing — see `LAUNCH.md` §0 for the file-to-product mapping. The £275 Professional tier also needs a 30-minute video walkthrough, which is not yet recorded.

**Do not commit the built markdown or PDF back into `docs/`.** A copy drifts from `deliverables/src/` the moment a section is edited, and a stale risk-classification tree in a compliance product reads as authoritative when it is wrong. Every figure in it is traceable to the EUR-Lex consolidated text at CELEX `02024R1689-20260727`; verify against that before changing one.
