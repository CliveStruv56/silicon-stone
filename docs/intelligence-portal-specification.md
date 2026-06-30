# Intelligence Portal Specification

> Reconstructed from Document 1: Strategic Architecture & System Logic and Document 2: Technical Component & UI Specifications

---

## Mission

Transition Silicon & Stone from a "personal blog" to a **Methodology-Driven Intelligence Portal** to mitigate "Single Point of Failure" risks.

---

## 1. Core Methodology Integration

The site must revolve around the **Forensic Technopolitics** framework, not just chronological posts.

### The Four Pillars

| Pillar | Description |
|--------|-------------|
| **Supply Chain Forensics** | Neon/Lithography chokepoints, critical materials analysis |
| **Policy Stress-Testing** | Atlantic Drift Model, regulatory divergence analysis |
| **Scenario Modeling** | Drift & disruption scenarios, future state planning |
| **Signal Filtering** | 30-year cycle benchmark, experience-led pattern recognition |

**Logic:** Every article must be presented as an output of these specific frameworks.

**Implementation:** Create a dedicated `/methodology` route with sections for each pillar.

---

## 2. Tiered Intelligence UX ("Analysis Fatigue" Fix)

Senior decision-makers (Personas: Clara, Ian, Sofia) require information at three speeds:

### The Three Tiers

| Tier | Time | Purpose |
|------|------|---------|
| **Pulse** | 30 seconds | Above-the-fold metadata and "Stone Truth" summaries |
| **Briefing** | 5 minutes | Actionable takeaways and the Methodology Checklist |
| **Audit** | Deep Dive | Comprehensive investigation for board-level defensibility |

---

## 3. Design Tokens (Voice DNA)

### Palette
- **"Stone"** (Slate/Grays #1a1a1a) - Stability, grounding
- **"Silicon"** (Electric Cyan #00e5ff) - Data/interactive elements

### Tone
- Sober
- Authoritative
- Weather-beaten
- Clinical

### Constraint
**Zero "Hype" language** - No "revolutionary," "game-changer," or "disruptive"

---

## 4. Technical Components

### Component A: Methodology Checklist

Insert at the top of every Briefing to validate analytical rigor.

```
Methodology Audit
─────────────────
[x] Supply Chain Forensics (Neon/Lithography Chokepoints)
[x] Policy Stress-Testing (Atlantic Drift Model)
[ ] Scenario-Based Modeling (Available in Deep Dive)
[x] Long-Memory Filter (30-Year Cycle Benchmark)
```

### Component B: Persona Filter & Dynamic CTA

Update `/briefings` to allow role-based filtering.

**Filter Logic:** Use metadata tags: `compliance`, `operations`, `policy`, `regional`

**Dynamic CTA Copy:**
| Active Filter | Newsletter Copy |
|---------------|-----------------|
| Compliance | "Secure your August 2nd AI Act signal." |
| Operations | "Track the semiconductor chokepoints." |
| Policy | "Quantify the Atlantic Drift." |

### Component C: Pulse Header (Metadata)

Every post header requires:

1. **Impact Score** - A 1-10 numerical gauge of systemic friction
2. **Persona Tag** - Explicitly stating who the content is for
3. **The Stone Truth** - A 2-3 sentence "Bottom Line" summary

---

## 5. Implementation Instructions

1. **Refactor** the main Article template to support the Tiered Intelligence hierarchy
2. **Initialize** the Persona Filtering state on the Briefings page
3. **Ensure** the Newsletter Signup (Primary CTA) is high-visibility but professionally "sober" in design
4. **Reference** voice-dna and persona data for all placeholder copy to maintain brand consistency

---

## 6. Target Personas

| Persona | Role | Primary Needs |
|---------|------|---------------|
| **Compliance Clara** | Legal/Compliance Officer | Deadline trackers, risk frameworks, board-ready briefings |
| **Industrial Ian** | Operations/Supply Chain | Supply chain maps, chokepoint analysis, scenario planning |
| **Sovereign Sofia** | Policy/Strategy Analyst | Comparative policy analysis, sovereignty scorecards |
| **Global Citizen** | Informed Observer | Accessible explainers, jargon-free analysis |

---

## 7. Schema Fields (Implemented)

```typescript
// Article schema additions
intelligenceTier: 'pulse' | 'briefing' | 'audit'
impactScore: number (1-10)
stoneTruth: string (max 160 chars)
methodologyPillars: string[] // Four pillars checklist
actionableInsights: string[] // Key takeaways for Briefing tier
```

---

## 8. Routes

| Route | Purpose |
|-------|---------|
| `/` | Homepage with Intelligence Stream |
| `/briefings` | Primary intelligence portal with persona filtering |
| `/analysis/[slug]` | Individual article with tiered display |
| `/methodology` | Four Pillars framework explanation |
| `/tools` | Interactive assessment tools |

---

*This document reconstructs the specifications from the original PDF documents provided for the Intelligence Portal restructure project.*
