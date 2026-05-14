import os
import re
import time
import logging
from typing import Any

import httpx
from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


logger = logging.getLogger("silicon_stone_api")

SANITY_CATEGORIES_QUERY = """*[_type == "category"] | order(title asc) {
  _id,
  title,
  "slug": slug.current
}"""

SANITY_BRIEFINGS_QUERY = """*[_type == "article" && defined(slug.current)]
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


RATE_LIMITS: dict[str, list[float]] = {}
ALLOWED_SUBSCRIBE_TAGS = {"Tool_Lead", "WaymarkPath_Early_Access"}
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


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
def subscribe(payload: SubscribeRequest) -> dict[str, bool]:
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


@app.post("/v1/hermes/events")
def hermes_events(payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "accepted": True,
        "event_type": payload.get("type", "unknown"),
        "routing_note": "Wire this endpoint to the Hermes service when the central agent is deployed.",
    }
