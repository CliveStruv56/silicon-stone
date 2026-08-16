/**
 * Fetch a regulatory instrument's consolidated text and render it as the
 * structured plain text the corpus stores on disk.
 *
 *   npm run reg:fetch -- --corpus eu-ai-act
 *   npm run reg:fetch -- --corpus eu-ai-act --html /tmp/aiact-raw.html   (offline)
 *
 * This is a HUMAN-REVIEWED step. It writes corpus/regulatory/<id>/<version>/source.txt
 * and is never run by the build or by CI — the text is committed so that an
 * amendment shows up as a reviewable diff rather than a silent re-embed.
 * After running it: read the diff, then `npm run reg:hash` to re-stamp the manifest.
 *
 * Output shape deliberately mirrors rulepack/versions/<v>/corpus/article-N.txt:
 *
 *   Article 6
 *
 *   Classification rules for high-risk AI systems
 *
 *   1.
 *
 *   Irrespective of whether an AI system is placed on the market ...
 *
 *   (a) the AI system is intended to be used as a safety component ...
 *
 * Keeping one shape across both lanes means one parser idiom and one set of
 * eyes needed to review either.
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { CORPUS_ROOT, readInstrumentMeta, listCorpusIds } from '../../src/lib/regulatory/meta'

import { extract } from './extract'
import { fetchInstrumentHtml } from './source-fetch'

async function main() {
  const argv = process.argv.slice(2)
  const arg = (flag: string): string | undefined => {
    const i = argv.indexOf(flag)
    return i >= 0 ? argv[i + 1] : undefined
  }

  const corpusId = arg('--corpus')
  if (!corpusId) {
    throw new Error(`--corpus is required. Known: ${listCorpusIds().join(', ') || '(none yet)'}`)
  }

  const meta = readInstrumentMeta(corpusId)
  const localHtml = arg('--html')

  // Text comes from Cellar, keyed on meta.celex — never from meta.sourceUrl,
  // which records the human-readable EUR-Lex page and is now behind a bot
  // challenge. See source-fetch.ts for why `!r.ok` was not a sufficient guard.
  const html = localHtml
    ? fs.readFileSync(localHtml, 'utf8')
    : await fetchInstrumentHtml(meta)

  const { text, articles, annexes } = extract(html)

  if (articles.length !== meta.expectedArticles) {
    throw new Error(
      `Parsed ${articles.length} articles but meta.json expects ${meta.expectedArticles}. ` +
        `Either the upstream text changed (update expectedArticles AND the changelog, ` +
        `deliberately) or the extractor is dropping content. Refusing to write.`,
    )
  }

  const dir = path.join(CORPUS_ROOT, corpusId, meta.version)
  fs.mkdirSync(dir, { recursive: true })
  const out = path.join(dir, 'source.txt')
  fs.writeFileSync(out, text, 'utf8')

  console.log(`Wrote ${out}`)
  console.log(`  ${articles.length} articles, ${annexes.length} annexes, ${text.length} chars`)
  console.log(`  articles: ${articles.slice(0, 6).join(', ')} … ${articles.slice(-4).join(', ')}`)
  console.log(`\nReview the diff, then run: npm run reg:hash`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
