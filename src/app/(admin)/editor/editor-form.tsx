'use client';

import { useActionState, useState, useEffect, useRef } from 'react';
import { updateContent } from './actions';
import { Save, Loader2, Check } from 'lucide-react';

const INITIAL_STATE = { success: false, message: '' };

export function EditorForm({ initialContent, path }: { initialContent: string, path: string }) {
    const [content, setContent] = useState(initialContent);
    const [state, formAction, isPending] = useActionState(updateContent, INITIAL_STATE);
    const [showSaved, setShowSaved] = useState(false);
    const prevSuccessRef = useRef(state.success);

    // Show "Saved!" toast briefly on success
    useEffect(() => {
        if (state.success && !prevSuccessRef.current) {
            prevSuccessRef.current = state.success;
            requestAnimationFrame(() => {
                setShowSaved(true);
            });
            const timer = setTimeout(() => setShowSaved(false), 2000);
            return () => clearTimeout(timer);
        }
        prevSuccessRef.current = state.success;
    }, [state.success]);

    // Handle Cmd+S
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 's') {
            e.preventDefault();
            // Trigger submit programmatically requires a ref to the form or button, 
            // but strictly we can just rely on the user clicking for MVP 
            // or use requestSubmit() if we had a ref.
            const form = e.currentTarget.closest('form');
            form?.requestSubmit();
        }
    };

    return (
        <form action={formAction} className="h-full flex flex-col relative">
            <input type="hidden" name="path" value={path} />

            <textarea
                name="content"
                className="flex-1 w-full h-full bg-transparent p-8 outline-none font-mono text-sm leading-relaxed resize-none text-foreground/90 placeholder:text-muted-foreground/30"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
            />

            {/* Floating Action Bar */}
            <div className="absolute bottom-6 right-6 flex gap-2">
                {state.success && showSaved && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 bg-emerald-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-bold">
                        <Check className="w-4 h-4" /> Saved
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isPending}
                    className="bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-lg hover:shadow-xl hover:bg-blue-600 transition-all font-bold flex items-center gap-2 disabled:opacity-50"
                >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isPending ? "Saving..." : "Save Draft"}
                </button>
            </div>
        </form>
    );
}
