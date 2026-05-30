/**
 * Pull one pending Sanity knowledge source into the local reviewed vault.
 *
 * Prepare the next pending manifest:
 *   npm run knowledge:pull
 *
 * Confirm a reviewed local filing and mark the Sanity inbox record processed:
 *   npm run knowledge:pull -- --confirm-reviewed <source-id>
 */

import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import * as fs from 'node:fs'
import * as path from 'node:path'
import {
  buildPendingKnowledgeSourceManifest,
  getKnowledgeSourceManifestFilename,
  isReviewedManifest,
  type PendingKnowledgeSource,
} from '../src/lib/knowledge-inbox'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-01-13'
const token = process.env.SANITY_API_WRITE_TOKEN
const vaultPath = process.env.AIOS_VAULT_PATH
const args = process.argv.slice(2)

function getArg(name: string) {
  const index = args.indexOf(name)
  return index === -1 ? undefined : args[index + 1]
}

function requireConfiguration() {
  if (!projectId) throw new Error('NEXT_PUBLIC_SANITY_PROJECT_ID is required.')
  if (!token) throw new Error('SANITY_API_WRITE_TOKEN is required.')
  if (!vaultPath) throw new Error('AIOS_VAULT_PATH is required.')

  if (!fs.existsSync(path.join(vaultPath, 'AIOS-SCHEMA.md'))) {
    throw new Error(`AIOS_VAULT_PATH does not contain AIOS-SCHEMA.md: ${vaultPath}`)
  }
  if (!fs.existsSync(path.join(vaultPath, 'Sources'))) {
    throw new Error(`AIOS_VAULT_PATH does not contain Sources/: ${vaultPath}`)
  }
}

requireConfiguration()

const reviewedVaultPath = vaultPath as string

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false,
})

const sourceProjection = `{
  _id,
  sourceId,
  title,
  sourceType,
  brandTags,
  topicTags,
  originalUrl,
  "assetRef": asset.asset._ref,
  "assetUrl": asset.asset->url,
  extractedText,
  contentHash,
  capturedAt,
  status,
  manifestId
}`

function getManifestPath(sourceId: string) {
  return path.join(
    reviewedVaultPath,
    'Sources',
    getKnowledgeSourceManifestFilename(sourceId),
  )
}

async function prepareNextPendingSource() {
  const source = await client.fetch<PendingKnowledgeSource | null>(
    `*[_type == "knowledgeSource" && status == "pending"] | order(capturedAt asc, _createdAt asc)[0] ${sourceProjection}`,
  )

  if (!source) {
    console.log('No pending knowledge sources found.')
    return
  }

  const manifestPath = getManifestPath(source.sourceId)
  if (fs.existsSync(manifestPath)) {
    console.log(`Manifest already exists; leaving it unchanged: ${manifestPath}`)
    console.log(`After local review, run: npm run knowledge:pull -- --confirm-reviewed ${source.sourceId}`)
    return
  }

  fs.writeFileSync(manifestPath, buildPendingKnowledgeSourceManifest(source), {
    encoding: 'utf8',
    flag: 'wx',
  })

  console.log(`Prepared pending vault manifest: ${manifestPath}`)
  console.log('Process one source locally, update the compiled wiki, and review the diff.')
  console.log(`After review, run: npm run knowledge:pull -- --confirm-reviewed ${source.sourceId}`)
}

async function confirmReviewedSource(sourceId: string) {
  const manifestPath = getManifestPath(sourceId)
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Reviewed manifest does not exist: ${manifestPath}`)
  }

  const manifest = fs.readFileSync(manifestPath, 'utf8')
  if (!isReviewedManifest(manifest)) {
    throw new Error(`Manifest must say "status: processed" before confirmation: ${manifestPath}`)
  }

  const source = await client.fetch<PendingKnowledgeSource | null>(
    `*[_type == "knowledgeSource" && sourceId == $sourceId][0] ${sourceProjection}`,
    { sourceId },
  )

  if (!source) throw new Error(`Sanity knowledge source not found: ${sourceId}`)
  if (source.status === 'processed' && source.manifestId === sourceId) {
    console.log(`Sanity knowledge source already processed: ${sourceId}`)
    return
  }
  if (source.status !== 'pending') {
    throw new Error(`Expected pending Sanity knowledge source, received: ${source.status}`)
  }

  await client
    .patch(source._id)
    .set({ status: 'processed', manifestId: sourceId })
    .commit()

  console.log(`Marked Sanity knowledge source processed: ${sourceId}`)
}

async function main() {
  const sourceId = getArg('--confirm-reviewed')

  if (sourceId) {
    await confirmReviewedSource(sourceId)
    return
  }

  await prepareNextPendingSource()
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
