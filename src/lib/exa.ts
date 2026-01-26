import Exa from 'exa-js';

const API_KEY = process.env.EXA_API_KEY;

export async function searchExa(query: string) {
    if (!API_KEY) {
        console.warn("Exa API Key missing. Returning null.");
        return null;
    }

    const exa = new Exa(API_KEY);

    try {
        const result = await exa.searchAndContents(
            query,
            {
                type: "neural",
                useAutoprompt: true,
                numResults: 5,
                text: true,
                highlights: {
                    numSentences: 3,
                    highlightsPerUrl: 1
                }
            }
        );
        return result.results;
    } catch (e) {
        console.error("Exa Search Failed:", e);
        return null;
    }
}
