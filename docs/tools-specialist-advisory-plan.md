# Tools and specialist advisory implementation

## Agreed direction

Tools should primarily generate standalone specialist projects. Clients may
commission a project after a free scoping conversation without a paid prerequisite.
Specialist work for retainer clients is separately scoped and charged at the
applicable project fee.

The first commercial focus is Compliance Checker → Advisory Briefing. The £450
Briefing covers one AI system and one principal question: preparation from the
Checker result and brief business context, one hour with the client, and a short
written follow-up with priorities, uncertainties and actions. It does not include
supporting-document review or verification of the system or vendor evidence.
Further investigation is optional and separately scoped.

## Implementation plan — completed

1. Align the catalogue, Briefing page, metadata, enquiry guidance and related
   summaries with the agreed scope. Retain the existing name, price and credit
   terms; make the retainer credit secondary.
2. Add a clear paid next step to each existing Tools card and strengthen the
   homepage links. Keep four tools and the current navigation. Share the route
   definitions so destinations and descriptions stay consistent.
3. Make the Briefing the primary human-help route beside the Checker result;
   keep self-service options and all assessment logic intact.
4. Describe the three modules as specialist advisory projects on their pages,
   Advisory, Pricing and the footer. State standalone access and separate
   project fees consistently; add an earlier link to specialist work on Advisory.
5. Run catalogue/advisory checks, lint and typecheck, then verify desktop/mobile
   presentation and the local Tools → Checker → Briefing enquiry journey.

## Decision, 16 November 2026: a fifth tool

The owner decided to release the EU AI Act Exposure Check at
`/tools/exposure-check` as a fifth free tool. This sets aside "Keep four tools"
in step 2 above, for this tool only; the rest of that step and the boundaries
below are unchanged. The reasoning: the Exposure Check answers the
organisation-level question ("does the Act reach us at all?") before the
Compliance Checker's per-system one, so it feeds the first commercial focus
(Checker → Advisory Briefing) rather than competing with it. Its follow-on is
the Advisory Briefing, through `TOOL_JOURNEYS`, with the Exposure Diagnostic
offered beneath it only when the answers show the organisation does not know
what AI it has or has many systems. It sits first in the Tools navigation and
the Tools page. Release still waits on the independent fact-check and
brand-voice check of its legal content and the owner's review of the preview.

### Released ahead of counsel review (owner decision, 16 November 2026)

The owner decided to release the Exposure Check ahead of counsel review. What
that means:

- The tool reuses the scope and organisation-size logic and five questions from
  Compliance Checker v2. v2's statements of law remain marked "Not reviewed by
  counsel" (`docs/compliance-checker-v2-state.md` §22.4), and v2's own release
  stays blocked on that review. **This decision covers the Exposure Check only;
  it does not unblock Checker v2.**
- The Exposure Check's release rests on the automated rule-pack checks (the
  pinned-corpus extract test, the timeline-date test and the build gates) and on
  the independent publication fact-check, check ID
  `fc-2026-11-16-exposure-check`. That check failed first time, including on two
  false "does not apply" results (an importer, and a group established in more
  than one place); both were fixed in the second round on 16 November 2026. The
  re-check (`fc-2026-11-16-exposure-check-r2`) failed a second time on narrower
  false "does not apply" routes (a "not sure" on the activity question, and a
  provider of a general-purpose AI model, which the EU connection question did
  not ask about), plus wording that overstated whom Article 4 binds; all were
  fixed in the third round the same day. Round 3
  (`fc-2026-11-16-exposure-check-r3`) found no false "does not apply" in
  153,216 combinations, but failed on over-inclusive results running the other
  way: "applies" at High for a non-EU organisation whose only EU connection was
  its supplier's placing on the market, a flat AI literacy "Owed" that depended
  on which system each connection belonged to, "contradict" and "likely" shown
  to EU organisations whose answers did not support them, an Article 50(4)
  exception missing one of its two conditions, and two date-dependent sentences
  that would go stale. All were fixed in the fourth round the same day. The
  check must pass on re-check before merge.
- The page and the Markdown export say "This check has not been reviewed by a
  lawyer."
- Eight points the fact-checkers say only counsel can settle remain open:
  (a) whether a non-EU developer whose system reaches the EU only through
  resellers or integrators is "placing on the market"; (b) whether the
  four-connection test is an acceptable organisation-level stand-in for
  Article 2(1); (c) the mapping from activities to roles; (d) the reused v2
  propositions and scope reading; (f) whether "Part of a product covered by EU
  product-safety law" with "None of these" should hold the verdict open rather
  than give "does not apply"; (g) whether "put into service in the EU" reaches a
  deployer established outside the EU, as one "located" in the Union; (h)
  whether a non-EU provider of a general-purpose AI model whose model reaches
  the EU only inside a downstream provider's system has placed it on the Union
  market; (i) whether deployers will read "The output of at least one is used
  in the EU" as their own use. These should go to counsel together with the v2
  review. Former item (e), an organisation that is a provider of one system and
  connected to the EU only through another, is moot for the flat AI literacy
  duty since round 4: the tool now shows that duty as flat only where some
  connection reaches the reader whichever of its activities that system falls
  under, and shows the conditional text otherwise.
- Owner rulings, 16 November 2026: the question-form page title, H1 and Tools
  card title stay; the name "Exposure Check" stays; the footer line "This check
  has not been reviewed by a lawyer." stays.

## Boundaries

No new products, prices, checkout, document uploads, automatic transfer of
Checker answers, assessment-rule changes, legal-content changes, or retainer
redesign. Enquiries continue through the existing form. No external messages or
test enquiries are sent. Deployment followed after review and is recorded below.

## Validation

- Lint and TypeScript checks passed after the final code edits.
- All 42 targeted catalogue, engagement-page, coverage-placement and tool-export
  tests passed. No assessment rules were changed.
- Browser-verified the Tools → Compliance Checker → Advisory Briefing links and
  the Briefing CTA to its enquiry form. No form was submitted.
- Reviewed desktop and 390px mobile screenshots. Tools has four independent
  free-tool links and four paid links, no nested anchors and no horizontal
  overflow. The Briefing page also has no horizontal overflow. The browser
  reported no page errors.
- Local HTTP checks passed for the homepage, Advisory, Pricing, all three
  specialist project pages and their three tools. All returned 200; obsolete
  add-on/included-in-retainer wording was absent. Project pages and Pricing
  state standalone access and separate fees.
- React review: stable list keys, separate link targets, shared catalogue prices
  and routes, no new client effects, dependencies or data transfers.

Local implementation and validation are complete. Commit `f1ceb8ad` was pushed
to `origin/main`. GitHub CI run
[`34503992775`](https://github.com/CliveStruv56/silicon-stone/actions/runs/34503992775)
completed successfully, including the production build and PWA checks. Vercel
reported deployment completed for
[`6cQYnomvnokZ9roRtQ5WVM5L5EGs`](https://vercel.com/clivestruv56s-projects/silicon-stone/6cQYnomvnokZ9roRtQ5WVM5L5EGs),
Railway reported success, and the live site returned HTTP 200 with the new
Tools copy. No enquiry was submitted. Deployment is complete; no post-deploy
application error scan beyond the live HTTP/content check was run.
