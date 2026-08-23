# Article generation (Claude Code vs website) — superseded

**Retired 20 August 2026.** This guide has been folded into the consolidated
operator's manual.

👉 **[`docs/operator-manual.md`](operator-manual.md)** — see §5 *Drafting*, which
carries the two-path comparison table this document existed for.

Why it was retired rather than updated: it was last reviewed on 22 June 2026 and
its central claim — that `/create` was broken because the Anthropic account was
empty — stated a point-in-time fact as a permanent property of the system. Nothing
in the code makes `/create` fail. The manual treats an empty balance as a
*symptom* with a fix, in §12.

Two other errors, corrected in the manual:

- The persona table used the prompt-builder slugs (`compliance-clara`) and
  presented them as the values Studio accepts. Studio accepts `clara`. Both
  namespaces are real; Appendix A maps them.
- It gave the Pulse format as "under ~600 words". That figure is the *intelligence
  tier*, not the format. The Pulse format drafts **250–300 words** (raised from
  100–140 on 23 August 2026).

This file is kept as a pointer so existing links do not break.
