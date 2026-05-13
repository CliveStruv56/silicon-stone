import os
from typing import Any

import httpx
from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


SANITY_CATEGORIES_QUERY = """*[_type == "category"] | order(title asc) {
  _id,
  title,
  "slug": slug.current
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


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def _sanity_env() -> tuple[str, str, str, str | None]:
    project_id = os.getenv("NEXT_PUBLIC_SANITY_PROJECT_ID", "")
    dataset = os.getenv("NEXT_PUBLIC_SANITY_DATASET", "production")
    api_version = os.getenv("NEXT_PUBLIC_SANITY_API_VERSION", "2026-01-13")
    token = os.getenv("SANITY_API_READ_TOKEN")

    if not project_id:
        raise HTTPException(status_code=503, detail="Sanity project is not configured")

    return project_id, dataset, api_version, token


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
    project_id, dataset, api_version, token = _sanity_env()
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    url = f"https://{project_id}.api.sanity.io/v{api_version}/data/query/{dataset}"

    try:
        response = httpx.get(
            url,
            params={"query": SANITY_CATEGORIES_QUERY},
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

    result = response.json().get("result", [])
    return [
        Category(id=item.get("_id", ""), title=item.get("title", ""), slug=item.get("slug", ""))
        for item in result
        if item.get("_id") and item.get("title") and item.get("slug")
    ]


@app.post("/v1/hermes/events")
def hermes_events(payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "accepted": True,
        "event_type": payload.get("type", "unknown"),
        "routing_note": "Wire this endpoint to the Hermes service when the central agent is deployed.",
    }
