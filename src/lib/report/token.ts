import 'server-only'

import { capabilitySigningConfigured, signCapability, verifyCapability } from '@/lib/capability-token'

/**
 * Capability tokens for a generated report.
 *
 * A report id alone must not be enough to read a report: the record holds a
 * description of someone's AI systems and the classification that followed from
 * it. The link the user is given carries an HMAC over the id, so a guessed or
 * enumerated id opens nothing. The signing itself lives in
 * `@/lib/capability-token`, shared with saved Checker results; the `report`
 * scope is unchanged, so links already issued still verify.
 */

const SCOPE = 'report'

export function reportSigningConfigured(): boolean {
  return capabilitySigningConfigured()
}

export async function signReportId(reportId: string): Promise<string> {
  return signCapability(SCOPE, reportId)
}

export async function verifyReportToken(reportId: string, token: string | null | undefined): Promise<boolean> {
  return verifyCapability(SCOPE, reportId, token)
}
