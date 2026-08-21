/**
 * Feature controls for the knowledge system. All four default to **off**, and
 * nothing in this wave reads them — they exist so the waves that follow can be
 * rolled out and rolled back independently (master spec §11).
 *
 * Three deliberate differences from `src/lib/flags.ts`:
 *
 *  - **No `NEXT_PUBLIC_` prefix.** These gate server behaviour — writes,
 *    indexing, retrieval — and a `NEXT_PUBLIC_` variable is inlined into the
 *    client bundle at build time. There is no reason a browser should be able
 *    to read whether external writes are enabled, and a test below asserts the
 *    prefix never appears here.
 *  - **Read at call time, not at module load.** Site-wide launch flags are
 *    fixed for a deployment; these gate long-running jobs and scripts where an
 *    operator may set the variable for a single process. Functions also make
 *    the behaviour testable without module-cache games.
 *  - **Only an explicit affirmative enables.** `flags.ts` treats "anything but
 *    `false`" as true, which is right for a flag that ships on. It is wrong
 *    for these: a typo, an empty string or a stray `KNOWLEDGE_AUTO_INDEX_ENABLED=maybe`
 *    must leave automatic indexing off rather than switch it on.
 */

/** The four controls, as the names an operator actually sets. */
export const KNOWLEDGE_FEATURE_ENV_VARS = {
  /** The rebuilt `/knowledge` cockpit (wave 4). */
  ui: 'KNOWLEDGE_V2_UI_ENABLED',
  /** Event-driven Pinecone indexing of approved knowledge (wave 3). */
  autoIndex: 'KNOWLEDGE_AUTO_INDEX_ENABLED',
  /** The editorial-memory lane in draft retrieval (wave 3). */
  draftRetrieval: 'KNOWLEDGE_DRAFT_RETRIEVAL_ENABLED',
  /** The universal external ingestion endpoint (wave 4). */
  externalWrites: 'KNOWLEDGE_EXTERNAL_WRITES_ENABLED',
} as const

export type KnowledgeFeature = keyof typeof KNOWLEDGE_FEATURE_ENV_VARS

/** A read-only view of the environment. Deliberately looser than
 * `NodeJS.ProcessEnv`, which Next augments with a required `NODE_ENV` — that
 * would force every caller passing a hypothetical environment to invent one. */
export type EnvSource = Readonly<Record<string, string | undefined>>

/** The only two values that turn a control on. Everything else — absent, empty,
 * `yes`, `TRUE `, a typo — reads as off. */
const AFFIRMATIVE = new Set(['true', '1'])

function readFlag(name: string, env: EnvSource): boolean {
  const raw = env[name]
  if (typeof raw !== 'string') return false
  return AFFIRMATIVE.has(raw.trim().toLowerCase())
}

/**
 * The env var editorial memory's measured score floor is written into.
 *
 * It lives here, beside the flags, because it is a second switch rather than a
 * setting: the retrieval lane will not run without it, so
 * `KNOWLEDGE_DRAFT_RETRIEVAL_ENABLED=true` alone does nothing (wave 3,
 * decision 5). There is no default anywhere — `PRIOR_COVERAGE_SCORE_FLOOR` was
 * measured over 15 articles and editorial memory cannot reproduce that
 * experiment against two records, so the number has to be earned with
 * `npm run knowledge:calibrate` rather than guessed.
 */
export const KNOWLEDGE_SCORE_FLOOR_ENV = 'KNOWLEDGE_SCORE_FLOOR'

/**
 * The measured floor, or null when nobody has measured one.
 *
 * Rejects a value outside (0, 1) rather than coercing it: a cosine floor of 37
 * is a typo for 0.37, and silently treating it as "nothing ever matches" would
 * look exactly like an empty corpus — the one thing this lane must not be
 * confusable with.
 */
export function configuredScoreFloor(env: EnvSource = process.env): number | null {
  const raw = env[KNOWLEDGE_SCORE_FLOOR_ENV]
  if (typeof raw !== 'string' || raw.trim() === '') return null
  const value = Number(raw)
  if (!Number.isFinite(value) || value <= 0 || value >= 1) return null
  return value
}

/**
 * Reads one control. `env` is injectable so tests and scripts can evaluate a
 * hypothetical environment without mutating the real one.
 */
export function knowledgeFeatureEnabled(
  feature: KnowledgeFeature,
  env: EnvSource = process.env,
): boolean {
  return readFlag(KNOWLEDGE_FEATURE_ENV_VARS[feature], env)
}

/** All four at once, for logging a startup banner or a diagnostic route. */
export function knowledgeFeatures(
  env: EnvSource = process.env,
): Record<KnowledgeFeature, boolean> {
  return {
    ui: knowledgeFeatureEnabled('ui', env),
    autoIndex: knowledgeFeatureEnabled('autoIndex', env),
    draftRetrieval: knowledgeFeatureEnabled('draftRetrieval', env),
    externalWrites: knowledgeFeatureEnabled('externalWrites', env),
  }
}
