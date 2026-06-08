// Querying with "sanityFetch" will keep content automatically updated
// Before using it, import and render "<SanityLive />" in your layout, see
// https://github.com/sanity-io/next-sanity#live-content-api for more information.
import { defineLive } from "next-sanity/live";
import { apiVersion } from '../env'
import { client } from './client'

const token = process.env.SANITY_API_READ_TOKEN

export const { sanityFetch, SanityLive } = defineLive({
  // Use the project-wide apiVersion (env-driven) rather than a separately pinned
  // one, so live queries run against the same API contract as everything else.
  client: client.withConfig({ apiVersion }),
  serverToken: token,
});
