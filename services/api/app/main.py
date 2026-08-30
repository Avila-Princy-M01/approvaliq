"""FastAPI application entry point."""

from __future__ import annotations

from fastapi import FastAPI

from .database import _engine
from .models import Base
from .routers import audit, checklist, reuse, review_queue, simulation, validation

app = FastAPI(title="ApprovalIQ API", version="0.1.0")

app.include_router(checklist.router)
app.include_router(validation.router)
app.include_router(reuse.router)
app.include_router(review_queue.router)
app.include_router(audit.router)
app.include_router(simulation.router)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=_engine)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
