/**
 * Probe the FULL retrieval path — gate, routing, score floor, diversification,
 * formatting — as /create runs it.
 *
 *   npm run reg:probe -- "topic one" "topic two"
 *
 * reg:ingest --probe queries the index directly, which measures raw vector
 * similarity. This measures what the drafting model would actually be handed,
 * which is the thing that can be wrong in ways similarity alone cannot show:
 * the right passage from the wrong instrument.
 */

import * as dotenv from 'dotenv'
import * as path from 'node:path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

async function main(): Promise<void> {
  const { retrieveRegulatoryContext } = await import('../../src/lib/regulatory/retrieve')

  const topics = process.argv.slice(2).filter((arg) => !arg.startsWith('--'))
  if (topics.length === 0) throw new Error('pass at least one topic')

  for (const topic of topics) {
    console.log(`\n${'─'.repeat(76)}\n▶ ${topic}`)
    const result = await retrieveRegulatoryContext({ topic })
    for (const note of result.notes) console.log(`  ${note}`)

    if (!result.block) {
      console.log('  → no block injected')
      continue
    }

    const instruments = result.block.match(/^## .+$/gm) ?? []
    const citations = result.block.match(/^\[cite as: .+\]$/gm) ?? []
    console.log(`  → ${result.block.length} chars`)
    for (const instrument of instruments) console.log(`     ${instrument}`)
    for (const citation of citations) console.log(`       ${citation}`)
    if (result.block.includes('INSTRUMENT TYPE: Directive')) {
      console.log('       (directive caveat rendered)')
    }
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
