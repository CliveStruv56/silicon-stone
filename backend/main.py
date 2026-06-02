import os
import re
import time
import uuid
import asyncio
import logging
from typing import Any

import httpx

try:
    # redis-py ships an asyncio client at redis.asyncio (>= 4.2).
    from redis import asyncio as aioredis
except ImportError:  # pragma: no cover — redis is optional; falls back to memory
    aioredis = None
from fastapi import FastAPI
from fastapi import HTTPException
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


logger = logging.getLogger("silicon_stone_api")

SANITY_CATEGORIES_QUERY = """*[_type == "category"] | order(title asc) {
  _id,
  title,
  "slug": slug.current
}"""

SANITY_BRIEFINGS_QUERY = """*[_type == "article" && !(_id in path("drafts.**")) && defined(intelligenceTier) && defined(slug.current)]
| order(coalesce(impactScore, 5) desc, publishedAt desc) [0...20] {
  _id,
  title,
  "slug": slug.current,
  excerpt,
  stoneTruth,
  impactScore,
  intelligenceTier,
  publishedAt,
  personas,
  methodologyPillars,
  mainImage,
  categories[]->{
    _id,
    title,
    "slug": slug.current
  }
}"""


class ServiceRoute(BaseModel):
    app: str
    frontend_host: str | None
    logic_host: str
    role: str
    status: str


class Category(BaseModel):
    id: str
    title: str
    slug: str


class SubscribeRequest(BaseModel):
    email: str
    tag: str | None = None


class ContactRequest(BaseModel):
    name: str
    email: str
    company: str | None = None
    interest: str | None = None
    message: str | None = None


class DeepResearchRequest(BaseModel):
    # `instructions` carries the full forensic prompt built on the Next.js side,
    # so all brand/prompt logic stays in one place. `topic` is for logging only.
    topic: str
    instructions: str
    model: str | None = None


RATE_LIMITS: dict[str, list[float]] = {}
ALLOWED_SUBSCRIBE_TAGS = {"Tool_Lead", "WaymarkPath_Early_Access"}
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
CONTACT_FIELD_LENGTHS = {
    "name": 120,
    "email": 254,
    "company": 160,
    "interest": 160,
    "message": 2_000,
}


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def _check_rate_limit(key: str, limit: int, window_seconds: int) -> int | None:
    now = time.time()
    window_start = now - window_seconds
    requests = [timestamp for timestamp in RATE_LIMITS.get(key, []) if timestamp > window_start]

    if len(requests) >= limit:
        retry_after = max(1, int(window_seconds - (now - requests[0])))
        RATE_LIMITS[key] = requests
        return retry_after

    requests.append(now)
    RATE_LIMITS[key] = requests
    return None


def _kit_env() -> tuple[str, str]:
    api_key = os.getenv("CONVERTKIT_API_KEY", "")
    form_id = os.getenv("CONVERTKIT_FORM_ID", "")

    if not api_key or not form_id:
        raise HTTPException(status_code=503, detail="Newsletter service not configured")

    return api_key, form_id


def _require_backend_api_key(request: Request) -> None:
    expected_key = os.getenv("BACKEND_API_KEY", "")
    if not expected_key:
        logger.error("BACKEND_API_KEY is not configured; rejecting protected write request")
        raise HTTPException(status_code=503, detail="Backend shared key is not configured")

    provided_key = request.headers.get("x-backend-api-key", "")
    if provided_key != expected_key:
        raise HTTPException(status_code=401, detail="Unauthorized")


def _normalize_field(value: str | None, max_length: int) -> str:
    if not isinstance(value, str):
        return ""
    return value.strip()[:max_length]


def _sanity_env() -> tuple[str, str, str, str | None]:
    project_id = os.getenv("NEXT_PUBLIC_SANITY_PROJECT_ID", "")
    dataset = os.getenv("NEXT_PUBLIC_SANITY_DATASET", "production")
    api_version = os.getenv("NEXT_PUBLIC_SANITY_API_VERSION", "2026-01-13")
    token = os.getenv("SANITY_API_READ_TOKEN")

    if not project_id:
        raise HTTPException(status_code=503, detail="Sanity project is not configured")

    return project_id, dataset, api_version, token


def _sanity_query(query: str) -> Any:
    project_id, dataset, api_version, token = _sanity_env()
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    url = f"https://{project_id}.api.sanity.io/v{api_version}/data/query/{dataset}"

    try:
        response = httpx.get(
            url,
            params={"query": query},
            headers=headers,
            timeout=10,
        )
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Sanity returned {exc.response.status_code}",
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="Sanity request failed") from exc

    return response.json().get("result", [])


def _sanity_image_url(image: dict[str, Any] | None, width: int = 800, height: int = 450) -> str | None:
    project_id, dataset, _, _ = _sanity_env()
    asset_ref = image.get("asset", {}).get("_ref") if image else None
    if not isinstance(asset_ref, str) or not asset_ref.startswith("image-"):
        return None

    parts = asset_ref.split("-")
    if len(parts) < 4:
        return None

    asset_id = parts[1]
    dimensions = parts[2]
    extension = parts[3]
    return f"https://cdn.sanity.io/images/{project_id}/{dataset}/{asset_id}-{dimensions}.{extension}?w={width}&h={height}"


# --- Deep research (Exa Research API) -----------------------------------------
# Long-running agentic research for Deep Dives. Runs here, on Railway, rather than
# in a Vercel serverless function which would time out after a few minutes.
#
# Job state lives in Redis when REDIS_URL is set (durable across redeploys and
# shared across replicas), and falls back to an in-process dict for local dev or
# before Redis is provisioned. Records are transient (status + report) with a
# short TTL, which is why Redis — not Postgres — is the right home for them; keep
# Postgres for durable records you intend to keep and query.
#
# NOTE: the async worker still runs in the process that accepted the POST. Redis
# makes job *state* durable and replica-shared; full crash-resumption of an
# in-flight run would need a real queue/worker and is out of scope here.
EXA_RESEARCH_URL = "https://api.exa.ai/research/v1"
RESEARCH_JOB_TTL_SECONDS = 60 * 60
REDIS_URL = os.getenv("REDIS_URL", "")

# In-memory fallback store (used only when Redis is not configured).
RESEARCH_JOBS: dict[str, dict[str, Any]] = {}

_redis_client = None


def _get_redis():
    """Lazily build a shared async Redis client, or None to use the memory store."""
    global _redis_client
    if not REDIS_URL or aioredis is None:
        return None
    if _redis_client is None:
        _redis_client = aioredis.from_url(REDIS_URL, decode_responses=True)
    return _redis_client


def _exa_api_key() -> str:
    key = os.getenv("EXA_API_KEY", "")
    if not key:
        raise HTTPException(status_code=503, detail="Exa API key is not configured")
    return key


def _job_key(job_id: str) -> str:
    return f"research:job:{job_id}"


async def _job_create(job_id: str, topic: str) -> None:
    redis = _get_redis()
    if redis is not None:
        key = _job_key(job_id)
        await redis.hset(key, mapping={"status": "pending", "created_at": str(time.time()), "topic": topic})
        await redis.expire(key, RESEARCH_JOB_TTL_SECONDS)
        return
    _prune_research_jobs()
    RESEARCH_JOBS[job_id] = {"status": "pending", "created_at": time.time(), "topic": topic}


async def _job_update(job_id: str, **changes: Any) -> None:
    redis = _get_redis()
    if redis is not None:
        # Hash fields are strings; None becomes "" so the GET endpoint can treat it as absent.
        mapping = {k: ("" if v is None else str(v)) for k, v in changes.items()}
        await redis.hset(_job_key(job_id), mapping=mapping)
        return
    if job_id in RESEARCH_JOBS:
        RESEARCH_JOBS[job_id].update(changes)


async def _job_get(job_id: str) -> dict[str, Any] | None:
    redis = _get_redis()
    if redis is not None:
        data = await redis.hgetall(_job_key(job_id))
        return data or None
    return RESEARCH_JOBS.get(job_id)


def _prune_research_jobs() -> None:
    cutoff = time.time() - RESEARCH_JOB_TTL_SECONDS
    stale = [jid for jid, job in RESEARCH_JOBS.items() if job.get("created_at", 0) < cutoff]
    for jid in stale:
        RESEARCH_JOBS.pop(jid, None)


async def _run_deep_research(job_id: str, instructions: str, model: str) -> None:
    api_key = os.getenv("EXA_API_KEY", "")
    if not api_key:
        await _job_update(job_id, status="failed", error="Exa API key is not configured")
        return

    headers = {"x-api-key": api_key, "Content-Type": "application/json"}
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(30.0)) as client:
            created = await client.post(
                EXA_RESEARCH_URL,
                headers=headers,
                json={"instructions": instructions, "model": model},
            )
            created.raise_for_status()
            research_id = created.json().get("researchId")
            if not research_id:
                await _job_update(job_id, status="failed", error="Exa did not return a researchId")
                return

            await _job_update(job_id, status="running", research_id=research_id)

            deadline = time.time() + 10 * 60  # 10 minutes
            while time.time() < deadline:
                await asyncio.sleep(3)
                poll = await client.get(
                    f"{EXA_RESEARCH_URL}/{research_id}",
                    headers=headers,
                    params={"stream": "false"},
                )
                poll.raise_for_status()
                data = poll.json()
                status = data.get("status")

                if status == "completed":
                    output = data.get("output") or {}
                    cost = (data.get("costDollars") or {}).get("total")
                    await _job_update(
                        job_id,
                        status="completed",
                        report=output.get("content", ""),
                        cost_dollars=cost,
                    )
                    return
                if status in ("failed", "canceled"):
                    await _job_update(
                        job_id,
                        status="failed",
                        error=data.get("error", f"research {status}"),
                    )
                    return

            await _job_update(job_id, status="failed", error="Deep research timed out")
    except httpx.HTTPStatusError as exc:
        logger.error("Exa research failed: status=%s body=%s", exc.response.status_code, exc.response.text[:500])
        await _job_update(job_id, status="failed", error=f"Exa returned {exc.response.status_code}")
    except httpx.HTTPError as exc:
        logger.error("Exa research request failed: %s", exc)
        await _job_update(job_id, status="failed", error="Exa request failed")
    except Exception as exc:  # noqa: BLE001 — never let a worker crash silently
        logger.exception("Deep research job crashed")
        await _job_update(job_id, status="failed", error=str(exc))


service_routes = [
    ServiceRoute(
        app="Silicon and Stone",
        frontend_host="Vercel",
        logic_host="Railway",
        role="Content portal and geopolitical analysis",
        status="frontend-currently-in-this-repo",
    ),
    ServiceRoute(
        app="Family Hub",
        frontend_host="Vercel",
        logic_host="Railway",
        role='Messaging and "Emergency Tap" system',
        status="planned",
    ),
    ServiceRoute(
        app="VB Partners",
        frontend_host=None,
        logic_host="Railway",
        role="SaaS for small businesses",
        status="planned",
    ),
    ServiceRoute(
        app="WaymarkPath",
        frontend_host="Vercel",
        logic_host="Railway",
        role="Career and skills gap analysis engine",
        status="planned",
    ),
    ServiceRoute(
        app="The Brain",
        frontend_host=None,
        logic_host="Railway",
        role="Central AI agent serving the project portfolio",
        status="planned",
    ),
]

app = FastAPI(
    title="Silicon and Stone Logic API",
    version="0.1.0",
    docs_url="/docs" if os.getenv("ENABLE_API_DOCS", "false").lower() == "true" else None,
    redoc_url=None,
)

allowed_origins = _split_csv(os.getenv("ALLOWED_ORIGINS", "http://localhost:3000"))
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": os.getenv("RAILWAY_SERVICE_NAME", "silicon-and-stone-logic"),
        "environment": os.getenv("RAILWAY_ENVIRONMENT_NAME", "local"),
    }


@app.get("/v1/topology", response_model=list[ServiceRoute])
def topology() -> list[ServiceRoute]:
    return service_routes


@app.get("/v1/categories", response_model=list[Category])
def categories() -> list[Category]:
    result = _sanity_query(SANITY_CATEGORIES_QUERY)
    return [
        Category(id=item.get("_id", ""), title=item.get("title", ""), slug=item.get("slug", ""))
        for item in result
        if item.get("_id") and item.get("title") and item.get("slug")
    ]


@app.get("/v1/briefings")
def briefings() -> dict[str, list[dict[str, Any]]]:
    articles = _sanity_query(SANITY_BRIEFINGS_QUERY)
    articles_with_images = [
        {
            **article,
            "mainImageUrl": _sanity_image_url(article.get("mainImage")),
        }
        for article in articles
        if isinstance(article, dict)
    ]
    return {"result": articles_with_images}


@app.post("/v1/subscribe")
def subscribe(payload: SubscribeRequest, request: Request) -> dict[str, bool]:
    _require_backend_api_key(request)

    email = payload.email.strip()[:254].lower() if isinstance(payload.email, str) else ""
    tag = payload.tag if payload.tag in ALLOWED_SUBSCRIBE_TAGS else None

    retry_after = _check_rate_limit(f"subscribe:{email}", limit=10, window_seconds=15 * 60)
    if retry_after is not None:
        raise HTTPException(
            status_code=429,
            detail="Too many requests",
            headers={"Retry-After": str(retry_after)},
        )

    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    if not EMAIL_RE.match(email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    api_key, form_id = _kit_env()
    headers = {
        "Content-Type": "application/json",
        "X-Kit-Api-Key": api_key,
    }

    try:
        response = httpx.post(
            f"https://api.kit.com/v4/forms/{form_id}/subscribers",
            headers=headers,
            json={"email_address": email},
            timeout=10,
        )
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        logger.error(
            "Kit subscribe failed: status=%s body=%s",
            exc.response.status_code,
            exc.response.text[:500],
        )
        raise HTTPException(
            status_code=502,
            detail=f"Kit returned {exc.response.status_code}",
        ) from exc
    except httpx.HTTPError as exc:
        logger.error("Kit subscribe request failed: %s", exc)
        raise HTTPException(status_code=502, detail="Kit request failed") from exc

    tag_id_map = {
        "Tool_Lead": os.getenv("CONVERTKIT_TOOL_LEAD_TAG_ID"),
        "WaymarkPath_Early_Access": os.getenv("CONVERTKIT_WAYMARKPATH_TAG_ID"),
    }
    tag_id = tag_id_map.get(tag) if tag else None
    subscriber_id = response.json().get("subscriber", {}).get("id")

    if tag_id and subscriber_id:
        try:
            httpx.post(
                f"https://api.kit.com/v4/tags/{tag_id}/subscribers/{subscriber_id}",
                headers=headers,
                json={},
                timeout=10,
            ).raise_for_status()
        except httpx.HTTPError:
            # The subscription succeeded; don't fail the user-visible request for tag issues.
            logger.exception("Kit tag assignment failed")
            pass

    return {"success": True}


@app.post("/v1/contact")
def contact(payload: ContactRequest, request: Request) -> dict[str, bool]:
    _require_backend_api_key(request)

    name = _normalize_field(payload.name, CONTACT_FIELD_LENGTHS["name"])
    email = _normalize_field(payload.email, CONTACT_FIELD_LENGTHS["email"]).lower()
    company = _normalize_field(payload.company, CONTACT_FIELD_LENGTHS["company"])
    interest = _normalize_field(payload.interest, CONTACT_FIELD_LENGTHS["interest"])
    message = _normalize_field(payload.message, CONTACT_FIELD_LENGTHS["message"])

    retry_after = _check_rate_limit(f"contact:{email}", limit=5, window_seconds=15 * 60)
    if retry_after is not None:
        raise HTTPException(
            status_code=429,
            detail="Too many requests",
            headers={"Retry-After": str(retry_after)},
        )

    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    if not name:
        raise HTTPException(status_code=400, detail="Name is required")

    if not EMAIL_RE.match(email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    api_key, form_id = _kit_env()
    headers = {
        "Content-Type": "application/json",
        "X-Kit-Api-Key": api_key,
    }

    try:
        create_response = httpx.post(
            "https://api.kit.com/v4/subscribers",
            headers=headers,
            json={
                "first_name": name,
                "email_address": email,
                "fields": {
                    "company": company,
                    "interest": interest,
                    "message": message,
                    "source": "services-contact-form",
                },
            },
            timeout=10,
        )
        create_response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        logger.error(
            "Kit contact create failed: status=%s body=%s",
            exc.response.status_code,
            exc.response.text[:500],
        )
        raise HTTPException(
            status_code=502,
            detail=f"Kit returned {exc.response.status_code}",
        ) from exc
    except httpx.HTTPError as exc:
        logger.error("Kit contact create request failed: %s", exc)
        raise HTTPException(status_code=502, detail="Kit request failed") from exc

    subscriber_id = create_response.json().get("subscriber", {}).get("id")
    if subscriber_id:
        try:
            httpx.post(
                f"https://api.kit.com/v4/forms/{form_id}/subscribers/{subscriber_id}",
                headers=headers,
                json={},
                timeout=10,
            ).raise_for_status()
        except httpx.HTTPError:
            logger.exception("Kit contact form assignment failed")

        tag_id = os.getenv("CONVERTKIT_CONTACT_TAG_ID")
        if tag_id:
            try:
                httpx.post(
                    f"https://api.kit.com/v4/tags/{tag_id}/subscribers/{subscriber_id}",
                    headers=headers,
                    json={},
                    timeout=10,
                ).raise_for_status()
            except httpx.HTTPError:
                logger.exception("Kit contact tag assignment failed")

    return {"success": True}


@app.post("/v1/hermes/events")
def hermes_events(payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "accepted": True,
        "event_type": payload.get("type", "unknown"),
        "routing_note": "Wire this endpoint to the Hermes service when the central agent is deployed.",
    }


@app.post("/v1/research/deep")
async def start_deep_research(payload: DeepResearchRequest, request: Request) -> dict[str, str]:
    _require_backend_api_key(request)
    _exa_api_key()  # fail fast if the key is missing

    instructions = payload.instructions.strip()
    if not instructions:
        raise HTTPException(status_code=400, detail="instructions are required")

    model = payload.model or "exa-research-pro"
    job_id = uuid.uuid4().hex
    await _job_create(job_id, payload.topic.strip()[:300])
    # Fire-and-forget: returns immediately so the caller never blocks on the
    # minutes-long research run; the client polls the GET endpoint below.
    asyncio.create_task(_run_deep_research(job_id, instructions, model))
    return {"jobId": job_id, "status": "pending"}


@app.get("/v1/research/deep/{job_id}")
async def get_deep_research(job_id: str, request: Request) -> dict[str, Any]:
    _require_backend_api_key(request)
    job = await _job_get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Unknown research job")

    cost = job.get("cost_dollars")
    return {
        "jobId": job_id,
        "status": job.get("status", "unknown"),
        "report": job.get("report") or None,
        "error": job.get("error") or None,
        "costDollars": float(cost) if cost not in (None, "") else None,
    }
