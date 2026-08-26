"""Environment-driven configuration for the API service."""

from __future__ import annotations

import os
from functools import lru_cache

from pydantic import BaseModel


class Settings(BaseModel):
    database_url: str
    matching_service_url: str
    log_level: str = "INFO"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings(
        database_url=os.environ.get(
            "DATABASE_URL", "postgresql+psycopg://approvaliq:approvaliq@localhost:5432/approvaliq"
        ),
        matching_service_url=os.environ.get("MATCHING_SERVICE_URL", "http://localhost:8100"),
        log_level=os.environ.get("LOG_LEVEL", "INFO"),
    )
