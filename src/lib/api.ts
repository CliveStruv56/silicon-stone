import fs from 'fs/promises';
import nodePath from 'path';
import { ICP, VoiceDNA, BusinessProfile } from '@/types/context';

const ROOT = process.env.AI_WRITER_ROOT || process.cwd();

// Allowed directories for file operations
const ALLOWED_DIRECTORIES = [
    'content',
    'context',
    'knowledge',
];

/**
 * Validates that a path is safe and within allowed directories.
 * Prevents directory traversal attacks.
 */
function validatePath(relativePath: string): void {
    const normalizedPath = nodePath.normalize(relativePath);

    // Check for path traversal attempts
    if (normalizedPath.includes('..') || normalizedPath.startsWith('/') || normalizedPath.startsWith('\\')) {
        throw new Error('Invalid path: Path traversal not allowed');
    }

    // Check if path starts with an allowed directory
    const isAllowed = ALLOWED_DIRECTORIES.some(dir =>
        normalizedPath.startsWith(dir + '/') ||
        normalizedPath.startsWith(dir + '\\') ||
        normalizedPath === dir
    );

    if (!isAllowed) {
        throw new Error('Invalid path: Directory not allowed');
    }
}

async function readJson<T>(relativePath: string): Promise<T> {
    // If we are in the web-platform dir, we need to go up if env var is not set correctly
    // But we assume AI_WRITER_ROOT is set to the project root.
    const fullPath = nodePath.join(ROOT, relativePath);
    try {
        const data = await fs.readFile(fullPath, 'utf-8');
        return JSON.parse(data) as T;
    } catch (error) {
        console.error(`Error reading ${relativePath} from ${fullPath}:`, error);
        throw new Error(`Failed to load context file: ${relativePath}`);
    }
}

export async function getICP(): Promise<ICP> {
    return readJson<ICP>('context/core/icp.json');
}

export async function getVoiceDNA(): Promise<VoiceDNA> {
    return readJson<VoiceDNA>('context/core/voice-dna.json');
}

export async function getBusinessProfile(): Promise<BusinessProfile> {
    return readJson<BusinessProfile>('context/core/business-profile.json');
}

export async function getContentFocus(): Promise<string> {
    const fullPath = nodePath.join(ROOT, 'knowledge/company/content-focus.md');
    try {
        return await fs.readFile(fullPath, 'utf-8');
    } catch {
        return "";
    }
}

export interface ContentFile {
    name: string;
    path: string;
    type: 'draft' | 'signal' | 'deep_dive' | 'linkedin';
    date: string;
    excerpt: string;
}

export async function listContentFiles(): Promise<ContentFile[]> {
    // Helper to traverse
    const results: ContentFile[] = [];

    // Check known directories
    const dirs = [
        { path: 'content/drafts', type: 'draft' as const },
        { path: 'content/substack/signals', type: 'signal' as const },
        { path: 'content/substack/deep-dives', type: 'deep_dive' as const },
        { path: 'content/social/linkedin', type: 'linkedin' as const }
    ];

    for (const d of dirs) {
        const fullPath = nodePath.join(ROOT, d.path);
        try {
            const files = await fs.readdir(fullPath);
            for (const f of files) {
                if (!f.endsWith('.md')) continue;

                const stats = await fs.stat(nodePath.join(fullPath, f));
                // name format is typically YYYY-MM-DD-slug.md
                // let's try to extract a pretty name
                const cleanName = f.replace('.md', '').split('-').slice(3).join(' ') || f;

                results.push({
                    name: cleanName,
                    path: nodePath.join(d.path, f),
                    type: d.type,
                    date: stats.mtime.toISOString().split('T')[0],
                    excerpt: "Loading..." // In real app, read first few lines
                });
            }
        } catch {
            // ignore missing dirs
        }
    }

    // Sort by date desc
    return results.sort((a, b) => b.date.localeCompare(a.date));
}

export async function saveICP(data: ICP): Promise<void> {
    const fullPath = nodePath.join(ROOT, 'context/core/icp.json');
    try {
        await fs.writeFile(fullPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch {
        throw new Error(`Failed to save ICP`);
    }
}

export async function getContent(relativePath: string): Promise<string> {
    // Validate path to prevent directory traversal attacks
    validatePath(relativePath);

    const fullPath = nodePath.join(ROOT, relativePath);
    try {
        return await fs.readFile(fullPath, 'utf-8');
    } catch {
        throw new Error(`File not found: ${relativePath}`);
    }
}

export async function saveContent(relativePath: string, content: string): Promise<void> {
    // Validate path to prevent directory traversal attacks
    validatePath(relativePath);

    const fullPath = nodePath.join(ROOT, relativePath);
    try {
        await fs.writeFile(fullPath, content, 'utf-8');
    } catch {
        throw new Error(`Failed to save file: ${relativePath}`);
    }
}

export async function deleteLocalContent(relativePath: string): Promise<void> {
    // Validate path to prevent directory traversal attacks
    validatePath(relativePath);

    const fullPath = nodePath.join(ROOT, relativePath);
    try {
        await fs.unlink(fullPath);
    } catch {
        // Ignore if file doesn't exist, might have been deleted manually
    }
}
