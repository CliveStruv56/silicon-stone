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
}
