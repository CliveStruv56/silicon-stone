/**
 * Decides whether the add-to-home-screen card may be shown. Pure so it can be
 * tested under node; the component hands it the two storage values it reads.
 *
 * Two rules:
 * - Never on a first visit. The card waits for the second session.
 * - A dismissal holds for 90 days. "Not now", the close control and cancelling
 *   the browser's own install dialog all count. The window used to be 30 days,
 *   which meant a daily reader was asked again every month and read it as the
 *   card ignoring their answer (owner decision 2026-09-15: 90 days).
 */

export const SESSION_COUNT_KEY = "ss:session-count";
export const SESSION_FLAG_KEY = "ss:session-counted";
export const DISMISSED_AT_KEY = "ss:install-dismissed-at";
export const MIN_SESSIONS = 2;
export const RENAG_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;

export interface InstallEligibilityInput {
  /** Number of distinct sessions seen, including the current one. */
  sessionCount: number;
  /** Raw stored dismissal timestamp (epoch ms), or null when never dismissed. */
  dismissedAt: string | null;
  /** Current time in epoch ms; injected so the window can be tested. */
  now: number;
}

export function isInstallPromptEligible({
  sessionCount,
  dismissedAt,
  now,
}: InstallEligibilityInput): boolean {
  const dismissed = Number(dismissedAt ?? "0");
  if (dismissed && now - dismissed < RENAG_WINDOW_MS) return false;
  return sessionCount >= MIN_SESSIONS;
}
