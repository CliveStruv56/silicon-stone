'use client';

import { loginToInoreader } from './inoreader-actions';
import { Rss } from 'lucide-react';

export function InoreaderLogin() {
    return (
        <form action={loginToInoreader}>
            <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-[#0099eb] hover:bg-[#0088d1] text-white rounded-lg font-medium transition-colors"
            >
                <Rss className="w-4 h-4" />
                Connect Inoreader
            </button>
        </form>
    );
}
