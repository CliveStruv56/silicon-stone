# Hero Image — The Watcher

> **Asset name**: `the-watcher.png`
> **Recommended path**: `/public/homepage-redesign-2026/the-watcher.png`
> **Source**: Generated via Gemini 3 Pro Image. 16:9 cinematic. 2K.

---

## Current state in the repo

The existing `src/components/home/HeroSection.tsx` references a fallback image at `/intelligence-stream-bg.png` (in `/public/`). It's currently rendered with these filters applied:

```tsx
className="object-cover opacity-30 grayscale mix-blend-luminosity"
```

**Both the image and the filter treatment change** for the redesign. New treatment renders the photograph at full opacity, full colour. The headline is held legible by a directional gradient overlay (see `DESIGN-TOKENS.md`), not by killing the photograph.

---

## Sourcing

The image is currently hosted at this URL:

```
https://hyperagent.com__IMG_364e0ba7__
```

### Option A — direct download to `public/`
Run from the repo root:
```bash
mkdir -p public/homepage-redesign-2026
curl -L -o public/homepage-redesign-2026/the-watcher.png \
  "https://hyperagent.com__IMG_364e0ba7__"
```
Then in `HeroSection.tsx`, update the fallback path:
```tsx
src="/homepage-redesign-2026/the-watcher.png"
```

### Option B — replace the existing path
If you'd rather not change the image path:
```bash
curl -L -o public/intelligence-stream-bg.png \
  "https://hyperagent.com__IMG_364e0ba7__"
```
Risk: any other reference to `intelligence-stream-bg.png` elsewhere in the codebase will silently switch image. Search before doing this.

### Option C — Sanity asset upload (best long-term)
Upload to Sanity media library. Reference via `urlFor()` with the existing `settings.heroImage` flow that `HeroSection.tsx` already supports. Lets Jane swap the image without a deploy.

```ts
// In Sanity Studio, on the siteSettings document:
heroImage = [uploaded asset]
heroImageAlt = "A figure on a Sanday clifftop, looking out across the North Atlantic — the view from the edge"
```

The component already handles both cases (Sanity image OR fallback path) — just upload to Sanity and the component picks it up.

**Recommended**: Option A for v1, then migrate to Option C once Jane is ready to manage hero imagery from Studio.

---

## Image description (for `alt` text and AI-vision contexts)

A figure on a Sanday clifftop, looking out across the North Atlantic — the view from the edge.

### What's depicted
- A single human figure (rear three-quarter view) standing at the edge of a low Orkney clifftop
- Wearing a weathered waxed-cotton jacket in muted dark amber
- Looking out across grey-blue North Atlantic
- Composition: figure in left third, two-thirds of frame is open ocean / sky / horizon
- Light: flat overcast Northern morning, no golden hour, no drama
- Documentary register — National Geographic / The Atlantic / Wired feature photography

The composition was deliberately built so the right two-thirds holds the homepage headline cleanly.

---

## Rendering rules — important

### Filters to remove from `HeroSection.tsx`

The component currently has:
```tsx
className="object-cover opacity-30 grayscale mix-blend-luminosity"
```

**Remove all three filters.** New className:
```tsx
className="object-cover"
```

### Background-position
- **Desktop**: `center 30%` (or via `objectPosition` prop on `next/image`) — keeps the figure high in the frame, gives breathing room above for nav.
- **Mobile**: `left center` — when content stacks below the image, this keeps the figure visible rather than off-frame.

If using `next/image` with `fill`, control via:
```tsx
<Image
  src="/homepage-redesign-2026/the-watcher.png"
  alt="A figure on a Sanday clifftop..."
  fill
  priority
  sizes="100vw"
  className="object-cover object-[center_30%] md:object-[center_30%]"
/>
```

For mobile-specific positioning, use Tailwind's responsive prefixes or an inline style with media queries.

### Aspect / sizing
- The image natively is 16:9.
- Above-the-fold: `priority` flag for LCP.
- `sizes="100vw"` since the image fills the viewport width.

### Optimization
- Convert to WebP if the build pipeline doesn't already do so (next/image handles this automatically).
- Consider AVIF for browsers that support it.
- Source PNG can stay in `/public/homepage-redesign-2026/` for archival.

---

## Alt text (canonical)

```
A figure on a Sanday clifftop, looking out across the North Atlantic — the view from the edge.
```

This is the alt text for accessibility AND the alt text shown if the image fails to load. Match exactly.

---

## When to regenerate

If the image needs regenerating (different framing, different season, different figure positioning), the original generation prompt is preserved here for reproducibility:

<details>
<summary>Original generation prompt (Gemini 3 Pro Image)</summary>

> Editorial documentary photograph for an intelligence-briefing publication. A single human figure stands at the edge of a low Orkney clifftop on the island of Sanday, photographed from behind in a three-quarter rear view. The figure occupies the LEFT THIRD of the frame, looking out across a grey North Atlantic. The right two-thirds is open ocean, low horizon, and overcast Scottish sky — deliberately negative space for a magazine headline overlay.
>
> The figure is a contemporary professional, late-fifties, wearing a weathered waxed-cotton jacket in muted dark amber, dark trousers, hands at sides. Not a hiker, not a tourist — someone who has stood at this spot many times. Wind moves the coarse coastal grass at their feet. Their stance is still and considered. The face is not visible.
>
> The location is unmistakably the Atlantic edge of Orkney: low salt-bitten grass, dark weathered sandstone outcrop at the cliff's lip, kelp-coloured sea below, no trees. A faint distant promontory on the right horizon adds depth. Light is flat overcast — no golden hour, no sun rays — the cool diffused light of a late northern morning.
>
> Visual register: National Geographic / The Atlantic / Wired feature photography. Shot on 35mm with natural film grain. Slightly muted, slightly desaturated. Documentary, never staged. The compositional spirit of Caspar David Friedrich's "Wanderer" but resolutely contemporary and unsentimental.
>
> Palette: charcoal slate, sea-grey, muted amber jacket as the only warm note, hint of teal in the deepest water, weathered greens in the foreground grass.
>
> Composition: wide 16:9 cinematic crop. Figure on the left third following rule of thirds. Horizon line low-centre. Generous, uncluttered sky and sea on the right two-thirds, ready for headline typography to sit clean over it.
>
> Strictly avoid: glowing particles, light effects, lens flares, sun rays, fantasy or surreal lighting, sci-fi or technology motifs, circuit patterns, dramatic over-saturation, magic realism, painterly fantasy treatment, anything that reads as AI-generated. This is a real person on a real cliff on a real grey morning.

Settings: aspect ratio 16:9, resolution 2K, model `gemini-3-pro-image-preview`.
</details>

If a regeneration is required, **keep the figure on the left third**. The composition is engineered to hold the headline on the right. A figure-on-right or figure-centre regeneration breaks the layout.