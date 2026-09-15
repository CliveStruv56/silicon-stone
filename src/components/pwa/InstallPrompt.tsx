"use client";

import { useCallback, useEffect, useState } from "react";
import { track } from "@/lib/track";
import { useStandalone } from "@/lib/pwa/useStandalone";
import {
  DISMISSED_AT_KEY,
  SESSION_COUNT_KEY,
  SESSION_FLAG_KEY,
  isInstallPromptEligible,
} from "@/lib/pwa/install-eligibility";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIos() {
  const ua = window.navigator.userAgent;
  return (
    /iphone|ipad|ipod/i.test(ua) ||
    // iPadOS 13+ reports as Mac; distinguish by touch support.
    (ua.includes("Macintosh") && navigator.maxTouchPoints > 1)
  );
}

/** Counts this session once, then asks the pure rule whether the card may show. */
function passesValueThreshold(): boolean {
  try {
    let count = Number(localStorage.getItem(SESSION_COUNT_KEY) ?? "0");
    if (!sessionStorage.getItem(SESSION_FLAG_KEY)) {
      sessionStorage.setItem(SESSION_FLAG_KEY, "1");
      count += 1;
      localStorage.setItem(SESSION_COUNT_KEY, String(count));
    }
    return isInstallPromptEligible({
      sessionCount: count,
      dismissedAt: localStorage.getItem(DISMISSED_AT_KEY),
      now: Date.now(),
    });
  } catch {
    return false;
  }
}

function recordDismissal() {
  try {
    localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

/**
 * Branded add-to-home-screen card. Never shows on a first visit: the deferred
 * `beforeinstallprompt` is only surfaced from the second session onwards
 * (Chromium), and iOS — which has no install event — gets manual share-sheet
 * instructions under the same threshold. A dismissal holds for 90 days: "Not
 * now", the close control and cancelling Chrome's own install dialog all
 * record it.
 *
 * It is also held back until the reader has scrolled past the first screen. The
 * card is `position: fixed`, so wherever it is anchored it lands on top of the
 * opening view — on the home page that means sitting over the hero's CTAs. A
 * page too short to scroll shows it straight away, since there is no fold to
 * clear.
 */
export function InstallPrompt() {
  const standalone = useStandalone();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<"hidden" | "native" | "ios">("hidden");
  const [pastFold, setPastFold] = useState(false);

  useEffect(() => {
    if (standalone) return;

    function onScroll() {
      if (window.scrollY > window.innerHeight * 0.6) {
        setPastFold(true);
        window.removeEventListener("scroll", onScroll);
      }
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // A page with no fold to clear still gets the card — but only once layout
    // has settled. Measuring during hydration reports almost every page as
    // short, which is what put the card back over the hero.
    const settle = window.setTimeout(() => {
      if (document.documentElement.scrollHeight <= window.innerHeight + 100) {
        setPastFold(true);
        window.removeEventListener("scroll", onScroll);
      }
    }, 1500);

    return () => {
      window.clearTimeout(settle);
      window.removeEventListener("scroll", onScroll);
    };
  }, [standalone]);

  useEffect(() => {
    if (standalone) return;

    const eligible = passesValueThreshold();

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      if (!eligible) return;
      setDeferred(e as BeforeInstallPromptEvent);
      setMode("native");
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    const onInstalled = () => {
      track("PWA Install");
      setMode("hidden");
    };
    window.addEventListener("appinstalled", onInstalled);

    if (eligible && isIos()) setMode("ios");

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [standalone]);

  const dismiss = useCallback(() => {
    recordDismissal();
    setMode("hidden");
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") track("PWA Install");
    // Cancelling the browser's dialog is a "no" too. Left unrecorded, the card
    // came straight back on the next page load as if nothing had been said.
    else recordDismissal();
    setDeferred(null);
    setMode("hidden");
  }, [deferred]);

  if (mode === "hidden" || standalone || !pastFold) return null;

  return (
    <aside
      aria-label="Install Silicon and Stone"
      className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 rounded-lg border border-border-subtle bg-surface-elevated p-4 shadow-lg motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 md:bottom-[calc(0.75rem+env(safe-area-inset-bottom))] md:left-auto md:right-6 md:w-96"
    >
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/icon-192.png"
          alt=""
          width={40}
          height={40}
          className="mt-0.5 h-10 w-10 rounded-md"
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-text-primary">
            Add Silicon &amp; Stone to your Home Screen
          </p>
          {mode === "native" ? (
            <p className="mt-1 text-sm leading-snug text-text-muted">
              Intelligence briefings, one tap away — installs in seconds.
            </p>
          ) : (
            <p className="mt-1 text-sm leading-snug text-text-muted">
              In Safari, tap the Share icon, then{" "}
              <span className="font-medium text-text-primary">
                Add to Home Screen
              </span>
              .
            </p>
          )}
          <div className="mt-3 flex items-center gap-3">
            {mode === "native" && (
              <button
                type="button"
                onClick={install}
                className="rounded-md bg-accent-fill px-4 py-1.5 text-sm font-semibold text-ink-on-accent transition-colors hover:opacity-90"
              >
                Add
              </button>
            )}
            <button
              type="button"
              onClick={dismiss}
              className="text-sm text-text-muted transition-colors hover:text-text-primary"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="-m-1 p-1 text-text-muted transition-colors hover:text-text-primary"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
