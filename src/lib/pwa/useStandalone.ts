"use client";

import { useSyncExternalStore } from "react";

// iOS Safari exposes a non-standard `navigator.standalone` for A2HS web apps.
declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

const QUERY = "(display-mode: standalone)";

function subscribe(onChange: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getSnapshot() {
  return (
    (window.matchMedia && window.matchMedia(QUERY).matches) ||
    window.navigator.standalone === true
  );
}

/**
 * True when the site is running as an installed app (standalone display mode
 * on Android/desktop, or iOS home-screen web app). SSR-safe: false on the
 * server and first paint.
 */
export function useStandalone(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
