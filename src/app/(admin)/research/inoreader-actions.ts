'use server';

import { getAuthUrl } from "@/lib/inoreader";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import crypto from "crypto";

export async function loginToInoreader() {
    // Generate cryptographically secure state token for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');

    // Store state in an httpOnly cookie to validate on callback
    const cookieStore = await cookies();
    cookieStore.set('inoreader-oauth-state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 10, // 10 minutes
        path: '/',
    });

    const url = await getAuthUrl(state);
    redirect(url);
}
