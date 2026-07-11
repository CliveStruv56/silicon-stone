"use client";

import { useEffect, useState } from "react";
import { CloudOff } from "lucide-react";
import { listArticles, type SavedArticle } from "@/lib/offline/article-store";

/**
 * Saved-content directory on the offline fallback page (P2-5), plus the
 * auto-recovery: the fallback document is served *at the URL the reader was
 * trying to reach*, so when the connection returns a reload resumes exactly
 * where they were headed.
 */
export function SavedOffline() {
  const [articles, setArticles] = useState<SavedArticle[]>([]);

  useEffect(() => {
    listArticles()
      .then(setArticles)
      .catch(() => setArticles([]));

    const onOnline = () => window.location.reload();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  if (articles.length === 0) return null;

  return (
    <section className="mt-10 w-full max-w-md text-left">
      <h2 className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-text-muted">
        <CloudOff className="h-3.5 w-3.5" aria-hidden="true" />
        Available offline
      </h2>
      <ul className="space-y-2">
        {articles.map((article) => (
          <li key={article.slug}>
            <a
              href={`/saved?read=${encodeURIComponent(article.slug)}`}
              className="block rounded-lg border border-border-subtle bg-surface-elevated/60 px-4 py-3 transition-colors hover:border-stone-teal"
            >
              <span className="block text-sm font-semibold text-text-primary line-clamp-2">
                {article.title}
              </span>
              {article.readingTime ? (
                <span className="mt-0.5 block text-xs text-text-muted">
                  {article.readingTime} min read
                </span>
              ) : null}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
