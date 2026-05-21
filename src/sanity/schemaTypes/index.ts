import { type SchemaTypeDefinition } from 'sanity'
import { article } from './article'
import { author } from './author'
import { category } from './category'
import { persona } from './persona'
import { siteSettings } from './siteSettings'
import { youtubeScript } from './youtubeScript'
import { assetCollection } from './assetCollection'
import { libraryImage } from './libraryImage'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    article,
    author,
    category,
    persona,
    siteSettings,
    youtubeScript,
    assetCollection,
    libraryImage,
  ],
}
