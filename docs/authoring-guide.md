# Authoring & Research Guide
*For Silicon & Stone Admins & Authors*

This guide outlines the workflows for researching topics, generating drafts, and publishing content to the Silicon & Stone platform.

## 1. Unified Content Creation (`/create`)
**Best for:** End-to-end workflow from research query to draft article in Sanity.

1.  **Access the Pipeline:**
    *   Navigate to `/create` (e.g., `https://siliconandstone.com/create`).
    *   Enter the deployment **Admin Password** if prompted.

2.  **Enter a Research Query:**
    *   Type a natural language query in the search bar.
    *   *Example:* "European battery passport implementation timeline and blockers"
    *   The system searches Inoreader feeds (if connected) and Exa.ai web results, then Claude synthesises a **Forensic Summary**.

3.  **Review Intelligence:**
    *   **Summary:** High-level overview of the topic.
    *   **Sources:** Cited articles and reports.
    *   **Context:** Suggested keywords and persona pain points.

4.  **Choose Output Format:**
    | Format | Description |
    |--------|-------------|
    | **Signal** | 800-1,500 word breaking analysis (default) |
    | **Deep Dive** | 3,000-6,000 word forensic report |
    | **Research Only** | Summary without full article generation |
    | **YouTube Script** | Tiered Intelligence structure (Pulse/Briefing/Audit CTA) |

5.  **Generate Draft:**
    *   Select format and click generate.
    *   Claude produces the draft at temperature 0.4 (controlled, on-brand output).
    *   A new **unpublished article** is created in Sanity CMS.

## 2. Research Portal (`/research`)
**Best for:** Exploring topics without immediately generating a full draft.

1.  Navigate to `/research`.
2.  Deploy a forensic agent with a natural language query.
3.  Review the summary, sources, and context.
4.  Optionally click **"Draft"** to create a Signal-type draft in Sanity.

## 3. Markdown Content Sync (Bulk/External Authoring)
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

### Sync Commands
```bash
npm run sync-content       # Standard sync (only changed files)
npm run sync-content:dry   # Preview what would change
npm run sync-content:force # Overwrite ALL articles (use with caution)
```

## 4. Final Polish & Publishing (Sanity Studio)
**Best for:** Final editing, image selection, and publishing.

1.  **Go to Studio:**
    *   Navigate to `/studio` (e.g., `https://siliconandstone.com/studio`).

2.  **Locate Drafts:**
    *   Look for the **"Articles"** list.
    *   Drafts (from `/create`, `/research`, or sync) will appear here.

3.  **Enhance Content:**
    *   **Main Image:** Upload the cover image (articles without images show a branded placeholder on the site).
    *   **Content Type:** Set to `Signal`, `Deep Dive`, `Guide`, or `YouTube`.
    *   **Intelligence Tier:** Set to `Pulse`, `Briefing`, or `Audit` for the briefings page display.
    *   **Personas:** Tag relevant personas (Clara, Ian, Sofia, Robert, Citizen).
    *   **Impact Score:** Set 1-10 for the briefings page impact bar.
    *   **Stone Truth:** Add a one-line forensic insight (displayed in italics on briefings cards).

4.  **Publish:**
    *   Click the green **Publish** button to make the article live on the site.
    *   The site uses ISR — published changes appear after revalidation.

## 5. Content Types Reference

| Type | Slug | Length | Turnaround | Use When |
|------|------|--------|------------|----------|
| **Signal** | `signal` | 800-1,500 words | 24-72 hours | Breaking regulatory news, quick analysis |
| **Deep Dive** | `deepdive` | 3,000-6,000 words | 1-2 weeks | Comprehensive forensic report on a topic |
| **Guide** | `guide` | 500-2,000 words | As needed | How to use interactive tools or products |
| **YouTube** | `youtube` | Variable | As needed | Script outline for video content |

## 6. Persona Reference

| Persona | Slug | Target Audience |
|---------|------|----------------|
| Compliance Clara | `clara` | Legal/compliance counsel at tech firms |
| Industrial Ian | `ian` | Supply chain and operations directors |
| Sovereign Sofia | `sofia` | Policy analysts at think tanks and government |
| Remote Robert | `robert` | Regional development strategists |
| Global Citizen | `citizen` | Informed general public, journalists, educators |
