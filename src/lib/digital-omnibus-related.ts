/** Match specific regulatory topics, not generic mentions of AI or sovereignty. */
export function isDigitalOmnibusRelated(article: {
  title?: string | null
  excerpt?: string | null
  slug?: string | null
} | null | undefined): boolean {
  if (!article) return false
  const text = [article.title, article.excerpt, article.slug].filter(Boolean).join(' ').replace(/[-–—]/g, ' ')
  return /\b(?:digital omnibus|post omnibus|ai omnibus|ai act|gpai|general purpose ai|ai literacy|article 50|data act|gdpr|eprivacy|nis\s?2|digital operational resilience act)\b/i.test(text)
}
