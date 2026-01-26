'use server';

import { getUserInfo } from "@/lib/inoreader";
import { cookies } from "next/headers";

export async function checkInoreaderConnection() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('inoreader_access_token')?.value;

        if (!token) {
            return { connected: false, user: null };
        }

        const userInfo = await getUserInfo(token);
        return { connected: true, user: userInfo.userName || userInfo.userId };
    } catch (e) {
        console.error(e);
        return { connected: false, user: null };
    }
}
