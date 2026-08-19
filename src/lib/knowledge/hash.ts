import { createHash } from 'node:crypto'

import { normalizeText } from './normalize'

/**
 * Content hashing for the knowledge lane.
 *
 * The `sha256:<64 lower-case hex>` shape is not a new invention — it is what
 * `knowledgeSource.contentHash` already stores and what its schema regex
 * enforces, so every hash written here stays valid against documents captured
 * before this wave.
 *
 * Two hashes exist for a reason. `contentHash` is over exactly the bytes given
 * and answers "is this the identical artefact"; `normalizedContentHash` folds
 * the text first and answers "is this the same content". Duplicate detection
 * wants the second; asset integrity wants the first.
 */

const PREFIX = 'sha256:'

/** Bare lower-case hex digest. */
export function sha256Hex(input: string | Uint8Array): string {
  return createHash('sha256').update(input).digest('hex')
}

/** Digest in the stored `sha256:<hex>` form. */
export function contentHash(input: string | Uint8Array): string {
  return `${PREFIX}${sha256Hex(input)}`
}

/**
 * Digest of the *normalised* text — what duplicate detection compares.
 *
 * An empty input still hashes, to the digest of the empty string, rather than
 * returning null. A caller with nothing to hash should not be asking; quietly
 * producing "no hash" here would make every empty record a duplicate of every
 * other one.
 */
export function normalizedContentHash(input: unknown): string {
  return contentHash(normalizeText(input))
}

/** Whether a value is a hash in the stored form. */
export function isContentHash(value: unknown): value is string {
  return typeof value === 'string' && /^sha256:[a-f0-9]{64}$/.test(value)
}

/**
 * Separator for composite keys. U+0000 cannot occur in any part, which is the
 * point: a printable separator is the classic way to let `['ab', 'c']` and
 * `['a', 'bc']` hash to the same value.
 */
const PART_SEPARATOR = '\u0000'

/** A stable digest over several parts, safe against that collision. */
export function compositeHash(parts: readonly (string | undefined | null)[]): string {
  return contentHash(parts.map((part) => part ?? '').join(PART_SEPARATOR))
}
