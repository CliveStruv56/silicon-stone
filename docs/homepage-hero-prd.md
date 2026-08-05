# PRD — Homepage Hero Re-point

> **One-line goal:** Make the first sentence and the buttons on the homepage speak to the
> person who pays (a compliance/country-manager at a mid-size European company), without
> gutting the Forensic Technopolitics brand.
>
> **Status:** Proposed · **Owner:** Clive · **Component:** `src/components/home/HeroSection.tsx`
> · **Effort:** ~1 hour (copy + one new CTA button)

---

## 1. Why

The current hero is well-written but does the wrong job. It markets a **magazine** (audience
play) when the revenue is **advisory** (the Drift Retainer / Focused Diagnostic). Three
specific failures:

1. **Headline names a topic, not a problem.** "AI. Policy. Power. Leadership." passes none of
   the five-second grunt tests (*What is it? For me? What do I do?*).
2. **One clause repels the paying buyer.** "AI governance as one application, *not the whole
   map*" tells the one visitor who'd pay that her need is a side-issue here.
3. **No revenue path above the fold.** The only CTA is a newsletter signup. Nothing points a
   budget-holder at the conversation that pays.

**Principle:** Lead with the buyer's problem; keep Forensic Technopolitics as the signature
*underneath*, not the door. The broad thesis is our depth, not our headline.

## 2. Target reader for this hero ("Clara")

Head of compliance / country manager at a 50–600-person European company that has deployed
AI, has no real governance in place, can't afford a Big Four firm, has little hands-on AI
knowledge, and is worried about sovereignty and upcoming legislation.

## 3. Scope

**In scope:** hero badge (keep), headline (replace), subhead (replace), supporting line
(remove from hero), primary CTA (keep), secondary CTA (add). Everything else on the page is
untouched.

**Out of scope:** the photo, brand world below the hero, methodology link, cadence line,
persona router, WaymarkPath, pricing, the rest of the site. No structural/layout change
beyond adding one button.

## 4. The changes (before → after)

### 4.1 Badge — KEEP AS-IS
```
Forensic Technopolitics · the view from the edge
```

### 4.2 Headline — REPLACE
- **Before:** `AI. Policy. Power. Leadership.`
- **After (recommended):**
  ```
  *"You've deployed AI. Have you governed it?"*
  
  
> Note: the headline currently falls back to `settings?.heroTitle` from Sanity. Either update
> `heroTitle` in Sanity Studio to the new line, or change the hard-coded fallback in
> `HeroSection.tsx` — make sure both say the same thing so the live page is correct.

### 4.3 Subhead — REPLACE (and delete the "not the whole map" clause)
- **Before:**
  > Independent, decision-grade intelligence on the technology supply chain and the
  > geopolitics of dependency — read from thirty years inside the industry. For UK and
  > European leaders, with AI governance as one application, not the whole map.
- **After:**
  > Independent, decision-grade intelligence and advisory on AI governance, the technology
  > supply chain, and the geopolitics of dependency — for leaders at mid-size UK and European
  > companies who have to act without a Big-Four budget. Read from thirty years inside the
  > industry.

The load-bearing addition is **"for leaders at mid-size UK and European companies… without a
Big-Four budget."** That clause is the grunt test, passed.

### 4.4 Supporting line — REMOVE from hero
- **Remove:** `AI fluency is fast becoming the baseline, not the edge — for industries and the careers inside them.`
- Reason: a fourth idea competing for the same five seconds, and it points at WaymarkPath /
  careers, which is a different business. May be relocated lower down the page later (not in
  this change).

### 4.5 Primary CTA — KEEP AS-IS
```
Get the Atlantic Drift Briefing   →  /#subscribe
```
Correct low-friction front door for cold traffic not ready to buy.

### 4.6 Secondary CTA — ADD (most important single change)
Replace the current "Read the methodology" text-link slot with — or add alongside it — a
revenue path:
```
Book a 20-minute AI exposure call  →  /advisory#contact
```
- This is the only element that points a budget-holder at the conversation that pays.
- It doubles as the booking link for the 20 validation calls (see
  `docs/ai-act-validation-script.md`) — website and outreach now point at the same door.
- If keeping "Read the methodology" as well, order: **[Get the Briefing] · [Book a call] · Read the methodology**. Two buttons + one text link is the ceiling — do not add more.

### 4.7 Cadence line — KEEP AS-IS
```
Two briefings a week · Tuesday Stone Briefing · Friday Practical Move
```

## 5. Acceptance criteria

- [ ] A first-time visitor can state, within five seconds, **what this is, who it's for, and
      what to do next.**
- [ ] The phrase "not the whole map" no longer appears in the hero.
- [ ] The subhead names the buyer ("mid-size UK and European companies", "without a Big-Four budget").
- [ ] There are exactly two buttons in the hero: subscribe (primary) + book-a-call (secondary).
- [ ] The book-a-call CTA resolves to the `/advisory` contact form.
- [ ] Sanity `heroTitle` and the `HeroSection.tsx` fallback agree (no stale old headline live).
- [ ] `npm run build` passes; hero renders correctly on mobile (single column) and desktop.

## 6. Out of scope / explicitly not changing now

- Collapsing the five personas to one (separate, larger piece of work).
- WaymarkPath positioning.
- Pricing or the advisory tier structure.
- Any layout, photo, or animation change beyond adding one button.


