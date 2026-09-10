# Five specialist advisory projects

## Agreed direction

The owner confirmed that these are scoped advisory projects and that European Procurement Readiness and Sovereign Architecture Review join the standalone range. This plan supersedes the three-project assumption in the visibility review.

All five can be commissioned directly after a free scoping conversation. The three free tools remain optional starting points. No paid prerequisite or retainer is required. Retainer work is separately scoped and charged. Where a broader engagement covers the same work, scope and fees account for that overlap.

## Scope and deliverables

| Project | Buyer decision | Proposed standalone output | Scope boundary |
| --- | --- | --- | --- |
| Manufacturing Exposure Module | Which dependencies could interrupt operations? | Supplier/chokepoint map, evidence register, resilience priorities. | Existing service and starting price retained. |
| Scenario Impact Analysis | What could a shock cost the business? | Business-unit scenarios, value-at-stake ranges, mitigation options, board briefs. | Existing service and starting price retained. |
| Regulatory Friction Assessment | Where do EU/US requirements create operational costs or delays? | Conflict map and prioritised operating roadmap. | Existing service and starting price retained; distinguish operating friction from a specific buyer's procurement process. |
| European Procurement Readiness | What must we prepare for a European buyer's review? | Buyer requirements/evidence matrix; evidence gaps and owners; response pack outline; prioritised readiness plan; handover discussion. | One agreed product/service and buyer process as the starting scope. No procurement guarantee, legal sign-off, negotiation, or implementation included. Broader markets, products and support are separately agreed. |
| Sovereign Architecture Review | What control do we have, and which alternatives are viable? | Architecture/control map; access and key-custody assessment; portability/exit constraints; options appraisal with effort and cost assumptions; staged decision roadmap; handover discussion. | One agreed system/workload as the starting scope. Based on supplied documentation and discussions. No penetration testing, code audit, certification, migration or legal opinion included. |

The new projects display “Fee agreed after scoping”. No starting price is invented or historical price reinstated. Final deliverables, evidence access, timing and fees are agreed in writing before work begins.

## Delivery plan

1. Extend the central catalogue with buyer questions for all five and the two new offerings. Preserve existing identifiers, prices and enquiry names.
2. Build two dedicated pages on the existing specialist template, including audience, method, deliverables, boundaries, metadata, enquiry forms and article placements.
3. Replace Advisory's three-card index with a five-project comparison: buyer question → project/output → fee and project link, with separately labelled optional tool links. Move it before enterprise and credits, immediately after the four-engagement chooser. Preserve `#modules` and other inbound anchors.
4. Add a specialist entry to the shared desktop/mobile Advisory menu; add a hero jump link, homepage discovery panel, Products cross-link and Pricing shortcut.
5. Lead existing specialist introductions with the business question and output; replace follow-on wording in search/social descriptions. Make direct commissioning explicit on every specialist page.
6. Link Procurement Readiness and Sovereign Architecture from their broader engagement sections, remove exclusive/included-only wording, and explain how overlapping scope is priced.
7. Add the new URLs to sitemap and AI-readable index. Use a fresh Sovereign Architecture canonical path (`/advisory/modules/sovereign-architecture`) because the earlier `…/sovereign-architecture-review` URL has already shipped as a permanent redirect; update that redirect and retain the Strategic Assessment anchor/link for cached redirects.
8. Update existing tests to reflect the owner's five-project decision, preserving checks for catalogue routes, metadata, article placement, contact interest and free-tool pairings.
9. Run targeted tests, lint, typecheck and production build. Browser-check the desktop/mobile chooser, navigation, both new pages, all five destinations, old Sovereign route, Pricing, Products and enquiry anchors. Do not send enquiries.

## Design

Use existing site fonts and semantic colour tokens: slate background, charcoal surface, primary/muted text, teal links and amber fees. Keep the current hero artwork and four core engagement presentation. The comparison is a labelled list with aligned columns on wide screens and stacked labelled content on mobile. It is not a sequence: no numbered project tiers, step arrows or mandatory tool funnel. Every project receives the same visual weight.

## Acceptance criteria

- All five projects are discoverable from Advisory navigation and the comparison without using a tool.
- Every comparison row shows the buyer question, output, fee basis and direct page link; only the three genuine tool pairs show an optional tool.
- Both new pages distinguish standalone scope from wider advisory work and route enquiries with their own catalogue names.
- Existing core engagements, tool behaviour, prices and contact transport remain intact.
- Mobile content wraps without horizontal overflow; links and form labels remain keyboard accessible.
- Old inbound anchors continue to work. Metadata and directory indexes recognise all five projects.

## Status

The owner reconfirmed all five standalone projects after the delayed clarification answers. Local implementation and verification are complete. Both new projects remain fee-after-scoping, without a starting price.

The comparison, catalogue, dedicated pages, navigation, Products, homepage, Pricing, broader-engagement links, metadata, sitemap, AI-readable index and legacy Sovereign redirect are implemented. No enquiry has been submitted. The owner authorised commit and push after verification; deployment success must be verified separately.

## Verification record

- `npm run lint` and `npm run typecheck` passed.
- 59 targeted tests passed across catalogue, engagement pages, coverage placement, Digital Omnibus discovery and tool exports.
- `npm run build` passed, including the corpus, Checker and operator-manual prebuild gates. It generated both new routes. The build emitted a service-worker warning that a 2.58 MB chunk exceeds its precache limit; no PWA configuration was changed in this work.
- Production preview served at `http://localhost:3100`. Advisory shows five projects and precisely three optional free-tool links. Desktop and 390px mobile layouts were checked, including light and dark presentation; no horizontal overflow was found on the checked project pages.
- All five dedicated pages load with their canonical URLs, direct-commissioning copy and enquiry forms. Both new CTA links reach their contact sections; their form labels resolve to the corresponding inputs. No form was submitted.
- Mobile Advisory menu and the hero link reach the specialist comparison. Homepage has direct links to all five projects and the comparison. Products and Pricing have their specialist shortcuts.
- Sitemap and llms.txt returned 200 and include both new paths. The old Sovereign module URL returned 301 to the new canonical page.
- The production browser session reported no page errors. React review found stable catalogue keys, separate tool/project links, no new effects or dependencies, and the existing server coverage/client enquiry boundary preserved.
- `git diff --check` passed. The owner authorised commit and push after these checks; deployment verification is pending.

Preview entry: [Specialist comparison](http://localhost:3100/advisory#modules).
