"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CloudOff, Wifi } from "lucide-react";

/**
 * Global connectivity indicator (P2-5). Non-blocking: a small fixed pill that
 * appears when the browser goes offline, points at the saved-articles store,
 * and clears itself on reconnect (after a brief "back online" confirmation).
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [reconnected, setReconnected] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);

    const onOffline = () => {
      setReconnected(false);
      setOffline(true);
    };
    const onOnline = () => {
      setOffline(false);
      setReconnected(true);
      setTimeout(() => setReconnected(false), 2500);
      // Drain the offline submission queue (P2-6) — the Background Sync API
      // does this itself on Chromium, but Safari/iOS needs the nudge.
      navigator.serviceWorker?.controller?.postMessage({
        type: "REPLAY_SUBMISSIONS",
      });
    };

    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  if (!offline && !reconnected) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-[calc(1rem+env(safe-area-inset-bottom))]"
    >
      {offline ? (
        <p className="pointer-events-auto flex items-center gap-2 rounded-full border border-border-subtle bg-surface-elevated px-4 py-2 text-sm text-text-primary shadow-lg">
          <CloudOff className="h-4 w-4 shrink-0 text-silicon-amber" aria-hidden="true" />
          <span>You&apos;re offline.</span>
          <Link
            href="/saved"
            className="font-medium text-stone-teal underline underline-offset-2 hover:text-silicon-amber"
          >
            Saved articles
          </Link>
          <span>still work.</span>
        </p>
      ) : (
        <p className="pointer-events-auto flex items-center gap-2 rounded-full border border-border-subtle bg-surface-elevated px-4 py-2 text-sm text-text-primary shadow-lg">
          <Wifi className="h-4 w-4 shrink-0 text-stone-teal" aria-hidden="true" />
          Back online
        </p>
      )}
    </div>
  );
}
