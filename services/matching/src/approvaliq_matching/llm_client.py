"""Thin, provider-agnostic wrapper for structured LLM calls.

The reasoning layer (reasoner.py) depends only on `generate_structured`,
which enforces JSON-only output. Swapping providers should never require
changes outside this module.
"""

from __future__ import annotations

import json
import os
from typing import Any

import httpx

_PROVIDER = os.environ.get("LLM_PROVIDER", "gemini")
_API_KEY = os.environ.get("LLM_API_KEY", "")


class LLMError(RuntimeError):
    """Raised when the LLM call fails or returns non-conforming output."""


def generate_structured(prompt: str, *, timeout_s: float = 20.0) -> dict[str, Any]:
    """Call the configured LLM provider and parse the response as JSON.

    The prompt is expected to explicitly instruct the model to return
    JSON only, with no surrounding prose or markdown fences. Raises
    LLMError if the response cannot be parsed as JSON — callers should
    treat this as "no confirmed match" rather than retrying with a looser
    parser, since a loosely-parsed malformed response is exactly the kind
    of silent failure this service is designed to avoid.
    """
    raw_text = _dispatch(prompt, timeout_s=timeout_s)
    cleaned = raw_text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise LLMError(f"Model response was not valid JSON: {exc}") from exc


def _dispatch(prompt: str, *, timeout_s: float) -> str:
    if _PROVIDER == "gemini":
        return _call_gemini(prompt, timeout_s=timeout_s)
    if _PROVIDER == "groq":
        return _call_groq(prompt, timeout_s=timeout_s)
    if _PROVIDER == "anthropic":
        return _call_anthropic(prompt, timeout_s=timeout_s)
    if _PROVIDER == "openai":
        return _call_openai(prompt, timeout_s=timeout_s)
    raise LLMError(f"Unsupported LLM_PROVIDER: {_PROVIDER}")


def _call_gemini(prompt: str, *, timeout_s: float) -> str:
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-1.5-flash:generateContent?key={_API_KEY}"
    )
    response = httpx.post(
        url,
        json={"contents": [{"parts": [{"text": prompt}]}]},
        timeout=timeout_s,
    )
    response.raise_for_status()
    data = response.json()
    return data["candidates"][0]["content"]["parts"][0]["text"]


def _call_groq(prompt: str, *, timeout_s: float) -> str:
    url = "https://api.groq.com/openai/v1/chat/completions"

    payload = {
        "model": "openai/gpt-oss-20b",
        "messages": [
            {
                "role": "user",
                "content": prompt,
            }
        ],
        "response_format": {"type": "json_object"},
    }

    headers = {
        "Authorization": f"Bearer {_API_KEY}",
        "Content-Type": "application/json",
    }

    last_error = None

    for attempt in range(3):
        try:
            response = httpx.post(
                url,
                headers=headers,
                json=payload,
                timeout=timeout_s,
            )

            if response.status_code in (429, 500, 502, 503, 504):
                response.raise_for_status()

            response.raise_for_status()

            data = response.json()
            return data["choices"][0]["message"]["content"]

        except httpx.HTTPStatusError as exc:
            last_error = exc

            if attempt < 2:
                import time
                time.sleep(1 * (attempt + 1))
            else:
                raise LLMError(
                    f"Groq API failed after 3 attempts: "
                    f"{exc.response.status_code} {exc.response.text[:500]}"
                ) from exc

        except (httpx.TimeoutException, httpx.NetworkError) as exc:
            last_error = exc

            if attempt < 2:
                import time
                time.sleep(1 * (attempt + 1))
            else:
                raise LLMError(
                    f"Groq network failure after 3 attempts: {exc}"
                ) from exc

    raise LLMError(f"Groq request failed: {last_error}")

def _call_anthropic(prompt: str, *, timeout_s: float) -> str:
    response = httpx.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": _API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        json={
            "model": "claude-sonnet-4-6",
            "max_tokens": 1000,
            "messages": [{"role": "user", "content": prompt}],
        },
        timeout=timeout_s,
    )
    response.raise_for_status()
    return response.json()["content"][0]["text"]


def _call_openai(prompt: str, *, timeout_s: float) -> str:
    response = httpx.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {_API_KEY}"},
        json={
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": prompt}],
        },
        timeout=timeout_s,
    )
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]
