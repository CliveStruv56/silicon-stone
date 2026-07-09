# Silicon and Stone · Welcome Pack

**For Jane · v3 · May 2026**

Welcome to Silicon and Stone.

Everything you need to know to come up to speed — what we're building, why, where things stand today, and where you fit. Read it in any order.

---

Jane,

Clive and I have been working through the strategy and execution for Silicon and Stone over the past few sessions. He mentioned you want to get more involved, and that's good news — there's more to do than one person can do well, and your business analyst and CMS background fits exactly the parts of this that have been thinly resourced.

This is **v3** of the Welcome Pack. v2 was written before the platform went live; this version reflects what's actually deployed today, what's still pending, and what the next phase is really about.

If anything in here is unclear, push back. The plan is still being shaped — your perspective is genuinely wanted, not just a check-the-box exercise.

— Prepared with Hyperagent for Clive
Silicon and Stone · Sanday, Orkney
Read time: ~30 minutes

---

## Contents

1. **Orientation** — What we're building, and where we are today
2. **The brand and the method** — In plain English
3. **The strategy** — How this becomes a business
4. **The team** — How the three of us work together
5. **First 30 days** — What to do, in order
6. **Reference** — Glossary and quick lookup

---

## 01 · Orientation
### What we're building, and where we are today

#### The thirty-second version

Silicon and Stone is a strategic intelligence service for senior European professionals navigating the 2026 technology power shift. It runs as a website, a weekly newsletter (on Kit), a Substack running in parallel, four interactive analytical tools, a planned YouTube channel, and a planned series of paid PDF intelligence reports. The audience is decision-makers in semiconductors, telecoms, AI infrastructure, regulation, and adjacent fields — the kind of people who run engineering teams, sit on compliance committees, advise governments, or make procurement decisions.

The product is rigorous, calibrated analysis of what events like the EU AI Act, US chip export controls, the Pax Silica alliance, and Asian supply-chain shifts actually mean for European decision-makers — analysis they can use to make better decisions, not commentary they can scroll past.

#### The problem we're solving

Senior professionals today have more technology-policy news than any generation before them and less methodology for processing it. The CHIPS Act, the EU AI Act, US export controls, AI hyperscalers, the fracturing of the post-1989 globalisation consensus — every one of these would have been a defining story in any prior decade. They are all happening at once.

Most coverage of these events is either too political (think tank position papers), too technical (industry analysts), or too superficial (general news). What's missing is rigorous, practitioner-grade analysis written by someone who has actually built and managed in the systems being discussed — and who explains it in language a senior person can use to make a decision.

That's what Clive's thirty years gives us. The framework — Forensic Technopolitics — gives the work structure. The combination is the moat.

#### Where we are today — the honest version

The platform is **live in production at siliconandstone.com** and has been since 31 March 2026. Specifically:

- The website ships from Vercel and pulls content from Sanity CMS.
- A separate logic backend runs on Railway, handling subscribe, contact, briefings, and categories endpoints. (You don't have to think about this — it's invisible from the editor's seat.)
- **Nine articles are published**, mostly the January 2026 launch set; another four generated drafts are queued in Sanity awaiting cover images and review.
- **Four interactive tools** are live and email-gated for lead capture: Compliance Checker, Supply Chain Mapper, Scenario Modeler, Policy Stress-Test.
- Three product sales pages are live (Toolkit £79/£149, AI Audit Checklist £24, Sector Briefings coming soon). Paid-product buttons use an early-access enquiry fallback until the Lemon Squeezy store and checkout URLs are configured.
- Newsletter and contact forms run through **Kit** (the platform formerly known as ConvertKit), with a **Substack** running in parallel for distribution.
- Plausible analytics is deployed in code, pending account setup.
- The Sanity → Pinecone vector pipeline runs automatically: every published article is indexed for semantic search and used as RAG context for future drafts.

What's **not** launched yet, and what the next phase is really about:

- The YouTube channel.
- The regular weekly content cadence (Tuesday Stone Briefing + Friday Practical Move).
- The paid Intelligence Series PDFs.
- The lead-magnet PDF (Atlantic Drift Briefing — outline drafted, full PDF still to write).
- LinkedIn cadence.
- Sponsorship and consulting flows.

So when this Pack talks about "launch", it means **launch of the publishing operation**, not launch of the platform. The platform is already there. The infrastructure is live. The audience-build has not started.

#### Where we're going

Phased over the next six months:

- **Days 1–14**: Methodology paper published (draft is ready — see `docs/forensic-technopolitics-methodology.md`), Atlantic Drift Briefing PDF shipped, newsletter cadence kicked off, LinkedIn cadence started.
- **Days 15–90**: YouTube channel launches with two videos per week. Email list grows. First paid Intelligence Series PDF (Semiconductor Supply Chain) pre-sold and shipped. Lemon Squeezy store live; affiliate links in YouTube descriptions from day one.
- **Days 91–180**: Membership product (Executive Intelligence Briefing) launches when the email list justifies it. Sponsorship outreach begins. Consulting opportunities start arriving organically through VBP Solutions (Clive's separate consulting brand) on the back of Silicon and Stone's authority.

Revenue target for the first twelve months: under £2k/month is sustainable; around £2k/month is the goal. The runway exists. The work is making the first hundred subscribers turn into the first thousand, and the first paid PDF turn into a recurring product line.

#### What I'd want you to take away from this section

The thing being built is more sophisticated than a YouTube channel. It's a publishing operation with a methodology, a defined audience, a content pipeline, a working CMS, four interactive tools that already capture leads, and a planned product line. Clive is the analyst-author. Hyperagent is the research and drafting engine. You — based on your experience — are the natural fit for everything between "we have a draft" and "the right people have read it." That's the spine of how this becomes a business.

---

## 02 · The brand and the method
### In plain English

#### Why "Silicon and Stone"

Silicon is the world's most engineered material — refined, layered, transient. Stone is its opposite — endured, weathered, permanent. Sanday's 5,000-year-old Neolithic monuments and the 5-nanometre transistor are products of the same human urge: to fix capability into matter that outlasts us.

The brand is published from the place where those two timescales meet, and from the conviction that you cannot understand the new without anchoring in the old. The name does the work of positioning before any content is read.

#### The edge position

Sanday is not incidental. London and Brussels see the politics. Frankfurt sees the markets. Munich sees the engineering. None of them see the system as a whole, because they're inside one of its parts.

The edge is where second-order effects become visible first. When a manufacturing investment decision is made in Berlin, it shows up in the supply chain, the labour market, and the regional economy of places like Sanday before it shows up in any Frankfurt newspaper. That's the perspective Silicon and Stone is published from. Not because it's exotic. Because it's clearer.

#### Forensic Technopolitics — the method

This is the analytical framework Clive has built. Every piece of content Silicon and Stone publishes uses it. You don't need to apply it yourself — but you should understand its shape, because it's what makes the work distinctive. The full version lives in the methodology paper at `docs/forensic-technopolitics-methodology.md`. The summary:

##### Three forensic domains

Three layers of technology power that get analysed:

- **Supply Chain Forensics** — the physical layer. Where are the chokepoints? Who controls them? What does substitution actually cost? This is where Clive's thirty years on the inside pays off — he can read a supply chain the way a doctor reads a chest X-ray.
- **Policy Stress-Testing** — the regulatory layer. What does this rule actually do when enforced? Who complies, who pays, who evades? Different from reading the legislation.
- **Talent & Capability Flow** — the human layer. Where are the people moving? Which capabilities are accumulating in a region, and which are hollowing out? This is the connection point between the macro story and individual professional reality. It's also the most underserved domain in existing technology-policy commentary.

##### Two analytical methods

Applied to all three domains:

- **Scenario-Based Modelling** — instead of a single confident forecast, every analysis runs three scenarios (low / medium / high friction) so the decision-maker has a structured menu of preparation moves.
- **Long-Memory Filter (30-Year Cycle Benchmark)** — pattern-matching the current event against the last thirty years of industrial cycles. The 1986 US-Japan Semiconductor Agreement, the 1990s offshoring wave, the 2000s globalisation consensus. History rhymes; the framework formalises that pattern recognition.

##### The matrix

Three domains × two methods = a 3×2 matrix of analytical moves. Every published Stone Briefing applies two to four of them. Every Deep Dive is eligible to apply all six, but the Methodology Audit only claims cells the body visibly uses. That transparency is the framework's commitment to intellectual honesty.

In Sanity Studio you'll see these as the six values in the **Methodology Audit (3×2 matrix cells)** field on every article:

| Cell | CMS slug |
|---|---|
| Supply Chain × Scenario Modelling | `supply-chain-scenario-modelling` |
| Supply Chain × Long-Memory Filter | `supply-chain-long-memory-filter` |
| Policy × Scenario Modelling | `policy-scenario-modelling` |
| Policy × Long-Memory Filter | `policy-long-memory-filter` |
| Talent × Scenario Modelling | `talent-scenario-modelling` |
| Talent × Long-Memory Filter | `talent-long-memory-filter` |

##### The Stone Truth

Every analysis ends in a single declarative one-line verdict — the Stone Truth. It is the most quotable, citable line in the piece. It is what the reader takes away and what AI search engines will start citing when users ask about European tech sovereignty or chip policy.

> "Pax Silica is the 1986 Semiconductor Agreement reborn — a managed-trade pact dressed as an alliance. Europe sat outside that one for fifteen years and emerged with a hollowed manufacturing industry."

That's an example. Stone Truths are short, calibrated, opinionated where the analysis warrants, hedged where it does not.

#### The audience — five personas

Every piece of content is tagged for relevance to one or more of these five decision-maker types. The full pain-points and content needs for each live in `docs/persona-profiles.md`. The persona documents in Sanity Studio currently hold a shorter version — bringing them in line with the markdown file is a v3 follow-up.

- **Compliance Clara** — Legal or compliance counsel at tech firms, large enterprises, law firms. Cares about: AI Act implementation timelines, risk classification, documentation, cross-border regulatory complexity.
- **Industrial Ian** — Operations or supply chain manager at semiconductor companies, electronics manufacturers, automotive OEMs. Cares about: supply chain disruption risks, foundry capacity, export control implications, reshoring decisions.
- **Sovereign Sofia** — Policy analyst or advisor at government agencies, think tanks, international organisations. Cares about: technology sovereignty strategies, industrial policy effectiveness, regulatory arbitrage, international governance.
- **Global Citizen** — Informed general public — journalists, educators, generalists. Cares about: broad technology and society implications, consumer impacts, democratic oversight of technology.
- **Transatlantic Troy** — Founder/CEO of a US or Canadian startup or mid-market company doing (or weighing) business in Europe. Cares about: AI Act obligations for non-EU providers, data localisation, cloud certification, procurement rules — the cost of entering the European market.

Clara, Ian, Sofia, and Troy are the high-priority audience for paid products. Global Citizen is the broader top-of-funnel reader who eventually self-sorts into one of the others.

A note on slug naming: when you tag an article in Sanity's **Personas** field, you'll see short codes — `clara`, `ian`, `sofia`, `citizen`, `troy`. The persona documents themselves have longer slugs (`compliance-clara`, etc.). Both refer to the same person; the article-level field uses the short codes.

---

## 03 · The strategy
### How this becomes a business

#### Two pillars per week

The YouTube channel runs two long-form pieces per week. The pillars are deliberate — they share an audience but serve different needs.

- **Tuesday — The Stone Briefing**: 12–20 minute analytical piece. Talking head with maps, data overlays, and the on-screen Methodology Audit. Sober, authoritative, intelligence-briefing tone. Drives the Intelligence Series PDFs and B2B sponsorships.
- **Friday — The Practical Move**: 5–10 minute applied piece. Often screen-share or demonstration format. Same audience, but the framing is "so what do I do about this?" — practical AI fluency, supply-chain literacy, career-positioning content. Drives the career products and affiliate revenue.

#### The bridge

Tuesday's analysis creates Friday's context. If Tuesday is on the Pax Silica chip alliance, Friday is on what supply-chain literacy now means for an operations director's CV. If Tuesday is on the phased EU AI Act timetable, Friday is on the governance evidence an operations leader needs to request from vendors.

This bridge is the moat. Pure geopolitics commentators don't connect to career impact. Pure career creators don't have the analytical depth. Silicon and Stone does both. That's why it is one channel, not two.

#### The revenue ladder

Built to compound, not to sequence. Each layer activates as the audience justifies it.

| Phase | Stream | Activation status |
|---|---|---|
| 1 | Free PDF lead magnets (email capture via Kit) | Lead capture **live** via tool email gates and homepage; Atlantic Drift PDF outline drafted, full PDF pending. |
| 1 | Affiliate links in YouTube descriptions | Pending channel launch. |
| 2 | Paid Intelligence Series PDFs (£12–19) | Sales pages live with early-access enquiry fallback; Lemon Squeezy store creation + product files pending. |
| 2 | YouTube ad revenue (AdSense) | Pending channel launch + thresholds (1,000 subs + 4,000 watch hours). |
| 3 | Sponsorships (B2B integrations) | Month 12+, when audience-quality data justifies. |
| 3 | Premium subscription (£7–12/mo) | Month 12+, when newsletter shows engagement. |
| 4 | Selective consulting (via VBP Solutions) | Opportunistic, as authority generates demand. |

#### The flagship lead magnet

The Atlantic Drift Briefing: 5 Supply Chain Chokepoints Every European Executive Should Monitor in 2026. A 10–15 page PDF demonstrating the methodology. It must exist before the first YouTube video so every video can drive viewers to it. Status: outline drafted at `docs/atlantic-drift-briefing-outline.md`; full PDF still to write.

In the meantime, the four interactive tools (Compliance Checker, Supply Chain Mapper, Scenario Modeler, Policy Stress-Test) are doing the lead-capture job: each one requires an email before showing results, and all sign-ups go to Kit tagged as `Tool_Lead`.

#### Why this works in a saturated market

YouTube's geopolitics niche has established players — Zeihan, CaspianReport, TLDR, Asianometry. They have hundreds of thousands of subscribers each. We are not competing with them on their ground. We occupy the intersection none of them serves: the practitioner-grade analysis of European technology supply chains and policy, written specifically for the senior career professional who needs to act on it.

That niche is narrower, but the audience is wealthier (Tier-1 advertising CPMs of $15–30 vs $4 for generic creators), more buying-prone (B2B PDFs at £14.99 vs free YouTube views), and underserved. A small audience of the right people is worth more than a large audience of the wrong ones.

#### A note on patience

Channels in this niche typically see real momentum after 20–50 videos. The first three months will feel slow, possibly slower than that. The compounding kicks in once: (a) the email list crosses 500, (b) the first paid PDF ships, (c) the YouTube algorithm recognises the audience cluster. None of those happen in week one. All of them happen if the cadence holds. The biggest risk is not slow growth — it is inconsistency.

---

## 04 · The team
### How the three of us work together

#### Who does what

- **Clive — Founder / Analyst / On-Camera.** The voice and the analysis. Owns the editorial line, the Stone Truths, and what gets said on camera. Picks the topics, signs off the verdicts, and is the on-screen presence. Final word on anything that affects positioning, methodology, or claims.

- **Jane — Operations & Audience.** The platform, the cadence, and the audience. Owns Sanity CMS publishing, the editorial calendar, social media (LinkedIn primary), audience analytics, and the pipeline that takes a draft from "ready" to "in front of the right reader." Final word on anything that affects how the work reaches its audience.

- **Hyperagent — Research & Drafting.** The drafting engine. Takes a topic from Clive and produces a Sanity-ready draft applying Forensic Technopolitics in his voice — typically with paired versions for newsletter, LinkedIn, and YouTube script. Maintains methodology consistency. Available across threads and projects, not just here.

- **VBP Solutions — Consulting (separate brand).** Clive's existing consultancy. Kept deliberately separate from Silicon and Stone. The methodology connects them — VBP delivers bespoke engagements "applying the Forensic Technopolitics framework" — but the brands and audiences stay distinct. Silicon and Stone is the audience-builder; VBP is the high-ticket commercial outlet.

#### Working assumptions for month one

These are the proposed ownership lines for the first month. They are here to make the starting workflow clear, not to lock anyone into a permanent structure. The principle: whoever owns the outcome owns the call.

| Decision area | Owner | Notes |
|---|---|---|
| Topics, angles, Stone Truths | Clive | Jane and Hyperagent advise; Clive decides. |
| Methodology and framework changes | Clive | Substantive amendments shipped via paper revisions. |
| Editorial calendar and cadence | Jane | Clive flags conflicts; Jane resolves the schedule. |
| Sanity tagging, polishing, publishing | Jane | Once a draft is approved by Clive. |
| LinkedIn voice, posts, engagement | Jane | Clive approves the first month, then Jane runs. |
| Newsletter (Kit + Substack) send schedule and copy | Jane | Drafted with Hyperagent; Clive approves the body once. |
| YouTube uploads, thumbnails, descriptions | Jane | Filming and voice = Clive; everything around it = Jane. |
| Audience analytics and persona-fit reviews | Jane | Quarterly review brings findings back to editorial. |
| Brand voice deviations | Clive (with Jane veto) | If Jane spots off-brand output, she can stop the train. |
| Tools, integrations, workflows | Joint | Hyperagent proposes; Clive and Jane agree. |
| Pricing, products, sponsorship deals | Clive | With Jane's audience-data input. |

#### Weekly cadence

Here's what a normal week looks like once the operation is steady-state. Adjust during launch.

| Day | Clive | Jane |
|---|---|---|
| Mon | Topic selection for the week. Research review (Inoreader + Pinecone). Brief Hyperagent. | Edit any pending Sanity drafts. Schedule Tuesday's social posts. |
| Tue | Film Stone Briefing. Review Hyperagent's drafted script and newsletter. | Polish and publish Tuesday's article in Sanity. Push Stone Briefing post to LinkedIn. Newsletter goes out via Kit and Substack. |
| Wed | Topic prep for Friday. Commercial work — VBP / sponsor outreach. | Engagement (LinkedIn comments, replies). Analytics check on Tuesday's piece. Audience reporting. |
| Thu | Film Practical Move. Review Hyperagent draft for Friday post. | Edit Friday video. Prepare Friday's Sanity draft. Schedule Friday social. |
| Fri | Approve Friday's piece and social posts. | Publish Friday's article. Push Practical Move to LinkedIn. End-of-week analytics. |
| Weekend | Optional: batch product creation for Intelligence Series PDFs. | Optional: longer-horizon planning, calendar review. |

The point of the table is not lock-step compliance. It's that both of you know what the other is doing on a given day, so handoffs don't fall through the cracks.

#### The tools

| Tool | What it does | Primary owner |
|---|---|---|
| **Inoreader** | RSS aggregation. Where Clive curates the news signals that become content topics. *Note: OAuth redirect URI may still point to localhost; needs updating before use from production.* | Clive |
| **Hyperagent** | The drafting engine. Both of you can use it independently — Clive for new pieces, Jane for social/newsletter copy variants and audience research. | Joint |
| **Sanity Studio** | The CMS at siliconandstone.com/studio. Drafts arrive from Hyperagent or the website's `/create` pipeline. You polish, tag, and publish here. | Jane |
| **Sanity → Pinecone sync** | Automatic. Every published article is indexed for semantic search and future RAG context. Background — you don't operate it. | Automatic |
| **Silicon and Stone website** | siliconandstone.com — Next.js front-end on Vercel pulling from Sanity. The `/create` and `/research` pages are admin-only research tools. | Joint |
| **Railway backend** | A separate logic API. Currently handles subscribe/contact/briefings/categories. Invisible from the editor's seat — only matters when something breaks. | Clive |
| **Kit (newsletter + contact)** | Primary newsletter platform (formerly ConvertKit). Subscribe, contact, and tool-lead tagging all run through it. | Jane |
| **Substack** | Running in parallel for distribution and discovery. Same content, different audience surface. | Jane |
| **Lemon Squeezy** | Intended checkout for paid PDFs and digital products. Sales pages are live with an early-access enquiry fallback; store creation and checkout URLs are pending. | Joint |
| **Plausible** | Privacy-first analytics. Six custom event goals defined; account/env var pending. | Jane (once live) |
| **YouTube Studio** | Channel management — uploads, thumbnails, descriptions, analytics. *Channel not yet launched.* | Jane uploads; both view analytics |
| **LinkedIn** | Primary social channel for the senior-professional audience. Three posts/week minimum. | Jane |
| **Notion** | Editorial planning, content calendar, drafts in progress, project documentation. The shared brain outside the published platform. | Joint |

#### A note on AI familiarity

You don't need to be an AI expert to do this work well. You'll use Hyperagent the way you might use a research assistant — describe what you need, look at what comes back, edit it. The platform's `/create` page is even simpler — type a query, get a draft. Sanity Studio is a normal CMS interface. The genuine AI complexity sits underneath, in pipelines Clive has already built. Your job is to use the outputs and steer the audience side; the engineering doesn't need to be in your head.

---

## 05 · First 30 days
### What to do, in order

The platform is already live, so your month one is less about waiting for things to be built and more about getting your hands on what's there.

#### Week 1 — Read and observe

- Read this Welcome Pack end-to-end. Note questions in the margin or a Notion page.
- Read the Forensic Technopolitics methodology paper at `docs/forensic-technopolitics-methodology.md`. About thirty minutes. You don't need to internalise the analytical mechanics, but you should know what it claims and recognise the structure when you see it applied.
- Read the persona profiles at `docs/persona-profiles.md`. These are the people we are writing for; the tagging decisions you'll make in Sanity flow from them.
- Read the YouTube Channel Strategy document at `docs/YouTube_Channel_Strategy.docx`. That's the master plan for the channel. Know it well enough to recognise when a piece of content is or isn't on-strategy.
- Skim the existing live articles on siliconandstone.com/analysis to see the voice in production. Particularly the January launch set ("Welcome to Silicon and Stone", "Open Source Sovereignty", "Tariff Enforcement Collision", "Atlantic Fault Lines Deepen") and the more recent generated pieces ("Helium Scarcity", "EU AI Act Compliance Chasm", "Korean Memory Fab", "Greenland Critical Minerals").
- Set up access — Sanity Studio account, GitHub account if you'll be touching the repo (probably not initially), LinkedIn brand-page admin if going that route, Notion access to the editorial workspace, Kit and Substack admin. Clive will provide credentials separately.
- Sit in on one Hyperagent thread session. Watch how Clive briefs the agent, how the response is shaped, and how a draft gets produced. You'll be doing this yourself by week 3.

#### Week 2 — Shadow and rehearse

- Watch a full publishing cycle. Topic chosen → drafted → polished in Sanity → published → distributed on LinkedIn → newsletter sent (both Kit and Substack). Take notes on every step.
- Polish one of the four queued draft articles in Sanity Studio. Pick one, set the Content Type, Intelligence Tier, Personas, Impact Score, Stone Truth, and Methodology Audit cells. Get familiar with where every field lives. This also closes a real gap — those drafts are sitting unpublished because nobody's polished them yet.
- Draft three sample LinkedIn posts derived from a published article. Don't publish them. Just write them, share with Clive, and we'll critique together. This calibrates the voice in your hands before the brand goes live.
- Audit the existing infrastructure. What's missing? Is the editorial calendar properly structured in Notion? Are the analytics dashboards set up? Do the Sanity persona documents in Studio match the rich definitions in `docs/persona-profiles.md`? (They currently hold a shorter version — see the open item in §06.) Bring the gap list back. This is exactly the kind of work your BA background does well.

#### Week 3 — Take the wheel

- Own LinkedIn cadence. Three posts per week, minimum. Drafts come from Hyperagent, you edit and post. Engagement (replies to comments, thanking people who share) is yours.
- Run the Sanity polish-and-publish workflow solo for at least one piece. Clive approves the body content, but the metadata, persona tags, image, scheduling — all yours.
- Set up the editorial calendar properly in Notion. Tuesday and Friday slots, twelve weeks ahead, with topic, status, owner, and dependencies.
- Begin tracking audience metrics weekly. Subscribers (Kit + Substack), opens, click-throughs, LinkedIn engagement, YouTube subs (once live). Bring a one-page summary into Friday end-of-week.

#### Week 4 — Steady state

By the end of the month you should be running:

- Two full publishing cycles per week (Tuesday Stone Briefing + Friday Practical Move)
- LinkedIn cadence at 3 posts/week
- Newsletter going out weekly via Kit, mirrored on Substack
- Editorial calendar maintained two weeks ahead
- Weekly audience-metrics report
- One audit-style piece of work per month — looking at what's compounding and what isn't, bringing recommendations back to editorial

#### Who to call when stuck

- Anything voice or methodology-related — **Clive**. He's the final authority on whether a draft sounds like Silicon and Stone.
- Anything technical (broken Sanity, Pinecone sync issue, Railway backend error, Inoreader auth expired) — **Clive** in the first instance. If it's a workflow question rather than a code question, ask **Hyperagent**.
- Anything strategic ("should we do X?") — bring it to a joint Friday session. Don't sit on it for a week.
- Anything where you need a quick sounding board — **Hyperagent**. Ask Clive to open a thread when you need research, drafting support, variants, or a second-pass review.

#### The most important thing about month one

Don't try to make everything perfect. The first thirty days is calibration — getting your hands on the tools, the voice, the audience, and the rhythm. By month two, you'll know which parts of the role you naturally extend (audience analysis? LinkedIn campaigns? content programming?) and which parts to delegate or automate. The plan should evolve to fit how you actually work, not the other way round.

---

## 06 · Reference
### Glossary and quick lookup

#### Terms you'll hear constantly

- **Forensic Technopolitics** — The analytical framework Silicon and Stone is built on. Three domains × two methods, applied to European technology power shifts. Coined by Clive; defined in `docs/forensic-technopolitics-methodology.md`.
- **Stone Truth** — The single declarative one-line verdict that ends every piece of analysis. The most quotable, citable line. Displayed in italics on briefing cards.
- **Methodology Audit** — The on-screen / front-of-document checklist showing which cells of the 3×2 matrix were applied in any given piece. Visual signal of analytical rigour.
- **The Matrix** — The 3×2 analytical grid: Supply Chain × Scenarios, Supply Chain × Long-Memory, Policy × Scenarios, Policy × Long-Memory, Talent × Scenarios, Talent × Long-Memory. Six cells.
- **Atlantic Drift** — One of Silicon and Stone's content categories — covering US-EU regulatory divergence, transatlantic technology partnerships, the slow widening of the geopolitical gap. Also the title of the flagship lead-magnet PDF.
- **Pax Silica** — Informal name for the US/Japan/South Korea/Taiwan/India semiconductor alliance that solidified in February 2026. The first major worked example in the methodology paper. Europe is not a member; the implications are significant.
- **The Edge Position** — The deliberate brand framing that Silicon and Stone is published from Sanday because the view from the edge of Europe is structurally clearer than the view from any of its centres.

#### Personas (article-level CMS slugs)

| Persona | Slug | Audience |
|---|---|---|
| Compliance Clara | `clara` | Legal/compliance counsel at tech firms |
| Industrial Ian | `ian` | Supply chain and operations directors |
| Sovereign Sofia | `sofia` | Policy analysts at think tanks and government |
| Global Citizen | `citizen` | Informed general public, journalists, educators |
| Transatlantic Troy | `troy` | US/Canadian founders and CEOs entering the European market |

The persona documents in Sanity have longer slugs (`compliance-clara`, etc.). Same people; different field.

#### Content Types

| Type | Slug | Length | Use when |
|---|---|---|---|
| Signal | `signal` | 800–1,500 words | Breaking news, quick analysis, 24–72hr turnaround |
| Deep Dive | `deepdive` | 3,000–6,000 words | Comprehensive forensic report, 1–2 weeks |
| Tool Guide | `guide` | 500–2,000 words | Practical walkthrough, tool documentation |
| YouTube Script | `youtube` | Variable | Script outline for video content |

#### Intelligence Tiers

| Tier | Meaning |
|---|---|
| Pulse | Quick read of an emerging signal — minimum analytical depth |
| Briefing | Standard depth — the default Stone Briefing tier |
| Audit | Maximum depth — full matrix applied, foundational pieces |

#### Categories (CMS slugs)

- `atlantic-drift` — US-EU regulatory dynamics, transatlantic partnerships
- `us-technopolitics` — CHIPS Act, export controls, antitrust, federal AI
- `european-sovereignty` — DMA, GDPR, ESMC, STMicro, ASML
- `asian-innovation` — China semiconductor strategy, Taiwan, Japan, Korea
- `ai-act` — EU AI Act timelines, compliance, risk classification
- `semiconductors` — supply chains, foundries, materials, equipment
- `digital-sovereignty` — data localisation, sovereign cloud, GAIA-X
- `edge-economy` — regional impacts, peripheral economies, workforce

#### Methodology Audit cells (3×2 matrix CMS slugs)

- `supply-chain-scenario-modelling`
- `supply-chain-long-memory-filter`
- `policy-scenario-modelling`
- `policy-long-memory-filter`
- `talent-scenario-modelling`
- `talent-long-memory-filter`

#### Key URLs

- **Public site**: siliconandstone.com
- **Sanity Studio**: siliconandstone.com/studio (credentials provided separately)
- **Admin area** (research, create, generate, content, editor): all at siliconandstone.com/* with credentials provided separately
- **Research portal**: siliconandstone.com/research (admin only)
- **Create pipeline**: siliconandstone.com/create (admin only)
- **GitHub repo**: github.com/CliveStruv56/silicon-stone (private)
- **Railway backend**: ask Clive for the public URL

#### Other names you'll hear

- **Antigravity** — The coding-agent framework Clive uses to develop the platform. Sits in the `.agent/` folder of the repo. Not relevant to your day-to-day unless something needs technical work.
- **Inoreader** — RSS feed aggregator. Clive uses it as the news-signal layer feeding the content pipeline. You might dip in occasionally; you won't manage it. Currently authenticated as user `clive4`.
- **Exa.ai** — The web search engine the platform uses for live research, separate from Inoreader's curated feeds.
- **Pinecone** — The vector database that archives every published piece. Operates automatically — when you publish in Sanity, it gets indexed here. Future drafts can retrieve from this archive as context. Background infrastructure; you don't operate it directly.
- **Kit** — The newsletter platform formerly known as ConvertKit. All subscribe, contact, and tool-lead capture goes through it.
- **Substack** — Secondary newsletter surface running in parallel to Kit, for distribution and discovery.
- **Lemon Squeezy** — The checkout platform we're using for paid PDFs and digital products. Sales pages are wired; store creation pending.
- **Plausible** — Privacy-first analytics. Six custom event goals defined in code; account creation pending.
- **Railway** — Cloud platform hosting the logic backend. Sister service to the Vercel frontend. Editorial workflow doesn't touch it.
- **The four tools** — Compliance Checker, Supply Chain Mapper, Scenario Modeler, Policy Stress-Test. Live, email-gated, tag leads as `Tool_Lead` in Kit. Together they're the most distinctive lead-capture feature on the site.
- **WaymarkPath** — A separate planned career-transition app linked from `/waymarkpath`. Same operator, different audience. Not part of Jane's remit but she'll see the page.
- **VBP Solutions** — Clive's separate technology consultancy. Kept distinct from Silicon and Stone publicly. Same methodology underneath. Silicon and Stone audience-builds; VBP delivers commercial engagements.
- **The cold-start playbook** — `docs/Silicon_and_Stone_Cold_Start_Playbook.docx` covering the launch tactics for the first 90 days. Worth reading once you're past Week 1.

---

Silicon and Stone · Welcome Pack v3 · May 2026
Prepared with Hyperagent for Clive Struver · Sanday, Orkney
This document supersedes v2. Treat it as a living document — updated as the plan evolves.
