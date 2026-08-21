/**
 * Measure a score floor for editorial memory — wave 3, decision 5.
 *
 *   npm run knowledge:calibrate -- --on "a topic you HAVE notes about" \
 *                                  --on "another one" \
 *                                  --off "something you plainly do not"
 *
 * The lane refuses to inject anything until `KNOWLEDGE_SCORE_FLOOR` is set, and
 * this is how you earn the number rather than guess it.
 *
 * The method is the one that produced `PRIOR_COVERAGE_SCORE_FLOOR = 0.37`, and
 * it is repeated here rather than described so it can actually be re-run: query
 * with topics you know the corpus covers, query with topics you know it does
 * not, and put the floor at the midpoint of the gap between the worst on-topic
 * best-match and the best off-topic best-match. Two of the original off-topic
 * queries deliberately shared the publication's professional register
 * ("negotiating a warehouse lease in Rotterdam"), because the hard case is not
 * a query about cats — it is a plausible-sounding query about the wrong thing.
 *
 * If the two bands overlap there is no honest floor, and the script says so
 * instead of splitting the difference. That is a real outcome: it means the
 * corpus is too small or too uniform to separate signal from noise yet.
 */

import * as dotenv from 'dotenv'
import * as path from 'node:path'

dotenv.config({ path: path.join(process.cwd(), '.env.local'), quiet: true })

const indexName = process.env.PINECONE_KNOWLEDGE_INDEX_NAME
if (!indexName) {
  console.error('PINECONE_KNOWLEDGE_INDEX_NAME is not set — there is nothing to calibrate against.')
  process.exit(1)
}
const knowledgeIndexName: string = indexName

/** The sample the article floor was measured over. Below it, a floor is a
 * number rather than a measurement — see the wave 3 brief, decision 5. */
const ADVISED_MINIMUM_RECORDS = 15

function collect(flag: string): string[] {
  const out: string[] = []
  const argv = process.argv
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === flag && argv[i + 1]) out.push(argv[i + 1])
  }
  return out
}

async function main(): Promise<void> {
  const onTopic = collect('--on')
  const offTopic = collect('--off')

  if (onTopic.length === 0 || offTopic.length === 0) {
    console.error('Give at least one --on and one --off query.')
    console.error('  npm run knowledge:calibrate -- --on "AI sovereignty" --off "warehouse leases"')
    process.exit(1)
  }

  const { Pinecone } = await import('@pinecone-database/pinecone')
  const { generateEmbedding } = await import('../src/lib/embeddings')

  const index = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! }).index(knowledgeIndexName)
  const stats = await index.describeIndexStats()
  const records = stats.totalRecordCount ?? 0

  console.log(`\nCalibrating against ${knowledgeIndexName} — ${records} record(s)\n`)
  if (records < ADVISED_MINIMUM_RECORDS) {
    console.log(
      `  ⚠ ${records} records is below the ${ADVISED_MINIMUM_RECORDS} the article floor was\n` +
        `    measured over. A number derived from this is a guess wearing a measurement's\n` +
        `    clothes. Read the result, do not set it yet.\n`,
    )
  }

  /** Best match for one query — the same statistic the article floor used. */
  async function best(query: string): Promise<number> {
    const vector = await generateEmbedding(query)
    const result = await index.query({ vector, topK: 1, includeMetadata: false })
    return result.matches?.[0]?.score ?? 0
  }

  const on: Array<[string, number]> = []
  for (const query of onTopic) on.push([query, await best(query)])
  const off: Array<[string, number]> = []
  for (const query of offTopic) off.push([query, await best(query)])

  console.log('  ON-TOPIC (should match):')
  for (const [query, score] of on) console.log(`    ${score.toFixed(3)}  ${query}`)
  console.log('\n  OFF-TOPIC (should not):')
  for (const [query, score] of off) console.log(`    ${score.toFixed(3)}  ${query}`)

  const worstOn = Math.min(...on.map(([, score]) => score))
  const bestOff = Math.max(...off.map(([, score]) => score))

  console.log(`\n  weakest on-topic: ${worstOn.toFixed(3)}`)
  console.log(`  strongest off-topic: ${bestOff.toFixed(3)}`)

  if (worstOn <= bestOff) {
    console.log(
      `\n  NO HONEST FLOOR. The bands overlap: something you do not write about scores\n` +
        `  at least as well as something you do. Splitting the difference here would\n` +
        `  produce a number that admits noise or excludes signal, and no way to tell\n` +
        `  which. Grow the corpus, or use queries that separate more cleanly, and\n` +
        `  leave the lane switched off.\n`,
    )
    process.exit(1)
  }

  const floor = Number(((worstOn + bestOff) / 2).toFixed(3))
  console.log(
    `\n  Suggested floor: ${floor}  (midpoint — clears the hardest off-topic case by\n` +
      `  ${(floor - bestOff).toFixed(3)} and the weakest on-topic case by ${(worstOn - floor).toFixed(3)})\n`,
  )
  console.log(`  Set it, with the measurement beside it:\n`)
  console.log(`    KNOWLEDGE_SCORE_FLOOR=${floor}`)
  console.log(`    KNOWLEDGE_DRAFT_RETRIEVAL_ENABLED=true\n`)
  console.log(
    `  Record what you measured — the queries and the numbers — wherever the floor\n` +
      `  is set. A bare constant outlives everyone's memory of where it came from,\n` +
      `  which is the whole reason this script exists.\n`,
  )
}

main().catch((error) => {
  console.error('\nCalibration failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})
