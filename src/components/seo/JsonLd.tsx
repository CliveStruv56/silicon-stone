/**
 * Reusable JSON-LD injector. Renders one or more schema.org objects as a single
 * `<script type="application/ld+json">`. Keeps structured data consistent and in
 * one place rather than hand-rolled per page.
 */
type JsonLdData = Record<string, unknown>

export function JsonLd({ data }: { data: JsonLdData | JsonLdData[] }) {
  return (
    <script
      type="application/ld+json"
      // Escape `<` so CMS-sourced strings can never contain a literal
      // `</script>` that breaks out of the tag.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  )
}
