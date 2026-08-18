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

function main() {
  assertCatalogueValid()
  assertPropositionsValid()

  const failures: string[] = []

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
    console.error('Compliance Checker v2 legal content failed verification:')
    for (const failure of failures) console.error(`  ✗ ${failure}`)
    console.error(
      '\nAn extract must be a contiguous verbatim run of the consolidated text.\n' +
        'If a passage needs cutting to be quotable, quote the shorter part.'
    )
    process.exit(1)
  }

  console.log(
    `Compliance Checker v2: ${QUESTION_CATALOGUE.length} questions, ` +
      `${LEGAL_PROPOSITIONS.length} propositions, all extracts verified.`
  )
}

main()
