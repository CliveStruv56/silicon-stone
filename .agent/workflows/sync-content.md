---
description: Sync content from AI Writer System to Sanity CMS
---

Use this workflow to push new or updated articles from your AI Writer System (`/Users/clivestruver/Projects/AI-Writer-System`) to the Silicon & Stone website.

Steps:

1. ensure your `.env.local` has the `SANITY_API_WRITE_TOKEN`.
2. Run the sync script:

// turbo
3. Run the sync command
```bash
export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/sync-content.ts
```
