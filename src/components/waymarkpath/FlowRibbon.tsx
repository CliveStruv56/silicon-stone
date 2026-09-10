'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { WAYMARKPATH_CAPABILITIES, WAYMARKPATH_POSITIONING } from '@/lib/waymarkpath'
import { STAGE_VISUALS } from './stage-visuals'
import styles from './waymarkpath.module.css'

/**
 * The seven stages on one drawn track — the same motif on `/waymarkpath` and
 * on the Products-page band, so the two surfaces cannot drift apart (they had:
 * the band carried a seven-dot sketch of this, which the owner asked to match
 * the real thing on 2026-09-10).
 *
 * There is no interaction here on purpose: on Products the whole band is a
 * single link, so anything clickable inside it would either swallow the
 * navigation or nest a control in an anchor. The interactive version is
 * `ConnectedSystem`.
 *
 * `intro` — the "Seven connected stages" heading. Off inside the Products card,
 * which already has an `<h2>` for WaymarkPath itself.
 * `surface` — what sits behind the ribbon. The arrows between stages mask the
 * track with a solid square, so they must be painted the colour of whatever
 * the ribbon is on: the page ground on `/waymarkpath`, the card on Products.
 */
export function FlowRibbon({
  className = '',
  intro = true,
  surface = 'page',
}: {
  className?: string
  intro?: boolean
  surface?: 'page' | 'card'
}) {
  const reduce = useReducedMotion()

  return (
    <div
      className={`${styles.theme} ${styles.ribbon} ${surface === 'card' ? styles.ribbonOnCard : ''} ${className}`}
    >
      {intro && (
        <div className={styles.ribbonIntro}>
          <h2>{WAYMARKPATH_POSITIONING.stagesHeading}</h2>
          <span>Seven stages. One shared picture of you.</span>
        </div>
      )}
      <div className={styles.ribbonRoute}>
        <motion.div
          className={styles.ribbonTrack}
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: reduce ? 0 : 0.9, ease: 'easeInOut' }}
          aria-hidden="true"
        />
        <ol className={styles.ribbonList} aria-label="The seven stages of your career journey">
          {WAYMARKPATH_CAPABILITIES.map((cap, index) => {
            const { icon: Icon, tone } = STAGE_VISUALS[cap.id]
            return (
              <li className={styles.ribbonStage} key={cap.id} data-tone={tone}>
                <span className={styles.ribbonDot} aria-hidden="true">
                  <Icon />
                  <span className={styles.ribbonNumber}>{cap.step}</span>
                </span>
                <div className={styles.ribbonCopy}>
                  <h3 className={styles.ribbonLabel}>{cap.name}</h3>
                  <p className={styles.ribbonSummary}>{cap.summary}</p>
                </div>
                {index < WAYMARKPATH_CAPABILITIES.length - 1 && (
                  <ChevronRight className={styles.ribbonArrow} aria-hidden="true" />
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
