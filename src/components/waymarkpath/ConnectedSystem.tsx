'use client'

import { useId, useState, type CSSProperties } from 'react'
import { ArrowRight } from 'lucide-react'
import { WAYMARKPATH_CAPABILITIES, type WaymarkPathCapabilityId } from '@/lib/waymarkpath'
import { STAGE_VISUALS } from './stage-visuals'
import styles from './waymarkpath.module.css'

// Routes are presentation coordinates; which edges exist comes from the product data.
const ROUTES: Record<string, string> = {
  'profile-skills': 'M100 168 H254',
  'skills-gaps': 'M300 168 H454',
  'gaps-learning': 'M500 168 H570 Q600 168 600 138 V86 Q600 56 630 56 H654',
  'gaps-resume': 'M500 168 H570 Q600 168 600 198 V250 Q600 280 630 280 H654',
  'learning-checkins': 'M700 56 H1050 Q1100 56 1100 106 V123',
  'resume-jobs': 'M700 280 H854',
  'jobs-checkins': 'M900 280 H970 Q1000 280 1000 250 V198 Q1000 168 1030 168 H1054',
  'checkins-gaps': 'M1100 168 H1150 Q1180 168 1180 198 V352 Q1180 382 1150 382 H440 Q410 382 410 352 V198 Q410 168 440 168 H454',
}

export function ConnectedSystem({ className = '' }: { className?: string }) {
  // Open on the fork so the shared-context benefit is visible before any interaction.
  const [selectedId, setSelectedId] = useState<WaymarkPathCapabilityId>('gaps')
  const instanceId = useId()
  const detailId = `${instanceId}-detail`
  const selected = WAYMARKPATH_CAPABILITIES.find((cap) => cap.id === selectedId)!
  const downstream = new Set(selected.feeds)

  return (
    <div className={`${styles.theme} ${styles.system} ${className}`}>
      <div className={styles.legend} aria-label="Stage colours">
        <span data-tone="starting"><i aria-hidden="true" />Your starting point</span>
        <span data-tone="direction"><i aria-hidden="true" />Find your direction</span>
        <span data-tone="action"><i aria-hidden="true" />Take action</span>
        <span data-tone="support"><i aria-hidden="true" />Keep moving</span>
      </div>
      <div className={styles.map}>
        <svg className={styles.connections} viewBox="0 0 1200 398" preserveAspectRatio="none" aria-hidden="true">
          {WAYMARKPATH_CAPABILITIES.map((source) => (
            <g key={source.id} data-tone={STAGE_VISUALS[source.id].tone}>
              <defs>
                <marker id={`${instanceId}-${source.id}-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                  <path d="M1 1 L8 5 L1 9" fill="none" stroke="var(--stage-color)" strokeWidth="1.5" />
                </marker>
              </defs>
              {source.feeds.map((target) => (
                <path
                  key={target}
                  d={ROUTES[`${source.id}-${target}`]}
                  className={styles.connection}
                  data-active={source.id === selectedId}
                  markerEnd={`url(#${instanceId}-${source.id}-arrow)`}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </g>
          ))}
        </svg>
        <ul className={styles.mapList} aria-label="Explore the seven career stages">
          {WAYMARKPATH_CAPABILITIES.map((cap) => {
            const { icon: Icon, tone, column, row } = STAGE_VISUALS[cap.id]
            const isSelected = cap.id === selectedId
            const receives = downstream.has(cap.id)
            return (
              <li key={cap.id}>
                <button
                  type="button"
                  id={`${instanceId}-stage-${cap.id}`}
                  className={styles.stageButton}
                  data-tone={tone}
                  data-receives={receives}
                  style={{ '--column': column, '--row': row } as CSSProperties}
                  onClick={() => setSelectedId(cap.id)}
                  aria-pressed={isSelected}
                  aria-controls={detailId}
                  aria-label={`${cap.name}${receives ? `, receives output from ${selected.name}` : ''}`}
                >
                  <span className={styles.badge}><Icon aria-hidden="true" /></span>
                  <span className={styles.stageLabel}>
                    <span className={styles.stageName}><span className={styles.stageNumber}>{cap.step}</span>{cap.short}</span>
                    <span className={styles.stageState}>{isSelected ? 'Selected' : receives ? 'Receives output' : 'Explore stage'}</span>
                  </span>
                </button>
                {isSelected && (
                  <div id={detailId} className={styles.detail} data-tone={tone} role="region" aria-labelledby={`${detailId}-heading`}>
                    <div className={styles.detailHeading}>
                      <Icon aria-hidden="true" />
                      <h3 id={`${detailId}-heading`}>{cap.step} · {cap.name}</h3>
                    </div>
                    <p className={styles.promise}>{cap.promise}</p>
                    <p className={styles.description}>{cap.detail}</p>
                    <div className={styles.destinations}>
                      <span className={styles.destinationsLabel}>{cap.id === 'checkins' ? 'Feeds back into' : 'What this informs'}</span>
                      {cap.feeds.map((id) => {
                        const target = WAYMARKPATH_CAPABILITIES.find((item) => item.id === id)!
                        const TargetIcon = STAGE_VISUALS[id].icon
                        return (
                          <button
                            key={id}
                            type="button"
                            className={styles.destination}
                            data-tone={STAGE_VISUALS[id].tone}
                            onClick={() => {
                              setSelectedId(id)
                              // The old detail is removed. Keep keyboard focus on the destination stage.
                              requestAnimationFrame(() => document.getElementById(`${instanceId}-stage-${id}`)?.focus())
                            }}
                            aria-label={`Explore ${target.name}`}
                          >
                            <TargetIcon aria-hidden="true" />{target.name}<ArrowRight aria-hidden="true" />
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
      <p className={styles.mapNote}>Select a stage to follow its connections. A solid ring marks your selection; dashed rings show which stages receive its output.</p>
      <p className="sr-only" role="status">{selected.name} selected. Informs {selected.feeds.map((id) => WAYMARKPATH_CAPABILITIES.find((cap) => cap.id === id)!.name).join(' and ')}.</p>
    </div>
  )
}
