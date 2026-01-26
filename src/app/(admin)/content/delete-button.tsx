'use client';

import { useActionState } from 'react';
import { deleteDraft } from './actions';
import { Trash2, Loader2 } from 'lucide-react';

export function DeleteButton({ path }: { path: string }) {
    const [, formAction, isPending] = useActionState(deleteDraft, { success: false, message: '' });

    return (
        <form action={formAction} onClick={(e) => e.stopPropagation()}>
            <input type="hidden" name="path" value={path} />
            <button
                type="submit"
                disabled={isPending}
                className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Delete from Disk & Sanity"
                onClick={(e) => {
                    if (!confirm("Are you sure? This deletes the local file AND the Sanity draft.")) {
                        e.preventDefault();
                    }
                }}
            >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
        </form>
    );
}
