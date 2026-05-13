# Railway and Vercel Next Steps

Last updated: 2026-05-13

This document starts from the current state of this repository:

- The Silicon and Stone Next.js app still deploys from the repository root.
- A new Railway-ready backend service exists in `backend/`.
- The backend is only a scaffold for now. It has health/topology endpoints, but the real application logic has not yet been migrated out of Next.js.
- No Railway setup has been done yet.

## 1. Push The Current Commits

From the repo root:

```bash
git push
```

After pushing, check that Vercel starts and completes its normal frontend deployment.

Do not worry if Railway does nothing yet. Railway will not deploy anything until you create a Railway project and connect the repo.

## 2. Create The Railway Project

1. Log in to Railway.
2. Create a new project.
3. Choose an empty project/canvas if Railway offers that option.
4. Name it something portfolio-level, for example:

```text
Struver Stack
```

This should eventually hold:

- Silicon and Stone logic API
- Hermes / The Brain
- Shared PostgreSQL
- Shared Redis
- Later services for Family Hub, VB Partners, and WaymarkPath

## 3. Add The Silicon And Stone Backend Service

In the Railway project:

1. Click **New**.
2. Choose **GitHub Repo**.
3. Select this repository.
4. Open the new service settings.
5. Set:

```text
Root Directory: /backend
Config file path: /backend/railway.json
```

If Railway asks for a start command, use:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

The committed `backend/railway.json` already contains that command, so Railway should normally pick it up from the config file.

## 4. Add Railway Environment Variables

In the Railway backend service variables, add:

```text
ALLOWED_ORIGINS=https://siliconandstone.com,https://YOUR-VERCEL-PREVIEW-OR-PRODUCTION-DOMAIN
ENABLE_API_DOCS=false
```

For the first test, you can temporarily include localhost:

```text
ALLOWED_ORIGINS=http://localhost:3000,https://siliconandstone.com,https://YOUR-VERCEL-DOMAIN
```

Later, remove origins you do not need.

You do not need to add OpenAI, Anthropic, Pinecone, Sanity, Redis, or PostgreSQL variables to this backend yet unless you start migrating real logic into it.

## 5. Generate A Public Railway Domain

In the Railway backend service:

1. Go to networking/settings.
2. Generate a public domain.
3. Railway will give you a URL similar to:

```text
https://your-service-name-production.up.railway.app
```

Open this in a browser with `/health` at the end:

```text
https://your-service-name-production.up.railway.app/health
```

Expected result:

```json
{
  "status": "ok",
  "service": "...",
  "environment": "..."
}
```

Also test:

```text
https://your-service-name-production.up.railway.app/v1/topology
```

## 6. Add Shared Railway Resources

In the same Railway project, add:

1. PostgreSQL
2. Redis

For now, these can sit unused. They are there so future services can share the same project canvas.

Recommended intended use:

- PostgreSQL: application data, durable state, user/account data, job records.
- Redis: queues, short-lived state, rate limits, Hermes working memory, background task coordination.

Do not move production data into Railway until the schema and migration strategy are explicit.

## 7. Connect Vercel To The Railway Backend

In Vercel, open the current Silicon and Stone project.

Keep:

```text
Root Directory: /
Framework: Next.js
```

Add or update this environment variable:

```text
NEXT_PUBLIC_API_URL=https://YOUR-RAILWAY-BACKEND-DOMAIN
```

Use the public Railway URL from step 5.

Then redeploy the Vercel project.

Important: the current frontend may not use `NEXT_PUBLIC_API_URL` everywhere yet. Adding it now prepares the app for route-by-route migration.

## 8. Confirm The Current App Still Works

After the Vercel redeploy:

1. Open the production site.
2. Check the homepage.
3. Check the tools pages:
   - `/tools/compliance-checker`
   - `/tools/policy-stress-test`
   - `/tools/scenario-modeler`
   - `/tools/supply-chain-mapper`
4. Check any admin/editor pages you use.
5. Confirm Sanity-powered pages still load.

At this point, the new Railway backend exists, but the current app should still behave as before.

## 9. First Real Migration Step

Do not move the whole frontend into `/frontend` yet.

Instead, migrate one low-risk backend concern from Next.js to Railway.

Good candidates:

- A simple API route with limited dependencies.
- A non-critical internal helper endpoint.
- A read-only endpoint before any write/payment/auth-sensitive endpoint.

Avoid migrating first:

- Auth/session logic.
- Payment or purchase flows.
- Sanity write operations.
- Anything user-facing that blocks core site usage.

For each route:

1. Create the FastAPI endpoint in `backend/main.py` or a new backend module.
2. Add any required backend dependencies to `backend/requirements.txt`.
3. Add required Railway environment variables.
4. Update the frontend call site to use:

```text
NEXT_PUBLIC_API_URL
```

5. Test locally.
6. Deploy to Railway.
7. Redeploy Vercel if the frontend changed.
8. Commit the route migration separately.

## 10. Hermes / The Brain

Create Hermes as a separate Railway service only when its interface is clear.

Before creating it, decide:

- What requests each app will send to Hermes.
- Whether Hermes responds synchronously or creates background jobs.
- How apps authenticate to Hermes.
- What data Hermes can access.
- What gets stored in PostgreSQL.
- What gets stored temporarily in Redis.

Once created inside Railway, other Railway services should call it through private networking:

```text
http://SERVICE_NAME.railway.internal:PORT
```

Use `http`, not `https`, for Railway private networking.

Browser-side code and Vercel-hosted frontend code cannot call `railway.internal` directly. They must use either:

- the public Railway domain, or
- a server-side proxy route.

## 11. Later Monorepo Restructure

Only consider moving the Next.js app into `/frontend` after:

- Current production deploys are stable.
- The Railway backend deploy is stable.
- At least one route migration has been completed successfully.
- The repo is clean and committed.

When that move happens, it should be its own dedicated commit.

Expected later structure:

```text
/
  frontend/
    package.json
    src/
    public/
    next.config.ts
  backend/
    main.py
    requirements.txt
    railway.json
  docs/
```

After that move:

- Vercel Root Directory changes from `/` to `/frontend`.
- Railway backend Root Directory stays `/backend`.
- GitHub Actions may need path updates.
- TypeScript, ESLint, Sanity, and package lock paths will need checking.

## 12. What Not To Do Yet

Do not do these immediately:

- Do not move the existing Next.js app into `/frontend`.
- Do not migrate all API routes at once.
- Do not make Hermes the dependency for every app before it has a stable contract.
- Do not put secrets in GitHub.
- Do not expose Railway private networking URLs to browser-side code.
- Do not delete current Next.js API routes until their Railway replacements are deployed and tested.

## 13. Success Criteria For This Phase

This phase is complete when:

- The current commits are pushed.
- Vercel still deploys Silicon and Stone from `/`.
- Railway deploys `backend/` successfully.
- `/health` works on the public Railway domain.
- `NEXT_PUBLIC_API_URL` is set in Vercel.
- PostgreSQL and Redis exist in the Railway project.
- No current production functionality has regressed.

After that, the project is ready for the first route-by-route backend migration.
