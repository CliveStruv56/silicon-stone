'use client';

import { useActionState } from 'react';
import { syncContent } from './actions';
import { RefreshCw, Check, AlertCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const INITIAL_STATE = { success: false, message: '' };

export function SyncButton() {
    const [state, formAction, isPending] = useActionState(syncContent, INITIAL_STATE);
    const [showStatus, setShowStatus] = useState(false);
    const prevMessageRef = useRef(state.message);

    useEffect(() => {
        // Only react when message changes (not on mount)
        if (state.message && state.message !== prevMessageRef.current) {
            prevMessageRef.current = state.message;
            // Use requestAnimationFrame to avoid synchronous setState in effect
            requestAnimationFrame(() => {
                setShowStatus(true);
            });

            const timer = setTimeout(() => setShowStatus(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [state.message]);

    return (
        <form action={formAction} className="relative">
            <button
                type="submit"
                disabled={isPending}
                className="bg-muted text-muted-foreground hover:bg-muted/80 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50 border border-border"
                title="Sync all files to Sanity CMS"
            >
                <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
                {isPending ? 'Syncing...' : 'Sync to Sanity'}
            </button>

            {showStatus && (
                <div className={`absolute top-full mt-2 right-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg z-50 ${state.success ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    {state.success ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {state.message}
                </div>
            )}
        </form>
    );
}
