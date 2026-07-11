import type { PortableTextComponents } from 'next-sanity'
import { urlFor } from '@/sanity/lib/image'
import { portableTextComponents } from './PortableTextComponents'

/**
 * Portable Text components for the offline reader (P2-4). Identical to the
 * live article renderer except images: plain <img> pointing straight at
 * cdn.sanity.io, at exactly the size the save action cached — /_next/image
 * URLs vary by device pixel ratio and can't be cached deterministically.
 */
export const offlinePortableTextComponents: PortableTextComponents = {
  ...portableTextComponents,
  types: {
    ...portableTextComponents.types,
    image: ({ value }) => {
      if (!value?.asset?._ref) {
        return null
      }

      return (
        <figure className="my-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={urlFor(value).width(1200).height(675).url()}
            alt={value.alt || ''}
            loading="lazy"
            className="w-full rounded-lg bg-stone-charcoal"
          />
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
