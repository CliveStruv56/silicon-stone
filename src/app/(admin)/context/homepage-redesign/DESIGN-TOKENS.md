# Design Tokens — Homepage Redesign

> **Pair with**: `SPEC.md` (component layouts), `COPY.md` (text strings).
>
> **Existing tokens**: The site already defines `silicon-amber`, `stone-teal`, `slate-deep`, `stone-charcoal`, `text-primary`, `text-muted`, `silicon-cyan`, `border-subtle`, `surface-elevated` in the Tailwind config. **Don't redefine these — verify they exist via `tailwind.config.ts` or `globals.css` `@theme` block, then use them.**
>
> **Component conventions** (verified against existing files):
> - Section components live in `src/components/home/` (PascalCase)
> - Existing files: `HeroSection.tsx`, `CredibilityBlock.tsx`, `OrchestrationFramework.tsx`, `IntelligenceTiers.tsx`, `PersonaNavigator.tsx`, `ToolsGallery.tsx`, `ToolsGrid.tsx`, `SubscribeCTA.tsx`, `DeadlineCountdown.tsx`
> - shadcn primitives in `src/components/ui/`: `badge`, `button`, `StaggerContainer`
> - Animation: `framer-motion` (already a dep), with custom `StaggerContainer` / `StaggerItem` wrappers in `@/components/ui/StaggerContainer`

---

## Existing colour tokens (verify, don't redefine)

| Token | Hex | Usage |
|---|---|---|
| `silicon-amber` | `#E89A3C` | Brand primary · CTA · headlines accent |
| `stone-teal` | `#4A9B9B` | Brand secondary · cadence dots · grid pattern |
| `slate-deep` | `#0B1117` | Page background |
| `stone-charcoal` | `#161C24` | Section alt background |
| `surface-elevated` | `#1A2029` | Elevated surfaces |
| `text-primary` | `#F5F1EA` | Body text on dark |
| `text-muted` | `#A0A4AA` | Muted text · meta |
| `silicon-cyan` | `#7FCBC4` | Briefings nav accent · section eyebrows |
| `border-subtle` | `rgba(255,255,255,0.08)` | Borders |

---

## New tokens to add

WaymarkPath sister-product accent — distinguishes from S&S amber while still feeling related. Add to either `tailwind.config.ts` (Tailwind 3 style) or `src/app/globals.css` `@theme` block (Tailwind 4 style — confirm which pattern the rest of the site uses, match it).

### If `tailwind.config.ts` style:
```ts
colors: {
  // ... existing tokens
  'sister-indigo': {
    DEFAULT: '#6366F1',
    bg: 'rgba(99, 102, 241, 0.06)',
    'bg-hover': 'rgba(99, 102, 241, 0.16)',
    border: 'rgba(99, 102, 241, 0.3)',
    'border-strong': 'rgba(99, 102, 241, 0.4)',
  },
  'silicon-amber-bg': 'rgba(232, 154, 60, 0.06)',
  'silicon-amber-dim': 'rgba(232, 154, 60, 0.5)',
}
```

### If `@theme` style (Tailwind 4):
```css
@theme {
  --color-sister-indigo: #6366F1;
  --color-sister-indigo-bg: rgba(99, 102, 241, 0.06);
  --color-sister-indigo-bg-hover: rgba(99, 102, 241, 0.16);
  --color-sister-indigo-border: rgba(99, 102, 241, 0.3);
  --color-sister-indigo-border-strong: rgba(99, 102, 241, 0.4);
}
```

Don't create both. Use the pattern matching `silicon-amber`.

---

## Typography scale

Already loaded site-wide. Verify these:

| Class | Use | Notes |
|---|---|---|
| `font-sans` | Body, headings | Inter |
| `font-mono` (or `font-ui-mono`) | Eyebrows, badges, meta | JetBrains Mono |

### H1 (Hero)
```css
font-size: clamp(44px, 6.0vw, 80px);
font-weight: 700;
letter-spacing: -0.028em;
line-height: 1.02;
```

### Subhead (Hero sub)
```css
font-size: clamp(20px, 2.0vw, 26px);
font-weight: 500;
letter-spacing: -0.005em;
line-height: 1.38;
color: var(--silicon-amber);
```

### Section H2
```css
font-size: clamp(32px, 4vw, 48px);
font-weight: 700;
letter-spacing: -0.02em;
line-height: 1.1;
```

### Section subhead
```css
font-size: clamp(18px, 1.8vw, 22px);
color: var(--silicon-amber);
font-weight: 500;
line-height: 1.45;
```

### Lede
```css
font-size: 16px;
line-height: 1.7;
color: var(--text-muted);
```

### Eyebrow / mono labels
```css
font-family: var(--font-mono);
font-size: 11px;
letter-spacing: 0.10em;
text-transform: uppercase;
color: var(--silicon-amber);
font-weight: 500;
```

---

## Spacing system

Tailwind defaults. For new sections:

| Use | Value |
|---|---|
| Section padding (vertical, desktop) | `96px` (Tailwind `py-24`) |
| Section padding (vertical, mobile) | `64px` (Tailwind `py-16`) |
| Section horizontal padding | `32px` (Tailwind `px-8`) |
| Max content width | `1280px` (Tailwind `max-w-7xl`) |
| Grid gap (cards) | `20–24px` (Tailwind `gap-5` to `gap-6`) |

---

## Faint grid pattern (used in Hero + Orchestration Battleground)

Subtle teal grid as quiet brand cohesion. The current `HeroSection.tsx` already implements this inline:

```tsx
<div
  className="absolute inset-0 opacity-[0.02]"
  style={{
    backgroundImage: `
      linear-gradient(to right, rgba(74, 155, 155, 0.5) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(74, 155, 155, 0.5) 1px, transparent 1px)
    `,
    backgroundSize: '60px 60px',
  }}
/>
```

The redesign uses the same pattern with two changes:
- Opacity `0.02` → `0.025` (slightly more visible)
- Background-size `60px` → `80px` (more breathing room)
- Add `mix-blend-mode: overlay`

For reuse in `OrchestrationBattleground`, consider extracting as a shared utility:

```css
@layer utilities {
  .bg-brand-grid {
    background-image:
      linear-gradient(to right, rgba(74,155,155,0.5) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(74,155,155,0.5) 1px, transparent 1px);
    background-size: 80px 80px;
  }
}
```

Use: `<div class="absolute inset-0 opacity-[0.025] bg-brand-grid mix-blend-overlay pointer-events-none" />`

---

## Hero gradient overlay

Replaces the current single-direction overlay. The four-stop horizontal gradient is the key — preserves figure visibility on left, darkens for type legibility on right. Don't reduce to a simple two-stop.

```css
.hero-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to right,
      rgba(11,17,23,0.50) 0%,
      rgba(11,17,23,0.18) 32%,
      rgba(11,17,23,0.55) 72%,
      rgba(11,17,23,0.88) 100%
    ),
    linear-gradient(to top,
      rgba(11,17,23,0.70) 0%,
      rgba(11,17,23,0) 38%
    );
}
```

Implement as inline `style` on a div in `HeroSection.tsx`, or as a Tailwind utility if multiple sections need it.

---

## Stone Truth callout (used in Orchestration Battleground)

```css
background: linear-gradient(to right,
  rgba(232,154,60,0.06),
  rgba(74,155,155,0.04));
border-left: 3px solid var(--silicon-amber);
border-right: 1px solid var(--border-subtle);
border-top: 1px solid var(--border-subtle);
border-bottom: 1px solid var(--border-subtle);
border-radius: 12px;
padding: 32px 36px;
max-width: 880px;
```

Consider extracting as a reusable component: `src/components/ui/StoneTruth.tsx`. Future briefings will use the same callout pattern.

---

## Adjacent Block (sister-product link to WaymarkPath)

```css
border: 1px dashed var(--sister-indigo-border-strong);
background: linear-gradient(to right,
  var(--sister-indigo-bg),
  rgba(232,154,60,0.03));
border-radius: 10px;
padding: 24px 32px;
```

The dashed indigo border marks this as **structurally adjacent** rather than part of S&S itself. Don't change to a solid border — the dashed treatment is intentional.

---

## Tier card highlighted state

The Stone Briefing tier (the live tier in the three-tier ladder) gets a subtle highlight:

```css
border-color: var(--silicon-amber-dim);
background: linear-gradient(to bottom,
  rgba(232,154,60,0.04),
  rgba(255,255,255,0.015));
```

---

## Responsive breakpoints

Tailwind defaults — site already uses these:

| Breakpoint | Width | Behaviour change |
|---|---|---|
| `md` | `768px` | Mobile → tablet hybrid |
| `lg` | `1024px` | Two-column layouts engage |
| `xl` | `1280px` | Max content width hits |

### Hero responsive behaviour
- **Desktop** (≥1024px): 50/50 grid, image left, content right two-thirds.
- **Mobile** (<768px): Image becomes a top-fade backdrop (`background-position: left center`), content stacks below.

### Tier grid responsive
- **Desktop**: 3 columns
- **Tablet** (768-1023px): 1 column (forces consideration of each tier)
- **Mobile**: 1 column

### Orchestration columns
- **Desktop** (≥768px): 2 columns side by side
- **Mobile**: 1 column stacked, Stance 02 below Stance 01

---

## Animation / motion

`framer-motion` is already a dependency. Use the existing `StaggerContainer` / `StaggerItem` from `@/components/ui/StaggerContainer` (already used by `CredibilityBlock.tsx` and `HeroSection.tsx`).

### Where to apply
- Hero: keep existing `containerVariants` / `itemVariants` stagger
- Tier cards: stagger fade-in on scroll
- Persona cards: stagger fade-in on scroll
- Tool cards: stagger fade-in on scroll
- Orchestration columns: stagger left-then-right

### Where NOT to apply
- The Stone Truth callout — needs to land statically
- The Adjacent block — quiet by design
- Body paragraphs in CredibilityBlock or any text-heavy block

---

## Iconography

Use `lucide-react` (already a dependency).

| Where | Icon |
|---|---|
| Search nav | `Search` |
| Primary CTA arrows | `ArrowRight` |
| Adjacent block CTA | `ArrowRight` (or `ExternalLink` to signal cross-domain) |
| Tier timer dots | `Circle` (filled, small, solid amber) |
| Section eyebrow dots | Use the Unicode `○` (U+25CB) as text, not an SVG — keeps tight against the text |

---

## Image asset

Hero image specifications and sourcing in `HERO-IMAGE.md`. Summary:

- Path target: `/public/homepage-redesign-2026/the-watcher.png` (recommended)
- Render with `next/image`, `priority` flag, `fill` layout
- `object-position: center 30%` desktop, `left center` mobile
- **Render at full opacity** — DO NOT apply the existing `opacity-30 grayscale mix-blend-luminosity` filter stack from `HeroSection.tsx`

---

## Component file map

```
src/components/home/
├── HeroSection.tsx                 # EDIT — hardcoded fallback + Sanity settings
├── CredibilityBlock.tsx            # EDIT — three copy edits
├── OrchestrationFramework.tsx      # REWRITE / RENAME → OrchestrationBattleground
├── IntelligenceTiers.tsx           # RESTRUCTURE — 4 → 3 tiers
├── AdjacentBlock.tsx               # CREATE — new sister-product cross-link
├── ToolsGallery.tsx                # EDIT — subhead + CTA copy
├── ToolsGrid.tsx                   # EDIT — subhead + CTA copy (verify which renders)
├── PersonaNavigator.tsx            # EDIT — two persona descriptions
├── SubscribeCTA.tsx                # EDIT — cadence reconciliation
├── DeadlineCountdown.tsx           # KEEP — no changes
└── index.ts                        # UPDATE — add AdjacentBlock; rename OrchestrationFramework → OrchestrationBattleground

src/components/ui/
├── StoneTruth.tsx                  # OPTIONAL CREATE — reusable callout
└── (existing: badge, button, StaggerContainer)

src/sanity/schemaTypes/
├── siteSettings.ts                 # EDIT — extend with adjacentProduct object
├── orchestrationBattleground.ts    # OPTIONAL CREATE — if you prefer a dedicated schema
└── index.ts                        # UPDATE — register any new schemas
```

---

## CSS layer ordering

Existing `globals.css` should already have `@layer base, components, utilities;`. Section-specific styles in `components`; one-off utilities in `utilities`.