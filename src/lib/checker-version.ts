import { RULE_PACK } from './rulepack'
import { COMPLIANCE_CHECKER_V2 } from './flags'

/**
 * Version stamps for a Compliance Checker run.
 *
 * §15.1 of the v2 specification requires every request and stored record to
 * carry four of them: the answer-record schema version, the checker version,
 * the question-catalogue version, and the rulepack version. They move
 * independently and each answers a different question when a result has to be
 * reproduced from a stored record months later:
 *
 * - `schemaVersion` — can this record be read at all?
 * - `checkerVersion` — which engine produced the result?
 * - `questionCatalogueVersion` — did the question mean the same thing then?
 * - `rulepackVersion` — which law was it decided against?
 *
 * This module sits at `src/lib` rather than under `compliance-v2/` on purpose:
 * v1 records get stamped too, and a v1 session importing its own version
 * constant from a directory named for its successor would be a lie about where
 * the code belongs.
 */

/** The answer-record schema versions this build can read. */
export const CHECKER_SCHEMA_VERSIONS = [1, 2] as const

export type CheckerSchemaVersion = (typeof CHECKER_SCHEMA_VERSIONS)[number]

/**
 * The version a *new* record is written at. Follows the rollout flag, so a
 * deployment with v2 dark keeps writing v1 records and nothing has to migrate
 * when the flag is flipped back.
 */
export const CURRENT_CHECKER_SCHEMA_VERSION: CheckerSchemaVersion = COMPLIANCE_CHECKER_V2 ? 2 : 1

/**
 * Read a schema version off an untrusted record.
 *
 * Missing or unreadable resolves to 1, never to the current version. §15.4
 * forbids reinterpreting an old answer record as a v2 record without a tested
 * migration, and a record written before this field existed is by definition a
 * v1 record — defaulting it forward would silently claim a v2 shape for answers
 * that never had one.
 */
export function parseCheckerSchemaVersion(value: unknown): CheckerSchemaVersion {
  return CHECKER_SCHEMA_VERSIONS.includes(value as CheckerSchemaVersion)
    ? (value as CheckerSchemaVersion)
    : 1
}

/**
 * The engine that produced a result. Bumped when evaluation behaviour changes
 * in a way that would alter a stored result, not on every edit.
 */
export const CHECKER_VERSION = COMPLIANCE_CHECKER_V2 ? '2.0.0-dev' : '1.0.0'

/**
 * The question catalogue. Separate from `CHECKER_VERSION` because a question's
 * *wording* can change the meaning of a stored answer without the engine
 * changing at all — which is the case §15.3's `STALE_QUESTION_VERSION` exists
 * to report.
 */
export const QUESTION_CATALOGUE_VERSION = COMPLIANCE_CHECKER_V2 ? '2.0.0-dev' : '1.0.0'

export interface CheckerVersionStamp {
  schemaVersion: CheckerSchemaVersion
  checkerVersion: string
  questionCatalogueVersion: string
  rulepackVersion: string
}

/** The four stamps §15.1 requires, as one object. */
export function checkerVersionStamp(): CheckerVersionStamp {
  return {
    schemaVersion: CURRENT_CHECKER_SCHEMA_VERSION,
    checkerVersion: CHECKER_VERSION,
    questionCatalogueVersion: QUESTION_CATALOGUE_VERSION,
    rulepackVersion: RULE_PACK.manifest.version,
  }
}
