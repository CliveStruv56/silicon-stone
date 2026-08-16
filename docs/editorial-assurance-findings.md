# Editorial Assurance — Internal Findings

**Weak points in the research and verification pipeline, ranked by risk to factual accuracy.**

Assessed 16 August 2026 against `main` at `745063bf`. Internal — not published, and
deliberately not linked from `editorial-assurance.md`.

Each finding records what is wrong, the evidence, why it matters, and a
recommended fix. Findings marked **verified** were reproduced by running the
system, not inferred from reading it.

---

## Summary

| # | Finding | Severity |
|---|---|---|
| 1 | The EUR-Lex drift watcher fails open — and the corpus can no longer be re-fetched | ~~Critical~~ **Fixed 16 Aug 2026** |
| 2 | Nothing prevents publishing a draft with unresolved `[AUTHOR: …]` placeholders | ~~High~~ **Fixed 16 Aug 2026** |
| 3 | Nothing prevents publishing despite a "major issues" fact-check verdict | ~~High~~ **Fixed 16 Aug 2026** |
| 4 | Quotations in articles are never mechanically verified | ~~High~~ **Fixed 16 Aug 2026** |
| 5 | Source URLs and titles are re-emitted by the model, not passed through | ~~High~~ **Fixed 16 Aug 2026** |
| 6 | Publication dates are discarded before drafting | ~~Medium-High~~ **Fixed 16 Aug 2026** |
| 7 | The fact-check never runs automatically, and Deep Dives are least protected | ~~Medium-High~~ **Fixed 16 Aug 2026** |
| 8 | Prior-coverage retrieval has no score floor | ~~Medium~~ **Fixed 16 Aug 2026** |
| 9 | Only the rule pack's corpus text is hashed, not its rules or penalties | ~~Medium~~ **Fixed 16 Aug 2026** |
| 10 | The two normalisers are duplicated by hand with no equality test | ~~Medium~~ **Fixed 16 Aug 2026** |
| 11 | Index shape verification never runs in CI | **Medium** |
| 12 | Only 300 characters of each source reach the model; highlights are discarded | ~~Medium~~ **Fixed 16 Aug 2026** |
| 13 | No source-quality controls on web search | **Medium** |
| 14 | Inoreader is disconnected from the main authoring path and cannot refresh its token | **Low-Medium** |

---

## 1 · The EUR-Lex drift watcher fails open, and the corpus cannot be re-fetched

**Severity: Critical · Verified live · FIXED 16 August 2026 — see the resolution at the end of this finding**

`npm run reg:drift` reports `CHANGED` for all six instruments while
`npm run reg:check` passes. Six simultaneous upstream corrections is not
plausible, and it is not what happened.

**Root cause.** EUR-Lex now sits behind an AWS WAF bot challenge. Automated
clients receive `HTTP 202 Accepted` with `Content-Length: 0` and the header
`x-amzn-waf-action: challenge`. Reproduced directly:

```
$ curl -s -D - -o /dev/null "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02016R0679-20160504"
HTTP/1.1 202 Accepted
Content-Length: 0
x-amzn-waf-action: challenge
```

It affects both the pinned text URL and the base act page, and does not depend on
the user agent — a browser user agent gets the same response.

`getText()` in `scripts/regulatory/drift.ts:71` guards with `if (!response.ok)`.
**`response.ok` is true for 202**, so the empty body is accepted as valid content.
The consequences run in both directions:

- **The tamper check produces a false positive.** `extract('')` yields zero
  articles and empty text, which hashes to `e3b0c442…` — the SHA-256 of the empty
  string. That never matches the manifest, so every instrument reports `CHANGED`
  with a message that actively misdirects: *"This is not an amendment — suspect
  the extractor, or an upstream correction."*
- **The check that actually matters fails silently.** Version discovery
  (`drift.ts:92`) regex-scans the base page for consolidation dates. An empty page
  yields `dates = []`, so `latest` is undefined and no `newer` status can ever be
  raised. Had the tamper check happened to pass, the watcher would report
  `current` while having read nothing at all. This is the fail-open case, and it
  is the more dangerous of the two.

**Second-order consequence — the documented remedy does not work either.**
`scripts/regulatory/fetch.ts:55` uses the same `!r.ok` guard, so `npm run reg:fetch`
also consumes the empty body. It does fail safe: the article-count guard at
`fetch.ts:61` refuses to write when it parses zero articles against an expected
99. But that means **the corpus cannot currently be refreshed by the documented
procedure**, and the next `reviewBy` deadline — 11 November 2026 for the AI Act —
will fail the build with no working path to clear it.

**Also worth knowing:** the scheduled workflow has never run. `gh run list
--workflow=regulatory-drift.yml` returns an empty list; it was added in the most
recent regulatory commit (`b4e47e41`) and the Monday cron has not yet fired. When
it does, it will open an issue reporting six false `CHANGED` findings — and,
running from a GitHub datacentre IP, is if anything more likely to be challenged
than a local run.

**Recommended fix, in order:**

1. Treat a 202, an `x-amzn-waf-action` header, or an empty body as a hard error in
   both `drift.ts` and `fetch.ts`. `if (!response.ok)` should become an explicit
   allow-list of 200 plus a non-empty body assertion. A fetcher that cannot
   distinguish "I was blocked" from "the document is empty" cannot be a safeguard.
2. Add a floor assertion to version discovery: if the base page yields zero
   consolidation dates *for an instrument that has a consolidated CELEX*, that is
   an `error`, not `current`. Only the two original-act instruments (Chips Act,
   Data Act) may legitimately return none.
3. Re-establish a working fetch path before 11 November 2026. Options, cheapest
   first: the EUR-Lex Cellar SPARQL/REST API (`publications.europa.eu`), which is
   intended for machine access and is not behind the same challenge; a WAF-aware
   client that solves the challenge; or a documented manual fallback — save the
   page from a browser and pass it via the existing `--html` flag, which
   `fetch.ts` already supports.
4. Until fixed, either disable the weekly workflow or set it to report rather than
   fail, so it does not train the reader to ignore it. A watcher that cries wolf
   every Monday is worse than none.

### Resolution — 16 August 2026

Fixed. The remedy turned out to be cleaner than expected, because the EU
Publications Office ("Cellar") machine-access endpoint is not behind the
challenge **and serves the same XHTML dialect** the extractor already parses.

New module `scripts/regulatory/source-fetch.ts` is now the only way either
script reads upstream. It:

- derives the URL from `meta.celex` rather than reading `meta.sourceUrl`, so the
  text fetched and the identifier claimed for it cannot disagree;
- rejects any status other than `200` — an equality test, not `response.ok`,
  since the entire failure was a 2xx carrying no document;
- names the bot challenge explicitly by checking for the `x-amzn-waf-action`
  header, so the error never sends the reader hunting the extractor;
- rejects a 200 whose body is below `MIN_USABLE_BYTES` (2 KB, three orders of
  magnitude below the smallest real instrument).

`drift.ts` additionally treats "no consolidation found" as an `error` rather
than `current` whenever the instrument is pinned to a consolidated CELEX — such
an instrument must at minimum discover its own version, so finding none proves
the lookup failed. Only the two original-act instruments (Chips Act, Data Act)
may legitimately return none.

**Verification.** All six instruments were re-fetched from Cellar and compared
against the committed corpus: every one reproduced `source.txt` **byte for byte**
(char delta 0) and hashed identically to the manifest, so the extractor needed no
changes at all. `npm run reg:fetch -- --corpus gdpr` was then run end to end and
left the working tree clean. `npm run reg:drift` now reports all six `ok`,
including the AI Act correctly resolving `latest 2026-07-27, pinned 2026-07-27`.

**Regression guards** added to `scripts/regulatory-index-checks.ts` (CI-blocking):
both scripts must import from `source-fetch`; neither may contain a
`!response.ok`-shaped status test; and `source-fetch` must reference the
challenge header, the `status !== 200` equality, and the size floor. The bad
regex was checked against `if (!r.ok)` and `if (response.status !== 200)` to
confirm it matches the former and not the latter, rather than passing vacuously.

Note the notice lists consolidations of *other* acts too — the GDPR notice cites
`01995L0046-20180525`, the old Data Protection Directive — so the pre-existing
instrument-pinned regex was kept exactly as it was. A generic pattern would
report another act's amendment as drift in this one.

**Not done, and deliberately:** the weekly workflow was left enabled rather than
disabled, since it now reports correctly. It has still never run; the first
Monday firing remains unobserved.

---

## 2 · Nothing prevents publishing a draft with unresolved `[AUTHOR: …]` placeholders

**Severity: High**

The system is carefully designed never to invent a fact it does not have; where
only the author can supply a specific, it inserts a visible `[AUTHOR: …]`
placeholder. That design is sound. But the obligation to resolve them is
documentation only.

`docs/authoring-guide.md` §4 states: *"Do not publish with any `[AUTHOR: …]`
placeholder still in place."* The Sanity schema description for `voiceEditNotes`
repeats it. Neither is enforced. `sanity.config.ts:27` adds only the fact-check
document action to the default action list; the publish action is untouched.

The failure mode is a published article containing a literal `[AUTHOR: confirm
the figure]` in the body — visible to every reader, and worse than a missing
sentence because it advertises that the piece was machine-drafted and not
finished. There is already one instance of this pattern in committed source
(`src/app/(website)/page.tsx:29`, in a comment rather than published prose, but it
shows the placeholder convention escapes into the repository).

**Recommended fix.** Add a Sanity publish action wrapper for the `article` type
that scans the body for `[AUTHOR:` and blocks with a clear message listing the
locations. This is the single highest-value change in this memo: it costs one
small file and converts the most consequential editorial obligation into a
mechanical one.

**Fixed 16 August 2026** — see the joint resolution under finding 3.

---

## 3 · Nothing prevents publishing despite a "major issues" fact-check verdict

**Severity: High**

The fact-check is explicitly advisory. `src/sanity/actions/factCheckAction.tsx`
carries the comment *"Advisory only — nothing here blocks publishing."* An article
whose `factCheck.overallVerdict` is `major-issues` — meaning at least one claim
was found to be contradicted by the evidence — can be published with one click and
no friction.

Nor does anything require that a fact-check has been run at all, or that an
article carries any `citations[]` entries. A published article with an empty
sources list is not detectable by any check in the system.

**Recommended fix.** Extend the same publish-action wrapper from finding 2 to
warn — with confirmation, not a hard block — when:
- `factCheck.status` is absent or not `completed`;
- `factCheck.overallVerdict` is `major-issues`;
- `citations` is empty on a `signal`, `deepdive` or `guide`.

A confirmation dialogue rather than a block is right here: there are legitimate
cases (an opinion-led Pulse with no external claims), and a control the author
routinely has to fight becomes a control they route around.

### Resolution — 16 August 2026 (findings 2 and 3 together)

Fixed by one publish guard, as proposed.

`src/lib/publish-preflight.ts` holds the checks as a pure function with no
Studio or server dependency, so they are unit-testable and cannot drift from
what the dialog claims. `src/sanity/actions/publishPreflight.tsx` wraps
Studio's own publish action — deliberately wrapping rather than replacing, so
publishing keeps its built-in disabled states, its "already published"
handling and its keyboard shortcut. Wired in `sanity.config.ts` by mapping over
the existing action list rather than appending a second publish button.

**Blocker (cannot be clicked past):** any unresolved `[AUTHOR: …]` placeholder
in the Body, Excerpt, Stone Truth or Actionable Insights.

**Warnings (confirm and continue):** no completed fact-check — distinguishing
absent, running and failed; an `overallVerdict` of `major-issues`; and an empty
`citations` list on a `signal`, `deepdive` or `guide`.

Four decisions worth recording:

- **`voiceEditNotes` is deliberately not scanned.** It is the field that *lists*
  the outstanding placeholders, so including it would block every article that
  had ever been through the voice pass — permanently. `sourceMaterial` is
  excluded for the same reason. There is a regression test for this.
- **Detection is on the opening token `[AUTHOR:`, not a balanced pair.** An
  unclosed placeholder is still unresolved, and requiring the closing bracket
  would let the worst-formed case through. It also matches the instruction the
  authoring guide gives a human.
- **Block text is joined before matching.** A placeholder that picks up a mark
  part way through is stored as several sibling spans; matching span by span
  would miss it. This is not hypothetical — the live test used exactly that
  shape and the guard reassembled it correctly.
- **`minor-issues` is not warned on.** Outdated and needs-context claims are
  routine editorial judgement, and warning on them would put the dialog in front
  of nearly every publish, which is how a control gets ignored.

**Verification.** 20 unit tests in `src/lib/publish-preflight.test.ts`, plus a
live run against the Studio driven with Puppeteer on a disposable draft:

- with a placeholder → dialog headed *"Not ready to publish"*, the placeholder
  listed with its field, **no "Publish anyway" button offered**, only "Back to
  the draft";
- with the placeholder removed → dialog headed *"Publish this article?"* listing
  the two warnings, with "Publish anyway" and "Cancel" both present;
- cancel closed the dialog in both cases; nothing was published.

The scratch draft was discarded afterwards and the dataset confirmed clean.

Two of the tests read `sanity.config.ts` and assert the wrapper is actually
mounted, and mounted by wrapping the publish action rather than appended
alongside it — a guard that exists but is never mounted still passes its own
unit tests.

**Not verified live, deliberately:** the clean pass-through, where no issues
means the original publish handler is called with no dialog. Exercising it
requires actually publishing, which on the production dataset would fire the
vectorise webhook and briefly put a scratch article on the live site. It is
covered by unit test instead.

---

## 4 · Quotations in articles are never mechanically verified

**Severity: High**

This is the largest asymmetry between the two lanes, and the most defensible
thing to fix.

The Compliance Checker string-matches every generated quotation against the
pinned corpus (`verifyCitation` → `corpusContainsQuote` in
`src/lib/rulepack/normalise.ts`), deletes any claim whose quote does not match,
and withholds the whole report at three failures. The editorial lane, which
routinely quotes the same statutes in published articles, relies on a prompt
instruction — *"Place quotation marks ONLY around words you have copied
character-for-character"* — and on human review.

CI asserts the instruction is present in the prompt
(`scripts/regulatory-index-checks.ts`). It cannot assert the model complied. So
the strongest sentence in the system is, in the editorial lane, unenforced.

**Recommended fix.** Build a quotation audit for article drafts, reusing what
already exists. For each quoted span in a draft body that sits near an Article
citation, normalise it and test it against the retrieved regulatory chunk text
(which is already stored in full in the chunk metadata, and is already carried
into the run). Surface unmatched quotes in a Studio field alongside the Voice
Edit Notes.

Note the one design constraint: unlike the Compliance Checker, the editorial lane
retrieves only six passages, so a legitimate quotation may come from an Article
that was not retrieved. The audit should therefore report *unmatched* and
*not-retrieved* distinctly, and must be advisory — but it converts "trust the
prompt" into "check the output", which is the whole point.

### Resolution — 16 August 2026

Fixed. The design question turned out to be *what to match against*, and the
answer was better than the one proposed above.

**Not the corpus on disk.** `src/lib/regulatory/meta.ts` says it plainly: the
Next app never touches the corpus files, which is why they are not traced into
the serverless bundle. Reading them at runtime works locally and fails on
Vercel — the same trap that made the house-style rules a generated module.

**Not a fresh Pinecone query either**, which would reintroduce a retrieval step
and a chunk-boundary failure mode of its own.

**The retrieved block, because the retrieved block IS the contract.** The prompt
promises: *"Place quotation marks ONLY around words you have copied
character-for-character from the passages below… If the provision you need is
not below, explain the rule in your own words WITHOUT quotation marks."* A
quotation absent from that block therefore violates the instruction by
definition — it was invented, or recalled from memory, or lifted from a
provision the retrieval did not return, and all three are the failure the
sentence exists to prevent. Auditing against it is free, exact, needs no
infrastructure, and tests the actual promise rather than an approximation of it.

`src/lib/quotation-audit.ts` is pure — no `server-only`, no disk, no network —
so it is fully unit-testable, and it reuses `corpusContainsQuote()` from
`src/lib/rulepack/normalise.ts`: exact substring after Unicode normalisation,
case preserved, the same matcher that protects the Compliance Checker.

Three statuses, mirroring the Checker's vocabulary:

- **verified** — present character-for-character in the supplied text;
- **unmatched** — presented as statute and not in it;
- **uncovered** — presented as statute but no statutory text was retrieved for
  this draft, so there is nothing to check against. Unchecked is never a pass.

Decisions worth recording:

- **Only quotations presented as statute are audited.** The trigger is an
  Article/Annex citation or a named instrument in the same paragraph, reusing
  `INSTRUMENT_TERMS` from `gate.ts` (now exported). Deliberately narrower than
  `looksRegulatory()`, whose generic vocabulary — "compliance", "obligation" —
  would make every quote in a regulatory piece a statutory claim. Articles quote
  ministers and reporting constantly; flagging those would drown the real
  findings.
- **Elisions are split and matched segment by segment.** A writer who writes
  *"the provider shall … ensure robustness"* elided words on purpose, and
  demanding the whole span match would report honest editing as fabrication.
- **A 40-character floor.** Below that a quoted span is a term of art or an
  emphasis quote — `"high-risk"` — not a quotation of a provision.
- **Blockquotes are audited too**, since a long statutory quotation is often set
  that way with no quotation marks at all.
- **It runs after the voice edit**, because that pass rewrites the body; auditing
  the pre-edit text would check quotations the reader never sees. A test asserts
  the ordering.

Surfaced in two places: a read-only **Quotation Audit** field on the article, and
a **warning in the publish guard** when the audit found unmatched quotations —
connecting this to findings 2 and 3. A warning rather than a block, because exact
matching cannot always distinguish an elided or bracketed quotation from an
invented one; the known false-positive sources are documented on the type.

**Verified against a real retrieved block**, not just a fixture. A NIS2 topic
retrieved six passages; a body was built with one sentence lifted verbatim from
them, one plausible fabrication, a minister's quote and a one-word term:

```
2 statutory quotations checked, 1 verified, 1 NOT FOUND in the supplied statutory text.

[UNMATCHED]
  "must notify the Commission directly within four hours of detecting any anomaly,
   regardless of severity"
```

The fabrication is the instructive part: it invents a four-hour notification duty
to the Commission where NIS2's actual duty is 24 hours to the CSIRT. It reads
entirely plausible, it sits beside a correct Article number, and no human reading
quickly would catch it. That is the class of error this closes.

The minister's quote and the one-word `"significant"` were correctly not audited.

26 unit tests, plus three that read `draft-pipeline.ts` and `create/actions.ts`
to assert the audit is actually called, called with the block the model was
given, and called after the voice edit.

**Known limits**, all deliberate: `/import` and `/research` retrieve no statutory
text, so quotations there return `uncovered` rather than verified — honest, and a
useful prompt to check by hand. The local-draft `save` command skips
`finalizeDraft` and so is not audited. And a quotation of a recital will always
be unmatched, because the corpus carries none.

---

## 5 · Source URLs and titles are re-emitted by the model, not passed through

**Severity: High**

`synthesizeContext` in `src/lib/research.ts` asks Claude to return a JSON object
containing a `sources` array. The Exa result objects are not preserved
programmatically — the model copies titles and URLs into its output, and that
output is what reaches the drafting prompt and the on-screen source index.

Every citation therefore passes through a generation step that can silently
mutate a URL, merge two sources, or attach the wrong title to the right link. The
failure is quiet: a plausible-looking URL that 404s, or worse, one that resolves
to something that does not support the claim.

**Recommended fix.** Keep the model's job to summarising, and carry the sources
through in code. Have `synthesizeContext` return only `summary` and
`suggestedContext`, and construct `sources[]` directly from the Exa response
objects already in scope in `performResearch`. If the model's selection among
sources is wanted, have it return *indices* into the result array rather than
reproduced strings. This is a small change with no downside.

### Resolution — 16 August 2026

Fixed by the index route, so the model keeps its editorial judgement about which
sources matter without ever handling a URL.

New module `src/lib/research-sources.ts` holds the plumbing as pure functions —
separate from `research.ts` because that module reaches `server-only` code
(`exa.ts`, `inoreader.ts`) and could not otherwise be unit tested. It provides:

- `registerSources()` — appends results to a numbered catalogue and renders them
  as `[S1] … [S2] …` for the prompt, **deduplicating by URL**, so a story reached
  through both Inoreader and Exa is one entry rather than two the model must
  choose between;
- `selectSources()` — rebuilds the list from the catalogue using the numbers the
  model returned, dropping anything out of range, duplicated or non-numeric;
- `extractReportSources()` — for Deep Dives, whose research arrives as prose with
  inline links and has no structured objects to pass through.

The synthesis prompt now asks for `sourceIndexes` and says explicitly: *"Give the
number and nothing else — do not retype a title, a URL or a snippet anywhere in
your output."*

Decisions worth recording:

- **An unusable selection falls back to the whole catalogue, not to nothing.** A
  malformed response should cost the model's ordering, not every source the
  research found. As a side effect the source list now also survives a synthesis
  parse failure, which it previously did not — the old fallback returned
  `sources: []`.
- **Deep Dive URLs are extracted in code rather than re-typed.** The report is
  itself model-written, so its links cannot be better than the agent made them —
  but extracting means the string reaching the writer is copied verbatim rather
  than passed through a *second* generation step. The source is titled with its
  host; inventing a nicer title is the exact behaviour being removed.
- **The mock dev search was converted from a text blob to structured results**, so
  the offline path exercises the same catalogue code as production instead of a
  parallel one.
- **A `[research] sources gathered=N selected=M` line is logged**, in the idiom of
  the retrieval lanes' notes. Without it a permanent fallback would look
  identical to a working selection.

**Verification.** 25 unit tests in `src/lib/research-sources.test.ts`, including
that selection returns the catalogue's URL rather than any supplied string, that
numeric strings are accepted (models emit them routinely), and that every
malformed-selection shape falls back rather than emptying the list. Three of them
read `research.ts` and assert the prompt still asks for indexes and that
`sources` is built by `selectSources` — if the prompt ever asks for a `sources`
array again, all this plumbing is bypassed in silence.

Two live runs against real Exa and Claude:

- *"EU AI Act general-purpose AI obligations enforcement"* → 8 sources, every URL
  a full real link with Exa's own page title, 0 malformed.
- *"TSMC Dresden fab capacity and European semiconductor supply chain"* →
  `gathered=8 selected=6`, all six matching the ground-truth search.

The second run is the one that matters: it confirms the model genuinely selects
rather than the code always falling back, so the editorial judgement survives
while the strings do not pass through it.

Worth noting that `scripts/local-draft/pipeline.ts` had **always** built its
sources programmatically from the Exa objects. The two paths disagreed, and the
local one was right.

---

## 6 · Publication dates are discarded before drafting

**Severity: Medium-High**

`formatExaResults` in `src/lib/research.ts` renders each result as title, URL and
300 characters of text. `publishedDate` is available on the Exa result — the
fact-check path captures it (`src/lib/fact-check.ts:208`) — but the research path
drops it.

The drafting model therefore cannot distinguish a 2019 article from one published
last week, while house style requires exact dates and explicit status labelling
(current law, proposal, guidance). The recency window helps on the first pass, but
the broaden pass removes it entirely, so genuinely old material can enter without
any date signal attached.

**Recommended fix.** Add `Published: <date or unknown>` to each formatted result,
and add one line to the drafting instruction telling the model to weigh recency
and to state the date of any source it relies on for a time-sensitive claim. Two
lines of code.

### Resolution — 16 August 2026 (findings 6 and 12 together)

Both were one change to `exaToSources`, as expected once the catalogue from
finding 5 existed.

**Dates (6).** `ResearchSource` gains an optional `publishedDate`, captured from
the search and carried through the catalogue, the selection and into the
drafting prompt, which now renders every source as
`- [2026-08-14] Title: snippet (url)`. A new `formatSourceDate()` trims a
zero-time ISO timestamp (`2026-07-02T00:00:00.000Z`) to the date for display —
presentation only, the stored value stays exactly as the search reported it, and
any other shape is passed through untouched rather than parsed, because guessing
at a date format is how a wrong date gets printed with confidence. Inoreader's
unix timestamp is converted at the point of mapping.

The prompt says what to do with them:

> Weigh recency: a source predating the most recent development in the research
> may describe a position that has since moved. When a claim turns on timing, say
> when it was reported. Never present an older source's position as the current
> one, and never infer a date for a source marked "date unknown".

Agentic report links carry no date and render as `date unknown`; deriving one
from the surrounding sentence would be a guess dressed as metadata.

**Highlights (12).** The snippet is now built highlights-first, then body text,
to `SOURCE_SNIPPET_CHARS = 1200` — matching the fact-check's own budget for the
same reason. Eight sources at that size is ~10 KB, small beside a 30 KB deep
report.

**Verified live** on *"EU Cyber Resilience Act obligations for manufacturers"*:
`gathered=8 selected=8 dated=8`, mean snippet 1,200 characters against the
previous 300, and the rendered block leads with the highlight rather than the
page furniture:

> `- [2026-08-14] Organisations must prepare for mandatory 24-hour reporting under
> EU Cyber Resilience Act: ## From 11 September, digital product manufacturers
> must notify authorities of any actively exploited vulnerabilities or severe
> incidents impacting their products or face fines of up to €15 million or 2.5%
> of turnover.`

That is the whole argument for finding 12 in one line. The 11 September date and
the €15 million ceiling are exactly the specifics house style demands; under the
old 300-character cap the model received the standfirst and byline instead.

**`scripts/local-draft/pipeline.ts` now imports `exaToSources`** rather than
mapping Exa results itself. The two call sites had already drifted once, and
after this change a local draft would otherwise have been written from 300-character
undated snippets while the site's used 1,200-character dated ones. A test asserts
the local path does not re-implement the mapping.

12 further tests (suite now 302), including that highlights lead but do not
replace the body text, that `publishedDate` is omitted rather than invented, and
two that read `prompts.ts` to assert the date reaches the writer *and* that the
recency instruction is still there — a date rendered without an instruction is
decoration.

---

## 7 · The fact-check never runs automatically, and Deep Dives are least protected

**Severity: Medium-High**

Three facts compound:

- The fact-check is triggered by hand from Studio. Nothing runs it on draft
  creation, so an article is only checked if the author remembers.
- Deep Dives — the longest, most heavily cited, most commercially significant
  format — are the only format the voice pass does not rewrite. It produces an
  audit and the author applies the changes.
- The Deep Dive's research comes from a single agentic run whose output is
  incorporated wholesale; the claim cap of 18 covers a fraction of a
  6,000-word piece.

The format with the most claims has the lightest automated scrutiny.

**Recommended fix.** Trigger `runFactCheck` automatically after `finalizeDraft`
for `deep_dive` and `signal`, using the same `after()` background pattern the API
route already uses. The report is advisory and lands on the draft, so this costs
an operator nothing and means every substantial draft arrives already checked.
Consider raising the audit cap above 18 for Deep Dives, or checking in two passes.

### Resolution — 16 August 2026

Fixed, though not by the mechanism proposed above.

**Not `after()` inside the generation.** The `/create` page has
`maxDuration = 300`, and generation already spends most of it on five sequential
model calls. Appending a 90–180s fact-check to the same invocation risks the
function being killed mid-run, which leaves `factCheck.status` stuck on
`running` until the route's 10-minute staleness guard clears it.

**Instead the client starts it against the existing route.**
`createDraftFromResearch` now returns the created draft's id, and the form POSTs
to `/api/fact-check` before navigating to Studio. That route already owns the
auth check, the 10/hour rate limit, the re-entrancy guard and its own background
run with its own 300s budget — reusing it means none of that is reimplemented
or allowed to drift. The POST is awaited, because it returns `202` as soon as it
has claimed the run and navigating away sooner would cancel the request.

`src/lib/auto-fact-check.ts` holds which formats qualify. **Signal and Deep Dive
only** — a Pulse is 100–140 words on one verified shift and a Guide explains a
tool, so checking them would spend Exa and model budget producing reports that
are nearly always empty, and a report nobody reads is worse than none.

The constant lives in its own module rather than in `actions.ts` because that
file carries `"use server"`, which may only export async functions; exporting a
`Set` from it is a rule violation waiting to bite. It imports `DraftFormat` as a
type only, so nothing from `prompts.ts` reaches the browser bundle. There is a
test for both.

**A failure to start is deliberately silent** — a `console.warn`, no alert. The
draft is already saved by that point, and an unstarted advisory check must never
be presented to the author as a lost draft.

**Not done, deliberately:** the Deep Dive claim cap stays at 18. Raising it
increases Exa fan-out and pushes the 90–180s runtime toward the route's 300s
ceiling, and choosing a new number without measuring that runtime would be a
guess. It remains worth doing with measurement behind it.

---

## 8 · Prior-coverage retrieval has no score floor

**Severity: Medium**

The regulatory lane applies score floors of 0.30 and 0.55, with the stated
reasoning that *"a weak match is worse than no match: the model uses whatever it
is given"* (`src/lib/regulatory/format.ts`). That reasoning is correct, and it is
not applied to the prior-coverage lane.

`gatherPriorCoverage` in `src/lib/draft-retrieval.ts` calls
`searchSimilar(vector, 5)` with no filter and no threshold, and hands the results
to the model under a heading asserting *"You have already written on related
topics."* On an index of 15 articles, every draft receives five "related" articles
regardless of whether any are related. The model is then invited to reference and
differentiate from work that may have nothing to do with the topic.

The same gap exists in two reader-facing places: the related-articles write-back
in `/api/vectorize` (`topK: 4`, top 3 kept, no threshold) and
`/api/search/semantic` (`topK: 10`, no threshold).

**Recommended fix.** Apply a floor to `gatherPriorCoverage` and to the
related-articles write-back. The regulatory floors were calibrated by measurement
rather than guessed; do the same here — run the existing corpus of published
articles against a handful of on-topic and off-topic queries and pick the
separating value. Also consider composing the prior-coverage query the way the
regulatory lane does: it currently embeds `topic` alone while the regulatory lane
embeds topic, brief, keywords, pain points and persona.

### Resolution — 16 August 2026

Fixed, and calibrated by measurement as the regulatory floors were.

**The measurement.** Three on-topic queries against the live index (15 published
articles) scored **0.421, 0.533 and 0.687** on their best match. Four off-topic
queries topped out at **0.318** — and two of those were chosen to be hard, sharing
the publication's professional register rather than being obviously absurd
("negotiating a warehouse lease in Rotterdam", "onboarding junior engineers
remotely"); the genuinely absurd control, sourdough hydration, reached only 0.147.

`PRIOR_COVERAGE_SCORE_FLOOR = 0.37` is the midpoint of that band: 0.05 clear of
the hardest off-topic case and 0.05 below the weakest on-topic one. The numbers
are recorded in the code, not just the value, because a bare threshold invites
someone to "tune" it later with no idea what it was separating.

**Applied per result, not to the top score alone.** An on-topic query typically
returns two or three genuine neighbours and then a tail around 0.33–0.35, and it
is the tail that produces "as we have covered before" about a piece that covered
nothing of the sort.

**Shared with the reader-facing list.** `/api/vectorize`'s related-articles
write-back imports the same constant, because an unrelated piece under "Related
Intelligence" is worse than an empty section, and `RelatedArticles` already
renders nothing when the list is empty.

**Verified end to end** through the real retrieval path — the behaviour is graded,
which is the point:

| Topic | Result |
|---|---|
| Transatlantic policy divergence (0.687) | 5 of 5 kept |
| AI Act high-risk classification (0.421) | **3 of 5 kept** — the weak tail dropped |
| Warehouse lease in Rotterdam (0.221) | no block injected |
| Onboarding junior engineers (0.318) | no block injected |

Before this, all four received five "you have already written on related topics"
articles.

**The query composition was left alone, deliberately** — and the asymmetry is now
documented in the code so it is not "fixed" later. Prior coverage embeds the
topic alone while the regulatory lane composes topic + brief + keywords + pain
points. That is correct for the mirror-image reason `retrieve.ts` gives for
excluding the research summary: the keywords come out of the research pass and
carry its news vocabulary, which here would pull the search toward whatever this
week's reporting happens to say rather than what the piece is about.

**Not changed:** `/api/search/semantic` (top-K 10, no threshold). It is
admin-only, returns the score with each result, and a human is reading it. A
search interface that hides weak results is a worse search interface; the harm a
floor prevents is a *model* being handed a weak match as context, which is not
what that endpoint does.

---

## 9 · Only the rule pack's corpus text is hashed, not its rules or penalties

**Severity: Medium**

`scripts/rulepack-check.mjs` hashes `rulepack/versions/*/corpus/*.txt` and nothing
else. `rules.json`, `penalties.json`, `timeline.json` and `sources.json` are not
hashed, and the manifest's `corpus` map covers only the 19 text files.

CLAUDE.md states the governing principle: *"Every figure in the pack is a legal
claim. Dates, penalty ceilings and Article anchors are traceable to the EUR-Lex
consolidated text."* But a penalty ceiling, an implementation date or an Article
anchor can be edited today with no build failure and no version bump — the exact
class of silent change the corpus hashing exists to prevent.

**Recommended fix.** Extend the manifest to hash all pack files, not just the
corpus. `rulepack-check.mjs` already walks the version directory; add the four
JSON files to the digest map under a separate key so the failure message can
distinguish "the statute text moved" from "a rule changed". Cheap, and it closes
the gap between the stated principle and what is enforced.

### Resolution — 16 August 2026

Fixed. The manifest now carries a second map, `files`, beside `corpus`:

```json
"files": {
  "penalties.json": "6aed52fc…",
  "rules.json":     "1bd00fd5…",
  "sources.json":   "e1a825d3…",
  "timeline.json":  "b88ecca7…"
}
```

Kept separate from `corpus` deliberately, so the failure message says which kind
of drift happened: statute text moving invalidates every citation ever verified
against it, while a changed rule invalidates a classification. Both stop the
build; they are not the same incident.

**Files are discovered, not listed.** Every `.json` beside the manifest is
hashed, so a new pack file is covered the day it appears rather than the day
someone remembers to add it to the script. A pack with data files but no `files`
map fails rather than passing — a pack predating this check has unverified
figures, and silence would be the wrong answer.

**Hashed by content, not by bytes.** The JSON is parsed, its object keys sorted
recursively, and re-stringified. Array order is preserved, because here it
carries meaning — the penalty tiers are ordered. So a prettier run does not fail
a build, and an edited figure does. The legal claim is the value, never the
whitespace around it.

**Verified by breaking it deliberately.** Three cases, in order:

| Change | Result |
|---|---|
| Nothing touched | `19 corpus files and 4 pack files verified`, exit 0 |
| `penalties.json` reformatted to 4-space indent | still passes, exit 0 |
| `"€35M or 7%…"` edited to `9%` | `penalties.json: content changed`, **exit 1** |

The middle case is the one worth having: a check that fires on whitespace is a
check people learn to bypass.

---

## 10 · The two normalisers are duplicated by hand with no equality test

**Severity: Medium**

`normaliseLegalText` exists twice: in `src/lib/rulepack/normalise.ts` and,
re-implemented inline, in `scripts/rulepack-check.mjs`. The duplication is
deliberate and documented — the script runs before any TypeScript build, so it
cannot import from `src/` — and the manifest records `normalisation: "v1"` so a
divergence is at least visible in principle.

Nothing asserts the two implementations agree. If they drift, the build check and
the runtime verifier would compute different hashes for the same text: either the
build passes on text the verifier will reject, or it fails on text the verifier
accepts. Both are hard to diagnose because the symptom appears far from the cause.

**Recommended fix.** Add a test that imports both implementations and asserts
identical output across the normalisation cases already in `rulepack.test.ts`
(the smart-quote, dash, non-breaking-space and case-preservation cases). The
script's copy can be exported from the `.mjs` for the test to import without
disturbing its no-imports property.

### Resolution — 16 August 2026

Fixed. The normaliser moved out of `rulepack-check.mjs` into a side-effect-free
`scripts/rulepack-normalise.mjs` — necessary because the check script does its
work at import time and would otherwise call `process.exit()` inside the test
run. It stays plain `.mjs`, so the "no imports from src/ before the TypeScript
build" property is untouched.

`src/lib/rulepack/normalise.test.ts` imports both and asserts they agree:

- **24 typographic cases**, one per fold the normaliser performs — each
  whitespace variant, the soft and non-breaking hyphens, all ten quote forms, the
  dashes, the ellipsis — plus the traps around them: empty input, whitespace
  only, combining accents, and one string containing all of it at once;
- **every corpus file in every live pack** — 19 files today. Synthetic cases only
  prove the folds someone thought to write down; the corpus is the text the
  hashes are actually computed over;
- that both declare the same `NORMALISATION_VERSION`, and that each pack's
  manifest records that same string — otherwise the manifest is a lie about
  which normalisation its stored hashes mean.

**Verified by breaking it deliberately.** Deleting the em-dash fold from the
build-time copy failed three cases (`en dash`, `em dash`, `everything at once`).
Worth noting what that exercise showed: the 19 corpus-file comparisons did *not*
fail, because the corpus happens to contain no en or em dashes. The synthetic
battery caught a divergence the real data would have missed, which is the
argument for having both rather than either.

Extraction was proved behaviour-preserving before anything else changed: the
manifest's 19 corpus hashes are byte-identical before and after.

One honest note on the new module: its character classes hold literal glyphs,
matching the TypeScript. Several — soft hyphen, zero-width space, the BOM — are
invisible in a diff, so each class carries its code points in the comment beside
it. The comment is a courtesy; the equality test is the guarantee.

---

## 11 · Index shape verification never runs in CI

**Severity: Medium**

`reg:verify-index` and `articles:verify-index` are the only checks that would
detect an index carrying an embedded-text configuration — the failure that
produced measured similarity of 0.09 against 0.54 and prompted the August 2026
migration. Neither runs in `check.yml`; both are manual.

They also perform the per-instrument live-versus-committed record count, which is
the only thing that detects records stranded by a re-chunk. A namespace total
cannot: re-ingesting an instrument overwrites the IDs that still exist and
silently leaves the ones that no longer do, so stale text stays retrievable
indefinitely.

The exclusion is understandable — both need live Pinecone credentials and the
network, and the project deliberately keeps network-dependent checks out of the
build. But the same reasoning produced the weekly drift workflow, and the same
solution applies.

**Recommended fix.** Add both to a scheduled workflow alongside
`regulatory-drift.yml` — weekly is ample — with the Pinecone key as a repository
secret, opening or commenting on an issue on failure. Keep them out of `prebuild`
for the stated reason.

---

## 12 · Only 300 characters of each source reach the model, and highlights are discarded

**Severity: Medium**

`searchExa` requests `text: true` and `highlights: { numSentences: 3,
highlightsPerUrl: 1 }`. `formatExaResults` then renders
`r.text.substring(0, 300)` and never touches `r.highlights`.

So the drafting model sees, per source, the first 300 characters of the page —
which on a news article is typically the standfirst and byline, not the
substance — while the three most query-relevant sentences that Exa already
selected and returned are thrown away. The evidence base is both thinner and less
relevant than the search was capable of producing. The fact-check path does this
correctly (highlights first, then text, up to 1,500 characters); the research
path does not.

**Recommended fix.** Mirror the fact-check's `snippet` construction in
`formatExaResults`: highlights first, then text, to a larger budget. Eight results
at 1,200 characters is roughly 10 KB, which is small beside a 30 KB deep report.

**Fixed 16 August 2026** — see the joint resolution under finding 6.

---

## 13 · No source-quality controls on web search

**Severity: Medium**

`searchExa` accepts an `includeDomains` option — commented *"Hard-restrict to
these domains. Off by default to preserve recall"* — and no caller passes it.
There is no `excludeDomains` anywhere. There is no relevance threshold, no
re-ranking, and no source-quality weighting: Exa's ranking is used as returned.

For a publication whose house style requires primary sources and whose fact-check
prompt explicitly rules out *"blogs, vendor content, or aggregators"*, the
research step applies no such standard at the point where sources are actually
selected. A vendor blog post that ranks well is treated exactly like a Commission
communication.

**Recommended fix.** Two low-cost options, either or both:
- Maintain a deny-list of known aggregators, content farms and vendor blogs and
  pass it as `excludeDomains`. Recall is preserved; noise is not.
- Annotate each formatted result with its domain, and add a line to the drafting
  instruction to prefer primary sources and to state when a claim rests only on
  secondary reporting.

The second is nearly free and does not risk excluding a source that turns out to
matter.

---

## 14 · Inoreader is disconnected from the main authoring path and cannot refresh its token

**Severity: Low-Medium**

Two separate issues with the curated feed.

**It is not wired to `/create`.** The Inoreader token is read only in
`src/app/(admin)/research/actions.ts`; `/create` calls the research pipeline with
no token. The curated `S&S Approved` label — the one input in the whole system
that has already passed a human editorial filter — informs only the secondary
research console, not the main drafting path. The workaround is the author
reading Inoreader themselves and typing a topic, which works but discards the
curation.

**The OAuth token cannot refresh.** `exchangeCodeForToken` handles the
authorisation-code grant only. The refresh token is stored in a cookie with a
one-year lifetime and never used; there is no `grant_type: refresh_token` path
anywhere. When the access token expires (30 days by default), `searchItems`
returns `[]` — errors are swallowed and return an empty array — so the failure is
silent. Research continues with Exa alone and nothing reports that the curated
feed dropped out.

**Recommended fix.** Implement the refresh grant and call it on a 401 from
`searchItems`; surface a connection-expired state in `InoreaderStatus` rather than
degrading quietly. Separately, decide deliberately whether `/create` should read
the curated feed — if the answer is no, say so in `authoring-guide.md`, because
the current split looks like an oversight rather than a decision.

---

## What is working well

Worth recording, so the fixes above are read in proportion.

- **The lane separation is real and enforced.** A CI check greps the Compliance
  Checker's directories for any reference to the editorial retrieval lane and
  fails the build on a match. Two copies of the AI Act exist on purpose, and
  nothing can quietly merge them.
- **The withhold logic is genuinely fail-closed.** An uncovered Article counts as
  a failure rather than a pass; an unreadable file degrades to uncovered; three
  failures withhold the whole report. The tests assert both sides of the
  threshold.
- **The routing and score floors work as documented.** Verified live: the AI Act
  query routed correctly at 0.830, NIS2 rendered its Directive caveat, and the
  semiconductor labour-market query was correctly refused at 0.473 against the
  0.55 floor.
- **The corpus is committed, hashed and count-checked.** The extractor refuses to
  write when the article count does not match, which is what stops a parser
  regression producing an index that looks healthy and cites nothing.
- **The "no silent failure" guard is unusual and valuable.** A CI check forbids
  empty `catch {}` blocks in the retrieval path, on the reasoning that an
  unqueried index is indistinguishable from a broken one. That is the correct
  instinct, and finding 1 is precisely a case of it not being applied to a fetch
  path.

---

## Suggested order of work

1. ~~**Finding 1** — the drift watcher and the fetch path.~~ **Done, 16 Aug 2026.**
   The 11 November review deadline now has a working refresh path behind it.
2. ~~**Findings 2 and 3** — the publish-action wrapper.~~ **Done, 16 Aug 2026.**
   The two largest editorial obligations are now mechanical.
3. ~~**Finding 5** — pass sources through in code.~~ **Done, 16 Aug 2026.**
4. ~~**Findings 6 and 12** — richer, dated source context.~~ **Done, 16 Aug 2026.**
5. ~~**Finding 4** — the quotation audit.~~ **Done, 16 Aug 2026.**
6. ~~**Findings 7 and 8**~~ **Done, 16 Aug 2026.**
7. ~~**Findings 9 and 10**~~ **Done, 16 Aug 2026.**
8. Remaining: **11** puts the index-shape checks on a schedule; **13** adds
   source-quality controls to web search; **14** is the Inoreader wiring and its
   silent token expiry. None is load-bearing on a published fact today, which is
   why they sit below the line.
