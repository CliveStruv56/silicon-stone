/**
 * Build-time gate for the Compliance Checker v2 catalogue and legal content.
 *
 * Phase 1's exit criteria are "the catalogue can be validated at build time" and
 * "duplicate question/rule/proposition IDs fail tests". The structural half of
 * that is also unit-tested; what can only happen here is the third check:
 * **every proposition's `shortExtract` is verbatim in the pinned corpus.**
 *
 * `rulepack/corpus.ts` is `server-only`, which throws under vitest, so a test
 * cannot read the statute. This script runs with `TSX_TSCONFIG_PATH` pointing at
 * the scripts tsconfig, which shims that specifier away — the same arrangement
 * every other CLI script in this repo uses.
 *
 * Run: `npm run test:checker-v2`. Wired into `prebuild`, so a proposition that
 * misquotes the law cannot reach a deployment.
 */

import { assertCatalogueValid, QUESTION_CATALOGUE } from '../src/lib/compliance-v2/questions'
import {
  assertPropositionsValid,
  LEGAL_PROPOSITIONS,
} from '../src/lib/compliance-v2/legal-content/propositions'
import { hasCorpus, verifyCitation } from '../src/lib/rulepack/corpus'
import { RETENTION_BY_ID } from '../src/lib/compliance-v2/retention'
import { CAPTURE_TTL_SECONDS } from '../src/lib/report/capture'

function main() {
  assertCatalogueValid()
  assertPropositionsValid()

  const failures: string[] = []

  /**
   * The one retention assertion that cannot live in a test.
   *
   * `src/lib/report/capture.ts` starts with `import 'server-only'`, which throws
   * under vitest, so `retention.test.ts` asserts the report and session periods
   * and leaves this one here — this script runs under the scripts tsconfig that
   * shims that specifier away. The recorded §22.1 policy and the TTL the code
   * actually applies must not drift: the first is what a privacy notice
   * promises, the second is what happens.
   */
  const emailRetention = RETENTION_BY_ID.get('report-email')
  if (!emailRetention) {
    failures.push('retention policy has no entry for the report email')
  } else if (emailRetention.seconds !== CAPTURE_TTL_SECONDS) {
    failures.push(
      `retention policy says the report email is kept ${emailRetention.seconds}s ` +
        `(${emailRetention.period}) but CAPTURE_TTL_SECONDS is ${CAPTURE_TTL_SECONDS}s`
    )
  }

  for (const proposition of LEGAL_PROPOSITIONS) {
    const article = proposition.corpusArticle
    if (!article) {
      // Legitimate for a proposition drawn from guidance or from an Article the
      // pack does not carry — but it means nothing verifies the extract, so say
      // so rather than letting the count imply coverage it does not have.
      console.log(`  ~ ${proposition.id}: no corpus article, extract unverified`)
      continue
    }

    if (!hasCorpus(article)) {
      failures.push(
        `${proposition.id}: corpusArticle "${article}" is not in the pinned pack`
      )
      continue
    }

    const verdict = verifyCitation(article, proposition.shortExtract)
    if (verdict.status !== 'verified') {
      failures.push(
        `${proposition.id}: extract from ${proposition.provision} is "${verdict.status}" against the pinned corpus`
      )
    }
  }

  if (failures.length) {
    console.error('Compliance Checker v2 failed verification:')
    for (const failure of failures) console.error(`  ✗ ${failure}`)
    /**
     * Advice that matches the failure.
     *
     * This epilogue used to print the extract guidance unconditionally, so a
     * retention drift was answered with "an extract must be a contiguous
     * verbatim run of the consolidated text" — true, and about something else
     * entirely. The script checks two unrelated things now; the hint has to know
     * which one broke.
     */
    if (failures.some((failure) => failure.startsWith('retention policy'))) {
      console.error(
        '\nThe recorded §22.1 retention policy and the TTL the code applies have\n' +
          'diverged. src/lib/compliance-v2/retention.ts is what a privacy notice\n' +
          'promises; the TTL constant is what happens. Change both, deliberately.'
      )
    }
    if (failures.some((failure) => !failure.startsWith('retention policy'))) {
      console.error(
        '\nAn extract must be a contiguous verbatim run of the consolidated text.\n' +
          'If a passage needs cutting to be quotable, quote the shorter part.'
      )
    }
    process.exit(1)
  }

  console.log(
    `Compliance Checker v2: ${QUESTION_CATALOGUE.length} questions, ` +
      `${LEGAL_PROPOSITIONS.length} propositions, all extracts verified.`
  )
}

main()
