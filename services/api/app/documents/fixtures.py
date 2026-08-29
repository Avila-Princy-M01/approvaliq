"""Fixture loader — reads document JSONs from data/seed/documents/.

All extraction is fixture-backed. The UI must display:
    "Demo fixture extraction — OCR not enabled."
Never claim OCR was run.
"""

from __future__ import annotations

import json
import pathlib
from functools import cache
from typing import Any

# Resolve path relative to this file: services/api/app/documents/ -> repo root
_REPO_ROOT = pathlib.Path(__file__).resolve().parents[4]
_SEED_DIR = _REPO_ROOT / "data" / "seed" / "documents"


@cache
def _load_json(filename: str) -> dict[str, Any]:
    path = _SEED_DIR / filename
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


def _load_json_fresh(filename: str) -> dict[str, Any]:
    """Bypass cache — used when pack metadata may change (tests, hot-reload)."""
    path = _SEED_DIR / filename
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


def load_document(document_id: str) -> dict[str, Any]:
    """Return the fixture for a single document. Raises FileNotFoundError if absent."""
    return _load_json(f"{document_id}.json")


def load_packs() -> dict[str, Any]:
    """Return the packs registry."""
    return _load_json("packs.json")


def load_pack(pack_id: str) -> dict[str, Any]:
    """Return pack metadata. Raises KeyError if pack_id unknown."""
    packs = load_packs()
    if pack_id not in packs:
        raise KeyError(f"Unknown document pack: {pack_id!r}")
    return packs[pack_id]


def load_pack_documents(pack_id: str) -> list[dict[str, Any]]:
    """Return list of loaded document dicts for every doc in the pack."""
    pack = load_pack(pack_id)
    docs = []
    for doc_id in pack["documents"]:
        try:
            docs.append(load_document(doc_id))
        except FileNotFoundError:
            # Fixture absent — treat as missing, don't crash
            pass
    return docs
