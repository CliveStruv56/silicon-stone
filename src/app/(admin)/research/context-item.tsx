'use client';

import { useState } from 'react';
import { PlusCircle, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { updateContext } from '../context/actions';

interface ContextItemProps {
    type: 'keyword' | 'pain_point';
    value: string;
}

export function ContextItemButton({ type, value }: ContextItemProps) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    async function handleClick() {
        setStatus('loading');
        try {
            const result = await updateContext(type, value);
            if (result.success) {
                setStatus('success');
            } else {
                setStatus('error');
            }
        } catch {
            setStatus('error');
        }
    }

    if (status === 'success') {
        return (
            <span className="text-green-500 flex items-center gap-1 text-xs">
                <CheckCircle className="w-3 h-3" /> Added
            </span>
        );
    }

    if (status === 'error') {
        return (
            <button onClick={handleClick} className="text-red-500 flex items-center gap-1 text-xs hover:underline">
                <AlertCircle className="w-3 h-3" /> Retry
            </button>
        );
    }

    if (type === 'keyword') {
        return (
            <button
                onClick={handleClick}
                disabled={status === 'loading'}
                className="ml-1 px-1.5 py-0.5 hover:bg-blue-500/20 text-blue-400 text-xs rounded transition-colors disabled:opacity-50"
                title="Add to Knowledge Base"
            >
                {status === 'loading' ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlusCircle className="w-3 h-3" />}
            </button>
        );
    }

    // Pain point style (text button)
    return (
        <button
            onClick={handleClick}
            disabled={status === 'loading'}
            className="ml-auto text-xs text-blue-400 hover:text-blue-300 hover:underline disabled:opacity-50 flex items-center gap-1"
        >
            {status === 'loading' && <Loader2 className="w-3 h-3 animate-spin" />}
            {status === 'loading' ? 'Adding...' : 'Add to ICP'}
        </button>
    );
}
