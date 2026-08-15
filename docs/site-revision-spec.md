# Silicon & Stone — Site Revision Spec

**Goal:** Re-orient the site around a recurring advisory spine (Model A — the Drift Retainer) while keeping the best of the project-based model (Strategic Assessment as premium on-ramp) and retaining the low-value one-off products as proof-of-value lead magnets.

**Target outcome:** A stable £10k/mo via 2–3 retainers, fed by the existing free-intelligence/tools/products funnel.

> **Implemented — prices differ from this spec.** Shipped 2026-08-15: Drift
> Retainer **£2,000/mo** (spec said £3,500–5,000), Strategic Assessment **from
> £8,000** (spec said £8–12k), and the *Focused Diagnostic* shipped as **The
> Exposure Diagnostic, from £2,500**. Products are unchanged at £24 / £79 /
> £149 / £39. Current figures live in `src/lib/offering.ts` and at `/pricing`;
> this spec is kept as the record of what was proposed.

**House Style reminders for all copy:** UK English, smart quotes, em-dash cap, calibrated and restrained ("never glib, never breathless"). Banned words: game-changer, unlock, empower, seamless, leverage (as verb), actionable insights, literally. Note: the live `/products` page currently contains "unlocking" — fix in passing.

---

## The revised ladder

```
Free Intelligence → Free Tools → One-off Products (£24–£79, KEPT)
   → Drift Retainer (£3,500–5,000/mo, NEW — the spine)
   → Strategic Assessment (£8–12k, premium on-ramp that converts to retainer)
```

Five rungs. The new retainer does the revenue work. Projects become entry points, not endpoints. Products become the warmest top-of-funnel lead source.

---

## WAVE ONE — revenue-unlocking (this week)

### Task 1.1 — Advisory page: add the Drift Retainer as the spine (PRIORITY 1)

**File:** the `/advisory` page/route.

**Current state:** Three "Engagement Options" cards — Advisory Briefing (From consultation), Focused Diagnostic (Custom scope, "Most Popular"), Strategic Assessment (Enterprise). All unpriced, all one-off.

**Change to:** Four tiers, re-ordered as an ascending ladder, with the retainer as the visually dominant "Most Popular" centre of gravity:

1. **Advisory Briefing** — keep. Add a price anchor (e.g. "£450, one hour"). Reposition explicitly as a low-friction taster that credits toward a retainer.
2. **Focused Diagnostic** — keep. Add price band (e.g. "from £2,500"). End the card with: "Converts to / credits toward a Drift Retainer."
3. **The Drift Retainer** — NEW. The dominant card, badged "Most Popular" (move the badge here from Focused Diagnostic). Price: **£3,500–5,000/mo, 3-month minimum.** Recurring promise, not a feature dump (copy in companion doc).
4. **Strategic Assessment** — keep as premium book-end. Add price band (e.g. "from £8,000"). Reframe its existing "ongoing advisory" line to explicitly mean "transitions into a Drift Retainer."

**Acceptance criteria:**
- The retainer is the only recurring (per-month) tier and is visually emphasised.
- Every one-off tier names a price or band and states a path into the retainer.
- The existing follow-on modules (Manufacturing Exposure, Scenario Impact, Regulatory Friction) are presented as components that can sit *inside* a retainer, not only as standalone add-ons.
- The "Most Popular" badge moves from Focused Diagnostic to the Drift Retainer.

### Task 1.2 — Homepage: fix the fourth rung of "Four ways to use" (PRIORITY 2)

**File:** homepage/route, the "Four ways to use Silicon & Stone" block.

**Current state:** Fourth rung reads "Bespoke — Engage — Bring us in directly. Diagnostics and assessments scoped to your organisation."

**Change to:** A concrete, priced, recurring hook. Card label "From £3,500/mo — Retain"; body: "A standing read on the drift, so your leadership team is never blindsided. Diagnostics and assessments scope into an ongoing relationship." CTA → `/advisory`.

**Acceptance criteria:**
- The bottom rung shows a number and names the recurring relationship.
- The existing "start at the top, move down as the stakes rise" framing is retained — only the bottom rung's specificity changes.

---

## WAVE TWO — polish & routing (following week)

### Task 2.1 — Rebrand weight: supply-chain over compliance (PRIORITY 3)

**Files:** homepage hero + "start here" emphasis; tool ordering.

**Change:** Lead with the semiconductor/supply-chain interpretation (the defensible, hard-to-copy ground) and treat AI Act compliance as one application rather than the headline.
- Promote **Supply Chain Mapper** and the **Korean memory-fab Audit** toward the top as signature proof assets.
- Let **Compliance Checker** sit alongside rather than lead.
- Keep all AI Act material — this is rebalancing emphasis, not removing content.

**Acceptance criteria:** A first-time visitor understands within the hero that the unique angle is *tech-supply-chain geopolitics from an industry insider*, not compliance checklists.

### Task 2.2 — Wire products to the retainer (PRIORITY 4, low effort)

**Files:** product pages / post-purchase flow.

**Change:** Each product's "Take it further →" path gains a final step pointing to the Advisory Briefing or Drift Retainer (not just the next product). The £24 checklist buyer who's clearly exposed is the warmest retainer lead — make the path explicit.

**Acceptance criteria:** Every product page has a visible route to advisory; post-purchase includes a soft retainer nudge. Fix the "unlocking" banned-word instance while in here.

### Task 2.3 — Tools "Take it further" → retainer (PRIORITY 5)

**Files:** the four tool pages.

**Change:** Each tool's onward "Take it further →" link lands on the **retainer** section of `/advisory`, not a generic page. Someone who's just mapped their chokepoints in the Supply Chain Mapper is in the exact mindset for a standing relationship.

**Acceptance criteria:** All four tools route onward to the retainer offer.

---

## What stays untouched
- All free intelligence and the twice-weekly briefing cadence.
- All four interactive tools (function unchanged; only onward links + ordering).
- The one-off products at £24–£79 (kept deliberately — proof of value + warmest leads).
- WaymarkPath as the separate career companion (it cleanly holds the individual-career anxiety).
- The 3×2 methodology and brand vocabulary.

## Suggested commit sequence
1. `feat(advisory): add Drift Retainer tier + reprice engagement options`
2. `feat(home): make fourth funnel rung a priced recurring hook`
3. `refactor(brand): lead with supply-chain, demote compliance to one application`
4. `feat(products): route products to advisory + fix banned-word`
5. `feat(tools): point take-it-further links to retainer`

## Definition of done
A visitor can move from a free read or tool result to a clearly priced, recurring advisory relationship without hitting a vague "contact us" wall — and every one-off offer (briefing, diagnostic, assessment, product) names a price and a path into the retainer.
