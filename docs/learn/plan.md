# Silicon & Stone Learning — plan for adding the course catalogue to siliconandstone.com

Nov 3, 2026 · @Clive Struver

## Summary

Give the courses their own section, **Learn** (`/learn`), as a new rung on the existing engagement ladder between **Use** and **Discuss**. Open it this month as a waitlist, then release one track roughly every six to eight weeks through 2027, so the run finishes before the 2 December 2027 high-risk deadline.

- **Where it lives:** a top-level *Learn* item in the main navigation, a hub page at `/learn` branded Silicon & Stone Learning, for the programme *Silicon to Sovereignty*, a page for each track and each course, and a `/learn/teams` page for in-house delivery. Courses also appear in context on the homepage, persona pages, tool result pages and article footers.
- **How people sign up:** one-field email capture on every Learn page, with optional tick-boxes for track and role. Each course page has its own *Notify me* that tags the subscriber to that course. Course interest is a separate consent from the newsletters.
- **How it rolls out:** a free 30-minute orientation (course 0.1) first, as the lead magnet. Then each track opens as a small live **founding cohort** of up to 20 people at a founding price, and is released as self-serve once the cohort has shaped it.
- **Why it will land:** no competitor starts with the chip, the power bill and the supply chain before reaching the regulation. That is Silicon & Stone's edge, and the promotional pages lead with it.
- **Build:** this plan can stay here. The site build (pages, Sanity schemas, waitlist, checkout) should move to Claude Code, working on the `silicon-and-stone-web` repo. A handoff brief is in the build section below.

## What the site review found

The site has no learning section yet, but it already has every pattern a course offer needs. The job is to reuse them, not invent new ones.

| What exists | Why it matters for courses |
| --- | --- |
| [How it fits together](https://siliconandstone.com/how-it-fits-together): a five-stage ladder (Read → Use → Discuss → Deliver → Retain) | Courses slot in as one new rung. Free Level 0 sits under Read. |
| Homepage "Four ways to engage" (Read, Tools, Buy, Retain) and persona routing (Clara, Ian, Sofia, Citizen, Troy) | Learn becomes a fifth way in, and each persona gets a recommended course route. |
| Four free tools ([Compliance Checker](https://siliconandstone.com/tools/compliance-checker), Supply Chain Mapper, Scenario Modeler, Policy Stress-Test), with email required for results | The courses' hands-on exercises, and the main route from tool user to learner. |
| [AI Act Compliance Toolkit](https://siliconandstone.com/products/ai-act-toolkit) page: hero with tiers, numbered cards, numbered steps, edition comparison, limits stated plainly, upsell to advisory | The template for course pages. Same look, same honesty about limits. |
| [WaymarkPath](https://siliconandstone.com/waymarkpath): one-field early-access list, plain development status, a promise about email use | The template for the waitlist. |
| [Pricing](https://siliconandstone.com/pricing): "checkout isn't open yet"; buy buttons collect an email | Courses can't be sold until Stripe checkout is live. That makes the CRM and Stripe work a dependency. |
| Brand voice: "Analysis from the Edge", independent, primary sources, open corrections; calm and never breathless | Course copy must sound the same. No hype, no invented social proof, no urgency tricks. |

Three things to fix before courses are promoted:

- **The About page doesn't name you.** Courses sell on the teacher. Add a short author profile (30 years, Motorola, Anritsu, WDS Global, semiconductor supply chains) to About and to every course page.
- **The Drift Retainer is still on the site,** though it has been folded into the Integration Room. Course upsells should point at whichever retainer is current.
- **Article 4 changed on 27 July 2026.** The Digital Omnibus ([Regulation (EU) 2026/1744](https://presencis.com/regulations/eu-ai-act/article-4/)) rewrote the AI literacy duty in softer terms, though it [still applies](https://www.dpo-consulting.com/blog/ai-act-what-the-digital-omnibus-really-changes-for-companies). Course 0.2 and any "literacy" copy must not sell it as the original "ensure a sufficient level" obligation.

## Where the courses live

Courses get their own top-level section, **Silicon & Stone Learning** (*Learn* in the navigation), and the programme inside it is called **Silicon to Sovereignty**. The name describes the arc exactly: Levels 1–2 are the silicon, Level 5 is sovereignty. A section of its own, rather than a tab under Products, signals that this is a programme, not a download.

&#91;embedded content: Learn section structure · 5 entry points, 1 hub, 1 sign-up\]

Every page funnels to the same sign-up. Team buyers branch off to an enquiry that leads into advisory.

| Page | URL | Job |
| --- | --- | --- |
| Learn hub | `/learn` | The promise, routes by role, the full catalogue with status badges, the release schedule and the waitlist |
| Free orientation | `/learn/start` | Course 0.1, *AI in 30 minutes*, as the free entry point and lead magnet |
| Track pages | `/learn/paths/foundations`, `/infrastructure-and-sovereignty`, `/eu-ai-act`, `/practitioner`, `/security`, `/capstone` | Why the track matters, its courses in order, track price, track waitlist |
| Course pages | `/learn/courses/how-ai-actually-works` (one per course, all 31) | The sales page: outcomes, shape, exercise, dates, price, sign-up |
| In-house training | `/learn/teams` | Private delivery: 60-minute board briefing to two-day workshop, per-seat licences, enquiry form |
| Release schedule | `/learn/schedule` | What opens when. An honest roadmap that gives people a reason to join the list now |

**Changes to existing pages:**

- **Main navigation:** add *Learn* between *Tools* and *Products*, with a mega-menu listing the six tracks, the free orientation and *In-house training*. Add a *Learn* column to the footer.
- **Homepage:** add a fifth card to "Four ways to engage" (*Learn*). Add one slim band after the decision tools: the programme line, three track highlights and the waitlist field. Don't touch the hero.
- **How it fits together:** insert *Learn* as a new stage between *Use* and *Discuss*. Courses are the natural step from trying a tool to talking to you, and the capstone leads into the Strategic Assessment.
- **Persona routing:** each persona gets a recommended route, taken from the catalogue's routes-by-role table. For example, the board and executive route is 0.1, 1.3, 2.2, 2.4, 3.2, 4.1 and 5.2.
- **Tool result screens:** after the result, add a quiet line such as "Learn to read this result properly", linking to the course that uses the tool (Compliance Checker to 4.3, Supply Chain Mapper to 2.3).
- **Articles and glossary:** a Sanity reference from article to course puts a related-course card in the article footer. Glossary terms link to the lesson that teaches them.

## The promotional pages

The hub sells one idea: **most AI training starts at the chatbot; this one starts at the chip.** Competitors teach board-level AI as strategy plus regulation (for example CGI's half-day boardroom courses). None of them explains why a data centre needs its own grid connection, or who controls the stack you rent. That is the gap, and it matches the publication's voice.

### Learn hub (`/learn`): section by section

1. **Hero.** Eyebrow: *Silicon & Stone Learning · Silicon to Sovereignty*. Headline options:
   - "Most AI training starts at the chatbot. Ours starts at the chip."
   - "Understand the machine before you sign off on it."
   - "AI, from the chip to the boardroom."

   Subhead: "Courses for the leaders who have to approve, buy and answer for AI: how it works, what it runs on, what the rules now require, and who really controls your stack." Then the email field, the button *Join the list* and a status line: "First courses open January 2027. Founding places are limited to 20 per cohort."
2. **Why this is different.** Four numbered cards, in the style of the Toolkit page:
   1. *Starts with the physical stack.* GPUs, memory, power and the supply chain, because they decide cost, risk and sovereignty.
   2. *Current, dated, sourced.* Post-Omnibus dates, primary sources and open corrections, the same standard as the publication.
   3. *One question throughout.* Who controls your stack, and what are you liable for in a model you didn't build?
   4. *You practise on real tools.* Every course ends with an exercise in the Compliance Checker, Supply Chain Mapper, Scenario Modeler or Policy Stress-Test.
3. **Find your route.** Persona-style tabs (Board and executive, Governance lead, SME owner, Operations and supply chain, Technical, Privacy and legal, and Moving into AI governance for career changers, built around course 4.10). Each tab shows its route of 4–7 courses as a numbered path, with total time.
4. **The pathway.** Six levels drawn as a ladder, from 0 Orientation to 5 Sovereignty capstone. Each course is a card with a code, a title, a duration and a status badge: *Open*, *Founding cohort*, *Coming \[month\]* or *In development*.
5. **How the courses work.** Core plus Go deeper in every module; slides, an interactive lesson and a written guide; live founding cohorts first, self-serve after; one exercise per course.
6. **Who teaches it.** Short author profile with a photo: 30 years in the industry, Motorola, Anritsu, WDS Global, semiconductor supply chains, and publishing from Sanday. Independent, with no vendor sponsorship.
7. **For teams.** One panel: "Train your board or your whole staff", linking to `/learn/teams`.
8. **Release schedule** (a summary of `/learn/schedule`), then **FAQ**, then the **waitlist** form again.

### Course page template (`/learn/courses/[slug]`)

Reuse the Toolkit page's structure so courses feel native:

| Section | Content |
| --- | --- |
| Hero | Eyebrow (*Level 2 · Infrastructure and sovereignty · Course 2.2*), title, a one-line promise, status badge, price or *Notify me* |
| Who it's for | Role chips, plus one sentence on prior knowledge |
| What you'll be able to do | 3–5 outcomes, each starting with a verb: "Explain to your board why…" |
| Shape of the course | Numbered modules, duration, the Core and Go deeper split |
| The exercise | Which Silicon & Stone tool you use and what you leave with (a register, a dependency map, a board note) |
| Free sample | One diagram or a 5-minute taster lesson, with email capture to unlock it |
| Dates and format | Cohort dates, session times (UK), recording policy, self-serve release date |
| Price | Founding price, standard price, team price, and what is included |
| What this course is not | Not legal advice and not a professional qualification. Learners receive a Silicon & Stone completion certificate, not an accreditation. The limits of the Compliance Checker are taught explicitly |
| Related | Two articles, one tool, the next course on the route |

### Copy rules

- Follow the house style and the `voice-edit` skill: no *unlock*, *empower*, *seamless* or *game-changer*, and no artificial urgency.
- **Honest scarcity only.** "20 places" is true because you teach live. Don't add countdown timers.
- **No invented social proof.** Leave out "Join 500 leaders" until it's true. After the first cohort, add named testimonials, with permission.
- **Regulatory claims carry dates and labels** (fact, inference or scenario), as in the articles. Each course page shows "Content checked against: \[date\]".
- **Benefit before topic.** "Know which questions to ask before you sign a data-centre or cloud contract" works better than "Module 3: Power and cooling".

## Sign-up and interest capture

Build one waitlist with tags, not a separate list for each course. Warm waitlists typically convert to paid at [5–15%, against 0.5–2% for cold traffic](https://getlaunchlist.com/waitlist-for-online-courses). So the list is the launch.

**The form.** Use one required field (email). The optional fields are on the same line or in a second step, so the form stays short:

- "What would you like first?": tick-boxes for the six tracks.
- "Your role": the persona list.
- "For me / for my team". A *team* answer sends a separate alert to you, because that's a sales lead.
- An unticked box: "Also send me the Stone Briefing". Course interest and newsletter consent stay separate under UK GDPR and PECR. Use double opt-in.

Under the button, use the WaymarkPath promise, adapted: "Course news only: opening dates, founding places, free lessons. No spam, and unsubscribe any time."

**Tags.** `learn:waitlist`, `learn:track:[track]`, `learn:course:[code]` (set by each course page's *Notify me*), `learn:role:[persona]`, `learn:team`, plus a source tag (homepage, tool, article, briefing). With these you can email exactly the people who asked about 2.2, and you can see which courses to build first.

**The founding cohort.** Each track opens first as a small live cohort:

- **Size:** 12–20 people. In one 2026 study of 1.31 million enrolments, cohorts of 11–25 had the [highest completion (65.2%)](https://www.ruzuku.com/learn/articles/cohort-vs-self-paced-completion-study). The study is observational and from one platform.
- **Offer:** a founding price (about 40% off the standard price) in return for feedback and, if they're willing, a named testimonial. Founding members keep access to every later update of the self-serve version.
- **Waitlist first:** each opening goes to the tagged waitlist 7 days before the public announcement.

**Email sequences.**

| Sequence | When | Emails |
| --- | --- | --- |
| Welcome | On sign-up | 1. Confirm, plus the link to the free 0.1 orientation. 2. (Day 3) "Why this starts at the chip", with one diagram from 2.2. 3. (Day 7) A two-question survey: which track, and what problem you're trying to solve. |
| Pre-opening | 14 days before a track opens | 1. What the track covers, who it's for, dates. 2. (Day 7) Founding places open to the waitlist. 3. (Day 10) An FAQ and a sample lesson. 4. (Day 13) Last call before public release. |
| Opening | Public opening | Announcement in the Stone Briefing, LinkedIn and YouTube; one reminder to tagged non-buyers. |
| Between cohorts | Monthly | A free lesson or diagram, the schedule, what changed in the rules. |

**Email and checkout run on your CRM.** It holds the waitlist and tags, and sends every sequence above. If its Stripe paid tiers are live, *Join the founding cohort* goes straight to checkout. If not, the CRM sends a Stripe payment link, so the first cohort can run either way.

## Rollout plan

Open the waitlist in November 2026, run the first paid cohort in January 2027 and finish with the sovereignty capstone in November 2027. That is three weeks before high-risk obligations apply on 2 December 2027, which gives the whole programme a natural deadline.

&#91;embedded content: Proposed rollout · Nov 2026 to Dec 2027\]

Each track follows the same five-step cycle:

1. **Announce** on the schedule page and in the Stone Briefing, 6–8 weeks out. The *Notify me* tag starts collecting.
2. **Pre-open** to the tagged waitlist 14 days out, with founding places offered 7 days before the public.
3. **Teach live** to a founding cohort of 12–20, in 4–6 weekly sessions of 60–90 minutes (UK lunchtime or 08:00 suits directors), recorded.
4. **Refine:** fold in questions, fix weak lessons, collect testimonials.
5. **Release self-serve** 4–6 weeks after the cohort ends. The course page switches from *Founding cohort* to *Open*.

**Order and why:**

- **November–December 2026:** pages, waitlist and the free 0.1 orientation. Write courses 1.1 and 1.3, which are designed but not yet written; they are the critical path for January. Leave the Christmas period quiet.
- **January 2027, Foundations (1.1–1.4):** the brand's differentiator and the natural next step after the free orientation. It builds the audience for every track after it.
- **March 2027, EU AI Act Core:** the course exists. Bring it up to date with the Digital Omnibus dates before it opens, and sell it with the Toolkit.
- **April–May 2027, Infrastructure and sovereignty:** the signature track, built from the Physicality of Compute research. Launch it alongside YouTube content on data centres and power.
- **June–July 2027, Practitioner plus Toolkit:** sell with Toolkit bundles.
- **August–November 2027, electives (self-serve) and Security:** 3.4 ISO 42001 first, then 3.6, 3.3, 3.5, 3.7, 3.8 and 3.9 as written. The career course 4.10 is released self-serve in August and promoted through the *Moving into AI governance* route. Security runs live in September and October, once 4.7 and 4.8 have source material.
- **November 2027, sovereignty capstone:** a half-day live session for directors, leading into the Strategic Assessment.

At 3–6 hours a week, run one live cohort at a time. A cohort takes about 3 hours a week (sessions plus preparation), which leaves the rest for writing the next track and turning the last one into its self-serve version.

## Pricing and packaging

Price by track rather than by course, within the brief's £200–800 band, and keep single courses as a cheaper way in. These prices are agreed. Review them after the first two cohorts.

| Offer | Proposed price (incl. VAT) | Founding price | Notes |
| --- | --- | --- | --- |
| Level 0: 0.1 and 0.2 | Free | Free | Lead magnet; the per-seat staff licence for 0.2 is sold to teams |
| Single self-serve course | £95–195 | n/a | Price by length |
| Self-serve track | £295–495 | n/a | Released after the founding cohort |
| Live cohort track (4–6 sessions) | £595–795 | about £350–475 | 12–20 places |
| EU AI Act Core plus Toolkit Standard | Track price plus £49 | Toolkit included | The bundle the catalogue already plans |
| Sovereignty capstone (half day, live) | £950 per person | £650 | Fee credited against a Strategic Assessment within 60 days |
| In-house: board briefing (60–90 min) to two-day workshop | On scoping | n/a | Through `/learn/teams` and advisory |

**How this compares.** CGI's live-online *AI Discussions in the Boardroom* (four hours) costs [£340–425 excluding VAT](https://www.cgi.org.uk/qualifications-training/training-courses/upcoming-courses/ai-discussions-in-the-boardroom/). A half-day *AI for Board Members and Directors* course costs [£255](https://e8b7e750-60c8-4e5f-adaa-d298858b315c.azurewebsites.net/course/ai-for-board-members-directors). A practitioner AI governance certificate costs [from £2,399 plus VAT](https://www.localgovernmentlawyer.co.uk/events/information-law/ai-governance-practitioner-certificate-act-now-3). A live track of four to six sessions at £595–795 sits above a single half-day and well below a certificate.

**Links to the rest of the ladder:**

- Course alumni get the Advisory Briefing (£450) with the course fee partly credited, for example £100 off.
- The Integration Room retainer includes one in-house briefing a year and free seats for client staff.
- Toolkit Professional buyers get 20% off the Practitioner track.

**Charities and not-for-profits:** a discount on every paid course, track and in-house booking, on proof of registered status. 30% is a suggested starting rate. The CRM applies it as a Stripe coupon, and the free Level 0 stays free for everyone. Mention it on `/learn/teams`, in the hub FAQ and on each course page's price block.

## Delivery platform and technical build

Keep the promotion, catalogue and sign-up on siliconandstone.com, where the brand, the SEO and the tools already are. Decide where the paid lessons live after the first cohort, once you know how people actually use them.

**Recommended route:**

1. **Now (waitlist):** build the Learn pages on the existing site. Course, track and level content lives in Sanity, so the catalogue and status badges update without code changes. Waitlist sign-ups go straight into your CRM, with tags, and the CRM sends every sequence.
2. **Founding cohorts (January–June 2027):** deliver live on Zoom or Teams. Materials (slides, written guide, recordings) go on a gated page or in a shared folder, and payment uses Stripe Payment Links. This is low build and tests the content before the platform.
3. **Self-serve (from mid-2027):** choose between:
   - **A learner area built into the site:** Stripe checkout, magic-link login, course pages gated by purchase, progress tracking. This fits the CRM plan (Stripe plus digital fulfilment) and keeps everything on one brand. It is more to build and maintain.
   - **A hosted course platform, white-labelled** (for example Thinkific or Teachable) on a subdomain such as `learn.siliconandstone.com`. This is faster and comes with quizzes, certificates and team seats, but it means a monthly fee and a second look and feel.

**Does this need Claude Code? Yes, for the build.** This plan, the copy and the course content can stay in this project. The site work touches the `silicon-and-stone-web` repo on your Lexar drive: Next.js routes, Sanity schemas, `src/lib/offering.ts`, forms and email-platform integration. Claude Code can read the existing components and match them, so the Learn pages reuse the Toolkit page's cards and step styles exactly.

**Handoff brief for Claude Code:**

- [ ] Sanity schemas: `course` (code, title, slug, level, track, promise, audience, outcomes, modules, duration, exercise tool reference, status, dates, prices, contentCheckedDate), `track`, `level`, `route` (persona to ordered courses), plus a reference from `article` to `course`.
- [ ] Seed Sanity with the 31 courses from the catalogue doc.
- [ ] Routes: `/learn`, `/learn/start`, `/learn/paths/[track]`, `/learn/courses/[slug]`, `/learn/teams`, `/learn/schedule`.
- [ ] Components: status badge, course card, route stepper, pathway ladder, waitlist form (one field plus optional step two), course-page sections that reuse the Toolkit page's patterns.
- [ ] Waitlist API route that posts to the CRM: double opt-in, tags, source capture, a team-lead alert to clive@siliconandstone.com.
- [ ] Edits to existing pages: navigation, footer, homepage card and band, the How it fits together stage, persona routes, tool result CTAs, article footer cards, glossary links.
- [ ] SEO: `Course` and `ItemList` structured data (schema.org), Open Graph images for each course, and a sitemap.
- [ ] Add courses to `offering.ts` and the Offering Catalogue, in that order, as the catalogue's open decisions say.

* [ ] Completion certificates: a PDF with the learner's name, course, date and hours, issued by the CRM when the last session or lesson is completed. Each certificate has a verification page at `/learn/verify/[id]`, so learners can share it on LinkedIn.
* [ ] Charity and not-for-profit coupon in Stripe, with a short eligibility form.

## Measures of success

The signal that matters most is the waitlist size before each opening. As a rule of thumb, a 20-place cohort needs about 150–200 tagged sign-ups for that track, assuming roughly 10% convert.

| Measure | Target | Why |
| --- | --- | --- |
| Waitlist sign-ups by 31 Dec 2026 | 300 | Enough to fill the first cohort and set the order of later tracks |
| Sign-ups per track before opening | 150+ | Open the cohort only when this is reached; otherwise extend the pre-opening period |
| Free 0.1 completions | 40% of starters | Tests whether the orientation earns the next step |
| Founding cohort fill | 12+ of 20 places | The minimum for a good live group |
| Cohort completion | 70%+ | Live, small, deadline-driven formats should reach this |
| Learner to advisory | 1 Advisory Briefing or retainer enquiry per cohort | Courses feed the main business |
| Team enquiries | 1 a month by Q2 2027 | In-house delivery is the highest-value route |

The targets are starting points to revise after the first opening.

## Decisions

Settled on 3 November 2026:

| Question | Decision |
| --- | --- |
| Live teaching capacity | 3–6 hours a week |
| First paid course | Foundations (January 2027), then EU AI Act Core (March 2027) |
| Email and waitlist | Your own CRM |
| Certificates | Completion certificates; no accreditation |
| Names | Section: Silicon & Stone Learning. Programme: Silicon to Sovereignty |
| Prices | As proposed |
| Career course 4.10 | Promoted here, through its own route |
| Discounts | For charities and not-for-profits |

Still open:

- [ ] **Self-serve platform:** a learner area in the site, or a hosted platform on a subdomain? This can wait until about April 2027.
- [ ] **Charity discount rate:** 30% is suggested. Confirm it, and say whether it also covers in-house delivery.

## Sources

- [siliconandstone.com](https://siliconandstone.com), [How it fits together](https://siliconandstone.com/how-it-fits-together), [Pricing](https://siliconandstone.com/pricing), [AI Act Compliance Toolkit](https://siliconandstone.com/products/ai-act-toolkit), [WaymarkPath](https://siliconandstone.com/waymarkpath), [About](https://siliconandstone.com/about)
- [AI from Silicon to Sovereignty: Course Catalogue](https://claude.ai/artifact/KG5BiN9T2PytRc74iqPTo7)
- [Ruzuku: cohort vs self-paced completion study (2026)](https://www.ruzuku.com/learn/articles/cohort-vs-self-paced-completion-study)
- [LaunchList: waitlists for online courses](https://getlaunchlist.com/waitlist-for-online-courses)
- [CGI: AI Discussions in the Boardroom](https://www.cgi.org.uk/qualifications-training/training-courses/upcoming-courses/ai-discussions-in-the-boardroom/)
- [AI Governance Practitioner Certificate (Act Now)](https://www.localgovernmentlawyer.co.uk/events/information-law/ai-governance-practitioner-certificate-act-now-3)
- [DPO Consulting: what the Digital Omnibus changes](https://www.dpo-consulting.com/blog/ai-act-what-the-digital-omnibus-really-changes-for-companies)
- [Presencis: Article 4 as replaced by Regulation (EU) 2026/1744](https://presencis.com/regulations/eu-ai-act/article-4/)
