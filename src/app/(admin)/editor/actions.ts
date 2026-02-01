'use server';

import { saveContent } from "@/lib/api";
import { revalidatePath } from "next/cache";
import path from "path";

interface ActionState {
    success: boolean;
    message: string;
}

// Allowed directories for content editing
const ALLOWED_DIRECTORIES = [
    'content/drafts',
    'content/substack/signals',
    'content/substack/deep-dives',
    'content/social/linkedin',
    'knowledge',
];

/**
 * Validates that a path is safe and within allowed directories.
 * Prevents directory traversal attacks (e.g., ../../etc/passwd)
 */
function isPathSafe(relativePath: string): boolean {
    // Normalize the path to resolve any ../ or ./ segments
    const normalizedPath = path.normalize(relativePath);

    // Check for path traversal attempts
    if (normalizedPath.includes('..') || normalizedPath.startsWith('/') || normalizedPath.startsWith('\\')) {
        return false;
    }

    // Check if path starts with an allowed directory
    const isAllowed = ALLOWED_DIRECTORIES.some(dir =>
        normalizedPath.startsWith(dir + '/') || normalizedPath.startsWith(dir + '\\')
    );

    if (!isAllowed) {
        return false;
    }

    // Only allow markdown and json files
    const ext = path.extname(normalizedPath).toLowerCase();
    if (!['.md', '.json', '.txt'].includes(ext)) {
        return false;
    }

    return true;
}

export async function updateContent(_prevState: ActionState, formData: FormData): Promise<ActionState> {
    const filePath = formData.get('path') as string;
    const content = formData.get('content') as string;

    if (!filePath || !content) {
        return { success: false, message: "Missing fields" };
    }

    // Validate path to prevent directory traversal
    if (!isPathSafe(filePath)) {
        console.error(`Blocked path traversal attempt: ${filePath}`);
        return { success: false, message: "Invalid file path" };
    }

    try {
        await saveContent(filePath, content);
        revalidatePath('/content');
        return { success: true, message: "Saved successfully" };
    } catch (e) {
        return { success: false, message: e instanceof Error ? e.message : 'Unknown error' };
    }
}
