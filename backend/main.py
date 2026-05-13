import os
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


class ServiceRoute(BaseModel):
    app: str
    frontend_host: str | None
    logic_host: str
    role: str
    status: str


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


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


@app.post("/v1/hermes/events")
def hermes_events(payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "accepted": True,
        "event_type": payload.get("type", "unknown"),
        "routing_note": "Wire this endpoint to the Hermes service when the central agent is deployed.",
    }
