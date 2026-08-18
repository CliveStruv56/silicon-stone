/**
 * The Phase 8 release report.
 *
 * Prints §20's eighteen acceptance criteria with their current status, and the
 * v1/v2 shadow comparison beside them. Not wired into `prebuild`: this is a
 * decision aid for a person deciding whether to widen the flag, and the
 * criteria it can check automatically are already asserted in
 * `release/acceptance.test.ts`, which does gate CI.
 *
 * Run: `npm run checker-v2:release`
 */

import { acceptanceSummary, evaluateAcceptance } from '../src/lib/compliance-v2/release/acceptance'
import { runShadowComparison, shadowSummary } from '../src/lib/compliance-v2/release/shadow'
import { GOLDEN_SCENARIOS } from '../src/lib/compliance-v2/test-fixtures/golden-scenarios'
import { LEGAL_PROPOSITIONS } from '../src/lib/compliance-v2/legal-content/propositions'
import { QUESTION_CATALOGUE } from '../src/lib/compliance-v2/questions'

const MARK = { pass: '  ✓', fail: '  ✗', manual: '  ?', blocked: '  —' }

function main() {
  const outcomes = evaluateAcceptance()
  const summary = acceptanceSummary(outcomes)

  console.log('\nEU AI Act Compliance Checker v2 — release report')
  console.log('='.repeat(64))
  console.log(
    `${QUESTION_CATALOGUE.length} questions · ${LEGAL_PROPOSITIONS.length} propositions · ` +
      `${GOLDEN_SCENARIOS.length} golden scenarios\n`
  )

  console.log('§20 release acceptance criteria')
  console.log('-'.repeat(64))
  for (const criterion of outcomes) {
    const mark =
      criterion.kind === 'automated'
        ? criterion.passed
          ? MARK.pass
          : MARK.fail
        : criterion.kind === 'manual'
          ? MARK.manual
          : MARK.blocked
    console.log(`${mark} ${String(criterion.id).padStart(2)}. ${criterion.text}`)
    if (criterion.kind !== 'automated' || !criterion.passed) {
      console.log(`       ${criterion.evidence}`)
      if (criterion.failures.length) console.log(`       failing: ${criterion.failures.join(', ')}`)
    }
  }

  console.log(
    `\n  ${summary.automatedPassing}/${summary.automatedTotal} automated criteria pass · ` +
      `${summary.manual} needs a person · ${summary.blocked} blocked`
  )

  const comparisons = runShadowComparison()
  const shadow = shadowSummary(comparisons)

  console.log('\n\nShadow comparison — v1 against v2')
  console.log('-'.repeat(64))
  for (const item of comparisons) {
    const mark = item.kind === 'unexplained' ? MARK.fail : MARK.pass
    console.log(`${mark} ${item.spec}`)
    console.log(
      `       v1 ${item.legacy.classification} (score ${item.legacy.score}, ${item.legacy.duties} duties)` +
        `  →  v2 ${item.v2.classification} (${item.v2.duties} duties)`
    )
    if (item.kind !== 'agreement' || item.dutyDelta !== 0) console.log(`       ${item.note}`)
  }
  console.log(
    `\n  ${shadow.agreements} agree · ${shadow.intended} intended change · ` +
      `${shadow.unexplained} unexplained`
  )

  console.log('\n\nWhat this report cannot tell you')
  console.log('-'.repeat(64))
  for (const line of [
    'Whether counsel has reviewed the decision matrix. Every proposition is',
    '  reviewStatus: "internal" and the cards say so on screen. §22.4 is open.',
    'Whether the questions are comprehensible to someone without legal training.',
    '  §17.5 wants completion testing with real users; none has been run.',
    'Whether retention periods and marketing use are settled. §22.1 and §22.2 are',
    '  open product decisions, and criterion 16 cannot pass until they are recorded.',
  ]) {
    console.log(`  ${line}`)
  }

  console.log(
    `\n${summary.automatedClean && !shadow.unexplained ? 'Automated checks are clean.' : 'Automated checks are NOT clean.'}` +
      ' That is not the same as ready to release.\n'
  )

  // Exit non-zero only on a genuine automated failure. A manual or blocked
  // criterion is information, not a build break — the point of this script is to
  // be run and read, and a report that always fails stops being read.
  if (!summary.automatedClean || shadow.unexplained) process.exit(1)
}

main()
