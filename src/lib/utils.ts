import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns a safe same-origin relative path for use in redirects, or `fallback`
 * if the input is absolute, scheme-relative ("//evil.com"), or otherwise unsafe.
 * Prevents open-redirect abuse when a path comes from user-supplied input.
 */
export function safeInternalPath(target: string | null | undefined, fallback = '/'): string {
  if (!target) return fallback
  // Reject anything that isn't a single-slash-rooted path.
  if (!target.startsWith('/')) return fallback
  // Reject scheme-relative ("//host") and backslash tricks ("/\\host").
  if (target.startsWith('//') || target.startsWith('/\\')) return fallback
  return target
}

/**
 * Build a clean URL slug from a title. Truncates to `maxLength` on a *word
 * boundary* (never mid-word) so long titles don't yield slugs like
 * `…-include-the-fda` cut at 96 chars. Default cap is 60 — short enough for
 * tidy, shareable URLs, long enough to stay descriptive.
 */
export function slugify(text: string, maxLength = 60): string {
  const base = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-')   // Replace multiple - with single -
    .replace(/^-+/, '')       // Trim - from start of text
    .replace(/-+$/, '');      // Trim - from end of text

  // Never return an empty slug (e.g. for all-non-ASCII titles) — callers should
  // add a unique suffix, but this guarantees a routable, non-empty floor.
  if (!base) return 'untitled'
  if (base.length <= maxLength) return base

  // Cut at the last hyphen within the limit so we never split a word.
  const cut = base.slice(0, maxLength)
  const lastDash = cut.lastIndexOf('-')
  const trimmed = (lastDash > 0 ? cut.slice(0, lastDash) : cut).replace(/-+$/, '')
  return trimmed || cut.replace(/-+$/, '') || 'untitled'
}
