/**
 * Turns a pasted story idea into the fields `/create` already takes.
 *
 * **The problem it removes.** Story ideas reach this environment only because
 * the owner types them in: an external agent emails a shortlist, one is chosen,
 * and its substance is re-keyed into *Primary Topic* and *Context / Brief*.
 * Everything downstream — research, five model calls, the guards, the draft —
 * is already automated. The single human transcription step sits at the very
 * front, re-keying text that already exists.
 *
 * **Why a parser and not a model call.** `/create` already spends most of its
 * 300-second budget on five sequential model calls against a shared, metered
 * key. A sixth to split one paragraph in two would cost real money and real
 * latency to do something a rule does adequately — and unlike a model, a rule
 * fails the same way twice. Everything it produces lands in editable fields, so
 * a bad split costs a keystroke rather than a wrong article.
 *
 * **Nothing is dropped silently.** Anything the parser cannot place goes into
 * the brief rather than being discarded, and `notes` says what it did so the
 * operator can see the decision rather than infer it from the result.
 *
 * **Provenance comes for free.** Wave 2 made a research run durable and gave it
 * a `brief` field, and the article links to its run. Because the idea's own text
 * *becomes* the brief, an article seeded this way already records what it was
 * written from — no new field, no second mechanism. See
 * `docs/siliconstone-knowledge-ideas-corpus-brief.md`, design B1.
 */

/** The formats `/create` offers, as the form's own values. */
export type IdeaFormat = 'pulse' | 'signal' | 'deep_dive' | 'guide' | 'youtube' | 'research'

export interface ParsedIdea {
  topic: string
  brief: string
  /** Only when the idea names one. The form's current choice wins otherwise. */
  format?: IdeaFormat
  /** What the parser did, in the operator's words. */
  notes: string[]
}

/**
 * How far into the text a headline boundary is still a headline boundary.
 *
 * The ideas this is built for run 153–1,163 characters with a median of 319,
 * and their opening clause is consistently under 200. Past this, a "boundary"
 * is just the first full stop of a long paragraph and splitting there produces
 * a topic nobody would have typed.
 */
const HEADLINE_WINDOW = 240

/** A topic line long enough to be useless is worse than a truncated one. */
const TOPIC_MAX = 180

/** Labelled lines the ideas carry, mapped to what they mean here. */
const LABELS: Record<string, 'topic' | 'brief' | 'format' | 'sources' | 'ignore'> = {
  headline: 'topic',
  title: 'topic',
  topic: 'topic',
  body: 'brief',
  text: 'brief',
  brief: 'brief',
  format: 'format',
  source: 'sources',
  sources: 'sources',
  // Present in the source material, meaningless here: the agent's own
  // confidence, its id, its date, and a category line the extraction pass
  // decides for itself further down the pipeline.
  score: 'ignore',
  id: 'ignore',
  date: 'ignore',
  slug: 'ignore',
  category: 'ignore',
  categories: 'ignore',
  status: 'ignore',
}

const FORMATS: Record<string, IdeaFormat> = {
  pulse: 'pulse',
  signal: 'signal',
  'deep dive': 'deep_dive',
  deepdive: 'deep_dive',
  deep_dive: 'deep_dive',
  guide: 'guide',
  youtube: 'youtube',
  'youtube script': 'youtube',
  research: 'research',
  'research only': 'research',
}

/** Trim, collapse runs of blank lines, normalise line endings and dash forms. */
function tidy(raw: string): string {
  return raw
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * The first headline boundary within the window, or -1.
 *
 * Two shapes appear in the material and either may come first, so the earlier
 * one wins — it yields the tighter headline, which is what a person would have
 * typed. An em-dash separates headline from body in one house style; a full
 * stop before "Why now:" does it in the other.
 */
function headlineBoundary(text: string): { at: number; skip: number } | null {
  const window = text.slice(0, HEADLINE_WINDOW)
  const dash = window.search(/\s[—–]\s/)
  // A sentence end, but not one inside "U.S." or a decimal, and not so early
  // that the "headline" is a fragment.
  const stop = window.slice(20).search(/[.:?!]\s+(?=[A-Z“"'(])/)
  const stopAt = stop === -1 ? -1 : stop + 20

  if (dash !== -1 && (stopAt === -1 || dash < stopAt)) return { at: dash, skip: 3 }
  if (stopAt !== -1) return { at: stopAt, skip: 1 }
  return null
}

/** Cut at a word boundary rather than mid-word. */
function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,;:—–-]\s*$/, '')
}

export function parseIdea(raw: string): ParsedIdea {
  const text = tidy(raw)
  if (!text) return { topic: '', brief: '', notes: [] }

  const notes: string[] = []
  const labelled: Partial<Record<'topic' | 'brief' | 'format' | 'sources', string>> = {}
  const prose: string[] = []

  for (const line of text.split('\n')) {
    const match = line.match(/^\s*([A-Za-z ]{2,20})\s*[::]\s*(.+)$/)
    const key = match ? match[1].trim().toLowerCase() : null
    const kind = key ? LABELS[key] : undefined
    if (match && kind) {
      if (kind !== 'ignore' && !labelled[kind]) labelled[kind] = match[2].trim()
      continue
    }
    prose.push(line)
  }

  const body = tidy(prose.join('\n'))

  let topic = labelled.topic ?? ''
  let brief = labelled.brief ?? ''

  if (topic && !brief) {
    // An explicit headline plus loose prose: the prose is all brief.
    brief = body
    if (body) notes.push('Took the headline from its label and the rest as the brief.')
    else notes.push('Took the headline from its label.')
  } else if (!topic) {
    const boundary = headlineBoundary(body)
    if (boundary) {
      topic = body.slice(0, boundary.at).trim()
      brief = tidy(body.slice(boundary.at + boundary.skip))
      notes.push('Split the opening clause into the topic and kept the rest as the brief.')
    } else if (body.length <= TOPIC_MAX) {
      topic = body
      notes.push('Short enough to be a topic on its own — nothing left for the brief.')
    } else {
      topic = truncate(body, 140)
      brief = body
      notes.push(
        'No headline boundary found, so the topic is the opening and the whole idea is the brief. Trim the topic if it reads long.',
      )
    }
  }

  if (topic.length > TOPIC_MAX) {
    topic = truncate(topic, TOPIC_MAX)
    notes.push('Shortened the topic line; the full text is still in the brief.')
  }

  // Leads the research pass can actually use. Appended rather than dropped,
  // and labelled so the model is not left to guess what the names are.
  if (labelled.sources) {
    brief = `${brief}${brief ? '\n\n' : ''}Sources the idea cited: ${labelled.sources}`
    notes.push('Kept the idea’s own sources in the brief as leads for the research pass.')
  }

  let format: IdeaFormat | undefined
  if (labelled.format) {
    format = FORMATS[labelled.format.trim().toLowerCase()]
    if (format) notes.push(`The idea asked for a ${labelled.format.trim()}.`)
    else notes.push(`Ignored an unrecognised format: “${labelled.format.trim()}”.`)
  }

  return { topic: topic.trim(), brief: brief.trim(), ...(format ? { format } : {}), notes }
}
