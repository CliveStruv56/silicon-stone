import { type SchemaTypeDefinition } from 'sanity'
import { article } from './article'
import { series } from './series'
import { author } from './author'
import { category } from './category'
import { product } from './product'
import { persona } from './persona'
import { siteSettings } from './siteSettings'
import { youtubeScript } from './youtubeScript'
import { assetCollection } from './assetCollection'
import { libraryImage } from './libraryImage'
import { knowledgeCandidate } from './knowledgeCandidate'
import { knowledgeSource } from './knowledgeSource'
import { knowledgeItem } from './knowledgeItem'
import { knowledgeTopic } from './knowledgeTopic'
import { researchRun } from './researchRun'
import { glossaryTerm } from './glossaryTerm'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    article,
    series,
    author,
    category,
    product,
    persona,
    siteSettings,
    youtubeScript,
    assetCollection,
    libraryImage,
    knowledgeSource,
    knowledgeItem,
    knowledgeTopic,
    researchRun,
    // Legacy. Nothing new writes one; the migration reads them.
    knowledgeCandidate,
    glossaryTerm,
  ],
}
