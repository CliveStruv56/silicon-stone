import { type SchemaTypeDefinition } from 'sanity'
import { article } from './article'
import { author } from './author'
import { category } from './category'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [article, author, category],
}
