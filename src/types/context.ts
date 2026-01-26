export interface Persona {
    role: string;
    organization_types: string[];
    example: string;
    key_concerns: string[];
    content_needs: string[];
    pain_point: string;
    why_she_follows?: string;
    why_he_follows?: string;
    why_they_follow?: string;
}

export interface ICP {
    profile_overview: {
        name: string;
        one_line_description: string;
    };
    personas: Record<string, Persona>;
}

export interface VoiceDNA {
    core_identity: {
        who_you_are: string;
        what_you_do: string;
        your_angle: string;
    };
    personality: {
        traits: string[];
        energy: string;
    };
    tone: {
        primary_tone: string;
        secondary_tone: string;
        how_formal: string;
    };
    signature_phrases: {
        opener_phrases: string[];
        transition_phrases: string[];
        emphasis_phrases: string[];
        closer_phrases: string[];
    };
    vocabulary: {
        keywords_2026: string[];
        use_these?: Record<string, string>;
    };
    voice_boundaries: {
        never_sounds_like: string[];
        never_uses_phrases: string[];
        avoids_topics: string[];
    };
    emotional_range: {
        primary_emotions: string[];
        how_you_show_enthusiasm: string;
        how_you_show_frustration: string;
    };
}

export interface BusinessProfile {
    positioning: {
        unique_angle: string;
        your_methodology: string;
    };
    content_focus: {
        content_pillars: Record<string, {
            description: string;
            categories: Array<{ name: string; slug: string; focus: string }>;
        }>;
        content_types: Array<{ name: string; purpose: string; }>;
    };
}
