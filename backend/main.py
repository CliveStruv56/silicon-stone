import os
import re
import json
import time
import uuid
import hashlib
import asyncio
import logging
from datetime import datetime, timedelta, timezone
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


logging.basicConfig(level=logging.INFO)
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


class UsageEvent(BaseModel):
    # One metered external-API call. Posted by the Next.js call sites (and by
    # the deep-research worker below). Cost is computed caller-side from a price
    # table; we just store and aggregate. Field names are camelCase to match the
    # frontend payload verbatim.
    service: str
    model: str
    operation: str
    inputTokens: int | None = None
    outputTokens: int | None = None
    costDollars: float = 0.0
    jobId: str | None = None
    ts: str | None = None


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


def _client_ip(request: Request) -> str:
    # Behind the Railway proxy, x-forwarded-for's first entry is the client IP.
    # Keyed instead of the user-supplied email so an attacker can't rotate the
    # email per request to mint a fresh bucket each time.
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def _check_rate_limit(key: str, limit: int, window_seconds: int) -> int | None:
    # NOTE: in-memory and per-process. With >1 replica the effective limit is
    # limit * replicas; move to the shared Redis store for strict limiting.
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
DEEP_RESEARCH_MAX_TOPIC_CHARS = 300
DEEP_RESEARCH_MAX_INSTRUCTION_CHARS = 20_000
DEEP_RESEARCH_START_LIMIT = 3
DEEP_RESEARCH_START_WINDOW_SECONDS = 60 * 60
DEEP_RESEARCH_MAX_ACTIVE_JOBS = 2

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


def _store_mode() -> str:
    """Which job store is active: 'redis' when REDIS_URL is set, else 'memory'."""
    return "redis" if (REDIS_URL and aioredis is not None) else "memory"


def _exa_api_key() -> str:
    key = os.getenv("EXA_API_KEY", "")
    if not key:
        raise HTTPException(status_code=503, detail="Exa API key is not configured")
    return key


def _job_key(job_id: str) -> str:
    return f"research:job:{job_id}"


def _deep_research_hash(topic: str, instructions: str) -> str:
    digest = hashlib.sha256(f"{topic}\n\n{instructions}".encode("utf-8")).hexdigest()
    return digest[:32]


def _deep_research_idempotency_key(digest: str) -> str:
    return f"research:active-hash:{digest}"


async def _require_deep_research_budget(request: Request, digest: str) -> str | None:
    redis = _get_redis()
    if redis is None:
        raise HTTPException(status_code=503, detail="Deep research budget store is not configured")

    existing_job_id = await redis.get(_deep_research_idempotency_key(digest))
    if existing_job_id:
        return str(existing_job_id)

    active_count = await redis.scard("research:active-jobs")
    if active_count >= DEEP_RESEARCH_MAX_ACTIVE_JOBS:
        raise HTTPException(status_code=429, detail="Too many active deep research jobs")

    key = f"research:starts:{_client_ip(request)}"
    count = await redis.incr(key)
    if count == 1:
        await redis.expire(key, DEEP_RESEARCH_START_WINDOW_SECONDS)
    if count > DEEP_RESEARCH_START_LIMIT:
        ttl = await redis.ttl(key)
        raise HTTPException(
            status_code=429,
            detail="Too many deep research starts",
            headers={"Retry-After": str(max(1, ttl))},
        )

    return None


async def _deep_research_mark_active(job_id: str, digest: str) -> None:
    redis = _get_redis()
    if redis is None:
        return
    await redis.sadd("research:active-jobs", job_id)
    await redis.expire("research:active-jobs", RESEARCH_JOB_TTL_SECONDS)
    await redis.set(_deep_research_idempotency_key(digest), job_id, ex=RESEARCH_JOB_TTL_SECONDS)
    await _job_update(job_id, digest=digest)


async def _deep_research_mark_finished(job_id: str) -> None:
    redis = _get_redis()
    if redis is None:
        return
    job = await _job_get(job_id)
    digest = job.get("digest") if job else None
    await redis.srem("research:active-jobs", job_id)
    if digest:
        await redis.delete(_deep_research_idempotency_key(str(digest)))


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
        await _deep_research_mark_finished(job_id)
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
                    logger.info(
                        "deep research job %s completed via Exa (research_id=%s, store=%s, cost=%s)",
                        job_id, research_id, _store_mode(), cost,
                    )
                    # Record spend in the usage ledger. The frontend only polls
                    # when the backend runs the job, so it can't log this itself.
                    await _record_exa_usage("deep-research", model, cost, job_id)
                    await _deep_research_mark_finished(job_id)
                    return
                if status in ("failed", "canceled"):
                    await _job_update(
                        job_id,
                        status="failed",
                        error=data.get("error", f"research {status}"),
                    )
                    await _deep_research_mark_finished(job_id)
                    return

            await _job_update(job_id, status="failed", error="Deep research timed out")
            await _deep_research_mark_finished(job_id)
    except httpx.HTTPStatusError as exc:
        logger.error("Exa research failed: status=%s body=%s", exc.response.status_code, exc.response.text[:500])
        await _job_update(job_id, status="failed", error=f"Exa returned {exc.response.status_code}")
        await _deep_research_mark_finished(job_id)
    except httpx.HTTPError as exc:
        logger.error("Exa research request failed: %s", exc)
        await _job_update(job_id, status="failed", error="Exa request failed")
        await _deep_research_mark_finished(job_id)
    except Exception as exc:  # noqa: BLE001 — never let a worker crash silently
        logger.exception("Deep research job crashed")
        await _job_update(job_id, status="failed", error=str(exc))
        await _deep_research_mark_finished(job_id)


# --- API usage ledger ---------------------------------------------------------
# Records one event per metered external call (Claude / OpenAI / Exa) so the
# admin analytics dashboard can show spend and token totals. Same storage shape
# as the research job store: Redis when REDIS_URL is set (durable, replica-
# shared), in-process dict otherwise. Events are bucketed by UTC day for cheap
# range aggregation; a `usage:days` set indexes which day buckets exist so the
# "all" period can be reconstructed without scanning the keyspace.
USAGE_EVENT_TTL_SECONDS = 60 * 60 * 24 * 400  # ~13 months of history
USAGE_DAYS_KEY = "usage:days"

# In-memory fallback store (used only when Redis is not configured): day -> events.
USAGE_EVENTS: dict[str, list[dict[str, Any]]] = {}


def _usage_day_key(day: str) -> str:
    return f"usage:events:{day}"


def _event_day(event: dict[str, Any]) -> str:
    """UTC day (YYYY-MM-DD) for an event, from its `ts` or now."""
    ts = event.get("ts")
    if isinstance(ts, str) and len(ts) >= 10:
        return ts[:10]
    return datetime.now(timezone.utc).date().isoformat()


async def _usage_store(event: dict[str, Any]) -> None:
    day = _event_day(event)
    redis = _get_redis()
    if redis is not None:
        key = _usage_day_key(day)
        await redis.rpush(key, json.dumps(event))
        await redis.expire(key, USAGE_EVENT_TTL_SECONDS)
        await redis.sadd(USAGE_DAYS_KEY, day)
        return
    USAGE_EVENTS.setdefault(day, []).append(event)


async def _usage_events_for_day(day: str) -> list[dict[str, Any]]:
    redis = _get_redis()
    if redis is not None:
        raw = await redis.lrange(_usage_day_key(day), 0, -1)
        out: list[dict[str, Any]] = []
        for item in raw:
            try:
                out.append(json.loads(item))
            except (ValueError, TypeError):
                continue
        return out
    return USAGE_EVENTS.get(day, [])


async def _usage_all_days() -> list[str]:
    redis = _get_redis()
    if redis is not None:
        return sorted(await redis.smembers(USAGE_DAYS_KEY))
    return sorted(USAGE_EVENTS.keys())


async def _usage_days_for_period(period: str) -> list[str]:
    """Ordered day buckets to aggregate. Fixed windows include zero-cost days so
    the trend chart shows gaps; 'all' returns only days that have data."""
    today = datetime.now(timezone.utc).date()
    if period == "all":
        return await _usage_all_days()

    if period == "7d":
        start = today - timedelta(days=6)
    elif period == "30d":
        start = today - timedelta(days=29)
    else:  # "mtd" (default)
        start = today.replace(day=1)

    span = (today - start).days
    return [(start + timedelta(days=i)).isoformat() for i in range(span + 1)]


async def _record_exa_usage(operation: str, model: str, cost: Any, job_id: str | None = None) -> None:
    """Best-effort usage write for backend-run Exa work; never raises."""
    try:
        await _usage_store(
            {
                "service": "exa",
                "model": model,
                "operation": operation,
                "costDollars": float(cost) if cost not in (None, "") else 0.0,
                "jobId": job_id,
                "ts": datetime.now(timezone.utc).isoformat(),
            }
        )
    except Exception:  # noqa: BLE001 — usage logging must never break the worker
        logger.exception("usage record failed for %s", operation)


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

def _validate_origins(origins: list[str]) -> list[str]:
    # With allow_credentials=True a wildcard "*" is invalid and unsafe, and the
    # browser requires exact, well-formed origins. Drop anything else.
    valid = [o for o in origins if o.startswith(("http://", "https://")) and o != "*"]
    dropped = [o for o in origins if o not in valid]
    if dropped:
        logger.warning("Ignoring invalid/unsafe CORS origins: %s", dropped)
    return valid


_raw_origins = os.getenv("ALLOWED_ORIGINS")
allowed_origins = _validate_origins(_split_csv(_raw_origins or "http://localhost:3000"))
if not _raw_origins:
    logger.warning("ALLOWED_ORIGINS not set; defaulting to http://localhost:3000 — set it explicitly in production.")
if not allowed_origins:
    logger.error("No valid ALLOWED_ORIGINS configured; browser requests will be blocked by CORS.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

logger.info("research job store: %s", _store_mode())


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

    # Validate before consuming a rate-limit slot so malformed input can't burn quota.
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    if not EMAIL_RE.match(email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    retry_after = _check_rate_limit(f"subscribe:{_client_ip(request)}", limit=10, window_seconds=15 * 60)
    if retry_after is not None:
        raise HTTPException(
            status_code=429,
            detail="Too many requests",
            headers={"Retry-After": str(retry_after)},
        )

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

    # Validate before consuming a rate-limit slot so malformed input can't burn quota.
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    if not name:
        raise HTTPException(status_code=400, detail="Name is required")

    if not EMAIL_RE.match(email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    retry_after = _check_rate_limit(f"contact:{_client_ip(request)}", limit=5, window_seconds=15 * 60)
    if retry_after is not None:
        raise HTTPException(
            status_code=429,
            detail="Too many requests",
            headers={"Retry-After": str(retry_after)},
        )

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

    topic = payload.topic.strip()[:DEEP_RESEARCH_MAX_TOPIC_CHARS]
    instructions = payload.instructions.strip()
    if not instructions:
        raise HTTPException(status_code=400, detail="instructions are required")
    if len(instructions) > DEEP_RESEARCH_MAX_INSTRUCTION_CHARS:
        raise HTTPException(status_code=413, detail="instructions are too large")

    model = payload.model or "exa-research-pro"
    digest = _deep_research_hash(topic, instructions)
    existing_job_id = await _require_deep_research_budget(request, digest)
    if existing_job_id:
        return {"jobId": existing_job_id, "status": "pending"}

    job_id = uuid.uuid4().hex
    await _job_create(job_id, topic)
    await _deep_research_mark_active(job_id, digest)
    logger.info("deep research job %s started (store=%s)", job_id, _store_mode())
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


@app.post("/v1/usage")
async def record_usage(payload: UsageEvent, request: Request) -> dict[str, bool]:
    _require_backend_api_key(request)
    event = payload.model_dump()
    if not event.get("ts"):
        event["ts"] = datetime.now(timezone.utc).isoformat()
    await _usage_store(event)
    return {"ok": True}


@app.get("/v1/usage/summary")
async def usage_summary(request: Request, period: str = "mtd") -> dict[str, Any]:
    _require_backend_api_key(request)

    if period not in ("7d", "30d", "mtd", "all"):
        period = "mtd"

    days = await _usage_days_for_period(period)

    by_service: dict[str, dict[str, Any]] = {}
    daily: list[dict[str, Any]] = []
    total_cost = 0.0
    total_calls = 0

    for day in days:
        day_cost = 0.0
        for event in await _usage_events_for_day(day):
            service = event.get("service") or "unknown"
            cost = float(event.get("costDollars") or 0)
            agg = by_service.setdefault(
                service,
                {"service": service, "calls": 0, "inputTokens": 0, "outputTokens": 0, "costDollars": 0.0},
            )
            agg["calls"] += 1
            agg["inputTokens"] += int(event.get("inputTokens") or 0)
            agg["outputTokens"] += int(event.get("outputTokens") or 0)
            agg["costDollars"] += cost
            day_cost += cost
            total_cost += cost
            total_calls += 1
        daily.append({"date": day, "costDollars": round(day_cost, 6)})

    for agg in by_service.values():
        agg["costDollars"] = round(agg["costDollars"], 6)

    return {
        "period": period,
        "totalCostDollars": round(total_cost, 6),
        "totalCalls": total_calls,
        "byService": sorted(by_service.values(), key=lambda s: s["costDollars"], reverse=True),
        "daily": daily,
    }
