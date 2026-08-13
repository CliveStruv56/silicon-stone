'use server';

import { listContentFiles, getContent, deleteLocalContent, validateManagedContentPath } from "@/lib/api";
import { createArticleInSanity, deleteArticleInSanity, writeClient } from "@/lib/sanity";
import { getPineconeIndex } from "@/lib/pinecone";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath, revalidateTag } from "next/cache";

interface ActionState {
    success: boolean;
    message: string;
}

export async function syncContent(_prevState: ActionState, _formData: FormData): Promise<ActionState> {
    void _prevState;
    void _formData;

    try {
        await requireAdmin();
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
        await requireAdmin();
        const safePath = validateManagedContentPath(path);
        // 1. Delete Local
        await deleteLocalContent(safePath);

        // 2. Delete from Sanity
        // path is like "content/drafts/2026-01-22-slug.md"
        // we need to extract the slug part for the ID: "2026-01-22-slug"
        const fileSlug = safePath.split('/').pop()?.replace('.md', '') || '';
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

/** Sanity document ids are restricted to this alphabet — anything else is not ours. */
const SANITY_ID = /^[a-zA-Z0-9._-]+$/;

/**
 * Pull a published article back to draft without losing anything.
 *
 * Reproduces Sanity's own unpublish semantics — copy the published document to
 * its `drafts.` twin, then delete the published one — plus the two things the
 * Studio action does not do: drop the Pinecone vector so the piece stops
 * surfacing in related-articles and semantic search, and invalidate the Next
 * caches that serve the public site.
 *
 * The reference sweep in step 2 is the load-bearing part. `relatedArticles`
 * holds STRONG references that the vectorize webhook writes back automatically,
 * and Sanity refuses to delete a document that others strongly reference — so
 * on any well-linked article the plain delete (and Studio's own Unpublish)
 * fails outright. Unsetting the incoming refs in the same transaction also
 * spares readers a Related card pointing at a 404.
 */
export async function unpublishArticle(_prevState: ActionState, formData: FormData): Promise<ActionState> {
    const id = String(formData.get('id') ?? '').trim();
    if (!id) return { success: false, message: "Missing article id" };
    if (id.startsWith('drafts.')) return { success: false, message: "That article is already a draft." };
    if (!SANITY_ID.test(id)) return { success: false, message: "Invalid article id" };

    try {
        await requireAdmin();

        // perspective: 'raw' — on recent apiVersions the client defaults to the
        // 'published' perspective, and we need the document exactly as stored.
        const published = await writeClient.fetch<Record<string, unknown> | null>(
            `*[_id == $id][0]`,
            { id },
            { perspective: 'raw' },
        );
        if (!published) return { success: false, message: "Published article not found." };

        // Drafts count too — a strong reference from any document blocks the delete.
        const referrerIds = await writeClient.fetch<string[]>(
            `*[references($id)]._id`,
            { id },
            { perspective: 'raw' },
        );

        const draftDoc: Record<string, unknown> = { ...published, _id: `drafts.${id}` };
        delete draftDoc._rev;
        delete draftDoc._createdAt;
        delete draftDoc._updatedAt;

        const tx = writeClient.transaction();
        for (const refId of referrerIds) {
            tx.patch(refId, { unset: [`relatedArticles[_ref=="${id}"]`] });
        }
        // createIfNotExists, never createOrReplace: if a draft already exists it
        // holds newer edits than the published copy and must win.
        tx.createIfNotExists(draftDoc as unknown as Parameters<typeof tx.createIfNotExists>[0]);
        tx.delete(id);
        await tx.commit();

        // Best-effort, and idempotent with the vectorize webhook's own delete
        // branch. A missing Pinecone config must not strand a half-done unpublish.
        try {
            await getPineconeIndex().deleteOne({ id });
        } catch (e) {
            console.error('[unpublish] Pinecone vector delete failed:', e);
        }

        // Same surfaces the Sanity revalidate webhook invalidates on publish.
        const slug = (published as { slug?: { current?: string } }).slug?.current;
        revalidateTag('sanity');
        revalidatePath('/');
        revalidatePath('/intelligence');
        if (slug) revalidatePath(`/analysis/${slug}`);
        revalidatePath('/content');

        return { success: true, message: "Unpublished — the article is now a draft." };
    } catch (e) {
        console.error('[unpublish] Failed:', e);
        return { success: false, message: `Unpublish failed: ${e instanceof Error ? e.message : 'Unknown error'}` };
    }
}
