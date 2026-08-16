export interface ResearchSource {
    title: string;
    url: string;
    snippet: string;
    /**
     * Publication date as the search reported it, ISO-ish and not normalised —
     * upstream formats vary and inventing precision would be worse than none.
     * Optional because an agentic report's inline links carry no date.
     *
     * Load-bearing: without it the drafting model cannot tell a 2019 source
     * from last week's, while house style demands exact dates and explicit
     * status labelling (current law / proposal / guidance).
     */
    publishedDate?: string;
}

export interface ContextSuggestion {
    keywords: string[];
    pain_points: string[];
}

export interface ResearchResult {
    summary: string;
    sources: ResearchSource[];
    suggestedContext: ContextSuggestion;
    /**
     * Full text of an agentic Exa Research run. Only populated for Deep Dives,
     * where it is passed verbatim to the writer as primary material.
     */
    deepReport?: string;
}
