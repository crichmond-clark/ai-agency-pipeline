import json
import os
import time
from typing import Any, TypeVar

from openai import APIConnectionError, APIStatusError, APITimeoutError, InternalServerError, OpenAI, RateLimitError
from pydantic import BaseModel, ValidationError

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

TRANSIENT_ERRORS = (APIConnectionError, APITimeoutError, RateLimitError, InternalServerError)


class LlmNotConfigured(RuntimeError):
    pass


class ProviderError(RuntimeError):
    def __init__(self, category: str, message: str, status_code: int = 400):
        super().__init__(message)
        self.category = category
        self.status_code = status_code


def generate_structured_object(
    *,
    schema: type[T],
    task_name: str,
    system_prompt: str,
    user_payload: dict[str, Any],
    ai_config: Any | None = None,
) -> T:
    provider, model = _resolve_provider_model(task_name, ai_config)
    if provider == "deterministic":
        raise LlmNotConfigured("AI provider is deterministic")

    client = _client(provider)
    try:
        response = _with_single_retry(lambda: client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(user_payload, ensure_ascii=False)},
            ],
            response_format={"type": "json_object"},
            timeout=60,
        ))
        content = response.choices[0].message.content
        if not content:
            raise ProviderError("provider_invalid_output", "AI provider returned an empty response")
        return schema.model_validate_json(_extract_json(content))
    except ValidationError as exc:
        raise ProviderError("provider_invalid_output", f"AI provider returned invalid structured output: {exc}") from exc
    except TRANSIENT_ERRORS as exc:
        raise ProviderError(_transient_category(exc), f"AI provider request failed: {exc}") from exc
    except APIStatusError as exc:
        raise ProviderError("provider_request_failed", f"AI provider returned HTTP {exc.status_code}: {exc.message}") from exc


def refresh_model_catalog(provider: str) -> list[str]:
    if provider == "deterministic":
        return []
    client = _client(provider)
    try:
        models = _with_single_retry(lambda: client.models.list(timeout=30))
        return sorted(model.id for model in models.data if model.id)
    except TRANSIENT_ERRORS as exc:
        raise ProviderError(_transient_category(exc), f"Model catalog refresh failed: {exc}") from exc
    except APIStatusError as exc:
        raise ProviderError("provider_request_failed", f"Model catalog refresh returned HTTP {exc.status_code}: {exc.message}") from exc


def _resolve_provider_model(task_name: str, ai_config: Any | None) -> tuple[str, str]:
    provider = getattr(ai_config, "provider", None) or os.getenv("AI_PROVIDER", "deterministic")
    if provider == "deterministic":
        return provider, ""

    defaults = PROVIDER_DEFAULTS.get(provider)
    if not defaults:
        raise ProviderError("provider_not_configured", f"Unsupported AI provider: {provider}")

    model = getattr(ai_config, "model", None) or os.getenv(f"AI_{task_name.upper()}_MODEL") or os.getenv("AI_MODEL") or defaults["model"]
    if not model:
        raise ProviderError("validation_failed", f"Model is required for provider {provider}")
    return provider, model


def _client(provider: str) -> OpenAI:
    defaults = PROVIDER_DEFAULTS.get(provider)
    if not defaults:
        raise ProviderError("provider_not_configured", f"Unsupported AI provider: {provider}")

    api_key = _api_key(defaults["api_key_env"])
    base_url = os.getenv("AI_BASE_URL") or defaults["base_url"]
    if not api_key:
        raise ProviderError("provider_not_configured", f"Missing API key for {provider}")
    if provider == "openai-compatible" and not base_url:
        raise ProviderError("provider_not_configured", "AI_BASE_URL is required for openai-compatible provider")

    return OpenAI(api_key=api_key, base_url=base_url)


def _with_single_retry(operation):
    try:
        return operation()
    except TRANSIENT_ERRORS:
        time.sleep(1)
        return operation()


def _api_key(provider_env: str) -> str | None:
    return os.getenv(provider_env) or os.getenv("AI_API_KEY")


def _transient_category(error: Exception) -> str:
    if isinstance(error, APITimeoutError):
        return "provider_timeout"
    return "provider_request_failed"


def _extract_json(content: str) -> str:
    stripped = content.strip()
    if stripped.startswith("```"):
        stripped = stripped.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    return stripped
