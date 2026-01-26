'use client';

import { checkInoreaderConnection } from './check-connection';
import { Rss, CheckCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { loginToInoreader } from './inoreader-actions';

export function InoreaderStatus() {
    const [status, setStatus] = useState<{ connected: boolean; user: string | null; loading: boolean }>({
        connected: false,
        user: null,
        loading: true
    });

    useEffect(() => {
        checkInoreaderConnection().then(res => {
            setStatus({ ...res, loading: false });
        });
    }, []);

    if (status.loading) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-lg font-medium text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Checking...
            </div>
        );
    }

    if (status.connected) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-lg font-medium text-sm">
                <CheckCircle className="w-4 h-4" />
                Connected as {status.user}
            </div>
        );
    }

    return (
        <form action={loginToInoreader}>
            <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-[#0099eb] hover:bg-[#0088d1] text-white rounded-lg font-medium transition-colors text-sm"
            >
                <Rss className="w-4 h-4" />
                Connect Inoreader
            </button>
        </form>
    );
}
