/**
 * PWA installability checks (P0-6). Run after `next build` (reuses the build
 * output rather than rebuilding): starts `next start` on a spare port and
 * asserts the manifest, service worker, offline fallback, and icon assets
 * are all served correctly. Fails CI if any PWA plumbing regresses.
 *
 *   npm run build && npm run test:pwa
 */
import assert from 'node:assert/strict'
import { spawn, type ChildProcess } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const PORT = 4319
const BASE = `http://localhost:${PORT}`
const ROOT = path.resolve(__dirname, '..')

function fileExists(rel: string) {
  assert.ok(fs.existsSync(path.join(ROOT, rel)), `missing file: ${rel}`)
}

async function waitForServer(timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/manifest.webmanifest`)
      if (res.ok) return
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error('next start did not become ready in time')
}

async function main() {
  // Build artifacts that must exist before the server can be checked.
  assert.ok(
    fs.existsSync(path.join(ROOT, '.next')),
    'no .next directory — run `npm run build` first',
  )
  fileExists('public/sw.js')
  fileExists('public/icons/icon-192.png')
  fileExists('public/icons/icon-512.png')
  fileExists('public/icons/icon-maskable-192.png')
  fileExists('public/icons/icon-maskable-512.png')
  fileExists('src/app/apple-icon.png')

  let server: ChildProcess | undefined
  try {
    server = spawn('npx', ['next', 'start', '-p', String(PORT)], {
      cwd: ROOT,
      stdio: 'ignore',
      env: process.env,
    })
    await waitForServer()

    // Manifest: valid JSON with the fields installability depends on.
    const manifestRes = await fetch(`${BASE}/manifest.webmanifest`)
    assert.equal(manifestRes.status, 200, 'manifest not served')
    const manifest = await manifestRes.json()
    assert.equal(manifest.display, 'standalone')
    assert.ok(manifest.name && manifest.short_name, 'manifest missing name')
    assert.ok(manifest.start_url?.startsWith('/'), 'manifest missing start_url')
    const iconSizes = (manifest.icons ?? []).map((i: { sizes: string }) => i.sizes)
    assert.ok(iconSizes.includes('192x192'), 'manifest missing 192px icon')
    assert.ok(iconSizes.includes('512x512'), 'manifest missing 512px icon')
    const maskable = (manifest.icons ?? []).some(
      (i: { purpose?: string }) => i.purpose === 'maskable',
    )
    assert.ok(maskable, 'manifest missing maskable icon')
    // Every icon the manifest references must actually be served.
    for (const icon of manifest.icons as { src: string }[]) {
      const res = await fetch(`${BASE}${icon.src}`)
      assert.equal(res.status, 200, `manifest icon 404: ${icon.src}`)
    }

    // Service worker: served fresh (never HTTP-cached) with precache manifest.
    const swRes = await fetch(`${BASE}/sw.js`)
    assert.equal(swRes.status, 200, 'sw.js not served')
    assert.match(
      swRes.headers.get('cache-control') ?? '',
      /no-cache|no-store/,
      'sw.js must not be HTTP-cacheable',
    )
    const swBody = await swRes.text()
    assert.ok(swBody.includes('precache'), 'sw.js has no precache manifest')
    assert.ok(swBody.includes('/offline'), 'sw.js missing /offline fallback')

    // Offline fallback document and apple-touch-icon.
    const offlineRes = await fetch(`${BASE}/offline`)
    assert.equal(offlineRes.status, 200, '/offline not served')
    const appleRes = await fetch(`${BASE}/apple-icon.png`)
    assert.equal(appleRes.status, 200, 'apple-icon.png not served')

    console.log('pwa-checks: all assertions passed')
  } finally {
    server?.kill('SIGTERM')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
