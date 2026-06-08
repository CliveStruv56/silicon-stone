# Silicon and Stone

Silicon and Stone is currently a Next.js content and analysis portal with an
embedded Sanity Studio. The repository also includes a new isolated Railway
backend package in `backend/` for the planned Vercel frontend + Railway logic
deployment model.

## What This Repo Contains

- Public intelligence portal at `src/app/(website)`.
- Protected Writer Studio routes at `src/app/(admin)`.
- Embedded Sanity Studio at `src/app/studio`.
- Next.js API routes for Sanity, search, newsletter/contact proxying, and vectorization.
- Railway FastAPI backend scaffold in `backend/`.
- Operational docs in `docs/` and the session handoff in `project_summary.md`.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Writer Studio

The main end-to-end content workflow is `/create`:

1. Select a format, including Pulse, Signal, Deep Dive, Research Only, or YouTube Script.
2. Launch the research agent.
3. Review sources and forensic summary.
4. Generate a Sanity draft. House style is enforced automatically: a guardrail in the
   draft prompt (Pass 1) plus a voice-edit pass (Pass 3) that strips AI tells, enforces
   the style guide, and flags `[AUTHOR: …]` specifics in a **Voice Edit Notes** field.
   Deep Dives get an audit-only pass (notes, no full rewrite).
5. Review and publish in `/studio` — resolve every `[AUTHOR: …]` placeholder first.

`/generate` has been **removed** and merged into `/create`; every draft is now
research-backed. For intel without a draft, use **Research Only**. The house-style
rules are synced from the Ideaverse vault — see `docs/authoring-guide.md` §7.

Generated Pulse articles are stored as `contentType: signal` with
`intelligenceTier: pulse`; Sanity treats editorial format and reading-speed tier as
separate fields.

## Railway Logic API

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

See `docs/struver-stack-deployment.md` for the Vercel/Railway deployment runbook.

## Checks

```bash
npm run check
npm run test:security
npm run build
```

`npm audit` currently has a known moderate baseline from transitive Next/Sanity
packages. Do not run `npm audit fix --force`; npm currently proposes unsafe
downgrades for the remaining advisories.

## Codebase Map (Knowledge Graph)

An interactive knowledge graph of the codebase (files, functions, imports,
architectural layers, and a guided tour) lives in `.understand-anything/` and is
committed with the repo. To explore it locally:

```bash
npm run graph
```

This launches the read-only dashboard viewer and auto-opens it at a localhost
URL. It only *views* the saved graph — it does not re-analyse code. Notes:

- The viewer binds to `127.0.0.1` only and gates its data endpoints with an
  access token. The token is generated once and cached in the gitignored
  `.understand-anything/.dashboard-token` (never committed, never passed on the
  command line). The same token persists across launches, so the URL is stable.
- To **regenerate** the graph after code changes, run the `/understand` command
  in Claude Code (incremental after the first build). The dashboard re-reads the
  graph on refresh.

## Deploy on Vercel

The frontend deploys on Vercel from `main`. Railway hosts the separate logic API
where configured. See `docs/struver-stack-deployment.md` and
`docs/railway-vercel-next-steps.md` for deployment details.
