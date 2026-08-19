import { describe, expect, it } from 'vitest'

import {
  KNOWLEDGE_FEATURE_ENV_VARS,
  knowledgeFeatureEnabled,
  knowledgeFeatures,
  type EnvSource,
  type KnowledgeFeature,
} from './features'

const FEATURES = Object.keys(KNOWLEDGE_FEATURE_ENV_VARS) as KnowledgeFeature[]

function envWith(name: string, value: string | undefined): EnvSource {
  return value === undefined ? {} : { [name]: value }
}

describe('knowledge feature controls', () => {
  it('is off for every feature in an empty environment', () => {
    expect(knowledgeFeatures({})).toEqual({
      ui: false,
      autoIndex: false,
      draftRetrieval: false,
      externalWrites: false,
    })
  })

  it.each(FEATURES)('enables %s only on an explicit affirmative', (feature) => {
    const name = KNOWLEDGE_FEATURE_ENV_VARS[feature]

    for (const on of ['true', '1', 'TRUE', ' true ', 'True']) {
      expect(knowledgeFeatureEnabled(feature, envWith(name, on))).toBe(true)
    }

    // Everything else is off — including the near-misses that a hand-edited
    // .env produces, which is the whole reason this is not "anything but false".
    for (const off of ['false', '0', '', 'yes', 'on', 'enabled', 'maybe', 'null', 'undefined']) {
      expect(knowledgeFeatureEnabled(feature, envWith(name, off))).toBe(false)
    }
    expect(knowledgeFeatureEnabled(feature, {})).toBe(false)
  })

  it('does not let one control switch on another', () => {
    for (const feature of FEATURES) {
      const env = envWith(KNOWLEDGE_FEATURE_ENV_VARS[feature], 'true')
      const snapshot = knowledgeFeatures(env)
      for (const other of FEATURES) {
        expect(snapshot[other]).toBe(other === feature)
      }
    }
  })

  it('never reads a NEXT_PUBLIC_ variable', () => {
    // A NEXT_PUBLIC_ name would be inlined into the browser bundle at build
    // time. These gate server writes, indexing and retrieval; none of that is
    // the client's business.
    for (const name of Object.values(KNOWLEDGE_FEATURE_ENV_VARS)) {
      expect(name.startsWith('NEXT_PUBLIC_')).toBe(false)
    }
  })

  it('names exactly the four controls the brief specifies', () => {
    expect(Object.values(KNOWLEDGE_FEATURE_ENV_VARS).sort()).toEqual([
      'KNOWLEDGE_AUTO_INDEX_ENABLED',
      'KNOWLEDGE_DRAFT_RETRIEVAL_ENABLED',
      'KNOWLEDGE_EXTERNAL_WRITES_ENABLED',
      'KNOWLEDGE_V2_UI_ENABLED',
    ])
  })
})
