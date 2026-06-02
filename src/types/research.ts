export interface ResearchSource {
    title: string;
    url: string;
    snippet: string;
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
