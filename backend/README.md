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

Migrated subscribe route:

```bash
curl -X POST http://localhost:8000/v1/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","tag":"Tool_Lead"}'
```

Migrated contact route:

```bash
curl -X POST http://localhost:8000/v1/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","company":"Example Ltd","interest":"AI governance","message":"Please contact me."}'
```

## Railway Settings

- Root Directory: `/backend`
- Config file path: `/backend/railway.json`
- Public health check: `/health`
- Start command: handled by `backend/railway.json`

Set `BACKEND_API_KEY` in Railway and Vercel to the same long random value to
protect write endpoints such as `/v1/subscribe` and `/v1/contact`.

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

The `/v1/subscribe` route needs Kit variables:

```text
CONVERTKIT_API_KEY=your_kit_api_key
CONVERTKIT_FORM_ID=your_kit_form_id
CONVERTKIT_TOOL_LEAD_TAG_ID=your_tool_lead_tag_id
CONVERTKIT_WAYMARKPATH_TAG_ID=your_waymarkpath_tag_id
```

The `/v1/contact` route also uses `CONVERTKIT_CONTACT_TAG_ID` when configured.
