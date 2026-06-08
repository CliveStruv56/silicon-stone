import assert from 'node:assert/strict'
import { getStyleGuardrail, getHouseStyleRules, getAITells } from '../src/lib/api'

/**
 * Guards against the silent-"" regression that bit getContentFocus: if the style
 * rules ever fail to reach the bundle, the generation prompt would quietly ship
 * with no house-style guardrail. These assertions fail CI instead.
 *
 * Run with: npm run test:style-rules
 */
function main() {
  const guardrail = getStyleGuardrail()
  assert.ok(guardrail.length > 200, 'guardrail should be substantial, not empty')
  assert.match(guardrail, /UK English/, 'guardrail should enforce UK English')
  assert.match(guardrail, /game-changer/, 'guardrail should ban the house hype words')
  assert.match(guardrail, /\[AUTHOR:/, 'guardrail should mandate [AUTHOR: …] placeholders over fabrication')

  const houseStyle = getHouseStyleRules()
  assert.ok(houseStyle.length > 500, 'house-style rules should be bundled and non-empty')
  assert.match(houseStyle, /UK English/, 'house-style should contain its UK English rule')
  assert.match(houseStyle, /Banned Words/i, 'house-style should contain the banned-words section')

  const aiTells = getAITells()
  assert.ok(aiTells.length > 500, 'ai-tells reference should be bundled and non-empty')
  assert.match(aiTells, /tapestry/, 'ai-tells should list the grand-register vocabulary')
  assert.match(aiTells, /absence test/i, 'ai-tells should include the absence test')

  console.log('style-rules checks passed: guardrail + full house-style + ai-tells all reach the bundle.')
}

main()
