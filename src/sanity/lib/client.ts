import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '../env'
import { SANITY_TIMEOUT_MS } from '@/lib/timeouts'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: process.env.NODE_ENV === 'production', // Set to false if statically generating pages, using ISR or tag-based revalidation
  timeout: SANITY_TIMEOUT_MS,
})
