'use client';

import { useState } from 'react';
import { FileText, Loader2, ArrowRight } from 'lucide-react';
import { createDraftFromResearch } from './actions';
import { useRouter } from 'next/navigation';

import { ResearchSource } from '@/types/research';

interface DraftButtonProps {
    summary: string;
    topic: string;
    sources: ResearchSource[];
}

export function DraftButton({ summary, topic, sources }: DraftButtonProps) {
    const [isCreating, setIsCreating] = useState(false);
    const router = useRouter();

    async function handleCreate() {
        setIsCreating(true);
        try {
            const result = await createDraftFromResearch(summary, topic, sources);
            if (result.success && result.id) {
                // Redirect to Sanity Studio to edit the new draft
                router.push(`/studio/intent/edit/id=${result.id};type=article`);
            } else {
                alert(result.message || "Failed to create draft");
                setIsCreating(false);
            }
        } catch (e) {
            console.error(e);
            setIsCreating(false);
            alert("Error creating draft");
        }
    }

    return (
        <button
            onClick={handleCreate}
            disabled={isCreating}
            className="flex items-center gap-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-purple-500/20"
        >
            {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <FileText className="w-4 h-4" />
            )}
            {isCreating ? "Creating Draft..." : "Create Draft"}
            {!isCreating && <ArrowRight className="w-3 h-3 ml-1 opacity-50" />}
        </button>
    );
}
