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

## Boundaries

No new products, prices, checkout, document uploads, automatic transfer of
Checker answers, assessment-rule changes, legal-content changes, or retainer
redesign. Enquiries continue through the existing form. No external messages or
test enquiries are sent. Deployment is separate from this local implementation.

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

Local implementation and validation are complete. The owner requested commit
and push after reviewing the result. Production build/CI and post-deployment
checks were not part of the local validation above; deployment is not yet verified.
