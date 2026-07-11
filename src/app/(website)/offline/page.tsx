import type { Metadata } from "next";
import Link from "next/link";
import { SavedOffline } from "./SavedOffline";

export const metadata: Metadata = {
  title: "Offline | Silicon and Stone",
  robots: { index: false, follow: false },
};

// Served by the service worker as the document fallback when a navigation
// fails offline. Lists the reader's saved articles (P2-5) and reloads
// automatically when the connection returns.
export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
      <p className="font-mono text-sm uppercase tracking-widest text-text-muted">
        You&apos;re offline
      </p>
      <h1 className="mt-4 font-serif text-3xl font-bold text-text-primary sm:text-4xl">
        No connection to the Atlantic edge
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-text-muted">
        This page isn&apos;t available offline. Your saved articles below still
        are, and this page will pick the connection back up automatically when
        it returns.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center rounded-md border border-border-subtle px-5 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-elevated"
      >
        Try the homepage
      </Link>
      <SavedOffline />
    </main>
  );
}
