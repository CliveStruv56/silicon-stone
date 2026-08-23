import Image from 'next/image'
import Link from 'next/link'
import { PortableTextComponents } from 'next-sanity'
import { urlFor } from '@/sanity/lib/image'
import { GlossaryPopover } from '@/components/glossary'

/**
 * Schemes an anchor may carry. Mirrors SAFE_LINK in markdown-to-portable-text.ts
 * and the article schema's own rule; relative links are permitted because
 * internal article links are written that way.
 */
const SAFE_HREF = /^(https?:\/\/|mailto:|\/)/i

// Heading anchor id, stamped onto the block by buildToc (src/lib/article-toc.ts).
// Undefined wherever the body was rendered without that pass — the heading then
// renders exactly as it did before, with no id and no tab stop.
function headingId(value: unknown): string | undefined {
  return (value as { tocId?: string } | undefined)?.tocId
}

// All sizes are em-based so the body scales with the container's font-size —
// which the A−/A/A+ stepper drives via the --article-size CSS var (P2-2).
export const portableTextComponents: PortableTextComponents = {
  block: {
    // Body markdown that starts with `# Heading` would otherwise emit a second
    // <h1>, duplicating the page title. Render it as an <h2> (keeping the larger
    // visual weight) so each article has exactly one <h1>.
    // `id`/`tabIndex` come from buildToc stamping `tocId` onto heading blocks.
    // tabIndex={-1} keeps the heading out of the tab order while letting the
    // contents list move focus *into* the section it jumps to; scroll-mt clears
    // the sticky header so the target is not hidden underneath it on arrival.
    h1: ({ children, value }) => (
      <h2
        id={headingId(value)}
        tabIndex={headingId(value) ? -1 : undefined}
        className="scroll-mt-24 text-[1.65em] font-bold text-text-primary mt-10 mb-4"
      >
        {children}
      </h2>
    ),
    h2: ({ children, value }) => (
      <h2
        id={headingId(value)}
        tabIndex={headingId(value) ? -1 : undefined}
        className="scroll-mt-24 text-[1.35em] font-bold text-text-primary mt-8 mb-4"
      >
        {children}
      </h2>
    ),
    h3: ({ children, value }) => (
      <h3
        id={headingId(value)}
        tabIndex={headingId(value) ? -1 : undefined}
        className="scroll-mt-24 text-[1.15em] font-semibold text-text-primary mt-6 mb-3"
      >
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-[1.05em] font-semibold text-text-primary mt-4 mb-2">{children}</h4>
    ),
    normal: ({ children }) => (
      <p className="font-serif text-[1.05em] leading-[1.62] text-text-primary mb-5">{children}</p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-silicon-amber pl-6 py-2 my-6 italic text-text-muted font-serif">
        {children}
      </blockquote>
    ),
  },
  marks: {
    glossaryTerm: ({ children, value }) => (
      <GlossaryPopover term={value?.term}>{children}</GlossaryPopover>
    ),
    strong: ({ children }) => (
      <strong className="font-bold text-text-primary">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="bg-stone-charcoal px-1.5 py-0.5 rounded text-[0.85em] font-mono text-silicon-amber-strong">
        {children}
      </code>
    ),
    link: ({ children, value }) => {
      const href = value?.href || ''

      // Validated here as well as in markdown-to-portable-text.ts, which is the
      // only *writer* today. A hand-edit in Studio does not go through that
      // path, so a `javascript:` href would otherwise reach an anchor tag with
      // nothing between it and the reader. An unsafe href renders as plain
      // text, exactly as the upstream parser already does.
      if (!SAFE_HREF.test(href)) return <>{children}</>

      const isExternal = href.startsWith('http')

      if (isExternal) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-stone-teal hover:text-silicon-amber-strong underline underline-offset-2 transition-colors"
          >
            {children}
          </a>
        )
      }

      return (
        <Link
          href={href}
          className="text-stone-teal hover:text-silicon-amber-strong underline underline-offset-2 transition-colors"
        >
          {children}
        </Link>
      )
    },
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc list-outside ml-6 mb-4 space-y-2 text-text-primary">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal list-outside ml-6 mb-4 space-y-2 text-text-primary">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li className="leading-relaxed">{children}</li>,
    number: ({ children }) => <li className="leading-relaxed">{children}</li>,
  },
  types: {
    image: ({ value }) => {
      if (!value?.asset?._ref) {
        return null
      }

      return (
        <figure className="my-8">
          <div className="relative aspect-video rounded-lg overflow-hidden bg-stone-charcoal">
            <Image
              src={urlFor(value).width(1200).height(675).url()}
              alt={value.alt || 'Article image'}
              fill
              className="object-cover"
            />
          </div>
          {value.caption && (
            <figcaption className="text-sm text-text-muted mt-2 text-center">
              {value.caption}
            </figcaption>
          )}
        </figure>
      )
    },
  },
}
