'use server';

import { getAuthUrl } from "@/lib/inoreader";
import { redirect } from "next/navigation";

export async function loginToInoreader() {
    const state = Math.random().toString(36).substring(7); // Simple state for CSRF
    const url = await getAuthUrl(state);
    redirect(url);
}
