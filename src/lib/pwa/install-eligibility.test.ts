import { describe, expect, it } from "vitest";
import {
  isInstallPromptEligible,
  MIN_SESSIONS,
  RENAG_WINDOW_MS,
} from "./install-eligibility";

const DAY = 24 * 60 * 60 * 1000;
const now = 1_789_500_000_000;

describe("isInstallPromptEligible", () => {
  it("never shows on a first visit", () => {
    expect(isInstallPromptEligible({ sessionCount: 1, dismissedAt: null, now })).toBe(false);
  });

  it("shows from the second session when never dismissed", () => {
    expect(isInstallPromptEligible({ sessionCount: MIN_SESSIONS, dismissedAt: null, now })).toBe(true);
    expect(isInstallPromptEligible({ sessionCount: 40, dismissedAt: null, now })).toBe(true);
  });

  it("holds a dismissal for 90 days, not the old 30", () => {
    expect(RENAG_WINDOW_MS).toBe(90 * DAY);
    const at = (daysAgo: number) => String(now - daysAgo * DAY);
    expect(isInstallPromptEligible({ sessionCount: 40, dismissedAt: at(0), now })).toBe(false);
    expect(isInstallPromptEligible({ sessionCount: 40, dismissedAt: at(31), now })).toBe(false);
    expect(isInstallPromptEligible({ sessionCount: 40, dismissedAt: at(89), now })).toBe(false);
  });

  it("asks again once the window has passed", () => {
    expect(isInstallPromptEligible({ sessionCount: 40, dismissedAt: String(now - 91 * DAY), now })).toBe(true);
  });

  it("treats an unreadable stored value as no dismissal", () => {
    expect(isInstallPromptEligible({ sessionCount: 40, dismissedAt: "garbage", now })).toBe(true);
  });
});
