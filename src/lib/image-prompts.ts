import { callClaude, CLAUDE_MODEL } from './anthropic'
import { extractArticleText } from './embeddings'
import { writeClient } from './sanity'

/** Minimal portable-text block — matches the shape extractArticleText reads. */
type PortableTextBlock = {
  _type?: string
  children?: { text?: string }[]
}

/**
 * Generates two short "what to depict" prompts for the article's main image.
 *
 * The user feeds one of these into an external image agent (Hyper Agent) that
 * already owns the house illustration style — isometric, diagrammatic, dark
 * backgrounds with glowing circuit traces. So these prompts describe the
 * SUBJECT and central visual metaphor only; they deliberately avoid style,
 * medium, colour, and rendering instructions, which the agent supplies.
 */

const ARTICLE_PROJECTION = `{
  _id, _type, title, stoneTruth, excerpt, body,
  actionableInsights, methodologyPillars, contentType
}`

/** Cap the body we send — the opening is plenty to fix the subject. */
const ARTICLE_TEXT_CHARS = 6000

export interface ImagePromptArticle {
  _id: string
  _type: string
  title?: string
  stoneTruth?: string
  excerpt?: string
  body?: PortableTextBlock[]
  actionableInsights?: string[]
  methodologyPillars?: string[]
  contentType?: string
}

/** Resolve the draft (preferred) or published article for a Studio document id. */
export async function resolveImagePromptTarget(
  documentId: string,
): Promise<{ targetId: string; article: ImagePromptArticle } | null> {
  const baseId = documentId.replace(/^drafts\./, '')
  const draftId = `drafts.${baseId}`
  // perspective: 'raw' — recent apiVersions default to 'published', which would
  // hide the drafts.* variant we usually want to read.
  const docs: ImagePromptArticle[] = await writeClient.fetch(
    `*[_id in [$draftId, $baseId] && _type == "article"] ${ARTICLE_PROJECTION}`,
    { draftId, baseId },
    { perspective: 'raw' },
  )
  const article = docs.find((d) => d._id === draftId) ?? docs.find((d) => d._id === baseId)
  return article ? { targetId: article._id, article } : null
}

const SYSTEM = `You write image-generation prompts for Silicon & Stone, an intelligence publication on "Forensic Technopolitics" (the collision of technology, power, regulation and supply chains).

Each article needs a striking lead illustration. The illustration is produced by a separate image agent that ALREADY OWNS the house visual style — isometric, diagrammatic 3D scenes on dark backgrounds, with glowing circuit traces, stone/marble platforms, glass domes and warning markers. You must NOT describe style, medium, colour palette, lighting, camera, or rendering. Your job is only to decide WHAT THE IMAGE SHOULD DEPICT.

Write TWO distinct prompts. Each:
- is one or two sentences describing a single clear central visual metaphor for THIS article's specific subject;
- is concrete and depictable (objects, structures, relationships you could actually draw), not abstract sloganeering;
- is striking and a little uncanny, while staying legible at a glance;
- captures the article's actual argument or tension, not a generic "technology" image;
- offers a genuinely different angle from the other prompt (e.g. one literal/infrastructural, one conceptual/systemic).

Do not name real logos, brands, or recognisable faces. UK English. No style words.

Return STRICT JSON only, no prose, in exactly this shape:
{"prompts": ["first depiction prompt", "second depiction prompt"]}`

function parsePrompts(raw: string): string[] {
  // Tolerate code fences or stray prose around the JSON object.
  const match = raw.match(/\{[\s\S]*\}/)
  const text = match ? match[0] : raw
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Image-prompt model did not return valid JSON')
  }
  const prompts = (parsed as { prompts?: unknown }).prompts
  if (!Array.isArray(prompts)) {
    throw new Error('Image-prompt response is missing a prompts array')
  }
  const cleaned = prompts
    .filter((p): p is string => typeof p === 'string')
    .map((p) => p.trim())
    .filter(Boolean)
  if (cleaned.length < 2) {
    throw new Error('Image-prompt response did not contain two prompts')
  }
  return cleaned.slice(0, 2)
}

/**
 * Generate two prompts for the given article and write them onto
 * imagePrompts.prompts (plus generation metadata). Returns the prompts so the
 * caller can echo them back to the client without waiting on live sync.
 */
export async function generateImagePrompts(
  targetId: string,
  article: ImagePromptArticle,
): Promise<string[]> {
  const text = extractArticleText(article).slice(0, ARTICLE_TEXT_CHARS)
  const user = `Propose two image prompts for this article.

TITLE: ${article.title ?? '(untitled)'}
${article.stoneTruth ? `BOTTOM LINE: ${article.stoneTruth}\n` : ''}${article.excerpt ? `EXCERPT: ${article.excerpt}\n` : ''}
ARTICLE TEXT:
${text}`

  const raw = await callClaude(SYSTEM, user, 0.8, 1024)
  const prompts = parsePrompts(raw)

  await writeClient
    .patch(targetId)
    .set({
      imagePrompts: {
        prompts,
        generatedAt: new Date().toISOString(),
        model: CLAUDE_MODEL,
      },
    })
    .commit()

  return prompts
}
