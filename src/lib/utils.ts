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

export function slugify(text: string): string {
  const slug = text
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
  return slug || 'untitled';
}
