# Silicon & Stone - Project Summary

## Project Overview
**Silicon & Stone** is a specialized analysis platform focused on **"Forensic Technopolitics"**. It provides in-depth analysis on AI regulation, semiconductor supply chains, and digital sovereignty. The platform is designed to cut through complexity for specific decision-maker personas like legal compliance officers, supply chain operations managers, and policy analysts.

## Technical Architecture

### Core Stack
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19, Tailwind CSS 4, Radix UI / Shadcn
- **CMS**: Sanity (Headless CMS)
- **Styling**: Tailwind CSS with custom theme configuration (colors like `slate-deep`, `silicon-amber`, `stone-teal`)
- **Icons**: Lucide React

### Key Features & Components

1.  **Content Engine (Sanity CMS)**
    -   **Article Types**: 
        -   **Deep Dive**: Long-form analysis.
        -   **Signal**: Breaking analysis/updates.
        -   **Tool Guide**: Instructions for interactive tools.
    -   **Target Personas**: Metadata tagging for specific audiences (e.g., "Compliance Clara", "Industrial Ian").
    -   **Content Sync**: A custom script (`scripts/sync-content.ts`) automates the synchronization of markdown content from a local "AI Writer System" directly into Sanity's datastore, ensuring a streamlined publishing workflow.

2.  **User Interface**
    -   **Home Page**: Features a responsive "Bento Grid" layout displaying featured articles, recent analysis, and interactive widgets (Deadline Countdown, Subscribe CTA).
    -   **Navigation**: Structured menu for Analysis (divided by topics like "Atlantic Drift", "AI Act"), Tools, Methodology, and About.
    -   **Design System**: A polished, "premium" aesthetic using a specific dark-mode-first palette (`bg-slate-deep`) and gradients.

3.  **Interactive Tools**
    -   The architecture supports interactive tools (referenced in navigation as "Compliance Checker", "Supply Chain Mapper", "Scenario Modeler").
    -   Placeholder components exist for tool grids and widgets.

## Current Status

### ✅ Implemented
-   **Foundation**: Project structure with Next.js 16 and Sanity is fully verified and running.
-   **Content Pipeline**: The `sync-content.ts` script allows for robust content management from local markdown files.
-   **Home Page**: A fully functional landing page with dynamic data fetching from Sanity.
-   **Sanity Schema**: robust schemas for Articles, Authors, and Categories are defined, including persona tagging and SEO fields.
-   **Navigation**: Responsive header with mobile menu and categorized dropdowns.

### 🚧 In Progress / Planned
-   **Interactive Tools**: While linked in the header (`/tools/*`), the specific tool implementations (Compliance Checker, etc.) appear to be in early stages or placeholders.
-   **Content Population**: The structure supports "Deep Dives" and "Signals", but the site relies on the content sync pipeline to populate this.
-   **Search Functionality**: A `/search` route exists, but full search implementation details (e.g., Algolia or Sanity-native search) were not deeply inspected in this pass.

## Content Workflow
The project proposes a unique "Hybrid" content workflow:
1.  Content is authored in a separate "AI Writer System" as Markdown.
2.  `npm run sync-content` is executed to parse these markdown files.
3.  The script hashes content to detect changes, uploads images, and syncs structured data (Portable Text) to Sanity.
4.  Next.js frontend fetches and renders this content via Sanity's APIs.

## Directory Structure
-   `src/app`: Next.js App Router pages (Home, Analysis, Tools, Studio).
-   `src/components`: Atomic UI components, split by feature (Home, Layout, UI).
-   `src/sanity`: Schema definitions and client configuration.
-   `scripts`: Automation scripts for content synchronization.
