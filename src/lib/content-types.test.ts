import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  CONTENT_TYPE_LABELS,
  LABELS_WITH_YOUTUBE,
  PRACTICAL_MOVE_CONTENT_TYPE,
  badgeLabel,
  contentTypeLabel,
} from './content-types'
import { contentTypeLabel as searchLabel } from './search/labels'

describe('content type labels', () => {
  it('keeps the stored value "guide" and presents it as Practical Move', () => {
    expect(PRACTICAL_MOVE_CONTENT_TYPE).toBe('guide')
    expect(contentTypeLabel('guide')).toBe('Practical Move')
  })
  it('leaves the other types as they were', () => {
    expect(contentTypeLabel('signal')).toBe('Signal')
    expect(contentTypeLabel('deepdive')).toBe('Deep Dive')
  })
  /**
   * Pins what readers saw before the rename, for every type except guide.
   * Search: no badge for youtube. Article page and cards: "Guide" for any
   * stored type that is not signal, deepdive (or the renamed guide).
   * Related list and admin: youtube named, unknown shows the raw value.
   */
  it('changes no reader-facing label for a non-guide type', () => {
    expect(contentTypeLabel('youtube')).toBeNull()
    expect(contentTypeLabel('mystery')).toBeNull()
    expect(badgeLabel('signal')).toBe('Signal')
    expect(badgeLabel('deepdive')).toBe('Deep Dive')
    expect(badgeLabel('youtube')).toBe('Guide')
    expect(badgeLabel('mystery')).toBe('Guide')
    expect(badgeLabel(null)).toBeNull()
    expect(LABELS_WITH_YOUTUBE.youtube).toBe('YouTube Script')
    expect(LABELS_WITH_YOUTUBE.signal).toBe('Signal')
    expect(LABELS_WITH_YOUTUBE.deepdive).toBe('Deep Dive')
    expect(LABELS_WITH_YOUTUBE.mystery).toBeUndefined()
  })
  it('shows no badge for a missing or unknown type', () => {
    expect(contentTypeLabel(undefined)).toBeNull()
    expect(contentTypeLabel(null)).toBeNull()
    expect(contentTypeLabel('mystery')).toBeNull()
  })
  it('search results use the same mapping', () => {
    expect(searchLabel('guide')).toBe('Practical Move')
  })
})

/**
 * Guard against a second, private mapping growing back. The label for the
 * stored value "guide" must live in src/lib/content-types.ts only: any other
 * file that maps `guide` to a display string is a place the old name can
 * linger. Admin generator formats ("guide" as a draft format, not a stored
 * label) are listed explicitly.
 */
describe('no stray guide-label mapping', () => {
  const ALLOWED = new Set([
    'src/lib/content-types.ts',
    // RESULT_LABELS.guide is the *site page* kind (e.g. the US Executive's Guide), not an article type.
    'src/lib/search/labels.ts',
    // Draft *format* picker for the admin generator, and its tests/prompts.
    'src/app/(admin)/create/create-form.tsx',
    'src/app/(admin)/import/types.ts',
  ])
  const root = path.resolve(__dirname, '../..')

  function walk(dir: string, out: string[] = []) {
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name)
      if (statSync(full).isDirectory()) walk(full, out)
      else if (/\.(ts|tsx)$/.test(name) && !/\.test\.ts$/.test(name)) out.push(full)
    }
    return out
  }

  it("no file other than content-types.ts maps guide: 'Guide' or contentType-guide to 'Guide'", () => {
    const offenders: string[] = []
    for (const file of walk(path.join(root, 'src'))) {
      const rel = path.relative(root, file)
      if (ALLOWED.has(rel)) continue
      const text = readFileSync(file, 'utf8')
      if (/guide\s*:\s*['"](Guide|Tool Guides?)['"]/.test(text)) offenders.push(rel)
      if (/\?\s*['"]Deep Dive['"]\s*:[^\n]*['"]Guide['"]/.test(text)) offenders.push(rel)
    }
    expect(offenders).toEqual([])
  })

  it('the Studio option title no longer says Tool Guide', () => {
    const schema = readFileSync(path.join(root, 'src/sanity/schemaTypes/article.ts'), 'utf8')
    expect(schema).toContain("value: 'guide'")
    expect(schema).toMatch(/title: 'Practical Move[^']*', value: 'guide'/)
    expect(schema).not.toContain('Tool Guide')
  })

  it('has the label table in one place', () => {
    expect(Object.keys(CONTENT_TYPE_LABELS).sort()).toEqual(['deepdive', 'guide', 'signal'])
  })
})
