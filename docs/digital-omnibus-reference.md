# Digital Omnibus reference

Implemented 9 September 2026 following the owner's decision to retire the Post-Omnibus Briefing as a separate offer.

## Editorial and commercial decisions

- Canonical page: `/digital-omnibus`. `/eu-exposure` permanently redirects there.
- Audience: business leaders across the UK and EU, plus US companies operating in or selling into Europe.
- Free reference, with no POB price or enquiry form. Tailored work goes through existing engagements.
- European Procurement Readiness is part of the relevant agreed Exposure Diagnostic or Strategic Assessment scope. The separate catalogue entry and add-on price are retired.
- Advisory Briefing, Exposure Diagnostic, Strategic Assessment and Sovereign Architecture Review each explain how they apply the shared context.
- Intelligence navigation and footer provide enduring discovery. The homepage timetable links directly to the reference timeline. One relevant featured story at a time gets a contextual background link, based on its title, excerpt or slug. Generic AI and sovereignty mentions do not trigger it.

## Design

Use the existing theme and type system: warm stone `#efece4`, white `#ffffff`, ink `#14181f`, teal `#16615f`, amber `#b5651d`, with existing dark-mode equivalents. Existing Fraunces headings and Outfit body copy remain. The application timeline is the main visual feature. A narrow contents column supports a left-aligned reading column on desktop and wraps into a compact contents list on mobile. No new image asset or animation is needed.

## Maintenance

Editorial owner: Clive Struver / Silicon and Stone. Recommended review cadence: monthly and after a material legislative event. No background monitoring job or automated publication has been set up.

1. Review the Commission overview and Parliament procedure before describing either track as enacted, agreed or under negotiation.
2. Check dates against the amended legal text and current Commission implementation guidance. A political agreement is not an entry-into-force date; entry into force is not necessarily the application date of a duty.
3. Main AI application dates come from the shared rule pack via `src/lib/ai-act-timeline.ts`. Do not create a separate calendar on this page. Changes to the pack require the existing regulatory verification workflow.
4. Update `DIGITAL_OMNIBUS_REVIEWED`, the visible reviewed date, the source list and the page review history only after an actual editorial review. The review date is deliberately not generated from the current clock.
5. Keep proposed data/privacy/cyber changes separate from enacted AI changes. Keep wider sovereignty measures, buyer preferences and contractual requirements distinct from Omnibus obligations.
6. Review examples and offer connections when the regulatory position changes. Avoid turning every advisory page into a duplicate explanation.

Primary sources are recorded in `src/lib/digital-omnibus.ts` and linked next to claims on the page. The sources were researched on 9 September 2026. The broader proposal's procedure was awaiting a committee decision at that review.

Historical documentation and historical Kit segmentation identifiers can still name the retired offer. They do not represent current commercial availability.
