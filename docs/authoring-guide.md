# Authoring & Research Guide
*For Silicon & Stone Admins & Authors*

This guide outlines the workflows for researching topics, generating drafts, and publishing content to the Silicon & Stone platform.

## 1. Research & AI Drafting (Admin Dashboard)
**Best for:** Rapidly gathering intelligence and creating initial drafts from raw queries.

1.  **Access the Portal:**
    *   Navigate to `/research` (e.g., `http://localhost:3000/research`).
    *   Enter the **Admin Password** if prompted (set in `.env.local`).

2.  **Deploy a Forensic Agent:**
    *   Enter a natural language query in the search bar.
    *   *Example:* "European battery passport implementation timeline and blockers"
    *   The system will search live sources and generate a **Forensic Summary**.

3.  **Review Intelligence:**
    *   **Summary:** A high-level overview of the topic.
    *   **Sources:** List of cited articles and reports used.
    *   **Context:** Suggested keywords and persona pain points.

4.  **Create Draft:**
    *   Click the **"Draft"** button (or similar action in the UI).
    *   This creates a new **unpublished article** in Sanity CMS.
    *   **Default Status:** `Draft`
    *   **Default Type:** `Signal`

---

## 2. Markdown Content Sync (Bulk/External Authoring)
**Best for:** Writing long-form content in an external editor (Obsidian, VS Code) and syncing in bulk.

### File Format
Create markdown files (`.md`) in your content directory (default: `../content/substack`).

**Required Structure:**
```markdown
# Title of the Article

**Subject Line:** The snappy subtitle for email/preview.
**Preview Text:** A short teaser for the card view.

## Article

This is the main body of the article. You can use:
*   **Bold text**
*   Headings (###)
*   > Blockquotes

Content continues here...
```

### Sync Command
Run the sync script to push local files to Sanity.

**Standard Sync:**
```bash
npm run sync-content
```
*   Only updates files that have changed (checks content hash).

**Dry Run (Preview):**
```bash
npm run sync-content:dry
```
*   Shows what *would* happen without making changes.

**Force Update:**
```bash
npm run sync-content:force
```
*   Overwrites ALL Sanity articles with local versions (use with caution).

---

## 3. Final Polish & Publishing (Sanity Studio)
**Best for:** Final editing, image selection, and publishing.

1.  **Go to Studio:**
    *   Navigate to `/studio` (e.g., `http://localhost:3000/studio`).

2.  **Locate Drafts:**
    *   Look for the **"Articles"** list.
    *   Drafts (from Research or Sync) will appear here.

3.  **Enhance Content:**
    *   **Main Image:** Upload the cover image (e.g., "generated forensic landscapes").
    *   **Content Type:** Switch between `Signal`, `Deep Dive`, or `Guide`.
    *   **Personas:** Tag relevant personas (e.g., "Global Citizen").

4.  **Publish:**
    *   Click the green **Publish** button to make the article live on the site.
