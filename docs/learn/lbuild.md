# Build brief: Silicon & Stone Learning (`/learn`)

Read this file, then use plan mode. Explore the repo before you write any code.

## Goal

Add a new top-level section, **Silicon & Stone Learning**, to siliconandstone.com. It is the home of the course programme **Silicon to Sovereignty**: 31 courses across six levels (0–5), grouped into tracks. The section launches as a **waitlist**: every course shows a status badge, and every page captures interest. Courses go on sale one track at a time from January 2027. Foundations opens first.

The full plan and catalogue are in `docs/learn/plan.md` and `docs/learn/catalogue.md`. The full plan is the source of truth for copy structure, pricing and tags.

## Before you build: explore and report back

1. Read the AI Act Compliance Toolkit page (`/products/ai-act-toolkit`) and its components. Learn pages must reuse its patterns: the hero with tiers, numbered cards, numbered steps and edition comparison.
2. Read the WaymarkPath page (`/waymarkpath`), which has the email-capture pattern, and the homepage sections "Four ways to engage", persona routing and newsletter signup.
3. Read `src/lib/offering.ts`, the Sanity schemas, the navigation, the footer, the `/how-it-fits-together` page and the tool result screens.
4. Find how the site currently talks to the CRM: the API client, its env vars, and how it subscribes and tags a contact.
5. Propose a phased plan that names the files you will create and change. **Wait for my approval before you write code.**

## Phase 1: content model

- Sanity schemas:
  - `course`: code, title, slug, level, track, promise, audience, outcomes[], modules[], duration, exerciseTool (reference), status, cohortDates, priceStandard, priceFounding, contentCheckedDate.
  - `track`: title, slug, order, intro, courses[], price.
  - `level`.
  - `route`: persona to an ordered list of courses.
  - Add a reference from `article` to `course` (related courses).
- `status` values: `open`, `founding-cohort`, `coming` (with month), `in-development`.
- Write a seed script that loads all 31 courses from `docs/learn/catalogue.md`. Run it against the dataset only after I confirm.

## Phase 2: Learn pages

| Route | Job |
| --- | --- |
| `/learn` | Hub: hero with waitlist, why it's different (4 cards), find your route (persona tabs, including career changers / course 4.10), pathway ladder with status badges, how it works, author, teams panel, schedule summary, FAQ, waitlist again |
| `/learn/start` | Free orientation, course 0.1 |
| `/learn/paths/[track]` | Track page |
| `/learn/courses/[slug]` | Course page, using the template in the plan |
| `/learn/teams` | In-house training and the enquiry form; mention the charity discount |
| `/learn/schedule` | Release schedule |

Waitlist form:
- One required field (email). An optional second step asks for track interest, role, and *for me* or *for my team*.
- An **unticked** box opts in to the Stone Briefing. This is a separate consent.
- Use double opt-in, through the CRM.
- Tags: `learn:waitlist`, `learn:track:[track]`, `learn:course:[code]`, `learn:role:[persona]`, `learn:team`, `learn:source:[page]`.
- A *team* answer also alerts clive@siliconandstone.com.

## Phase 3: weave Learn into the existing site

- Navigation: add *Learn* between Tools and Products, with a mega-menu. Add a *Learn* column to the footer.
- Homepage: add a fifth card to "Four ways to engage", and a slim Learn band after the decision tools. **Don't change the hero.**
- `/how-it-fits-together`: add a *Learn* stage between Use and Discuss.
- Persona pages: show a recommended route on each.
- Tool result screens: add a quiet link to the course that uses that tool.
- Article footers: add a related-course card. Glossary terms link to the lesson that teaches them.

## Phase 4: SEO and polish

- schema.org `Course` and `ItemList` structured data, Open Graph images for each course, sitemap entries.
- Accessibility check. Light and dark themes both work.

## Later phases (not now)

- Stripe checkout through the CRM, with a payment-link fallback, and a charity/not-for-profit coupon.
- Completion certificates: a PDF issued by the CRM, with a verification page at `/learn/verify/[id]`.
- Self-serve learner area. The platform decision is due around April 2027.

## Rules

- Follow the house style and use the `voice-edit` skill for all copy. Banned words include: unlock, empower, seamless, game-changer, leverage (as a verb), actionable insights. No artificial urgency, no invented social proof, smart quotes.
- Regulatory claims carry dates. Article 4 (AI literacy) was rewritten by Regulation (EU) 2026/1744 on 27 July 2026. Do not describe it as the original "ensure a sufficient level" duty.
- Work on branch `feature/learn`. Commit each phase separately. Never push to main without asking.
- Ask before running the seed script, changing env vars or deploying.
