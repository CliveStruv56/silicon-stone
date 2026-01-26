'use client';

import { useActionState } from 'react';
import { updatePersona } from '../actions';
import { Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Persona } from '@/types/context';

const INITIAL_STATE = { success: false, message: '' };

export function EditPersonaForm({ originalKey, initialData }: { originalKey: string, initialData: Persona }) {
    const [state, formAction, isPending] = useActionState(updatePersona, INITIAL_STATE);

    return (
        <form action={formAction} className="space-y-6">
            <input type="hidden" name="originalKey" value={originalKey} />

            <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Role Title</label>
                <input
                    name="role"
                    defaultValue={initialData.role}
                    className="w-full bg-background border border-border rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500/50"
                    required
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Primary Pain Point</label>
                <textarea
                    name="painPoint"
                    defaultValue={initialData.pain_point}
                    className="w-full bg-background border border-border rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[100px]"
                    required
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Representative Example</label>
                <input
                    name="example"
                    defaultValue={initialData.example}
                    className="w-full bg-background border border-border rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500/50"
                    required
                />
            </div>

            <div className="pt-4 flex items-center gap-4">
                <button
                    type="submit"
                    disabled={isPending}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                </button>

                {state.success && (
                    <div className="text-emerald-500 flex items-center gap-2 text-sm font-medium animate-in fade-in">
                        <CheckCircle className="w-4 h-4" /> {state.message}
                    </div>
                )}

                {state.success === false && state.message && (
                    <div className="text-red-500 flex items-center gap-2 text-sm font-medium animate-in fade-in">
                        <AlertCircle className="w-4 h-4" /> {state.message}
                    </div>
                )}
            </div>
        </form>
    );
}
