# Specialist project visibility review

> Historical review snapshot. The owner subsequently confirmed five standalone scoped projects, including European Procurement Readiness and Sovereign Architecture Review. See [the implementation plan](specialist-project-implementation-plan.md) for current scope and status.

Reviewed 10 September 2026 against commit `0241dbb3`, with live browser checks of Advisory at desktop and mobile widths, Tools, and Scenario Impact Analysis.

## What changed previously

Commit `f1ceb8ad` added standalone positioning, paid next steps on Tools and homepage tool cards, an earlier specialist link on Advisory, and consistent scope/fee wording across the project pages, Pricing and footer. The deployment record is in [tools-specialist-advisory-plan.md](tools-specialist-advisory-plan.md). The live Advisory and Tools pages contain those changes.

No buyer-facing comparison matrix was found in the current implementation or the earlier implementation plan. The specialist index remains three summary cards.

## Finding

The three projects are independently commissionable, but discovery still favours visitors who start with a free tool. Their placement and some language continue to suggest secondary additions to the main engagements.

On live Advisory at 1280 × 633, the specialist heading starts at approximately y=2484 and its first cards at y=2640. At 390 × 844, the heading starts at y=4345, more than five viewport heights down. The first internal specialist link sits within the four-engagement chooser rather than the hero. There was no horizontal overflow in the mobile check. These positions describe the checked layout, not engagement analytics.

## Visibility matrix

| Surface | Current evidence | Recommended treatment |
| --- | --- | --- |
| Advisory navigation | Four core engagements only; no specialist entry. Same navigation data feeds desktop/mobile. | Add “Specialist projects” linking directly to the comparison section. |
| Advisory hero | Four-engagement artwork and Briefing-led copy; specialists absent. | Keep the Briefing emphasis and add a clear “Explore specialist projects” route beside it. |
| Advisory page | Three linked cards below Retainer, engagement chooser, enterprise offer and credit ladder. | Move the specialist chooser immediately after the main engagement chooser, ahead of enterprise and credits. |
| Tools index | All three tools have separate paid project links and starting prices; confirmed live. | Retain. Clarify that the tool is an optional starting point. |
| Individual tools | Shared specialist CTA follows each of the three tools in source. | Retain the full CTA and consider a short link near the tool introduction so completion is unnecessary for discovery. |
| Homepage | Tool cards contain paid next steps; Advisory band focuses on core engagements. | Add one explicit standalone specialist route in the Advisory band. |
| Products | Digital products only, followed by a general advisory/contact CTA. | Add a clearly labelled specialist-project cross-link; do not mix scoped services into the downloads grid. |
| Pricing | Three named project rows, starting prices and standalone terms; no specialist shortcut in the hero. | Add “Specialist projects” beside Products and Advisory shortcuts. |
| Footer | One “Specialist advisory” link to Advisory’s specialist section. | Retain as supporting navigation. |
| Project pages | Dedicated pages with audience, deliverables, price and enquiry form; shared hero explicitly permits direct commissioning. | Lead the explanatory body with the buyer’s problem and output; describe the free tool afterwards as optional. |
| Search/social descriptions | All three source descriptions end with “The follow-on module to…”; also confirmed live for Scenario Impact. All three URLs are in the sitemap. | Describe a standalone specialist project. Keep existing URLs. Search indexing/rankings were not assessed. |

## Proposed buyer-facing comparison

Suggested heading: **Specialist projects for a defined business question**.

Suggested introduction: “Commission a focused project directly, or use a free tool to explore the question first. No earlier purchase or retainer is required. Scope and fees are agreed after a free conversation.”

| Your question | Project | What you receive | Optional starting tool | Current starting fee |
| --- | --- | --- | --- | --- |
| Which supplier dependencies could interrupt our operations? | Manufacturing Exposure Module | Dependency and chokepoint map, evidence register and prioritised resilience actions. | Supply Chain Mapper | From £3,500 |
| What would a geopolitical shock do to our revenue and margin? | Scenario Impact Analysis | Scenarios by business unit, value-at-stake ranges, mitigation options and board briefs. | Scenario Modeler | From £3,500 |
| Where do EU and US requirements create cost or delay? | Regulatory Friction Assessment | Operational conflict map, prioritised actions and a transatlantic roadmap with owners. | Policy Stress-Test | From £3,500 |

Each project name should link to its dedicated page. Each tool link should be a separate optional action. On mobile, render the same information as stacked cards with explicit labels, rather than forcing a wide table. Production prices must continue to come from `src/lib/offering.ts`; the figures above are a dated review snapshot.

This is a proposed comparison, not a new website implementation. It gives both a direct commissioning route and a free exploratory route without suggesting a required sequence of purchases.

## Naming and scope decisions

- Use “Specialist projects” consistently for the public group label. “Add-ons” suggests an earlier purchase is required.
- Consider changing “Manufacturing Exposure Module” to “Manufacturing Exposure Assessment”. This is the only one of the three with “Module” in its public name; its present name also underplays cloud and broader operational dependencies. Confirm the desired audience before broadening the name further.
- European Procurement Readiness currently sits within the Exposure Diagnostic and Strategic Assessment. Sovereign Architecture Review sits within Strategic Assessment. Neither is one of the three separately priced catalogue projects. Treating them as standalone offers would require a separate scope and pricing decision.
- Working assumption: the existing three remain personally delivered, separately scoped advisory projects. Fixed-price checkout or new downloadable products would be a different commercial change.

## Implementation sequence proposed

1. Add specialist shortcuts to Advisory navigation, its hero and Pricing.
2. Move and improve the Advisory specialist chooser using the comparison above.
3. Add standalone discovery links from Products and the homepage Advisory band.
4. Align page introductions and metadata; confirm any name change separately.
5. Verify desktop/mobile discovery, all project/tool destinations and enquiry links. No test enquiries need to be submitted.

## Status of this review

This document is the only change made during this review. No website code, catalogue, prices or deployment changed. The two commercial questions put to the owner concern scoped projects versus fixed-price products, and whether to include the two capabilities currently embedded in broader engagements.
