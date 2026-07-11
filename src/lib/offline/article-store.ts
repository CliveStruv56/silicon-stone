import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

// Device-local offline article store (P2-4). Articles are saved as their
// rendered content model — Portable Text plus pre-resolved cdn.sanity.io
// image URLs — so offline reads never depend on network GROQ or the
// /_next/image optimizer. No accounts, no sync, no server round-trip.

export interface SavedAuthor {
  name?: string | null
  role?: string | null
  bio?: string | null
  slug?: string | null
  imageUrl?: string | null
}

export interface SavedArticle {
  slug: string
  savedAt: number
  title: string
  excerpt?: string | null
  stoneTruth?: string | null
  impactScore?: number | null
  intelligenceTier?: string | null
  publishedAt?: string | null
  readingTime?: number
  personas?: string[]
  categories?: Array<{ title: string; slug: string }>
  citations?: Array<{ title: string; url: string; publisher?: string }>
  actionableInsights?: string[]
  mainImageUrl?: string | null
  mainImageAlt?: string | null
  author?: SavedAuthor | null
  body: unknown[]
  /** Every image the article needs offline — cached in IMAGES_CACHE on save. */
  imageUrls: string[]
}

interface OfflineDB extends DBSchema {
  articles: {
    key: string
    value: SavedArticle
  }
}

const DB_NAME = 'ss-offline'
const DB_VERSION = 1

/** Read-through target of the service worker's cdn.sanity.io route — keep in
 *  sync with SAVED_IMAGES_CACHE in src/app/sw.ts. */
const IMAGES_CACHE = 'ss-saved-images'

/** Thrown when the browser refuses the write for space reasons, so the UI can
 *  show eviction messaging instead of failing silently. */
export class StorageQuotaError extends Error {
  constructor() {
    super('Storage quota exceeded')
    this.name = 'StorageQuotaError'
  }
}

function isQuotaError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' ||
      // Firefox's historical name for the same condition.
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  )
}

function getDb(): Promise<IDBPDatabase<OfflineDB>> {
  return openDB<OfflineDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore('articles', { keyPath: 'slug' })
    },
  })
}

export async function saveArticle(article: SavedArticle): Promise<void> {
  // Ask for durable storage once we hold content the user expects to keep.
  // Best-effort: browsers may decline silently.
  try {
    await navigator.storage?.persist?.()
  } catch {
    /* ignore */
  }

  try {
    const db = await getDb()
    await db.put('articles', article)
  } catch (error) {
    if (isQuotaError(error)) throw new StorageQuotaError()
    throw error
  }

  // Image caching is best-effort: a failed image never fails the save, and
  // the service worker's stale-while-revalidate browsing cache still covers
  // anything the reader has already seen. no-cors is required — the Sanity
  // CDN serves images without CORS headers, so we store opaque responses
  // (fine for <img> rendering, unverifiable status is the trade-off).
  if (typeof caches !== 'undefined') {
    try {
      const cache = await caches.open(IMAGES_CACHE)
      await Promise.allSettled(
        article.imageUrls.map(async (url) => {
          const response = await fetch(url, { mode: 'no-cors' })
          await cache.put(url, response)
        }),
      )
    } catch {
      /* ignore */
    }
  }
}

export async function removeArticle(slug: string): Promise<void> {
  const db = await getDb()
  const record = await db.get('articles', slug)
  await db.delete('articles', slug)

  // Purge this article's cached images, keeping any an *other* saved article
  // still references.
  if (!record || typeof caches === 'undefined') return
  try {
    const remaining = await db.getAll('articles')
    const stillUsed = new Set(remaining.flatMap((a) => a.imageUrls))
    const cache = await caches.open(IMAGES_CACHE)
    await Promise.allSettled(
      record.imageUrls
        .filter((url) => !stillUsed.has(url))
        .map((url) => cache.delete(url)),
    )
  } catch {
    /* ignore */
  }
}

export async function getArticle(slug: string): Promise<SavedArticle | undefined> {
  const db = await getDb()
  return db.get('articles', slug)
}

export async function listArticles(): Promise<SavedArticle[]> {
  const db = await getDb()
  const all = await db.getAll('articles')
  return all.sort((a, b) => b.savedAt - a.savedAt)
}

export async function isSaved(slug: string): Promise<boolean> {
  return (await getArticle(slug)) !== undefined
}
