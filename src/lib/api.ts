import fs from 'fs/promises';
import nodePath from 'path';
import { ICP, VoiceDNA, BusinessProfile } from '@/types/context';
import icpJson from '../../context/core/icp.json';
import voiceDnaJson from '../../context/core/voice-dna.json';
import businessProfileJson from '../../context/core/business-profile.json';
import { HOUSE_STYLE_RULES, AI_TELLS_RULES } from './style-rules.generated';
import { CONTENT_FOCUS } from './content-focus.generated';
import { STYLE_GUARDRAIL } from './style-guardrail';

const ROOT = process.env.AI_WRITER_ROOT || process.cwd();

// Allowed directories for file operations
const ALLOWED_DIRECTORIES = [
    'content',
    'context',
    'knowledge',
];

const MANAGED_CONTENT_DIRECTORIES = [
    'content/drafts',
    'content/substack/signals',
    'content/substack/deep-dives',
    'content/social/linkedin',
    'knowledge',
];

const MANAGED_CONTENT_EXTENSIONS = new Set(['.md', '.json', '.txt']);

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

export function validateManagedContentPath(relativePath: string): string {
    const normalizedPath = nodePath.normalize(relativePath);

    if (normalizedPath.includes('..') || normalizedPath.startsWith('/') || normalizedPath.startsWith('\\')) {
        throw new Error('Invalid path: Path traversal not allowed');
    }

    const isAllowed = MANAGED_CONTENT_DIRECTORIES.some(dir =>
        normalizedPath.startsWith(dir + '/') ||
        normalizedPath.startsWith(dir + '\\')
    );

    if (!isAllowed) {
        throw new Error('Invalid path: Directory not allowed');
    }

    const ext = nodePath.extname(normalizedPath).toLowerCase();
    if (!MANAGED_CONTENT_EXTENSIONS.has(ext)) {
        throw new Error('Invalid path: File type not allowed');
    }

    return normalizedPath;
}

export async function getICP(): Promise<ICP> {
    return icpJson as ICP;
}

export async function getVoiceDNA(): Promise<VoiceDNA> {
    return voiceDnaJson as VoiceDNA;
}

export async function getBusinessProfile(): Promise<BusinessProfile> {
    return businessProfileJson as BusinessProfile;
}

/**
 * Condensed house-style guardrail for the Pass-1 draft prompt. Bundled (not read
 * from disk) so it always reaches the production prompt. See style-guardrail.ts.
 */
export function getStyleGuardrail(): string {
    return STYLE_GUARDRAIL;
}

/** Full canonical house-style rules (Pass-3 voice edit). Generated from .agent/rules/style/. */
export function getHouseStyleRules(): string {
    return HOUSE_STYLE_RULES;
}

/** Full AI-tells detection/removal reference (Pass-3 voice edit). Generated from .agent/rules/style/. */
export function getAITells(): string {
    return AI_TELLS_RULES;
}

/**
 * Optional editorial steer for the draft prompt. Returns "" when there is none —
 * callers MUST treat "" as "omit the section", not "emit an empty header"
 * (see buildDraftPrompt).
 *
 * BUNDLED, not read from disk, for the same reason as the style rules above.
 * This used to `fs.readFile` a path built from process.cwd(), which Next's file
 * tracing cannot resolve — so the file was never included in the serverless
 * bundle and the read failed on Vercel every time, returning "" while working
 * perfectly in local development. It also read a file that did not exist at all
 * until 21 August 2026. Both failures were invisible: the miss was logged once
 * per process, into logs nobody was reading.
 *
 * The source is knowledge/company/content-focus.md; scripts/gen-style-rules.mjs
 * turns it into the module imported here, and announces an empty one at build
 * time. Note that `next dev` does not run prebuild — after editing the markdown,
 * run `npm run gen:style` to see the change locally. That is equally true of the
 * house-style rules.
 */
export function getContentFocus(): string {
    return CONTENT_FOCUS;
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
    const normalizedPath = validateManagedContentPath(relativePath);

    const fullPath = nodePath.join(ROOT, normalizedPath);
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
