'use server';

import { saveContent } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

interface ActionState {
    success: boolean;
    message: string;
}

export async function updateContent(_prevState: ActionState, formData: FormData): Promise<ActionState> {
    const filePath = formData.get('path') as string;
    const content = formData.get('content') as string;

    if (!filePath || !content) {
        return { success: false, message: "Missing fields" };
    }

    try {
        await requireAdmin();
        await saveContent(filePath, content);
        revalidatePath('/content');
        return { success: true, message: "Saved successfully" };
    } catch (e) {
        return { success: false, message: e instanceof Error ? e.message : 'Unknown error' };
    }
}
