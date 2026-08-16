'use client'

/**
 * This configuration is used to for the Sanity Studio that’s mounted on the `/app/studio/[[...tool]]/page.tsx` route
 */

import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {media} from 'sanity-plugin-media'

// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import {apiVersion, dataset, projectId} from './src/sanity/env'
import {schema} from './src/sanity/schemaTypes'
import {structure} from './src/sanity/structure'
import {FactCheckAction} from './src/sanity/actions/factCheckAction'
import {withPublishPreflight} from './src/sanity/actions/publishPreflight'
import {factCheckBadge} from './src/sanity/badges/factCheckBadge'

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  // Add and edit the content schema in the './sanity/schemaTypes' folder
  schema,
  document: {
    // Articles only: "Run fact-check" action, the verdict badge, and the
    // pre-publish guard. The guard WRAPS Studio's own publish action rather
    // than replacing it, so publishing keeps its built-in disabled states and
    // keyboard shortcut; it blocks on an unresolved [AUTHOR: …] placeholder and
    // asks for confirmation on a missing or adverse fact-check. See
    // src/lib/publish-preflight.ts.
    actions: (prev, ctx) =>
      ctx.schemaType === 'article'
        ? [
            ...prev.map((action) =>
              action.action === 'publish' ? withPublishPreflight(action) : action,
            ),
            FactCheckAction,
          ]
        : prev,
    badges: (prev, ctx) => (ctx.schemaType === 'article' ? [...prev, factCheckBadge] : prev),
  },
  plugins: [
    structureTool({structure}),
    // Vision is for querying with GROQ from inside the Studio
    // https://www.sanity.io/docs/the-vision-plugin
    visionTool({defaultApiVersion: apiVersion}),
    // Media browser for dataset image assets — adds a "Media" tab and
    // registers itself as an asset source for image fields
    media(),
  ],
})
