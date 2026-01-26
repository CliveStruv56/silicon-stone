'use server';

import { saveContent } from "@/lib/api";
import { revalidatePath } from "next/cache";

interface ActionState {
    success: boolean;
    message: string;
}

export async function updateContent(_prevState: ActionState, formData: FormData): Promise<ActionState> {
    const path = formData.get('path') as string;
    const content = formData.get('content') as string;

    if (!path || !content) return { success: false, message: "Missing fields" };

    try {
        await saveContent(path, content);
        revalidatePath('/content');
        return { success: true, message: "Saved successfully" };
    } catch (e) {
        return { success: false, message: e instanceof Error ? e.message : 'Unknown error' };
    }
}
