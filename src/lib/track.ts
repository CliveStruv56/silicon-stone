/**
 * Plausible custom-event helper. Event names are plain space-separated words
 * (e.g. "PWA Install", "Feed Filter") and must match the Custom Event goals
 * registered in the Plausible dashboard character-for-character.
 *
 * Note: CSS-tagged events (`plausible-event-name=Buy+Toolkit+Standard` class
 * names) also record with spaces — Plausible decodes the `+` — so every goal
 * in the dashboard is created with spaces, regardless of how it's fired.
 *
 * No-ops when Plausible isn't loaded (missing env var, blocked, offline),
 * so callers never need to guard.
 */
export function track(event: string, props?: Record<string, string>) {
  if (typeof window === "undefined") return;
  window.plausible?.(event, props ? { props } : undefined);
}
