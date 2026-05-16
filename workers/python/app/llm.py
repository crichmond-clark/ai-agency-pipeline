import json
import os
from typing import Any, TypeVar

from openai import OpenAI
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


PROVIDER_DEFAULTS = {
    "opencode-go": {
        "base_url": "https://opencode.ai/zen/go/v1",
        "api_key_env": "OPENCODE_API_KEY",
        "model": "glm-5.1",
    },
    "zai": {
        "base_url": "https://api.z.ai/api/coding/paas/v4",
        "api_key_env": "ZAI_API_KEY",
        "model": "glm-5.1",
    },
    "openrouter": {
        "base_url": "https://openrouter.ai/api/v1",
        "api_key_env": "OPENROUTER_API_KEY",
        "model": "z-ai/glm-4.5",
    },
    "openai-compatible": {
        "base_url": None,
        "api_key_env": "AI_API_KEY",
        "model": "gpt-4.1-mini",
    },
    "openai": {
        "base_url": None,
        "api_key_env": "OPENAI_API_KEY",
        "model": "gpt-4.1-mini",
    },
}


class LlmNotConfigured(RuntimeError):
    pass


def generate_structured_object(
    *,
    schema: type[T],
    task_name: str,
    system_prompt: str,
    user_payload: dict[str, Any],
) -> T:
    provider = os.getenv("AI_PROVIDER", "deterministic")
    if provider == "deterministic":
        raise LlmNotConfigured("AI_PROVIDER is deterministic")

    defaults = PROVIDER_DEFAULTS.get(provider)
    if not defaults:
        raise LlmNotConfigured(f"Unsupported AI_PROVIDER: {provider}")

    api_key = _api_key(defaults["api_key_env"])
    base_url = os.getenv("AI_BASE_URL") or defaults["base_url"]
    model = os.getenv(f"AI_{task_name.upper()}_MODEL") or os.getenv("AI_MODEL") or defaults["model"]
    if not api_key:
        raise LlmNotConfigured(f"Missing API key for {provider}")
    if provider == "openai-compatible" and not base_url:
        raise LlmNotConfigured("AI_BASE_URL is required for openai-compatible provider")

    client = OpenAI(api_key=api_key, base_url=base_url)
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": json.dumps(user_payload, ensure_ascii=False)},
        ],
        response_format={"type": "json_object"},
    )
    content = response.choices[0].message.content
    if not content:
        raise ValueError("AI provider returned an empty response")

    return schema.model_validate_json(_extract_json(content))


def _api_key(provider_env: str) -> str | None:
    return os.getenv(provider_env) or os.getenv("AI_API_KEY")


def _extract_json(content: str) -> str:
    stripped = content.strip()
    if stripped.startswith("```"):
        stripped = stripped.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    return stripped
