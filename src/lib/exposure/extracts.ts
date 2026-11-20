/**
 * Verbatim extracts the Exposure Check shows, from the pinned rule pack corpus.
 *
 * Each is a contiguous run of the consolidated text, with no ellipses and no
 * tidied punctuation. `extracts.test.ts` string-matches every one against the
 * corpus through `verifyCitation`, so a pack that changes the wording fails the
 * build rather than leaving a misquotation on screen.
 */
export const EXTRACTS = {
  'article-2-1-a': {
    article: '2',
    citation: 'Article 2(1)(a)',
    text: 'providers placing on the market or putting into service AI systems or placing on the market general-purpose AI models in the Union, irrespective of whether those providers are established or located within the Union or in a third country',
  },
  'article-2-1-c': {
    article: '2',
    citation: 'Article 2(1)(c)',
    text: 'providers and deployers of AI systems that have their place of establishment or are located in a third country, where the output produced by the AI system is used in the Union',
  },
  'article-4-1': {
    article: '4',
    citation: 'Article 4(1)',
    text: 'Providers and deployers of AI systems shall take measures to support the development of AI literacy of their staff and other persons dealing with the operation and use of AI systems on their behalf',
  },
  'article-6-1-a': {
    article: '6',
    citation: 'Article 6(1)(a)',
    text: 'the AI system is intended to be used as a safety component of a product, or the AI system is itself a product, covered by the Union harmonisation legislation listed in Annex I',
  },
  'article-6-2': {
    article: '6',
    citation: 'Article 6(2)',
    text: 'In addition to the high-risk AI systems referred to in paragraph 1, AI systems referred to in Annex III shall be considered to be high-risk.',
  },
  'article-22-1': {
    article: '22',
    citation: 'Article 22(1)',
    text: 'Prior to making their high-risk AI systems available on the Union market, providers established in third countries shall, by written mandate, appoint an authorised representative which is established in the Union.',
  },
  'article-50-1': {
    article: '50',
    citation: 'Article 50(1)',
    text: 'Providers shall ensure that AI systems intended to interact directly with natural persons are designed and developed in such a way that the natural persons concerned are informed that they are interacting with an AI system',
  },
  'article-50-2': {
    article: '50',
    citation: 'Article 50(2)',
    text: 'Providers of AI systems, including general-purpose AI systems, generating synthetic audio, image, video or text content, shall ensure that the outputs of the AI system are marked in a machine-readable format and detectable as artificially generated or manipulated.',
  },
  'article-99-6': {
    article: '99',
    citation: 'Article 99(6)',
    text: 'In the case of SMEs, including start-ups, each fine referred to in this Article shall be up to the percentages or amount referred to in paragraphs 3, 4 and 5, whichever thereof is lower.',
  },
  'article-99-6a': {
    article: '99',
    citation: 'Article 99(6a)',
    text: 'In the case of SMCs, each fine referred to in paragraphs 4 and 5 shall be up to the percentages or amount referred therein, whichever is lower.',
  },
  'article-111-3': {
    article: '111',
    citation: 'Article 111(3)',
    text: 'Providers of general-purpose AI models that have been placed on the market before 2 August 2025 shall take the necessary steps in order to comply with the obligations laid down in this Regulation by 2 August 2027.',
  },
} as const

export type ExtractId = keyof typeof EXTRACTS
