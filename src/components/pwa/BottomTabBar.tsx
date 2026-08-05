"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Home, Newspaper, Wrench, Bookmark, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = {
  name: string;
  href: string;
  icon: typeof Home;
  /** Route prefixes (beyond href) that light this tab up. */
  match?: string[];
};

// Five-tab bar (P1-2). "More" replaces the spec's "Account" — the site has no
// user accounts (Phase 3 decision), so the fifth slot holds secondary nav.
const TABS: Tab[] = [
  { name: "Home", href: "/", icon: Home },
  { name: "Read", href: "/intelligence", icon: Newspaper, match: ["/analysis"] },
  { name: "Tools", href: "/tools", icon: Wrench },
  { name: "Saved", href: "/saved", icon: Bookmark },
  {
    name: "More",
    href: "/more",
    icon: LayoutGrid,
    match: [
      "/products",
      "/advisory",
      "/methodology",
      "/glossary",
      "/about",
      "/search",
      "/atlantic-drift",
      "/eu-exposure",
      "/waymarkpath",
    ],
  },
];

const scrollKey = (href: string) => `ss:tab-scroll:${href}`;
const NAV_FLAG = "ss:tab-nav";

function matchesPrefix(pathname: string, prefix: string) {
  if (prefix === "/") return pathname === "/";
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function activeTab(pathname: string): Tab | undefined {
  return TABS.find(
    (tab) =>
      matchesPrefix(pathname, tab.href) ||
      tab.match?.some((prefix) => matchesPrefix(pathname, prefix)),
  );
}

/**
 * Mobile-only bottom tab bar (hidden ≥768px via CSS so there is no hydration
 * flash — the DOM is identical on server and client). Tab taps remember the
 * outgoing tab's scroll position and restore the incoming tab's, so switching
 * tabs feels native; browser back/forward keeps Next.js's own restoration.
 */
export function BottomTabBar() {
  const pathname = usePathname();
  const current = activeTab(pathname);

  useEffect(() => {
    try {
      const target = sessionStorage.getItem(NAV_FLAG);
      // The flag is single-use: any navigation that isn't the awaited tab
      // destination clears it. Otherwise an abandoned tab tap (tap Read, then
      // go back before the feed renders) leaves the flag set for the rest of
      // the session, and the next arrival at that path — an in-page link such
      // as "Browse Briefings" — gets thrown down to a stale offset.
      if (target === null) return;
      sessionStorage.removeItem(NAV_FLAG);
      if (target !== pathname) return;
      const key = scrollKey(pathname);
      const stored = Number(sessionStorage.getItem(key) ?? "0");
      sessionStorage.removeItem(key);
      requestAnimationFrame(() => window.scrollTo(0, stored));
    } catch {
      /* sessionStorage unavailable — plain navigation still works */
    }
  }, [pathname]);

  const rememberScroll = (destination: Tab) => {
    try {
      // Re-tapping the active tab on its root scrolls to top (native
      // convention); tapping it from a sub-route (e.g. an article) returns
      // to the root at its remembered position.
      if (pathname === destination.href) {
        sessionStorage.removeItem(scrollKey(destination.href));
        window.scrollTo({ top: 0 });
        return;
      }
      if (current && pathname === current.href) {
        sessionStorage.setItem(scrollKey(current.href), String(window.scrollY));
      }
      sessionStorage.setItem(NAV_FLAG, destination.href);
    } catch {
      /* ignore */
    }
  };

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border-subtle glass-plate md:hidden"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <ul className="flex">
        {TABS.map((tab) => {
          const isActive = current?.href === tab.href;
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="min-w-0 flex-1">
              <Link
                href={tab.href}
                scroll={false}
                aria-current={isActive ? "page" : undefined}
                onClick={() => rememberScroll(tab)}
                className={cn(
                  "flex flex-col items-center gap-0.5 pb-1.5 pt-2 text-[11px] font-medium transition-colors",
                  isActive
                    ? "text-silicon-cyan"
                    : "text-text-muted hover:text-text-primary",
                )}
              >
                <Icon
                  className="h-5 w-5"
                  strokeWidth={isActive ? 2.25 : 1.75}
                  aria-hidden="true"
                />
                <span className="truncate">{tab.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
