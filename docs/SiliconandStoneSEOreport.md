# Silicon & Stone — SEO & Discoverability Build Brief (2026)

*A prioritised implementation plan for the coding agent (CC), with a research summary, a live-site audit, and a keyword map. Prepared 8 June 2026. Scope: Google organic, AI answer engines, YouTube, Substack/newsletter. Tooling assumption: free/manual (no Ahrefs/Semrush).*

---

## 0. The one-paragraph version

Silicon & Stone's **content and editorial structure are already strong** — good titles, clean heading architecture, a "Sources" section, "Related Intelligence" internal links, a category taxonomy, and a brand-grade Organization schema on the homepage. What's missing is the **technical scaffolding that tells Google and AI engines what the site is**: there is no `sitemap.xml`, no `robots.txt`, no canonical tags, no Article/author structured data on article pages, the article meta descriptions are broken (raw markdown bullets), and social/OG tags are generic site-wide. These are cheap, low-risk, high-leverage fixes. Land the **eight P0 foundations** and the site goes from "invisible plumbing" to "properly legible to every discovery surface." Everything after that — topical authority, author E-E-A-T, AI-citation content discipline — compounds on top.

**The frame to hold:** this is a low-volume, **high-authority, citation-first** publication. Success is *being the named source in an AI answer to a director*, and *owning a tight set of high-intent decision-maker queries* — not chasing traffic. Optimise for that, not for volume.

---

## 1. What still matters in SEO in 2026 (research summary)

### Google organic
- **E-E-A-T and topical authority are the two big levers** for a publication like this. Trust is the dominant dimension; it is demonstrated through *named, credentialed authors*, an *About/editorial-standards* page, and *outbound citations to primary sources* — not through keywords. (Google Search Central; the May 2024 API leak revealed `siteFocusScore`/`siteRadius` site-level topic-concentration signals.)
- **The Helpful Content system is now part of core ranking.** It does **not** penalise opinion or analysis — it rewards *original* analysis, synthesis of primary sources, and informed expert perspective, and penalises commodity aggregation. This is structurally favourable to S&S.
- **Core Web Vitals (2026 thresholds, 75th-percentile mobile):** LCP ≤ 2.5 s · INP ≤ 200 ms · CLS ≤ 0.1. INP is the most-failed metric; on Next.js it's mostly about deferring non-critical JS.
- **Dead folklore — do not spend time on:** keyword density, meta-keywords tag, exact-match domains, "bounce rate as a direct ranking signal."

### AI answer engines (GEO/AEO) — a parallel discipline, now first-class
- Getting **cited** in ChatGPT Search, Perplexity, Google AI Overviews and Claude is a separate game from blue-link ranking. It runs on: (a) being **crawlable by the right bots**, (b) **answer-first content structure**, and (c) **being mentioned across third-party sites** (AI search is "overwhelmingly biased toward earned media").
- The Princeton/KDD GEO study (directional, older models) found the biggest citation lifts from **named-expert quotations (+41%), statistics with sources (+31%), and inline citations (+28%)** — and a *negative* effect from keyword stuffing. AI Overviews cite from a page's **first ~200 words 55% of the time**.
- **Crawler posture is the most consequential single decision** (see WS5): retrieval crawlers drive live citations and should be allowed; training crawlers are a separate, optional IP call.

### YouTube (for the cold-start channel)
- For a new niche channel, **search is the primary discovery surface** (Home/Suggested activate later). The early levers, in order: **thumbnail CTR → first-30-seconds retention → average view duration → session time (playlists)**. Tags barely matter; thumbnails and the cold open matter enormously.
- The cross-surface win that is a **CC task**: ship **VideoObject schema + full transcript** on the site so the *website* (not just YouTube) earns Google video rich-results and AI citations.

### Substack / newsletter
- **The hard constraint:** Substack **cannot set a canonical URL to an external domain.** If you publish full text on both the site and Substack, Google may credit Substack (higher domain authority) and cannibalise your own site.
- **Posture:** publish full text **on the site first** with a self-referential canonical → wait for indexing → post a **teaser + link** on Substack for evergreen pieces (full text only for ephemeral/commentary). Kit email is **no SEO risk** (email isn't indexed). Substack discovery is driven by **Recommendations (~50% of new subs) + Notes**; LinkedIn is the primary external channel for this audience.

---

## 2. Live-site audit (www.siliconandstone.com, 8 June 2026)

Method: server-HTML inspection of homepage, `/methodology`, `/about`, `/analysis` (archive), `/briefings`, and a live article, plus `robots.txt`, `sitemap.xml`, redirects, and structured data. PageSpeed's anonymous API was rate-limited at audit time — CWV must be measured by CC (Lighthouse + Search Console CrUX).

### What's already working — keep it
- **Stack:** Next.js App Router + Sanity + Vercel; **Plausible** analytics deployed (privacy-light, fast).
- **Redirects are correct:** non-www → www and http → https both 308. Redirect-level canonicalisation is sound.
- **Per-route `<title>` and `<meta description>` are dynamic** — a good base.
- **Homepage has Organization + WebSite + WebPage JSON-LD** with a strong `knowsAbout` entity list.
- **Article editorial structure is good:** single dynamic title, H2s (*The Signal / The Noise / Forensic Analysis / Strategic Implications / The Long View / **Sources** / **Related Intelligence***). Citations and internal links already exist as a pattern.
- **Articles are server-rendered and crawlable**; `/analysis` lists all of them. `/studio` is correctly `noindex`.

### Critical gaps — the P0 list
| # | Finding | Evidence | Impact |
|---|---|---|---|
| 1 | **No `sitemap.xml`** (404) | `app/sitemap.ts` not implemented | Crawlers/AI can't enumerate content; no GSC submission |
| 2 | **No `robots.txt`** (404) | `app/robots.ts` not implemented | No sitemap pointer; no intentional AI-crawler policy |
| 3 | **No `<link rel=canonical>` on any page** | home, methodology, about, every article | Duplicate-content risk (acute with Substack mirror) |
| 4 | **No Article/author JSON-LD on article pages** | 0 JSON-LD blocks on a live article | Biggest on-page + GEO miss; no author E-E-A-T |
| 5 | **Broken article meta description** | renders raw markdown bullets, truncated mid-word ("- With 5 months… exposi…") | Poor SERP snippet → low CTR |
| 6 | **Generic site-level OG/Twitter tags on every article** | same `og:title`, `og:type=website`, same `the-watcher.png` | Weak social shares; weaker AI/social parsing |
| 7 | **Duplicate `<h1>` on article pages** | title rendered as H1 twice | On-page structure error |
| 8 | **No author/Person entity anywhere** | no byline schema, no `sameAs`, no visible dates in metadata | E-E-A-T + AI-citation gap |

### Secondary gaps
- **No RSS feed** (`/rss.xml`, `/feed` 404) — limits syndication (Inoreader, aggregators) and a discovery surface.
- **No `llms.txt`** — low-cost AI-curation signal absent (see WS5; calibrated value).
- **Inconsistent slugs.** Auto-generated slugs truncate mid-word with a numeric suffix (`…-include-the-fda--1761`, `…-a-critical-bo-5189`, `…-semiconductor-amarke-2035`); hand-crafted ones are clean (`greenland-critical-minerals-transatlantic-scramble`). Fix generation + 301 the worst offenders.
- **Article TTFB / caching:** articles return `X-Vercel-Cache: MISS` (dynamic per request) vs homepage `HIT/PRERENDER`. Move articles to static generation / ISR.
- **Schema URL host mismatch:** homepage JSON-LD uses non-www `siliconandstone.com` while the canonical host is `www.` — normalise to `www.`.

---

## 3. The implementation plan — seven workstreams

*Priority: **P0** ship first · **P1** high · **P2** later/ops. Effort: **S** <2h · **M** ~half-day · **L** multi-day. Owner in brackets.*

### WS1 — Technical foundations  **[CC]**
The cheap, compounding fixes. Most are a day's work combined.

1. **`app/robots.ts`** — emit a real `robots.txt`; reference the sitemap; set the AI-crawler policy from WS5. **(P0, S)**
2. **`app/sitemap.ts`** — dynamic sitemap from Sanity (all published articles, categories, static pages; exclude `/studio`, thin paginations, drafts). Submit in Search Console. **(P0, S)**
3. **Self-referential canonicals** — set `alternates.canonical` in `generateMetadata` on every route, absolute `https://www.` host. **(P0, S)**
4. **Fix article meta description** — use the clean `metaDescription` Sanity field (150–160 chars, plain prose); strip markdown; never fall back to bulleted `actionableInsights`. Fix the Pass-2 extraction in `src/lib/prompts.ts` so it writes a proper sentence. **(P0, S)**
5. **Per-article Open Graph** — in `generateMetadata`, set `openGraph` and `twitter` per article: title, description, `type:'article'`, `publishedTime`, `authors`, and a **per-article image** (use `mainImage`; consider an auto OG card with the Stone Truth). **(P0, M)**
6. **Fix duplicate H1** — exactly one `<h1>` per article (the title); demote the second to a visually-identical H2 or remove. **(P0, S)**
7. **RSS feed** — add `/rss.xml` (route handler from Sanity). Helps Inoreader/syndication. **(P1, S)**
8. **Clean slugs + 301s** — improve slug generation (editorial slug from title, ≤ ~60 chars, no mid-word truncation, drop/replace the random numeric suffix; enforce uniqueness via Sanity, not a random int). 301 the worst existing slugs to clean ones. **(P1, M)**
9. **Static/ISR for articles** — `generateStaticParams` + `revalidate` so article HTML is prerendered (better TTFB, guaranteed SSR for crawlers/AI). **(P1, M)**
10. **Normalise schema/OG host to `www.`** everywhere. **(P0, S)**

### WS2 — Structured data / schema  **[CC]**
A reusable server component that injects JSON-LD from Sanity fields at render. Validate each type with Google's Rich Results Test.

1. **`Article` (or `NewsArticle` for current-affairs pieces)** on every article: `headline`, `description`, `image`, `datePublished`, `dateModified`, `author` (Person ref), `publisher` (Organization ref), `mainEntityOfPage`. **(P0, M)**
2. **`Person`** for the author, with `url` and `sameAs` (LinkedIn, etc.) — the single fastest E-E-A-T lever. **(P0, S)** *(depends on WS3 author model)*
3. **`Organization`** sitewide: add `logo`, `sameAs` (LinkedIn/X/Substack/YouTube), keep the strong `knowsAbout`. **(P0, S)**
4. **`BreadcrumbList`** from the `/analysis/category/*` taxonomy. **(P1, S)**
5. **`WebSite`** with `SearchAction` (you already have `/search`) for a potential sitelinks search box. **(P2, S)**
6. **`FAQPage`** on pieces that carry a Q&A block. Google restricts FAQ *rich results* to gov/health, **but the schema still helps AI engines extract Q&A pairs as citable units** — implement for GEO, not for stars. **(P1, S)**
7. **`ProfilePage`** on author bio pages. **(P1, S)**

### WS3 — E-E-A-T & the author entity  **[CC build · Jane/Clive content]**
1. **Author model in Sanity** (if absent): name, role/title, credentials, bio, photo, `sameAs` links. **(P1, M)**
2. **Author bio pages** at `/authors/[slug]` with `Person`/`ProfilePage` schema; link bylines to them. **(P1, M)**
3. **Visible byline + published/updated dates** on every article. **(P0, S)**
4. **About / Editorial Standards page** stating mission, ownership, the Forensic Technopolitics method, sourcing and correction policy — Quality Raters read this. (Extend the existing `/about`.) **(P1, M)**
5. **Formalise outbound citations** — the article "Sources" section already exists; ensure links point to primary sources (EU Commission, Reuters, FT, company filings) and open in-page. **(P1, S, ongoing — Hyperagent at draft time)**
6. **Surface the Stone Truth as a marked-up pull-quote** — it is purpose-built as the quotable, citable line; give it a stable, extractable DOM position. **(P1, S)**

### WS4 — Topical authority & internal linking  **[Jane/Hyperagent · CC supports]**
1. **Pillar-and-cluster on the five clusters** in §5, mapped to the `/analysis/category/*` taxonomy. One **pillar page** per cluster (2,500–4,000 words, comprehensive), each linking down to its cluster articles. **(P1, L, ongoing)**
2. **Bidirectional internal links** with descriptive, keyword-rich anchors (not "read more"); every article links up to its pillar and laterally to 2–3 siblings. Kill orphan pages. **(P1, ongoing)** — CC can add a "same-cluster" auto-link module.
3. **Topic discipline:** stay inside sovereignty / semiconductors / AI policy / supply chains / talent. Off-topic posts dilute `siteFocusScore`. **(Clive/Jane editorial rule)**
4. **Article briefs come from the keyword map** (§5): one long-tail target per piece, in the title, H1, and first 100 words. **(Hyperagent at commissioning)**

### WS5 — AI answer-engine optimisation (GEO)  **[CC + Hyperagent + Clive sign-off]**
**a) Crawler posture in `robots.txt` (Clive's call — it touches future licensing rights):**
- **Allow the retrieval crawlers** (these *are* live AI citations): `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Perplexity-User`, `Claude-SearchBot`, `Claude-User`.
- **Training crawlers** (`GPTBot`, `ClaudeBot`, `Google-Extended`): **recommended ALLOW** for a citation-first publication with no licensing strategy. Note `Google-Extended` specifically — blocking it removes you from **Google AI Overviews grounding**, so allow it. You can cleanly *opt out of training while keeping citations* later (block `GPTBot`, keep `OAI-SearchBot`) if Clive ever wants that. Optionally block `CCBot` (Common Crawl; no retrieval function). **(P0 decision, S to implement)**

**b) `llms.txt` + `llms-full.txt` [CC]** — a curated `/llms.txt` index (one-paragraph authority statement + key pages grouped by topic) and an `llms-full.txt` text dump. **Calibrated:** explicitly respected by Anthropic and Perplexity; benefit is modest/contested (one 300k-domain study found no general signal); cost is < 1 day and it forces a canonical brand description. Do it, don't overclaim it. **(P1, S)**

**c) Content discipline [Hyperagent drafting + Jane QA]** — bake into the house style:
- **Answer the headline question in the first 40–60 words** (≈55% of AI-Overview citations come from the first ~200 words).
- **A named statistic with its source within the first 150 words.**
- **Verbatim quotes from named, titled experts** and **inline citations** (the highest-lift GEO tactics).
- **Question-shaped H2s** with a 2–3-sentence direct answer underneath, then depth.
- **Comparison tables** for "X vs Y" pieces (among the most-cited formats) — e.g. the *open-weight vs foundation model* explainer.
- **No keyword stuffing** (measurably negative).

**d) Entity consistency [Jane/Clive]** — identical org name, one-line descriptor, and author bylines across the site, LinkedIn, Substack, YouTube, and press. Pursue earned mentions (Politico Europe, Euractiv, IEEE Spectrum, policy institutes) — AI search is biased toward third-party mentions. A Wikidata entry once notability is met. **(ongoing)**

### WS6 — YouTube (when the channel launches)  **[CC for schema · Jane/Clive for ops]**
1. **VideoObject schema + full transcript on the site** for every video page (`embedUrl`, `thumbnailUrl`, `uploadDate`, `duration`, `transcript`, `publisher` ref; add `hasPart`/Clip for chapters). This pulls Google video rich-results and AI citations to **your domain**, not just YouTube. **(P1 when launching, M) [CC]**
2. **On-video discipline [Jane/Clive]:** keyword-front titles (55–70 chars); 200+-word descriptions with the keyword in the first 150 chars; timestamped chapters; institutional (not clickbait) thumbnails — *invest here, it's the #1 early lever*; ignore tags. Engineer the first 30 seconds.
3. **Clusters + playlists** by topic/intent; one video/week consistent cadence; **seed each upload** via the Kit newsletter embed + a LinkedIn post within 24–48 h (intended use, not gaming).
4. **Realistic expectation:** months 1–3 are search-only and single-digit-to-hundreds of views; a 2,000–5,000-subscriber channel of *qualified directors* at 12 months is the real success metric, not raw subs.

### WS7 — Substack / newsletter + canonical strategy  **[Jane ops · CC supports via WS1]**
1. **Self-referential canonical on every article (WS1.3)** is the load-bearing fix — it's what lets the site keep SEO credit despite the Substack mirror.
2. **Publishing sequence [Jane]:** site first (full text, self-canonical) → confirm indexing in GSC → Substack **teaser + link** for evergreen pieces (full text only for ephemeral) → Kit send (no SEO risk).
3. **Substack custom domain** (e.g. `newsletter.siliconandstone.com`) to consolidate brand authority. **[Jane/CC DNS]**
4. **Discovery [Jane]:** pursue **Recommendations** from 5–10 adjacent EU-tech-policy publications; **1–2 substantive Notes/day** (restacks with added analysis); **LinkedIn as the primary external channel** for this audience.
5. **RSS (WS1.7)** supports cross-posting/syndication tooling.

---

## 4. Sequenced rollout

**Launch context:** today is 8 June; the four-piece launch wave is 9 June. CC's launch-week critical path is the §R homepage edit + supporting Jane's Sanity intake. **SEO foundations are additive and low-risk — they do not gate the launch**, but the sooner they're live, the sooner the launch content is properly indexed and AI-discoverable.

- **Sprint 0 — Foundations (P0, ~1 day, launch week or immediately after):** robots.txt (with WS5 crawler posture), sitemap.xml + GSC submission, self-canonicals, fix meta description, per-article OG, fix duplicate H1, normalise host, **Article + Person + Organization schema**. *This alone closes the worst gaps.*
- **Sprint 1 — E-E-A-T + structure (P1, ~3–5 days):** author model + `/authors/[slug]` pages, bylines + dates, About/Editorial-Standards expansion, BreadcrumbList/FAQPage/ProfilePage, Stone-Truth pull-quote markup, clean slugs + 301s, ISR for articles, RSS, llms.txt.
- **Sprint 2 — Topical authority + GEO content (ongoing):** pillar pages for the five clusters, internal-linking module + discipline, house-style GEO rules applied to every new draft, entity-consistency pass.
- **Sprint 3 — Channel surfaces (when live):** VideoObject schema for YouTube; Substack custom domain + posture; recommendations/Notes/LinkedIn cadence.

---

## 5. Keyword universe & map

*Intent: INFO / INV (investigating) / NAV (brand) · Comp (small-site read): LOW winnable now · MED via clusters · HIGH aspirational. Validate demand free via Google autocomplete + "People Also Ask" and Search Console "queries" — exact volumes are unavailable and largely irrelevant at this audience size.*

### A — EU AI Act & AI regulation · *Compliance Clara* (head: *EU AI Act compliance*, HIGH)
| Query | Intent | Comp |
|---|---|---|
| EU AI Act August 2026 deadline | INFO | LOW–MED |
| GPAI obligations 2 August 2026 | INFO | LOW |
| AI Act systemic-risk threshold 10^25 FLOPs | INFO | LOW |
| EU AI Act compliance checklist for [sector] | INV | LOW |
| national AI Act authority Germany / France | INFO | LOW |
| GPAI Code of Practice signatories | INFO | LOW |
| **Q:** what does the EU AI Act require by August 2026? | INFO (AI/snippet) | LOW |
| **Q:** open-weight vs open source AI model? | INFO (AI/snippet) | LOW |
| **Q:** foundation model vs open-weight model | INFO (AI/snippet) | LOW |

*The open-weight / foundation-model distinction is a distinctive S&S asset (most outlets get it wrong) — a strong AI-citation candidate.*

### B — Semiconductors & supply chains · *Industrial Ian / Sovereign Sofia* (head: *European semiconductor supply chain*, HIGH)
| Query | Intent | Comp |
|---|---|---|
| EU Chips Act implementation status 2026 | INFO | LOW–MED |
| semiconductor supply chain risk Europe | INV | MED |
| Korean memory fab capacity 2027 | INFO | LOW |
| helium shortage semiconductor manufacturing | INFO | LOW |
| ASML export controls impact | INFO | MED |
| semiconductor testing bottleneck | INFO | LOW |
| critical minerals Europe chips (Greenland, gallium) | INFO | LOW |
| **Q:** how exposed is Europe's chip supply to a Taiwan disruption? | INFO (AI) | LOW |

### C — Digital sovereignty & sovereign AI · *Sovereign Sofia* (head: *digital sovereignty* HIGH / *sovereign AI Europe* MED)
| Query | Intent | Comp |
|---|---|---|
| what is digital sovereignty | INFO | MED |
| sovereign AI Europe | INV | MED |
| is Mistral AI sovereign | INV | LOW |
| European cloud sovereignty vs US hyperscalers | INV | MED |
| sovereign AI infrastructure / compute Europe | INFO | LOW |
| EU defence tech investment 2026 | INFO | LOW–MED |
| **Q:** can Europe build a sovereign AI stack? | INFO (AI) | LOW |
| **Q:** did Mistral's AI Act lobbying help Europe or US rivals? | INFO (AI) | LOW |

### D — Atlantic Drift / US–EU divergence · *Global Citizen* funnel + brand (head: *the Atlantic Drift*, BRAND — own it)
| Query | Intent | Comp |
|---|---|---|
| US–EU technology divergence / decoupling | INFO | MED |
| US foreign policy impact on European tech | INFO | LOW |
| transatlantic tech tariff / enforcement | INFO | LOW |
| the Atlantic Drift / Forensic Technopolitics / Silicon and Stone | NAV | LOW (own) |

### E — Talent & careers in European tech · *Remote Robert / Industrial Ian* (head: *European AI talent market*, MED)
| Query | Intent | Comp |
|---|---|---|
| AI compliance engineer jobs Europe / salary | INV | LOW |
| Chief AI Officer role Europe (the "AI translator") | INFO | LOW |
| defence-tech careers Europe security clearance | INV | LOW |
| EU AI Act compliance skills gap | INFO | LOW |
| **Q:** most durable AI career bet in Europe? | INFO (AI) | LOW |

**Using the map:** one pillar page per cluster → every new article targets one long-tail row (query in title + H1 + first 100 words) → question rows are GEO/snippet bait (answer directly under a question H2) → own the brand/method terms completely.

---

## 6. Measurement & success

- **Search Console (free, do first):** verify the property, **submit the sitemap**, watch *Indexing → Pages* and the *Queries* report (your real, free demand signal). Use the **AI Mode appearance filter** (added June 2025) for Google AI-Overview impressions.
- **Plausible (already deployed — adapt the GA4-era advice):** S&S uses Plausible, not GA4, so skip the GA4 channel hack. Instead, watch the **Top Sources / referrers** report for `chatgpt.com`, `perplexity.ai`, `claude.ai`, `gemini.google.com`, `copilot.microsoft.com`; optionally save a segment or tagged goal for AI referrers. *Caveat: AI referrals are badly undercounted (mobile apps strip referrers; AI-Overview clicks look like organic) — treat any AI-referral number as a floor.*
- **AI-citation baseline (free, manual, monthly):** run your top ~20 queries (the §5 question rows) across ChatGPT, Perplexity, Claude and Gemini; screenshot; track whether S&S is cited and the sentiment. This is the truest signal for a citation-first publication, since a citation may produce no click.
- **CWV:** CC runs Lighthouse in CI and checks the CrUX panel in Search Console against the §1 thresholds.
- **What winning looks like here:** named citations in AI answers + first-page ranking for the long-tail decision-maker queries + a slow climb on the head terms as clusters mature — *not* a traffic vanity number.

---

## 7. Decision rights (per the project's locked model)
- **CC (code):** WS1, WS2, WS6-schema, WS7 canonical/RSS, llms.txt route — robots, sitemap, canonicals, schema, meta/OG fixes, slugs, ISR, VideoObject.
- **Hyperagent (research + drafting):** apply the GEO content discipline (WS5c) to every draft; keyword-mapped article and pillar briefs.
- **Jane (ops / editorial / audience):** pillar/cluster calendar + internal-linking discipline in Sanity, author-bio content, Substack posture, Notes/Recommendations, LinkedIn cadence, YouTube upload ops, Plausible monitoring.
- **Clive (approval):** the **AI-crawler posture** (WS5a — touches future licensing), topics, Stone Truths, methodology, products/pricing.

---

## 8. Key sources
Google Search Central (E-E-A-T, helpful content, Article structured data); web.dev/articles/vitals (CWV). Princeton/KDD GEO study (arXiv:2311.09735). Chen et al., "How to Dominate AI Search" (arXiv:2509.08919). AI-crawler taxonomy (fokal.com/ai-seo/ai-crawler-access; capconvert.com OAI-SearchBot/GPTBot playbook). llms.txt adoption (presenc.ai/research/state-of-llms-txt-2026; SERanking 300k-domain study via codersera.com). Substack SEO & Recommendations (on.substack.com); Substack canonical limitation (HN 46360600). YouTube: VideoObject schema (capconvert.com), algorithm 2026 (vidiq, tubespark, thumbmentor, contentbuck). GA4/AI measurement (ga4audits.com) — adapted for Plausible.
