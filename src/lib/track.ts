/**
 * Plausible custom-event helper. Event names follow the site convention of
 * `+`-separated words (e.g. "PWA+Install", "Feed+Filter") so they line up
 * with the goals registered in the Plausible dashboard.
 *
 * No-ops when Plausible isn't loaded (missing env var, blocked, offline),
 * so callers never need to guard.
 */
export function track(event: string, props?: Record<string, string>) {
  if (typeof window === "undefined") return;
  window.plausible?.(event, props ? { props } : undefined);
}
