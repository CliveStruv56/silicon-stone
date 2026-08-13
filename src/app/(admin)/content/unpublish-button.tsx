'use client';

import { useActionState, useState } from 'react';
import { unpublishArticle } from './actions';
import { EyeOff, Loader2 } from 'lucide-react';

/**
 * Pulls a published article back to draft. Two-step inline confirm rather than
 * window.confirm() so the whole flow stays inside the page (and stays testable).
 * Nothing is deleted — the article and every field on it survive as a draft, so
 * the confirm copy says so plainly.
 */
export function UnpublishButton({ id }: { id: string }) {
    const [state, formAction, isPending] = useActionState(unpublishArticle, {
        success: false,
        message: '',
    });
    const [armed, setArmed] = useState(false);

    if (!armed) {
        return (
            <div className="flex flex-col items-end gap-1 shrink-0">
                <button
                    type="button"
                    onClick={() => setArmed(true)}
                    className="text-sm font-medium hover:text-amber-500 flex items-center gap-1 opacity-70 hover:opacity-100 transition-colors whitespace-nowrap"
                    title="Remove from the public site and keep it as a draft"
                >
                    <EyeOff className="w-3 h-3" /> Unpublish
                </button>
                {!state.success && state.message && (
                    <span className="text-[11px] text-red-500 max-w-xs text-right">{state.message}</span>
                )}
            </div>
        );
    }

    return (
        <form action={formAction} className="flex items-center gap-2 shrink-0">
            <input type="hidden" name="id" value={id} />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
                Remove from the public site?
            </span>
            <button
                type="submit"
                disabled={isPending}
                title="The article and every field on it are kept as a draft — nothing is deleted."
                className="text-xs font-bold px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 transition-colors disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
            >
                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <EyeOff className="w-3 h-3" />}
                Unpublish
            </button>
            <button
                type="button"
                onClick={() => setArmed(false)}
                disabled={isPending}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
                Cancel
            </button>
        </form>
    );
}
