# Struver Stack Deployment Runbook

Last updated: 2026-05-13

## Target Topology

| App | Host | Role | Local repo status |
| --- | --- | --- | --- |
| Silicon and Stone | Vercel frontend + Railway logic | Content portal and geopolitical analysis | Existing Next.js app in repo root; new `backend/` service added |
| Family Hub | Vercel frontend + Railway logic | Messaging and "Emergency Tap" system | Separate repo/app still needed |
| VB Partners | Railway full stack | SaaS for small businesses | Separate repo/app still needed |
| WaymarkPath | Vercel frontend + Railway logic | Career and skills gap analysis engine | Existing page links out; separate repo/app likely needed |
| The Brain | Railway Hermes service | Central AI agent for all apps | Service still needed |

## What Is Done Locally

- Added `backend/` as an isolated Railway service.
- Added `backend/railway.json` with Nixpacks, IPv4-compatible binding via `--host 0.0.0.0`, and `/health` checks.
- Added FastAPI endpoints:
  - `GET /health`
  - `GET /v1/topology`
  - `POST /v1/hermes/events`
- Added `NEXT_PUBLIC_API_URL` and Railway backend variables to `.env.example`.

## Current Repository Shape

This repository is not yet a true `/frontend` + `/backend` monorepo. The existing
Silicon and Stone frontend and Next.js API routes still live at the repository
root. That is acceptable for the next deploy step:

- Vercel project root should stay as `/`.
- Railway service root should be `/backend`.

Move the Next.js app into `/frontend` only after the current uncommitted app work
is committed or intentionally discarded. That move will touch most project files.

## Railway Setup

Create one Railway project for the shared production canvas, then add services.

For this repo's first logic service:

1. New service from GitHub repo.
2. Root Directory: `/backend`.
3. Config file path: `/backend/railway.json`.
4. Generate a public domain for browser and Vercel server calls.
5. Add variables:
   - `ALLOWED_ORIGINS`
   - `ENABLE_API_DOCS=false`
   - Any future API keys needed by migrated logic.

Add shared Railway resources:

- PostgreSQL for app data.
- Redis for queueing, sessions, or Hermes short-term state.

For internal Railway service calls, use:

```text
http://SERVICE_NAME.railway.internal:PORT
```

Use `http`, not `https`, for Railway private networking. Browser-side code and
Vercel-hosted frontend code cannot call `railway.internal`; they need the public
Railway domain or a Vercel server route that proxies to it.

## Vercel Setup

For the current Silicon and Stone repo:

1. Keep Root Directory as `/`.
2. Framework preset: Next.js.
3. Add environment variables from `.env.example`.
4. Add:
   - `NEXT_PUBLIC_API_URL=https://YOUR-RAILWAY-DOMAIN`

If the frontend is later moved into `/frontend`, update the Vercel Root Directory
to `/frontend` at the same time as the filesystem move.

## Migration Order

1. Deploy `backend/` to Railway and confirm `/health`.
2. Add the Railway public URL to Vercel as `NEXT_PUBLIC_API_URL`.
3. Migrate one low-risk API route from Next.js to FastAPI.
4. Update the frontend call site to use `NEXT_PUBLIC_API_URL`.
5. Repeat route-by-route.
6. Create the Hermes Railway service once there is a concrete agent interface.
7. Switch inter-service calls inside Railway to private DNS.
8. Only then consider moving the Next.js app into `/frontend`.

## Still To Do In Dashboards

- Create or select the Railway project canvas.
- Add the `/backend` service from this GitHub repo.
- Add PostgreSQL and Redis.
- Generate the Railway public domain.
- Add `NEXT_PUBLIC_API_URL` in Vercel.
- Configure production secrets in Vercel and Railway.
- Decide service names because Railway private DNS depends on them.

## Still To Build

- Actual Hermes service.
- Auth and service-to-service authorization between apps and Hermes.
- Database schema and migrations.
- Queue/background job pattern if Hermes work should not block requests.
- Route migration from existing Next.js API handlers to Railway.
- Separate repos or packages for Family Hub, VB Partners, and WaymarkPath.
