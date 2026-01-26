'use server';

import { listContentFiles, getContent, deleteLocalContent } from "@/lib/api";
import { createArticleInSanity, deleteArticleInSanity } from "@/lib/sanity";
import { revalidatePath } from "next/cache";

interface ActionState {
    success: boolean;
    message: string;
}

export async function syncContent(_prevState: ActionState, _formData: FormData): Promise<ActionState> {
    try {
        const files = await listContentFiles();
        let count = 0;

        for (const file of files) {
            // 1. Read Content
            const content = await getContent(file.path);
            const lines = content.split('\n');

            // 2. Extract Metadata (Naive Parsing similar to generate)
            let title = file.name;
            for (const line of lines) {
                if (line.startsWith('# ')) {
                    title = line.replace(/^#\s*/, '').trim();
                    break;
                }
            }

            let excerpt = "";
            for (const line of lines) {
                if (line.startsWith('**Subject Line:**') || line.startsWith('**Preview Text:**')) {
                    excerpt = line.replace(/\*\*.*:\*\*\s*/, '').trim();
                    break;
                }
            }
            if (!excerpt) excerpt = "Imported from local file.";

            // 3. Extract Persona (Naive check from content header or file path or default)
            // We look for **Persona:** ... in text
            let persona = "global-citizen"; // default
            for (const line of lines) {
                if (line.includes('**Persona:**')) {
                    const pText = line.split('|')[0].replace('**Persona:**', '').trim().toLowerCase();
                    if (pText.includes('clara')) persona = 'compliance-clara';
                    if (pText.includes('ian')) persona = 'industrial-ian';
                    if (pText.includes('sofia')) persona = 'sovereign-sofia';
                    if (pText.includes('robert')) persona = 'remote-robert';
                    break;
                }
            }

            // 4. Deterministic ID based on filename (which includes date and slug)
            // Sanity IDs should be valid strings. We can use a prefix.
            // Filename: 2026-01-22-slug.md
            const fileSlug = file.path.split('/').pop()?.replace('.md', '') || 'unknown';
            const sanityId = `draft.${fileSlug}`;

            // 5. Sync
            await createArticleInSanity({
                id: sanityId,
                title,
                slug: fileSlug, // Matches the file slug exactly
                excerpt,
                body: content,
                contentType: file.type === 'draft' ? 'guide' : (file.type as 'signal' | 'deepdive' | 'guide'), // 'draft' maps to 'guide' or whatever default
                persona
            });
            count++;
        }

        revalidatePath('/content');
        return { success: true, message: `Synced ${count} files to Sanity.` };

    } catch (e) {
        console.error(e);
        return { success: false, message: `Sync failed: ${e instanceof Error ? e.message : 'Unknown error'}` };
    }
}

export async function deleteDraft(_prevState: ActionState, formData: FormData): Promise<ActionState> {
    const path = formData.get('path') as string;
    if (!path) return { success: false, message: "Missing path" };

    try {
        // 1. Delete Local
        await deleteLocalContent(path);

        // 2. Delete from Sanity
        // path is like "content/drafts/2026-01-22-slug.md"
        // we need to extract the slug part for the ID: "2026-01-22-slug"
        const fileSlug = path.split('/').pop()?.replace('.md', '') || '';
        if (fileSlug) {
            await deleteArticleInSanity(fileSlug);
        }

        revalidatePath('/content');
        return { success: true, message: "Deleted successfully" };
    } catch (e) {
        console.error(e);
        return { success: false, message: `Delete failed: ${e instanceof Error ? e.message : 'Unknown error'}` };
    }
}
