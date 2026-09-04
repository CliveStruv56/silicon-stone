# CLAUDE.md

Guidance for Claude Code in this repo. See also `project_summary.md` (session
handoff), `docs/operator-manual.md` (how the publication is actually run —
research, drafting, the guards, publishing, knowledge capture) and the persistent
auto-memory in `MEMORY.md`.

## The operator's manual is guarded (do not paper over a failure)

`docs/operator-manual.md` is the single manual for running the publication. It
replaced four overlapping guides that had gone stale together and then
**contradicted each other on eight points of fact**, with nothing failing to
say so. `scripts/manual-checks.ts` (`npm run test:manual`, in `prebuild` and
CI) is what stops that recurring: 20 checks that read a value out of the code
and assert the manual still states it.

Two rules when it fails:

- **A failure is a real signal.** Either the code changed and the manual needs
  updating, or a check went blind. Fix one of those — never delete the check or
  loosen it to green.
- **Every extractor must fail loudly when its anchor is missing.** A regex that
  silently stops matching turns the guard into a rubber stamp, which is the
  exact failure it exists to prevent. Three checks did this on first run and
  were caught only because they assert their anchor was found. **Mutation-test
  every check you add** — change the code it reads and watch it go red. A check
  that has only ever been seen passing has not been tested at all.

Guard facts, not prose: numbers, enum values, field names. Wording changes
legitimately; a guard that fights the writer gets switched off.

## Studio's admin session bridge (load-bearing — do not widen)

`/api/studio-session` trades a Sanity user token for the ordinary `/login` admin
cookie, so Studio's own buttons ("Run fact-check", "Suggest two prompts") stop
failing when the 24-hour admin session lapses. Three properties are the whole
security of it, and `src/lib/sanity-identity.test.ts` asserts each:

- **The identity lookup goes to the project-scoped host**
  (`https://<projectId>.api.sanity.io/...`), never the global `api.sanity.io`.
  On the global host a valid token for somebody else's project would
  authenticate here.
- **Administrator role, not membership.** Sanity returns the caller's roles for
  this project on the same response. An account invited as an editor or viewer
  must not inherit the metered Claude/Exa/OpenAI pipeline.
- **It fails closed.** A Sanity outage returns null, not a pass.

It mints no new session format — the cookie is exactly what `/login` sets, with
the same verifier — so nothing downstream had to learn about Sanity. Do not add
`/api/studio-session` to the middleware matcher: it is what creates the session
the matcher looks for. The client half (`src/sanity/lib/studio-session.ts`)
retries a 401 **once**, never a 403/409/429, and degrades to the old `/login`
fallback if Studio's token storage ever moves.

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
- **Three `overrides` exist for security patches, and one of them deliberately
  contradicts a declared range.** `next@15.5.23` declares `sharp: ^0.34.3`, but
  every `sharp` below `0.35.0` carries four inherited libvips CVEs and npm
  offers only `next@16` as the fix — which `CLAUDE.md` forbids. So `sharp` is
  overridden to `^0.35.3`, and that was verified rather than assumed: Next's
  image optimizer was exercised against a real Sanity asset and returns a
  correctly resized image on the plain path and a WebP on the browser `Accept`
  path. `nanoid@^3.3.18` and `ws@^8.21.3` are ordinary patches. Re-verify the
  image path if the `sharp` override moves again.
- **Do NOT run `npm audit fix --force`.** It proposes `next@16`, `sanity@6` and
  `next-sanity@13`, every one of which the ceilings above forbid. The remaining
  audit findings all sit under the `sanity` CLI/export toolchain, which never
  executes in the Vercel function runtime; they resolve with the planned
  Next 16 / Sanity v5 upgrade.

## AI Act rule pack (load-bearing — do not break)

The Compliance Checker's legal payload lives in `rulepack/versions/<version>/`,
not in TypeScript constants. Two rules:

- **Never edit ANY pack file without bumping the pack version.** `prebuild` runs
  `scripts/rulepack-check.mjs`, which exits 1 on any hash drift — that is
  deliberate. Pack content and pack version move together, or every citation
  previously verified against it is silently invalidated. Intentional change:
  bump the version directory, then `npm run rulepack:hash`.
- **Every figure in the pack is a legal claim.** Dates, penalty ceilings and
  Article anchors are traceable to the EUR-Lex consolidated text at CELEX
  `02024R1689-20260727`. Verify against that before changing one; do not take a
  date from a summary, a blog post, or a build spec.
- **Both halves of the pack are hashed** (since 2026-08-16). `manifest.corpus`
  covers `corpus/*.txt` — verbatim statute, folded through the legal-text
  normaliser. `manifest.files` covers every other `.json` in the version
  directory: `rules`, `penalties`, `timeline`, `sources`. Those were unhashed
  until then, so a penalty ceiling could change with no build failure. The two
  maps are separate so the error says which kind of drift happened. Data files
  are hashed by *content* — parsed, object keys sorted, re-stringified — so
  reformatting is not a change and an edited figure is. Files are discovered,
  not listed: a new pack file is covered the day it appears.
- **The normaliser exists twice and a test holds it together.**
  `src/lib/rulepack/normalise.ts` is the runtime copy;
  `scripts/rulepack-normalise.mjs` is the build-time mirror, plain `.mjs`
  because `prebuild` runs before any TypeScript. `src/lib/rulepack/normalise.test.ts`
  asserts they agree across every typographic fold and every corpus file. If
  they drift, the build gate and the citation verifier compute different hashes
  for the same text, and the symptom appears nowhere near the cause.

Four invariants the tool promises on screen and must keep:

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
- **A result item is never presented as a duty unless it is one** (since
  2026-08-17), **and no result item asserts a citation it cannot link** (since
  2026-08-18). `RuleFinding.actions` is `RuleItem[]`, not `string[]`, and each
  item carries a `kind`: `duty`, `conditional`, `concession`, `support`,
  `enforcement` or `good-practice`. The card was once headed "Immediate
  obligations" over a list that mixed an Article 26(6) retention duty with an SME
  concession, a support measure whose sandboxes need not exist until 2027, and a
  statement about how fines are calculated. Invariants in
  `src/lib/ai-act-rules.test.ts` hold the line: no `-proportionate-relief` item
  may be a duty, every duty carries an `article`, and every item carries a
  substantive `basis`.

  `RuleFinding.vendorQuestions` is `VendorQuestion[]` on the same pattern, with
  `why` in place of `basis`. Seven of those questions used to open
  "Article 13 — …" inside the prose and eight carried no anchor at all, so a
  reader could not tell a citation from a sentence and the card could not link
  either. The tests forbid the prefix, require an anchor on every question
  outside a **named** two-item exception list (`vendor-evidence-data-terms`,
  which is GDPR rather than the AI Act; `vendor-gpai-documentation`, whose
  chapter is outside the corpus), and hold `article` and `corpusArticle` in
  agreement exactly as they do for actions. Both exceptions render a "No AI Act
  anchor" badge — a blank where every neighbour shows a citation reads as an
  omission rather than a decision.

Three consequences of that shape worth not undoing:

- **The Article anchor is a field, not prose.** `article` and `corpusArticle` are
  per *item*, where the pack's `ruleAnchors` are per *rule* and can hold only one
  provision each — `sme-proportionate-relief` is anchored to the lump
  "Articles 11, 17, 57 and 99(6)". A test asserts every `corpusArticle` is a key
  of `RULE_PACK.manifest.corpus`, so an explainer link can never 404, and that
  `articleNumberFrom(article)` agrees with it, so an anchor cannot be
  copy-pasted onto the wrong provision. Do not put citations back in the prose.
- **`basis` and per-item anchors live in TypeScript, deliberately.** They are
  authored explanation, the same class of content as the obligation prose that
  already sat there, and `src/lib/rulepack/index.ts` scopes the pack to dates,
  ceilings, anchors, citations and corpus. Keeping them out of the pack is what
  let this ship without a version bump. Note the pack has **no `article17` or
  `article57` entry in `sources.json`**, so per-item Service Desk links would
  force the full bump procedure — the corpus-backed provisions page does not, and
  is the stronger citation anyway.
- **Reliefs scoped to high-risk providers are gated on that path.**
  Articles 11(1) and 17(2) relieve *provider* duties on *high-risk* systems.
  `sizeReliefActions()` gates them on `hasProviderDuties() && inAnnexIIIDomain()`;
  firing them on organisation size alone told an SME deploying a minimal-risk
  chatbot it could simplify Annex IV documentation it never owed.

The paid report is handed these items in three labelled prompt blocks
(`src/lib/report/generate.ts`), never one flat list. **The citation verifier
cannot catch a promoted concession** — a model writing "you must use the
simplified form" can quote Article 11(1)'s genuine "*it shall use the form
referred to in this paragraph*" and verify clean, because that sentence is
mandatory once you opt in. The structural split and the labelling are the whole
mitigation; do not assume `verifyReport()` covers this.

`/tools/compliance-checker/provisions/[article]` renders the pinned corpus for a
reader: 25 statically prerendered server pages, because `rulepack/corpus.ts` is
`server-only` and the checker is a Client Component. The count is not hardcoded —
the index renders `coveredArticles().length`, so it follows the pack. Each page
sets its **own** canonical — the parent layout hard-codes one pointing at the
checker, which inherited would deindex all but one. Statute published on a
commercial site carries the
EUR-Lex "consolidated text, no legal value, only the OJ is authentic" notice and
the EU source acknowledgement; that is not decoration.

Corpus coverage is partial: **27 Articles plus Annex III**. Annex III arrived
2026-08-18; Articles 10, 14, 15, 16 and 43 on 2026-08-19 in pack `2026-08-19`;
Articles 4, 27 and 86 the same day in pack `2026-08-19b`. All from the same CELEX
and with `corpusCutOff` unmoved at `2026-07-27` — the same consolidation, just
more of it read out of it. **The `b` suffix is deliberate**: two packs were cut
on 2026-08-19, and dating the second `2026-08-20` would put a false date on the
provenance of a legal claim. Version keys sort lexicographically, so a suffix
orders after its parent; `rulepack.test.ts` allows `^\d{4}-\d{2}-\d{2}[a-z]?$`. Fetch an Article with
`npm run rulepack:fetch-article -- --version <pack> --article <n>`, which is the
Annex script's twin and asserts the served consolidation date the same way. It
emits each lettered point on one line, as the Annex fetcher does; the original
nineteen Articles put the marker in its own block. The two forms normalise
identically, so a citation verifies the same either way — do not add a reshaping
step to make them look alike. Annex III is keyed `annex-iii`, not a
number — `corpusPath()` and `coveredArticles()` branch on that prefix, and
`provisionLabel()` exists so no page is ever headed "Article annex-iii". A
numeric sort over a mixed key set yields NaN comparisons, which is an unstable
order rather than an error, so annexes are sorted separately and appended.
`verifyCitation()` returns
`uncovered` for anything else — treat that as unverifiable, never as a pass.
The report generator only supplies Articles the pack covers, so an `uncovered`
verdict means the model cited outside its evidence, not merely that coverage is
thin.

## Compliance Checker v2 (in build, behind a flag)

**Read `docs/compliance-checker-v2-state.md` first** — one page on how to run it,
what exists, what is deliberately unfinished, and which decisions are open.
`docs/# EU AI Act Compliance Checker v2 — Impl.md` is the plan of record — 23
sections, 8 phases. **All eight are built** under `src/lib/compliance-v2/` and
`src/components/tools/checker-v2/`; v1 is untouched and remains what every user
gets. Reaching v2 needs `NEXT_PUBLIC_COMPLIANCE_CHECKER_V2=true` **and** `?v2=1`
on the checker URL. Progress and per-phase state live in `project_summary.md` §11.

Its central move: **no score decides a legal classification.** v1 returns
"Likely high-risk" on `score >= 5` with no rule having classified anything —
that and five other defects are documented in
`docs/compliance-checker-v1-known-defects.md` and asserted as *still present* in
`src/lib/compliance-v2/v1-invariants.test.ts`. Those are characterisation tests:
when v2 fixes one, the test fails and must be moved and inverted, never deleted.

Five things not to undo:

- **An unknown is a state, never a value.** `AnswerState` is
  `answered | unknown | not_applicable | declined`, and `evaluateCondition`
  refuses to satisfy a value test from a non-answered state. v1's defect 5 is
  that "not sure" about personal data produced a result byte-identical to "no".
- **Branch conditions are data, not closures.** That is what lets
  `validateCatalogue()` reject a condition referencing a question that does not
  exist *or one asked later* — a forward reference means the branch never opens
  and nothing errors.
- **Every high-risk result cites an exact route.** `classify.ts` contains no
  arithmetic; `statutoryRoutes` is empty exactly when nothing was cited, and
  `hasStatutoryRoute()` is asserted across every golden scenario.
- **Legal content is curated, versioned and corpus-verified.**
  `legal-content/propositions.ts` holds every quotable extract;
  `npm run test:checker-v2` (in `prebuild`) string-matches all of them against
  the pinned pack and fails the build on a mismatch. A finding may only cite a
  proposition, and a report may only cite what its own findings carry.
- **The model writes prose, never law.** `report/schema.ts` gives generated
  output no field for an obligation, a citation or a date;
  `report/verify.ts` implements §14.4 with no tolerance threshold. The email
  address is not in `AnswerRecordV2` at all, so it cannot reach a prompt.
- **The GDPR overlay is downstream of everything and upstream of nothing.**
  `engine/gdpr-ai.ts` takes the answers and nothing else — no classification, no
  roles, no findings — so there is no argument by which a data-protection answer
  could change an AI Act conclusion. `gdprExposed` and `gdprSettled` are two
  golden scenarios with identical AI Act answers and opposite data-protection
  ones, and the test compares the whole AI Act half deeply. It also **cites
  nothing**: no pinned GDPR corpus exists for this lane, so every overlay finding
  has no `source`, names no provision in its prose, and wears no AI Act role
  (controller is not a deployer). `verifyReport` checks those three absences and
  drops the whole block rather than showing a heading over nothing.

**Article 5's prohibitions are conjunctions, and clearing one is a feature.**
`engine/article-5.ts` evaluates every limb of all ten practices and returns
`not_engaged`, `unresolved` or `all_limbs_met`. A cleared practice is *shown*,
not dropped — the reader ticked the box and is owed the answer. A complete path
still reports `potentially_prohibited` at `medium` confidence: §6.3's enum has no
`prohibited` value, the answers are self-reported judgements about the user's own
system, and the content is `reviewStatus: 'internal'`. Do not add a `prohibited`
classification without counsel review.

**The high-risk provider path emits the whole of Chapter III Section 2**, as of
2026-08-19: Articles 9, 10, 11, 12, 14, 15, 16, 17 and 19, plus registration
under Article 49 and the conformity assessment under Article 43. Before any of it
existed a high-risk provider was told it owed nothing at all, which Phase 8's
shadow comparison found; between 2026-08-19 morning and evening it was a six-item
list with a caveat finding admitting the omission. **The caveat is now deleted**,
because a caveat that no longer bites is worse than none — its surviving idea, that
the pack holds the provisions this tool cites rather than the Regulation, is said
once in the result footer instead. Do not reintroduce it as a finding.

**The high-risk deployer path emits the whole of Article 26**, as of 2026-08-19 —
all eleven operative paragraphs. Before that it was two findings. Five of them
(26(4), (7), (8), (9), (10)) are `conditional_obligation` because each turns on a
fact the questionnaire never asks — input-data control, being an employer, being
a public authority, owing a data protection impact assessment. Do not promote
them to flat duties: that asserts things about the reader nobody established.
26(3) emits nothing; it is a without-prejudice clause. 26(10) is gated on the
biometrics route because it governs *post*-remote identification, where Article
5(1)(h) governs the real-time case.

**Both caveat findings are now gone.** The deployer's
(`high-risk-deployer-duties-incomplete`) went the way the provider's did, when
pack `2026-08-19b` added Articles 4, 27 and 86 — the three it named. Do not
reintroduce either; the surviving idea, that the pack holds the provisions this
tool cites rather than the Regulation, is said once in the result footer.

**Articles 4, 27 and 86 do not share an application date, and that is the thing
most likely to be got wrong.** Article 4 (AI literacy) is Chapter I and has
applied since **2 February 2025**; Article 86 (right to an explanation) is
Chapter IX, which none of Article 113's carve-outs reach, so it has applied since
**2 August 2026** — ahead of the Chapter III duties owed on the very same
systems. Only Article 27 waits, to 2 December 2027 on the Annex III route.
`dates.ts` exposes `AI_LITERACY_APPLIES` and `GENERAL_APPLICATION_APPLIES` so
neither date is written in a finding; the second is an alias of the transparency
label because the pack's entry for 2 Aug 2026 carries the *general* application
basis (Article 113, second paragraph), and a finding about Article 86 must not
appear to cite Article 50.

**Article 4 is the only legal finding not gated on a classification.** It binds
providers and deployers of any AI system at any tier, so it reaches the reader a
minimal-risk result would otherwise tell to do nothing — which was false. It is
emitted after the tier-specific findings, and never on an out-of-scope result,
where `buildLegalFindings` has already returned. Two consequences that bit once:
every shadow scenario's v2 duty count rose by one, which cancelled the `dutyDelta`
that used to evidence v1 defect 6 — so `shadow.test.ts` now asserts the *absence
of a binding Article 50 duty* rather than a count, and the release script prints
every authored note unconditionally instead of inferring from arithmetic that
there is nothing to explain.

**Article 27 splits, and only one branch is flat.** It excepts Annex III point 2
outright, and otherwise reaches bodies governed by public law, private entities
providing public services, and Annex III 5(b)/5(c) credit and insurance
deployers. The engine settles the third from the route it already cited, so that
one is a duty; the other two are `conditional_obligation`, on the Article 26(8)
pattern, because the questionnaire never asks whether you are a public body. Do
not promote them.

**Check the corpus before assuming a gap needs a pack bump.** Article 26 was
completed with no version change at all — the text had been pinned since the
first extraction, and only the propositions and findings were missing.

**Cards render plain text, not markdown.** `*emphasis*` in a finding's `title`,
`whyItApplies`, `practicalMeaning`, `action` or `evidenceToKeep` reaches the
reader as literal asterisks. `result.test.ts` fails on it. The test exists
because three had already shipped, one of them since Phase 7 — and because a
browser walk-through, not the suite, is what noticed.

**Article 43 is a procedure, not a duty, and is emitted from its own module**
(`engine/article-43.ts`, shaped like `article-50.ts`). Three routes: Annex I
sectoral (43(3), checked first — its fourth subparagraph settles the overlap with
Annex III explicitly), the Annex VI/VII choice on Annex III point 1 (43(1)), and
flat Annex VI internal control on points 2 to 8 (43(2)). The one new question,
`art43_harmonised_standards`, opens only on the point 1 provider branch. **An
unknown answer there leaves the route unresolved and must never default to Annex
VI** — it is the cheaper procedure, so guessing it is the expensive direction to
be wrong in, and `golden-matrix.test.ts` asserts the card neither says "Annex VI"
nor "internal control" on that path. Article 43(4) is a separate finding: a
substantial modification needs a *new* assessment regardless of redistribution.

**§20 is executable, and `automatedClean` is not `ready`.**
`release/acceptance.ts` checks 16 of the 18 criteria; criterion 14 is `manual`
and 16 is `blocked` on §22.1–22.2, and neither reports as passing. Shadow mode
accounts for divergences **per scenario**, never by a global allow-list of
classification pairs — that is what stops a real divergence being waved through
in the one scenario nobody meant it to happen in. `npm run checker-v2:release`.

One carve-out recorded rather than hidden: **no model call or email send is
wired** — `src/lib/email.ts` exists but sends enquiry notifications only, nothing here is
connected to it, and §22.1's retention decision is open.

One flow rule worth not undoing: **`isFinished` and `isLastQuestion` are
different questions**, and the nav renders both buttons when both are true. The
data-protection questions are optional by design — that is what stops them
blocking the AI Act result — and a "See the result" button that *replaces*
"Continue" the moment the assessment becomes finishable makes every optional
trailing question unreachable. A browser walk-through is what caught it; no unit
test on the flow functions would have.

## Regulatory retrieval corpus (editorial only — do not blur)

`corpus/regulatory/`, `src/lib/regulatory/` and the Pinecone index named by
`PINECONE_REGULATORY_INDEX_NAME` give the drafting model at `/create` primary
statutory text to quote and cite. They are **never** an authority for anything
the Compliance Checker shows on screen — that remains the pinned rule pack under
`rulepack/versions/`. Two copies of the AI Act exist on purpose; the separation
is the safety property.

- `npm run test:regulatory-index` fails if any file under `src/lib/report/`,
  `src/lib/rulepack/` or `src/app/api/tools/compliance-checker/` so much as
  references the regulatory lane — and also if the generator stops consuming it,
  if the prompt stops forbidding quotation from memory, or if a silent
  `catch {}` reappears anywhere in the retrieval path.
- `npm run reg:check` runs in `prebuild` and blocks the build on corpus hash
  drift, on a lapsed `reviewBy` date, **or** if the corpus consolidation date
  stops matching the rule pack's `corpusCutOff`. The lanes assert consistency
  with each other; they never share storage.
- Corpus text is committed so an amendment is a reviewable `git diff` rather
  than a silent re-embed. To change it: `npm run reg:fetch -- --corpus <id>`,
  read the diff, then `npm run reg:hash` and write what you checked into the
  manifest `changelog`.
- **Statutory text is fetched from the EU Publications Office ("Cellar"), not
  from `eur-lex.europa.eu`.** Since 2026-08-16 the human web rendering sits
  behind an AWS WAF bot challenge that answers automated clients with `HTTP 202`
  and an empty body — and `response.ok` is TRUE for 202, which is how both fetch
  paths once read a challenge page as an empty instrument. All upstream reads go
  through `scripts/regulatory/source-fetch.ts`, which requires status `200`,
  detects the `x-amzn-waf-action` header by name, and rejects a body too small
  to be an instrument. The URL is derived from `meta.celex`, never from
  `meta.sourceUrl`, so the text and the identifier claimed for it cannot
  disagree. Cellar serves the same XHTML dialect, so `extract.ts` is unchanged.
- Every chunk carries its citation header *inside* the embedded text, so a
  quotation can never reach the model separated from its locator.
- **Quotations in drafts are audited** (since 2026-08-16). `src/lib/quotation-audit.ts`
  string-matches every quotation the draft presents as statute against the
  retrieved block the model was actually given, reusing `corpusContainsQuote()`.
  The retrieved block is the right target because it is what the prompt's
  promise refers to — "quote only from the passages below" — so a quotation
  absent from it violates the instruction by definition. Results land on the
  article's `quotationAudit` field and raise a publish-guard warning. This is
  still weaker than the Compliance Checker's guarantee: it warns rather than
  withholds, and it cannot verify a quotation from a provision retrieval never
  returned. Human review in Studio remains the final control.
- The index must have **no integrated `embed` config** — this app writes OpenAI
  vectors, and Pinecone's integrated text path would embed queries with a
  different model. `npm run reg:verify-index` asserts this against the live
  index; `--create` provisions one correctly. It also reports live-vs-committed
  record counts per corpus, which is what catches records stranded by a
  re-chunk; a namespace total cannot.

Six instruments share one namespace (`eu-ai-act`, `gdpr`, `eu-chips-act`,
`eu-data-act`, `nis2`, `eu-cyber-resilience-act`). Three consequences:

- **Routing is not optional.** Statutory prose is self-similar enough that
  similarity alone hands the model the right words from the wrong instrument.
  `looksRegulatory()` reports which instruments a topic names and retrieval
  filters on it. Adding a corpus means adding its terms to `INSTRUMENT_TERMS` in
  `gate.ts` — the guard fails if an ingested corpus has no routing terms,
  because text nothing can route to is text nobody can reach.
- **`instrumentType` is required and load-bearing.** A Directive (NIS2) binds
  Member States, not companies; the block header says so above every passage,
  because the quotation will be accurate even when the obligation it appears to
  create is addressed to a Member State. `applicationNote` does the same job for
  obligations that apply from a future date (the CRA's main body: 11 Dec 2027).
- **Two dialects.** EUR-Lex serves consolidated texts and original acts with
  different CSS vocabularies. An instrument that has never been amended has no
  consolidated version at all (Chips Act, Data Act), so `fetch.ts` reads both.
  Resolve the current CELEX from EUR-Lex at fetch time — never from a summary;
  one asserted a Data Act consolidation that does not exist.

Use `npm run reg:probe -- "<topic>"` to exercise the full routed path before
trusting a change. `reg:ingest --probe` only measures raw vector similarity.

### Keeping it current

`npm run reg:drift` asks upstream whether the law has moved. The non-obvious part
is why it does not simply diff the text: every instrument is pinned to one
consolidation, so when it is amended the pinned CELEX keeps returning the **old**
text forever and hashes identically. A content-diff watcher would report "no
drift" indefinitely while the law changed. The real check is *"does a newer
consolidation exist than the one I pinned"*, read off the base act's metadata
notice; the hash comparison is only a tamper check on the pinned text.

Two things it now does that it did not before 2026-08-16, both fixing a
fail-**open**: it reads through `source-fetch.ts` (see above), and it treats "no
consolidation found" as an `error` rather than `current` for any instrument
pinned to a consolidated CELEX — such an instrument must at minimum discover its
own version, so finding none proves the lookup broke rather than that nothing
changed. Only the original-act instruments (Chips Act, Data Act) may legitimately
return none.

It runs weekly in `.github/workflows/regulatory-drift.yml` and opens (or
comments on) an issue labelled `regulatory-drift`. The fail-closed backstop
remains `reviewBy` in `reg:check`, which fails the **build** 90 days after each
instrument's last review — automation can break silently, `prebuild` cannot. The
watcher exists to make that review a two-minute "nothing changed, restamp"
rather than a research task, which is what makes six instruments sustainable.

A new **AI Act** consolidation is not a simple re-fetch: `reg:check` asserts its
`consolidatedAs` equals the rule pack's `corpusCutOff`, so the pack version must
move with it and every pinned citation be re-verified. `reg:drift` says so in
its output rather than implying all six are equal work.

## Dataset access control (load-bearing, and it lives in a console)

The `production` dataset's `aclMode` is **`public`**, but that is not the whole
story and reading it as such produces a false finding. **Type-level access
control is configured on the project**, and it already draws the line correctly:
the eight types the public site renders (`article`, `series`, `author`,
`category`, `glossaryTerm`, `product`, `sanity.imageAsset`, `siteSettings`)
answer anonymous GROQ; the ten internal ones — all four knowledge types plus
`persona`, `libraryImage` and the Sanity system types — do not.

**The console draws a denylist, so a new document type is anonymously readable
by default.** That is the part to remember, and it was established rather than
assumed on 2026-09-04: `persona` has five published documents and returns `0` to
an anonymous count, so the block is real and specific — while `series`, created
that morning, answered anonymous GROQ immediately with nobody touching the
console. Correct for a public reading path; exactly wrong for the next internal
type somebody adds, which will be world-readable until it is explicitly blocked.

So adding an internal type is a **two-part** job: block it in the console, and
add it to `MUST_BE_PRIVATE` in `scripts/dataset-access-checks.ts`. The script is
what turns forgetting the first half into a red CI run rather than a silent leak.
Note `MUST_BE_PUBLIC` is a single string (`article`) serving as the probe's
positive control, not an inventory of the public types — it does not assert that
`series` stays readable.

This matters because a security audit concluded the opposite. It reasoned from
`aclMode: public` that `sensitivity: confidential` in
`src/lib/knowledge/read.ts` was "an application-level filter over a
world-readable store", and proposed rewriting the knowledge lane to create
documents as `drafts.*`. That change would have broken deduplication — the seven
`!(_id in path("drafts.**"))` filters in `read.ts` and `repository.ts` exist
because the duplicate probes, the candidate listing and the source resolution
all need to see published records — in exchange for no security gain whatever.

**Verify before rewriting.** One `curl` with no token settles it.

`npm run test:dataset-access` (`scripts/dataset-access-checks.ts`, CI-blocking)
is what keeps this honest, and two properties are the whole design:

- **The positive control is asserted first and is fatal.** "The query returned
  nothing" passes for two different reasons — the data is protected, or the
  probe is broken. So `article` MUST come back readable; if the public site's
  own content cannot be seen anonymously, the run has proved nothing and exits
  non-zero rather than reporting a clean bill of health.
- **"No documents" is not "protected".** A type with nothing in it returns empty
  either way. With `SANITY_API_READ_TOKEN` the run only reports `PROTECTED` when
  a type demonstrably **has** documents and anonymous access still cannot see
  them; everything else is reported `unproven` out loud. `researchRun` is the
  live example — the type is empty, so whether the first one leaks is genuinely
  unknown until one exists.

Deliberately **not** in `prebuild`: it needs the network, and a Sanity blip must
not fail a Vercel deploy. `scripts/security-checks.ts` asserts the CI step
exists, because a probe that does not run is worse than none.

**Still open:** making the dataset private and giving the public site a read
token. That is the stronger control — it would not depend on a console setting
staying put — but every public fetch path currently runs without a token, so it
is its own piece of work rather than a side effect of something else.

## Editorial memory (the knowledge lane — dark)

`PINECONE_KNOWLEDGE_INDEX_NAME` names the fourth index, added by wave 3 of the
knowledge programme (`docs/siliconstone-knowledge-wave-03-brief.md`). It holds
one OpenAI vector per **reviewed** `knowledgeItem` / `knowledgeSource`.

- **Two switches, and the second is the point.**
  `KNOWLEDGE_AUTO_INDEX_ENABLED` gates indexing on review (**on in production
  since 2026-08-22**, together with `PINECONE_KNOWLEDGE_INDEX_NAME` — the flag
  does nothing without a store, and reports `unchanged` rather than failing if
  the name is absent);
  `KNOWLEDGE_DRAFT_RETRIEVAL_ENABLED` gates the drafting lane — and the lane
  *also* needs `KNOWLEDGE_SCORE_FLOOR`, a measured number. **No default floor
  exists in the code and none may be added.** `PRIOR_COVERAGE_SCORE_FLOOR = 0.37`
  was measured over 15 articles; this corpus is three records. Earn the number with
  `npm run knowledge:calibrate` or leave the lane off.
- **Only `normal` sensitivity is ever indexed**, and only reviewed records with
  settled extraction. The calculation is `knowledge/eligibility.ts` and every
  verdict carries a reason, including the eligible ones.
- **The writer and the reconciler must agree what "up to date" means.** Both
  compare the content hash **and** `KNOWLEDGE_INDEX_VERSION`; comparing the hash
  alone made `knowledge:sync` print a plan that `indexRecord` then declined to
  carry out.
- **`not_eligible` is not evidence the vector is gone; `indexedHash` is.**
  `applyReviewTransition` withdraws eligibility eagerly — the status is written
  in the same patch as the verdict, before anything touches Pinecone — so on the
  review route the record *always* says `not_eligible` by the time the indexer
  sees it. Reading the status alone, the indexer returned `unchanged` and
  `knowledge:sync` reported "0 to remove · 0 orphan(s)" while an un-approved
  record's vector sat in the index with nothing left that would ever remove it.
  Both sides now read `indexedHash`, which is the record's own claim that the
  index holds its text and is what a completed withdrawal clears. **Do not
  clear it in the review patch**: it is the only signal that a removal is
  outstanding. Once the vector is actually deleted, `forgetIndexedVector()`
  clears the two evidence fields without a self-transition, which the machine
  still refuses.
- **Nothing is truncated silently.** `generateEmbedding` slices at
  `MAX_EMBEDDING_CHARS`, which is right for articles and wrong here, so the
  indexer refuses at that boundary with an `error` naming the limit.
- **The review action tells the reviewer what the index did.** `/api/knowledge/review`
  returns `indexing`, and the Studio toast renders it. Dropping it reported a
  failed embedding as an unqualified success with the reason only in a server
  log.
- `npm run knowledge:verify-index` asserts the index has **no integrated `embed`
  config**, for the reason the article lane learned the hard way.

**Pinecone is at its five-index limit.** Four are this app's (articles,
regulatory, evidence, knowledge). The fifth, `silicon-and-stone`, is the retired
integrated-embed index and **must not be deleted**: besides stale article vectors
it holds an `ideas` namespace written daily by an external story-idea agent that
lives nowhere in this repo.

## Article vectors (the other Pinecone lane)

`PINECONE_INDEX_NAME` names the index behind semantic search, related articles
and the prior-coverage RAG at `/create`. It holds one OpenAI vector per
published Sanity article in the default namespace, written by
`/api/vectorize` on publish.

- **It must also have no integrated `embed` config.** The original index
  (`silicon-and-stone`) was created with one, and because both models are
  1024-dimensional nothing ever errored — a text-path query just returned
  confident nonsense (measured 0.09 and unrelated, against 0.54 done properly).
  Migrated to `silicon-and-stone-articles` on 2026-08-15.
  `npm run articles:verify-index` asserts the shape; `--create` provisions one.
- **The index is rebuildable from Sanity.** Every embedded field and every
  metadata value derives from the document, so `npm run articles:sync` restores
  it end to end and reconciles orphans. There is nothing to back up.
- Do not rename `getPineconeIndex()` or `searchSimilar` — `evidence-index-checks`
  (CI-blocking) and `regulatory-index-checks` grep for those literals, and a
  rename makes one assertion vacuously pass rather than fail.
- **`PRIOR_COVERAGE_SCORE_FLOOR = 0.37`** (`src/lib/draft-retrieval.ts`), applied
  per result and shared with the related-articles write-back in
  `/api/vectorize`. Calibrated 2026-08-16 against the live index: on-topic
  queries scored 0.421 / 0.533 / 0.687 on their best match, off-topic queries
  topped out at 0.318. The floor is the midpoint. **Re-measure it as the back
  catalogue grows** — it was calibrated against 15 articles, and a larger index
  produces stronger matches across the board.
- **Prior coverage embeds the topic alone**, while the regulatory lane composes
  topic + brief + keywords + pain points. Do not "fix" that asymmetry: the
  keywords come from the research pass and carry its news vocabulary, which is
  the mirror image of why `retrieve.ts` excludes the research summary.

## Draft-time editorial guards

Three checks run on generated drafts. All are advisory by design — they inform a
human, none blocks generation.

- **Quotation audit** — see the regulatory-corpus section above. Writes
  `quotationAudit` on the article.
- **Auto fact-check** — a Signal or Deep Dive POSTs to `/api/fact-check` from
  the browser once the draft is saved (`src/lib/auto-fact-check.ts` decides
  which formats). Client-triggered on purpose: `/create` has `maxDuration = 300`
  and has already spent most of it on five sequential model calls, so running a
  90–180s check in the same invocation risks the function dying and leaving
  `factCheck.status` stuck on `running`. The route already owns auth, the
  10/hour limit, the re-entrancy guard and its own background run — do not
  reimplement any of that at the call site.
- **Publish guard** — `src/sanity/actions/publishPreflight.tsx` wraps Studio's
  own publish action (wraps, never replaces, so the built-in validation and
  disabled states survive). It **blocks** on an unresolved `[AUTHOR: …]`
  placeholder and **warns** on a missing or adverse fact-check, an unmatched
  quotation, or an empty sources list. `src/lib/publish-preflight.ts` holds the
  checks as a pure function so they are testable and cannot drift from what the
  dialog claims. It deliberately does **not** scan `voiceEditNotes` — that field
  lists the outstanding placeholders, so scanning it would block every
  voice-passed article forever. There is a test for that.

## Enquiry notifications (load-bearing — do not rewire onto one path)

`/api/contact` writes an advisory enquiry into Kit custom fields and tags the
subscriber. Until 2026-08-24 that was **all** it did — nobody was told, so a
£2,500 Exposure Diagnostic enquiry sat in a `message` custom field until someone
opened Kit. `src/lib/email.ts` now emails the owner through Resend.

Four properties, each with a test:

- **It fires on both storage paths.** Contact writes Kit directly by default and
  proxies to Railway only when `CONTACT_VIA_BACKEND=true`, returning *before* the
  Kit code when it does. A notification wired into the Kit half alone would pass
  every unit test, look right on a local run, and — while the proxy was still
  unconditional — never have sent an email in production. Every exit after
  validation goes through `withNotification()`, including the catch-all 500, and
  `contact-notification.test.ts` exercises both. Mutation-tested: reverting the
  proxy path to a bare `return` fails two assertions.
- **The email carries the whole enquiry, and `stored: false` changes the
  subject.** When the Kit write fails the notification is the only surviving
  record, so it must be complete enough to act on — and a failure that reads
  identically to a success in an inbox list is a failure nobody acts on.
- **It can never fail the request.** The enquiry is already saved by the time the
  send is attempted. `notifyEnquiry` returns a status and never throws; the
  route logs it. Missing env vars degrade to `unconfigured`, not an error — the
  form ran without this for months and a half-configured environment must not
  start 500ing a public form.
- **Subjects are single-lined.** `normalizeField()` truncates but does not strip
  newlines, and `company`/`interest` reach a mail Subject. `singleLine()` is
  defence in depth, not the only guard, but a header is never legitimately
  multi-line.

Resend is called over plain `fetch`, not the `resend` package: `AbortSignal`
gives a real bound the SDK does not expose, and the dependency ceilings above
make a new runtime dependency a poor trade for fifteen lines of HTTP.
`ENQUIRY_NOTIFY_FROM` must be on a domain verified in Resend — verification there
is separate from Kit's DKIM, and the same domain needs both.

**Contact goes direct to Kit by default, and that is a fix, not a preference.**
Until 2026-08-24 the route proxied to Railway whenever `BACKEND_API_URL` was set,
with no way to opt out — subscribe got that escape hatch on 2026-07-19 and
contact did not. Railway's `_kit_env()` raises
503 "Newsletter service not configured" when its own `CONVERTKIT_API_KEY` or
`CONVERTKIT_FORM_ID` is empty, and Railway's copies are **separate from
Vercel's**, so swapping the Kit key in Vercel on 2026-08-20 did not touch them.
Result: newsletter signups worked throughout while **every** advisory and
EU-exposure enquiry 503'd and was stored nowhere. The enquiry notification found
it on its first live run. `BACKEND_API_URL` must stay set — briefings, usage
tracking and deep research use it — so the gate is a flag, not the URL's absence.
Re-enable `CONTACT_VIA_BACKEND=true` only once the backend has Kit configured and
a live enquiry has been proven end to end.

**`backend/main.py` duplicates `/v1/contact` and does not notify.** Harmless
while the flag is off. Do not "simplify" by moving the notification into the
backend without moving all of it.

**`scripts/security-checks.ts` reads `git ls-files`, so an untracked new file is
invisible to it.** A new server module passes the outbound-bound check until it
is committed — the run where you would most want the answer is the one that
cannot give it. Its regex is also literal: the string `fetch(` inside a *comment*
trips the check. Both bit while adding `email.ts`.

## Article series (load-bearing — do not break)

A `series` is an ordered reading path across published articles, rendered at
`/intelligence/series[/slug]` with a "Part N of M" strip and a prev/next pair on
`/analysis/[slug]`. One rule underpins all of it:

**The position of an entry in `series.entries` IS its part number.** No part
number is stored on an article, and none may be added — that is the `£`-literal
and the `publishedAt` mistake in a third costume. `scripts/manual-checks.ts`
check 20 asserts no `partNumber`/`seriesPart` field has appeared on `article`.

Five consequences, each of which bit or would have:

- **`entries` holds WEAK references.** Same lesson as `researchRun.articles[]`:
  a strong reference from a published document to one that does not exist in the
  published dataset is refused, so a series could not point at a part still in
  draft. It also matters on the way out — with strong refs `unpublishArticle`
  must sweep the entry, and `unset` on an array member **collapses it, renumbering
  every part after**. Weak refs simply stop resolving and the slot survives.
- **Numbering counts every slot; linking skips the unresolved ones.** The GROQ
  uses the positional `entries[]{ _key, "ref": _ref, "article": @->{…} }`, never
  the collapsing `entries[]->{…}` — the latter drops unresolved elements and
  would renumber the parts after a hole. Verified against production with a real
  draft-only article. This is the first `@->` in the repo.
- **`rule.unique()` cannot catch duplicates here.** It compares array members
  with a key-count guard before ignoring `_key`, and a Studio reference to a
  draft carries `_weak` and `_strengthenOnPublish` — different key count, so the
  comparison short-circuits. A custom `_ref` validator does the work.
- **The `/intelligence` feed query is deliberately untouched.** Selecting a series
  navigates to its page rather than filtering the feed (a series is ordered, the
  feed is impact-ranked). That is what keeps this clear of the four-copy query in
  `intelligence/page.tsx`, `api/briefings/route.ts`, `queries.ts` and
  `backend/main.py`.
- **There is no `?series=` pin, on purpose.** Reading searchParams in
  `/analysis/[slug]` would opt every article out of static rendering to serve a
  multi-membership case that does not exist yet. `resolveSeriesContext` takes the
  first match; the pin belongs there if that ever changes.

Two more things not to undo. **The series strip sits OUTSIDE the
`hasIntelligenceFields` conditional** — nested inside it, series context vanishes
on untiered articles, which is the shape of the defect where an untiered article
published into invisibility. And **`SeriesNav` carries `mb-10` because `<Gate>`
has no top margin**: without it the commerce card butts flush against the "next
part" card and the upsell reads as part of the series nav. Both were found by
walking the pages in a browser, not by the suite.

**The revalidate webhook's filter must include `series`.** It lives in the Sanity
dashboard, not this repo (see `LAUNCH.md`). Scoped to articles only, a series
edit invalidates nothing and the page sits stale with no error anywhere.

## The advisory pages come off one template (do not hand-roll a fifth)

Each of the four engagements has its own page under `src/app/(website)/advisory/`,
and all four are assembled from the same five components in
`src/components/advisory/`: `AdvisoryPracticeBand`, `EngagementHero`,
`AtAGlance`, `WhereItLeads`, `EngagementContactForm`.

That is not tidiness. Three engagements were pages and the Retainer was a
*section on the hub*, and that asymmetry is precisely **why** their styling kept
diverging — a section and a page were never built from one template. A fifth
engagement comes off these five components or the divergence starts again.

Three things the pages depend on:

- **Every price is `gbp(AMOUNTS.x)`; the four pages contain no `£` literal.**
  Same rule as everywhere else — see the Pricing section below.
- **`ENGAGEMENTS[].href` in `src/lib/offering.ts` is the single source of the
  URL**, rendered by both the header dropdown and `/pricing`. A rename turns two
  nav entries into a 404 with nothing failing nearby, so
  `src/lib/advisory/engagement-pages.test.ts` asserts each `href` resolves to a
  real `page.tsx`. It does **not** yet assert the href reaches `sitemap.ts`.
- **`/advisory#retainer` must keep resolving.** The engagements used to be
  fragments on the hub, and a fragment never reaches the server — so no redirect
  could have covered the split. The hub keeps a summary block under that id, and
  the same test guards it. A dead anchor does not 404; it silently scrolls
  nowhere.

**WaymarkPath has the same shape and the same rule.** `src/lib/waymarkpath.ts` is
the single source for its seven capabilities, including the `feeds` field that
records which stage hands output to which. It is a *sister* product: indigo
(`--color-sister-indigo`), never the S&S amber/teal, and flagged `sister` in the
header nav rather than added as a plain fourth Products entry.

## Publication dates (load-bearing — do not break)

Every price has one source; so does every publication date. `publishedAt` is
written **only** through `publishedAtPatch()` in `src/lib/published-at.ts`, by
two callers that both ask it: `withPublishStamp` (Studio, patches the *draft*
before the publish copies it over) and `/api/on-publish` (the backstop for
anything that never touched Studio). Nothing wrote it at all until 2026-08-22,
so ten of sixteen published articles had no date and nothing failed.

- **Never overwrite an existing date.** Re-publishing is not re-publication, and
  every edit re-fires the publish webhook.
- **Every article feed orders by `coalesce(publishedAt, _updatedAt)`** — all
  eleven sites, `backend/main.py` included, which is what production answers
  from. Bare `publishedAt desc` sinks a dateless article past the end of a
  `[0...10]` slice: published and unbrowsable, the `intelligenceTier` failure
  again. `published-at-query.test.ts` fails on any other expression.
- **The backfill used `_createdAt` and that is deliberately different** from the
  queries' fallback. Chronology for ten historical articles, loudness for a
  future regression. Do not harmonise them.

## Pricing (load-bearing — do not break)

Every price the site shows comes from `src/lib/offering.ts`. `AMOUNTS` is the
only place a figure is typed; `DERIVED` computes the ones that are arithmetic
on others (the "£83 for both rather than £103" line is a sum of two prices, not
a third price). Components interpolate `gbp(AMOUNTS.x)` — **never** write a `£`
literal in a page or component, prose included.

Two checks enforce this, and both are meant to be annoying:

- `src/lib/offering.test.ts` walks `src/` and fails on any `£` outside a
  four-file allowlist. Add to the allowlist only with a reason.
- `npm run test:sanity-prices` fails CI when a published Sanity `product`
  document's `priceLabel` / `name` / `productPath` disagrees with
  `SANITY_PRODUCTS`. Those three documents are the one copy code cannot import,
  and the end-of-article gate renders them, so changing a product price means
  changing `AMOUNTS` **and** the document in Studio.

A price is a commercial claim. `project_summary.md` §5 is the written record of
what is on sale, at what, and why.

## CLI scripts and `server-only`

Several `src/lib` modules start with `import 'server-only'`, which throws under
plain `tsx`. Any script reusing them must run with
`TSX_TSCONFIG_PATH=scripts/tsconfig.scripts.json`, which maps that specifier to
an empty shim. Forgetting it is not subtle — the script dies on import.

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
