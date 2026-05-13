# Silicon and Stone Logic API

This is the first Railway-ready backend package for the broader Struver Stack.
It is intentionally small: it gives Railway a deployable service boundary now,
without forcing the existing Next.js application to move before its API routes
are split out.

## Local Development

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Health check:

```bash
curl http://localhost:8000/health
```

Migrated category route:

```bash
curl http://localhost:8000/v1/categories
```

Migrated briefings route:

```bash
curl http://localhost:8000/v1/briefings
```

## Railway Settings

- Root Directory: `/backend`
- Config file path: `/backend/railway.json`
- Public health check: `/health`
- Start command: handled by `backend/railway.json`

Set `ALLOWED_ORIGINS` to a comma-separated list of Vercel frontend origins, for
example:

```text
ALLOWED_ORIGINS=https://siliconandstone.com,https://silicon-and-stone.vercel.app
```

The `/v1/categories` and `/v1/briefings` routes also need the Sanity public project variables:

```text
NEXT_PUBLIC_SANITY_PROJECT_ID=your_sanity_project_id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2026-01-13
```

If the Sanity dataset is private, set `SANITY_API_READ_TOKEN` as well.
