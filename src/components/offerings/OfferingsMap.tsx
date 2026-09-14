import Link from 'next/link'
import {
  BRIEFING,
  CORE_ENGAGEMENTS,
  INTRO,
  READ,
  RETAINER,
  SELF_SERVE,
  SPECIALIST_PROJECTS,
  TOOLS,
  type MapBox,
} from '@/lib/offerings-map'

/**
 * The offerings map, drawn from `src/lib/offerings-map.ts`.
 *
 * Geometry is the only thing authored here. Column x positions and the row
 * pitch are constants; every y position derives from an array index, so a
 * sixth specialist project adds a row and nothing else moves. Colours come
 * from the site's tokens (cyan for the path, amber for the gate and the core
 * engagements, teal for the retainer) so light and dark both hold.
 *
 * Conventions the owner settled on 2026-09-13, after four rounds on the
 * artifact: one colour for every arrow; no words on any arrow; the Briefing
 * drawn as the gate every path passes through; a dotted line through the gate
 * from each tool to the project built on it; each self-serve product with its
 * own arrow into the Briefing; amber stripes on the core engagements only.
 *
 * Below `md` the SVG gives way to a stacked list of the same boxes.
 */

// ---- geometry (SVG user units) ----
// Sized up on 2026-09-14 (owner: "a bit larger so it's easier to read"):
// type 13/11 → 15/12.5, boxes 40 → 46 tall, and the figure breaks out of
// the page's max-w-7xl into a 1600px container so the scale-down is smaller.
const COL = {
  read: { x: 20, w: 230 },
  use: { x: 306, w: 236 },
  gate: { x: 604, w: 150 },
  commission: { x: 816, w: 360 },
  stay: { x: 1238, w: 190 },
} as const
const W = 1448
const TOP = 90
const TOOL_H = 46
const PITCH = 54
const READ_H = 50
const READ_PITCH = 62
const LABEL = 15
const NOTE = 12.5

// Tools block: y positions and its overall height, used to centre the Read column.
const toolY = (i: number) => TOP + i * PITCH
const toolsBlockH = TOOLS.length * PITCH - (PITCH - TOOL_H)
const readStart = TOP + Math.max(0, (toolsBlockH - (READ.length * READ_PITCH - (READ_PITCH - READ_H))) / 2)
const readY = (i: number) => readStart + i * READ_PITCH

const selfServeSub = TOP + toolsBlockH + 40
const selfServeY = (i: number) => selfServeSub + 10 + i * 64

const projectSub = TOP + 20
const projectY = (i: number) => TOP + PITCH + i * PITCH
const coreSub = projectY(SPECIALIST_PROJECTS.length) + 36
const CORE_H = 58
const coreY = (i: number) => coreSub + 12 + i * (CORE_H + 24)
const coreBottom = coreY(CORE_ENGAGEMENTS.length - 1) + CORE_H

const gateBottom = Math.max(coreBottom, selfServeY(SELF_SERVE.length - 1) + TOOL_H + 40)
const introY = gateBottom + 36
const H = introY + 60 + 24

const mid = (y: number, h: number) => y + h / 2

// ---- pieces ----

function Box({
  box, x, y, w, h, labelSize = LABEL,
}: { box: MapBox; x: number; y: number; w: number; h: number; labelSize?: number }) {
  const stripeClass = box.stripe === 'amber' ? 'fill-silicon-amber' : 'fill-silicon-cyan'
  return (
    <a href={box.href} className="group focus:outline-none" aria-label={box.name}>
      <rect
        x={x} y={y} width={w} height={h} rx={6}
        className={
          box.dashed
            ? 'fill-none stroke-border-subtle group-hover:stroke-silicon-cyan group-focus-visible:stroke-silicon-cyan'
            : 'fill-surface-elevated stroke-border-subtle group-hover:stroke-silicon-cyan group-focus-visible:stroke-silicon-cyan'
        }
        strokeWidth={1}
        strokeDasharray={box.dashed ? '4 3' : undefined}
      />
      {box.stripe && <rect x={x} y={y} width={4} height={h} className={stripeClass} />}
      <text x={x + (box.stripe ? 14 : 12)} y={y + 20} fontSize={labelSize} fontWeight={500} className="fill-text-primary">
        {box.name}
      </text>
      {box.note.map((line, i) => (
        <text key={line} x={x + (box.stripe ? 14 : 12)} y={y + 36 + i * 14.5} fontSize={NOTE} className="fill-text-muted">
          {line}
        </text>
      ))}
    </a>
  )
}

function Arrow({ x1, y1, x2, y2, dashed = false }: { x1: number; y1: number; x2: number; y2: number; dashed?: boolean }) {
  return (
    <path
      d={`M${x1},${y1} L${x2},${y2}`}
      className="stroke-silicon-cyan fill-none"
      strokeWidth={1.75}
      strokeDasharray={dashed ? '4 3' : undefined}
      markerEnd="url(#offerings-map-arrow)"
    />
  )
}

function StageHeader({ x, eyebrow, title }: { x: number; eyebrow: string; title: string }) {
  return (
    <>
      <text x={x} y={26} fontSize={11} letterSpacing="0.14em" className="fill-text-muted font-mono">{eyebrow}</text>
      <text x={x} y={52} fontSize={20} fontWeight={600} className="fill-text-primary font-display">{title}</text>
    </>
  )
}

function Sub({ x, y, children }: { x: number; y: number; children: string }) {
  return <text x={x} y={y} fontSize={11} letterSpacing="0.1em" className="fill-text-muted font-mono">{children}</text>
}

/** The gate (amber) and the destination (teal): tall boxes with a title mid-way. */
function Pillar({
  x, w, title, lines, foot, tone, href, eyebrow,
}: { x: number; w: number; title: string[]; lines: string[]; foot: string[]; tone: 'amber' | 'teal'; href: string; eyebrow: string }) {
  const cx = x + w / 2
  const centre = TOP + (gateBottom - TOP) / 2
  const fill = tone === 'amber' ? 'fill-silicon-amber/10 stroke-silicon-amber' : 'fill-stone-teal/10 stroke-stone-teal'
  const titleFill = tone === 'amber' ? 'fill-silicon-amber-strong' : 'fill-stone-teal'
  const rule = tone === 'amber' ? 'stroke-silicon-amber' : 'stroke-stone-teal'
  return (
    <a href={href} className="group focus:outline-none" aria-label={title.join(' ')}>
      <rect x={x} y={TOP} width={w} height={gateBottom - TOP} rx={10} className={fill} strokeWidth={1.5} />
      <text x={cx} y={TOP + 24} fontSize={10.5} letterSpacing="0.1em" textAnchor="middle" className="fill-text-muted font-mono">{eyebrow}</text>
      {title.map((t, i) => (
        <text key={t} x={cx} y={centre - 22 + i * 24} fontSize={21} fontWeight={600} textAnchor="middle" className={`${titleFill} font-display group-hover:underline`}>{t}</text>
      ))}
      {lines.map((l, i) => (
        <text key={l} x={cx} y={centre + 28 + i * 17} fontSize={NOTE} textAnchor="middle" className="fill-text-muted">{l}</text>
      ))}
      <line x1={x + 20} y1={gateBottom - 58} x2={x + w - 20} y2={gateBottom - 58} className={rule} strokeWidth={1} opacity={0.6} />
      {foot.map((l, i) => (
        <text key={l} x={cx} y={gateBottom - 37 + i * 17} fontSize={NOTE} textAnchor="middle" className="fill-text-muted">{l}</text>
      ))}
    </a>
  )
}

export function OfferingsMap() {
  const gateL = COL.gate.x
  const gateR = COL.gate.x + COL.gate.w
  const comL = COL.commission.x
  const comR = COL.commission.x + COL.commission.w
  const useR = COL.use.x + COL.use.w

  /** Row (mid y) of the specialist project a tool leads to, if it leads to one. */
  const projectRowFor = (offeringId: string) => {
    const j = SPECIALIST_PROJECTS.findIndex((p) => p.id === offeringId)
    return j === -1 ? null : mid(projectY(j), TOOL_H)
  }

  return (
    <figure className="m-0">
      {/* ---- desktop: the drawing ---- */}
      <div className="hidden overflow-x-auto rounded-lg border border-border-subtle bg-stone-charcoal p-5 md:block">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full min-w-[960px]"
          role="img"
          aria-label="Flow chart: free reading leads to four Interactive Forensic Tools and three self-serve products; every one feeds the Advisory Briefing, which leads into five specialist projects, the Exposure Diagnostic, the Strategic Assessment or a board-level engagement; every one of those settles into the Drift Retainer."
        >
          <defs>
            <marker id="offerings-map-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" stroke="none" />
            </marker>
          </defs>

          <StageHeader x={COL.read.x} eyebrow="STAGE 1 · FREE" title="Read" />
          <StageHeader x={COL.use.x} eyebrow="STAGE 2 · FREE · SELF-SERVE" title="Use" />
          <StageHeader x={COL.gate.x} eyebrow="STAGE 3 · THE GATE" title="Talk" />
          <StageHeader x={COL.commission.x} eyebrow="STAGE 4 · ONE-OFF" title="Commission" />
          <StageHeader x={COL.stay.x} eyebrow="STAGE 5 · STANDING" title="Stay" />

          {/* Stage 1 */}
          {READ.map((box, i) => (
            <Box key={box.href} box={box} x={COL.read.x} y={readY(i)} w={COL.read.w} h={READ_H} />
          ))}
          <Arrow x1={COL.read.x + COL.read.w + 4} y1={TOP + toolsBlockH / 2} x2={COL.use.x - 6} y2={TOP + toolsBlockH / 2} />

          {/* Stage 2 */}
          <Sub x={COL.use.x} y={TOP - 8}>INTERACTIVE FORENSIC TOOLS</Sub>
          {TOOLS.map((tool, i) => (
            <Box key={tool.slug} box={tool} x={COL.use.x} y={toolY(i)} w={COL.use.w} h={TOOL_H} />
          ))}
          <Sub x={COL.use.x} y={selfServeSub}>SELF-SERVE PRODUCTS</Sub>
          {SELF_SERVE.map((box, i) => (
            <Box key={box.href} box={box} x={COL.use.x} y={selfServeY(i)} w={COL.use.w} h={TOOL_H} />
          ))}

          {/* Stage 3: dotted lanes first so the gate sits over them */}
          {TOOLS.map((tool, i) => {
            const py = projectRowFor(tool.leadsTo.id)
            if (py === null) return null
            return (
              <path
                key={`lane-${tool.slug}`}
                d={`M${gateL},${mid(toolY(i), TOOL_H)} L${gateR},${py}`}
                // Fainter than the arrows so it reads as a trace, not a route; a
                // shade stronger on dark, where the amber-tinted gate fill was
                // swallowing it (owner request, 2026-09-14).
                className="stroke-silicon-cyan fill-none opacity-55 dark:opacity-80"
                strokeWidth={2}
                strokeDasharray="3 4"
              />
            )
          })}
          <Pillar
            x={COL.gate.x} w={COL.gate.w} tone="amber" href={BRIEFING.href}
            eyebrow="EVERY PATH PASSES HERE"
            title={['Advisory', 'Briefing']}
            lines={['one AI system', 'one principal question', 'one hour, then a written', 'follow-up with priorities']}
            foot={['fee credited against', 'your first engagement']}
          />
          {TOOLS.map((tool, i) => (
            <Arrow key={`in-${tool.slug}`} x1={useR + 4} y1={mid(toolY(i), TOOL_H)} x2={gateL - 4} y2={mid(toolY(i), TOOL_H)} />
          ))}
          {SELF_SERVE.map((box, i) => (
            <Arrow key={`in-${box.href}`} x1={useR + 4} y1={mid(selfServeY(i), TOOL_H)} x2={gateL - 4} y2={mid(selfServeY(i), TOOL_H)} />
          ))}
          <Box box={INTRO} x={COL.gate.x} y={introY} w={COL.gate.w} h={60} />
          <Arrow x1={COL.gate.x + COL.gate.w / 2} y1={introY - 4} x2={COL.gate.x + COL.gate.w / 2} y2={gateBottom + 6} dashed />

          {/* Stage 4 */}
          <Sub x={COL.commission.x} y={projectSub}>SPECIALIST PROJECTS · ONE AT A TIME</Sub>
          {SPECIALIST_PROJECTS.map((box, i) => (
            <g key={box.href}>
              <Box box={box} x={COL.commission.x} y={projectY(i)} w={COL.commission.w} h={TOOL_H} />
              <Arrow x1={gateR + 4} y1={mid(projectY(i), TOOL_H)} x2={comL - 4} y2={mid(projectY(i), TOOL_H)} />
              <Arrow x1={comR + 4} y1={mid(projectY(i), TOOL_H)} x2={COL.stay.x - 4} y2={mid(projectY(i), TOOL_H)} />
            </g>
          ))}
          <Sub x={COL.commission.x} y={coreSub}>CORE ENGAGEMENTS</Sub>
          {CORE_ENGAGEMENTS.map((box, i) => (
            <g key={box.href}>
              <Box box={box} x={COL.commission.x} y={coreY(i)} w={COL.commission.w} h={CORE_H} />
              <Arrow x1={gateR + 4} y1={mid(coreY(i), CORE_H)} x2={comL - 4} y2={mid(coreY(i), CORE_H)} />
              <Arrow x1={comR + 4} y1={mid(coreY(i), CORE_H)} x2={COL.stay.x - 4} y2={mid(coreY(i), CORE_H)} />
            </g>
          ))}

          {/* Stage 5 */}
          <Pillar
            x={COL.stay.x} w={COL.stay.w} tone="teal" href={RETAINER.href}
            eyebrow="EVERYTHING SETTLES HERE"
            title={['The Drift', 'Retainer']}
            lines={['the standing relationship', 'a monthly briefing, a working', 'session on one live decision,', 'a quarterly exposure review']}
            foot={['rolling monthly', 'no minimum term']}
          />
        </svg>
      </div>

      {/* ---- phone: the same boxes, stacked ---- */}
      <ol className="grid gap-3 md:hidden" aria-label="The same map, stacked for narrow screens">
        <StackedStage eyebrow="Stage 1 · free" title="Read" groups={[{ boxes: READ }]} />
        <StackedStage
          eyebrow="Stage 2 · free · self-serve"
          title="Use"
          groups={[
            { label: 'Interactive Forensic Tools', boxes: TOOLS },
            { label: 'Self-serve products', boxes: SELF_SERVE },
          ]}
        />
        <StackedStage
          eyebrow="Stage 3 · the gate"
          title="Talk: the Advisory Briefing"
          tone="amber"
          groups={[{
            boxes: [
              { name: 'One AI system, one principal question', href: BRIEFING.href, note: ['one hour, then a written follow-up with priorities'], stripe: 'amber' },
              { name: 'Every path passes here', href: BRIEFING.href, note: ['fee credited against your first engagement'], stripe: 'amber' },
              INTRO,
            ],
          }]}
        />
        <StackedStage
          eyebrow="Stage 4 · one-off"
          title="Commission"
          groups={[
            { label: 'Specialist projects · one at a time', boxes: SPECIALIST_PROJECTS },
            { label: 'Core engagements', boxes: CORE_ENGAGEMENTS },
          ]}
        />
        <StackedStage
          eyebrow="Stage 5 · standing"
          title="Stay: the Drift Retainer"
          tone="teal"
          groups={[{ boxes: [{ name: 'Everything settles here', href: RETAINER.href, note: ['a monthly briefing, a working session on one live decision, a quarterly exposure review · rolling monthly, no minimum term'], stripe: 'cyan' }] }]}
        />
      </ol>

      <figcaption className="mt-3 max-w-3xl text-sm text-text-muted">
        Arrows run left to right. Each tool sits level with the project built on it, and the
        dotted line through the Briefing follows that lane across; the Compliance Checker&rsquo;s
        lane ends at the Briefing, where its result is reviewed. The three self-serve products
        feed the Briefing directly. Amber stripes mark the core engagements. Every box in stage
        four has an arrow into the Retainer. Every box is a link.
      </figcaption>
    </figure>
  )
}

function StackedStage({
  eyebrow, title, groups, tone,
}: { eyebrow: string; title: string; tone?: 'amber' | 'teal'; groups: Array<{ label?: string; boxes: MapBox[] }> }) {
  const toneClass =
    tone === 'amber'
      ? 'border-silicon-amber bg-silicon-amber/10'
      : tone === 'teal'
        ? 'border-stone-teal bg-stone-teal/10'
        : 'border-border-subtle bg-stone-charcoal'
  return (
    <li className={`rounded-lg border p-4 ${toneClass}`}>
      <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">{eyebrow}</div>
      <h3 className="mb-2 mt-0.5 font-display text-xl font-semibold text-text-primary">{title}</h3>
      {groups.map((g, gi) => (
        <div key={g.label ?? gi} className={gi > 0 ? 'mt-3' : ''}>
          {g.label && (
            <div className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">{g.label}</div>
          )}
          <ul className="grid gap-1.5">
            {g.boxes.map((box) => (
              <li
                key={`${box.href}-${box.name}`}
                className={`border-l-[3px] pl-3 text-[15px] ${box.stripe === 'amber' ? 'border-silicon-amber' : box.stripe === 'cyan' ? 'border-silicon-cyan' : 'border-border-subtle'}`}
              >
                <Link href={box.href} className="font-medium text-text-primary hover:underline">{box.name}</Link>
                {box.note.length > 0 && (
                  <span className="block text-[13px] text-text-muted">{box.note.join(' · ')}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </li>
  )
}
