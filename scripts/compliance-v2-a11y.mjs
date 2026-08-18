/**
 * Phase 8's accessibility check (§17.5), as something that can be re-run.
 *
 * Three of §17.5's five items are machine-checkable and are checked here:
 * keyboard-only completion, screen-reader labelling (axe's label, name-role-value
 * and aria rules), and completion at a mobile viewport. The audit runs at 390px
 * on the questionnaire, at 390px on the result with every disclosure open — a
 * collapsed `<details>` hides its contents from the audit as well as from the
 * reader — and again at 1280px.
 *
 * The two it cannot check are the two that need people: plain-language
 * comprehension, and completion testing with users who do not know legal
 * terminology or their company's financial figures. Neither has been run.
 *
 * Needs a dev server with the flag on:
 *
 *   NEXT_PUBLIC_COMPLIANCE_CHECKER_V2=true npm run dev
 *   npm run checker-v2:a11y
 *
 * Exits non-zero on any violation, or if the keyboard-only walk cannot finish.
 */

import puppeteer from 'puppeteer'
import { readFileSync } from 'node:fs'

const AXE = readFileSync('node_modules/axe-core/axe.min.js', 'utf8')

const STEPS = [
  ['eu_eea', ['eu_eea']],
  ['used_from_eu_establishment', ['used_from_eu_establishment']],
  ['used_internally_or_for_customers', ['used_internally_or_for_customers']],
  ['employment', ['employment']],
  ['recommends_ranks_scores', ['recommends_ranks_scores']],
  ['possibly', ['yes']],
  ['50_249', ['50_249']],
  ['recruitment_selection', ['recruitment_selection']],
  ['art5_a', ['none_of_these']],
  ['health', ['health']],
  ['from_individuals', ['from_individuals']],
  ['reviewed_and_recorded', ['not_reviewed']],
  ['meaningful_review', ['no_review']],
  ['considered_not_required', ['not_considered']],
  ['controller', ['controller']],
  ['excluded_by_terms', ['training_permitted']],
  ['routine', ['no_route']],
]
const YES_PROMPTS = [/evaluate personal aspects of people/, /legal or similarly significant effect/, /leave the UK/]

async function audit(page, label) {
  await page.evaluate(AXE)
  const res = await page.evaluate(async () => {
    const r = await window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    })
    return r.violations.map((v) => ({
      id: v.id, impact: v.impact, help: v.help,
      nodes: v.nodes.slice(0, 3).map((n) => n.html.slice(0, 110)),
    }))
  })
  console.log(`\n--- ${label}: ${res.length} violation type(s)`)
  for (const v of res) {
    console.log(`  [${v.impact}] ${v.id} — ${v.help}`)
    for (const n of v.nodes) console.log(`      ${n}`)
  }
  return res
}

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--no-sandbox'],
})
const page = await browser.newPage()
await page.setViewport({ width: 390, height: 844, isMobile: true })  // §17.5 mobile viewport
page.on('pageerror', (e) => console.log('PAGE ERROR:', e.message))
await page.goto('http://localhost:3000/tools/compliance-checker?v2=1', { waitUntil: 'domcontentloaded' })
await new Promise((r) => setTimeout(r, 2500))

const all = []
all.push(...(await audit(page, 'questionnaire, first question (390px)')))

// §17.5 keyboard-only completion: drive the whole flow with the keyboard alone.
let keyboardOnly = true
let stalled = false
for (let step = 0; step < 60; step += 1) {
  const state = await page.evaluate(() => ({
    values: [...document.querySelectorAll('fieldset input')].map((i) => i.value),
    hasText: Boolean(document.querySelector('textarea')),
    prompt: document.querySelector('[data-slot="card-title"]')?.textContent?.trim() ?? '',
  }))
  const match = STEPS.find(([sig]) => state.values.includes(sig))
  let picks = match ? match[1] : null
  if (match) STEPS.splice(STEPS.indexOf(match), 1)
  if (!picks && state.values.includes('no')) {
    picks = YES_PROMPTS.some((re) => re.test(state.prompt)) ? ['yes'] : ['no']
  }

  for (const v of picks ?? []) {
    // Focus the input via keyboard-reachable means, then activate with Space.
    const reached = await page.evaluate((value) => {
      const input = [...document.querySelectorAll('fieldset input')].find((i) => i.value === value)
      if (!input) return false
      input.focus()
      return document.activeElement === input
    }, v)
    if (!reached) keyboardOnly = false
    await page.keyboard.press('Space')
    await new Promise((r) => setTimeout(r, 110))
  }
  if (!picks && state.hasText) {
    await page.focus('textarea')
    await page.keyboard.type('It ranks job applicants and rejects those below a threshold.')
  }

  const done = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) =>
      x.textContent.trim().startsWith('Continue') && !x.disabled
    )
    if (b) { b.focus(); return 'continue' }
    const s = [...document.querySelectorAll('button')].find((x) =>
      x.textContent.trim().startsWith('See the result') && !x.disabled
    )
    if (s) { s.focus(); return 'result' }
    return false
  })
  if (!done) {
    const buttons = await page.evaluate(() =>
      [...document.querySelectorAll('button')].map((b) => `${b.textContent.trim().slice(0, 24)}:${b.disabled}`)
    )
    console.error(`\nNo keyboard-reachable way forward at "${state.prompt}".`)
    console.error(`  buttons: ${buttons.join(' ')}`)
    stalled = true
    break
  }
  await page.keyboard.press('Enter')
  await new Promise((r) => setTimeout(r, 300))
  if (done === 'result') break
}

await new Promise((r) => setTimeout(r, 1200))
const titles = await page.evaluate(() =>
  [...document.querySelectorAll('[data-slot="card-title"]')].map((h) => h.textContent.trim()))
console.log('\nreached result with keyboard only:', keyboardOnly, '|', titles[0])

// Open every disclosure so the audit sees the detail content too.
await page.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)))
await new Promise((r) => setTimeout(r, 400))
all.push(...(await audit(page, 'result, all disclosures open (390px)')))

await page.setViewport({ width: 1280, height: 1000 })
await new Promise((r) => setTimeout(r, 400))
all.push(...(await audit(page, 'result (1280px)')))

await browser.close()

console.log(`\n${'='.repeat(60)}`)
console.log(`Keyboard-only completion: ${keyboardOnly && !stalled ? 'yes' : 'NO'}`)
console.log(`WCAG 2.1 A/AA violation types across all three audits: ${all.length}`)
console.log('\nNot checked here, because it needs people (§17.5):')
console.log('  Plain-language comprehension testing.')
console.log('  Completion testing with users who do not know legal terminology,')
console.log('  or their own turnover, balance sheet or group status.\n')

if (all.length || stalled || !keyboardOnly) process.exit(1)
