# AI Provider Selection Plan

## Table of Contents

- [1. Problem Statement](#1-problem-statement)
- [2. Goals & Non-Goals](#2-goals-non-goals)
- [3. Proposed Architecture](#3-proposed-architecture)
- [4. Component Breakdown](#4-component-breakdown)
- [5. Data Flow](#5-data-flow)
- [6. Interface Contracts](#6-interface-contracts)
- [7. File Changes](#7-file-changes)
- [8. Implementation Phases](#8-implementation-phases)
- [9. Testing Strategy](#9-testing-strategy)
- [10. Security Implications](#10-security-implications)
- [11. Risks & Tradeoffs](#11-risks-tradeoffs)
- [12. Open Questions](#12-open-questions)

## 1. Problem Statement

AI provider and model selection is currently controlled by environment variables only. That is safe for secrets, but awkward for day-to-day admin use because changing models requires editing `.env` and restarting services. The Admin User needs to choose global AI defaults and optionally override provider/model per generation run from the frontend/admin UI, while API keys remain server-side secrets.

## 2. Goals & Non-Goals

Goals:

- Add admin-editable global AI provider/model defaults.
- Add optional per-operation provider/model defaults for profile, demo content, QA, and outreach, allowing different operations to use different providers/models.
- Allow per-run provider/model overrides from generation actions.
- Keep provider API keys in `.env`; never store or expose secret values in Payload documents or browser responses.
- Support at minimum `opencode-go`, `zai`, `openrouter`, `openai`, `openai-compatible`, and `deterministic`.
- Keep the Python AI Service as the owner of model calls and structured output validation.
- Record selected provider/model metadata on Workflow Runs for traceability.
- Treat per-run overrides as one execution only; do not persist them as Lead, Demo Site, Business Profile, or Outreach Draft preferences.
- Preserve deterministic fallback only when deterministic is explicitly selected.

Non-Goals:

- No frontend editing of API keys.
- No OAuth/subscription-login model access.
- No requirement that every provider support live model catalog syncing; unsupported providers use curated defaults and manual model entry.
- No per-user API keys.
- No cost tracking beyond workflow metadata.
- No frontend/admin tuning for temperature, max tokens, top-p, or other generation parameters in this pass; keep safe per-task defaults in Python.
- No custom visual dashboard polish beyond the simplest admin/frontend controls needed to trigger the flow.

## 3. Proposed Architecture

Use both global defaults and per-run overrides.

Secrets stay in environment variables:

```txt
OPENCODE_API_KEY
ZAI_API_KEY
OPENROUTER_API_KEY
OPENAI_API_KEY
AI_API_KEY
```

Non-secret selection state lives in a Payload Global:

```txt
AiSettings Global
  default_provider
  default_model
  profile_provider
  profile_model
  demo_content_provider
  demo_content_model
  qa_provider
  qa_model
  outreach_provider
  outreach_model
```

Use a singleton collection only as a fallback if Payload Global local API typing becomes unexpectedly awkward during implementation.

Generation requests may include a non-secret override. When a per-run override is present, provider and model are treated as a pair; provider is required, and model is required unless provider is `deterministic`.

```json
{
  "ai": {
    "provider": "openrouter",
    "model": "z-ai/glm-4.5"
  }
}
```

Resolution order:

```txt
request override > Payload AI Settings per-operation default > Payload AI Settings global default > environment provider/model bootstrap fallback > deterministic fallback
```

After AI Settings are configured, Payload is the primary source for provider/model selection. Environment provider/model variables remain a bootstrap/fallback mechanism only; API keys remain environment-only.

Payload/Next resolves the non-secret provider/model selection and sends it to the Python AI Service in each request. Python validates the provider against its allowlist, looks up the matching server-side API key from environment variables, and calls the provider.

This preserves ADR 0014/0017: Python owns model calls; Payload owns workflow state and admin actions.

## 4. Component Breakdown

- `AiSettings` Payload Global: stores non-secret provider/model defaults and cached provider model lists where available.
- AI model configuration constants: shared TypeScript provider/model options for admin fields, curated fallback suggestions, and request validation.
- Model catalog refresh service: Python AI Service performs provider model discovery using documented catalog APIs where available, or a generic OpenAI-compatible `/models` request against the provider's server-side configured base URL. Next requests refresh and caches returned model IDs in Payload settings without exposing API keys.
- Admin/frontend controls: Payload Global settings for defaults, plus a minimal authenticated custom review route for per-run provider/model overrides and generation buttons. Use basic global settings first and advanced per-operation/per-run controls without dominating the workflow.
- API routes: parse optional per-run provider/model override, merge with saved settings, and pass selection to `lib/ai-service-client.ts`.
- AI service client: includes provider/model selection in request bodies.
- Python schemas: add optional `ai_config` to profile, demo content, QA, and outreach request schemas.
- Python provider client: accept request-level provider/model overrides before falling back to environment defaults, enforce a modest timeout, and retry once for transient provider/network failures only.
- Workflow Runs: save provider/model metadata and clear error category/message for successful and failed AI operations. This is audit/provenance only; it does not become a future preference for the Lead or generated artifact.

## 5. Data Flow

Global default flow:

```txt
Admin edits AI Settings in Payload
→ Admin clicks Generate Profile / Generate Demo Content / Run QA / Generate Outreach Draft
→ Next API route loads AI Settings
→ Next API route sends lead/content plus resolved provider/model to Python AI Service
→ Python uses matching server-side API key from env
→ Python returns validated structured JSON
→ Next validates with Zod and saves output
→ Workflow Run records provider/model metadata
```

Per-run override flow:

```txt
Admin selects provider/model in action UI
→ Browser POST includes { ai: { provider, model } }
→ Next validates selection against allowlist
→ Request override wins over saved default
→ Same Python generation flow continues
```

Fallback flow:

```txt
Provider is explicitly deterministic
→ Python deterministic fallback generates safe output
→ Workflow Run metadata records deterministic mode
```

Missing provider key flow:

```txt
Admin explicitly selects opencode-go, zai, openrouter, openai, or openai-compatible
→ Matching server-side API key or base URL is missing/invalid
→ Python returns a provider-configuration error
→ Next records a failed Workflow Run with provider/model metadata
```

Explicit non-deterministic provider selection must never silently fall back to deterministic output.

## 6. Interface Contracts

- Payload Global: `ai-settings`
  - Access: Admin User only for read and write. If the current MVP has no role field yet, enforce authenticated access now and tighten to explicit admin roles when roles are introduced.
  - Fields:
    - `default_provider`: enum `deterministic | opencode-go | zai | openrouter | openai | openai-compatible`
    - `default_model`: string optional when provider is deterministic, required otherwise
    - `profile_provider`: enum optional
    - `profile_model`: string optional
    - `demo_content_provider`: enum optional
    - `demo_content_model`: string optional
    - `qa_provider`: enum optional
    - `qa_model`: string optional
    - `outreach_provider`: enum optional
    - `outreach_model`: string optional
    - per-operation model fields are required when their matching provider field is a non-deterministic provider; model may be blank for deterministic provider; if provider is blank, the pair is ignored and global defaults are used
    - `openai_compatible_base_url_label`: optional non-secret note/name only; actual `AI_BASE_URL` stays in `.env`
    - `provider_model_cache`: provider-keyed cached model IDs/suggestions
    - `provider_model_cache_refreshed_at`: timestamp for the last successful refresh
  - Output: non-secret settings available to authenticated Admin Users.

- Next API route request bodies:
  - Existing generation routes accept optional body:
    ```ts
    type AiSelectionOverride = {
      ai?:
        | { provider: 'deterministic'; model?: string }
        | { provider: Exclude<AiProvider, 'deterministic'>; model: string }
    }
    ```
  - Error cases:
    - unknown provider: `400`
    - missing model for non-deterministic per-run override: `400`
    - provider not configured: `400` with `provider_not_configured`
    - provider request failed: `400` with `provider_request_failed`
    - provider timeout: `400` with `provider_timeout`
    - provider invalid output: `400` with `provider_invalid_output`
    - validation failed: `400` with `validation_failed`
    - unauthenticated: `401`
    - generation conflict remains existing `409` where applicable

- `lib/ai-service-client.ts`:
  - `requestBusinessProfile(lead, aiConfig?)`
  - `requestDemoContent(input, aiConfig?)`
  - `requestAiQa(input, aiConfig?)`
  - `requestOutreachDraft(input, aiConfig?)`

- Python request schemas:
  - Add:
    ```py
    class AiConfig(BaseModel):
        provider: str | None = None
        model: str | None = None
    ```
  - Each AI endpoint request includes `ai_config: AiConfig | None = None`.

- Workflow metadata:
  - Add metadata keys where known:
    ```json
    {
      "ai_provider": "openrouter",
      "ai_model": "z-ai/glm-4.5",
      "ai_source": "request_override|settings|env|deterministic"
    }
    ```

## 7. File Changes

Create:

- `globals/AiSettings.ts` — non-secret AI provider/model settings.
- `lib/ai-provider-options.ts` — TypeScript provider allowlist, curated fallback model suggestions, and validation helpers.
- `lib/ai-model-catalog.ts` — Next-side request/cache helpers for model catalog refresh, calling Python rather than providers directly.
- `lib/ai-settings.ts` — load settings and resolve per-task provider/model config.
- `app/dashboard/leads/page.tsx` — minimal authenticated workflow-oriented Lead list dashboard for entering review/action flows. Show business name, city, pipeline status, sales status, demo approval state, latest Demo Site link/status, latest Workflow Run status/error, and a Review button.
- `app/dashboard/review/[leadId]/page.tsx` — minimal authenticated review/action route for a Lead.
- `components/admin/AiRunControls.tsx` or equivalent minimal client component — per-run selector UI and generation buttons for the custom review route.

Modify:

- `payload.config.ts` — register the `AiSettings` Global.
- `lib/ai-service-client.ts` — send optional `ai_config` to Python.
- `app/api/leads/[leadId]/generate-profile/route.ts` — parse override, resolve settings, pass config, record metadata.
- `app/api/leads/[leadId]/generate-demo-content/route.ts` — same.
- `app/api/demo-sites/[demoSiteId]/run-qa/route.ts` — same.
- `app/api/leads/[leadId]/generate-outreach-draft/route.ts` — same.
- `workers/python/app/schemas.py` — add `AiConfig` and request fields.
- `workers/python/app/llm.py` — accept request-level provider/model overrides, refresh provider model catalogs where supported, and return selected config metadata if needed.
- `.env.example` — clarify env keys store secrets only; frontend controls store provider/model names only.
- `docs/ai-demo-pipeline-plan.md` — reference admin-selectable AI settings.

Delete:

- None.

## 8. Implementation Phases

### Phase A — Settings model, curated suggestions, and resolver

Commit: `feat(ai): add admin model settings`

- Add Payload Global AI settings storage for non-secret provider/model names.
- Include basic global default provider/model fields and advanced per-operation provider/model override pairs, allowing QA/outreach/generation to use different providers/models when useful.
- Add fields for cached provider model lists and last refresh timestamp.
- Add TypeScript provider allowlist, curated model suggestions, resolver, and settings validation rules for provider/model pairs.
- Register settings in Payload config.
- Keep existing environment provider/model behavior as bootstrap/fallback only; Payload AI Settings become primary once configured.

Done when: AI settings can be edited in Payload admin and resolver unit/compile checks pass.

### Phase B — Request overrides through Next routes

Commit: `feat(ai): pass provider selection to service`

- Update AI service client signatures.
- Update generation/QA/outreach routes to parse optional request override.
- Load global settings and resolve final provider/model per task.
- Record selected provider/model in Workflow Run metadata.

Done when: existing routes still work without a body, and they accept a valid `{ ai: { provider, model } }` override.

### Phase C — Python request-level provider selection

Commit: `feat(ai-service): support request model overrides`

- Add Pydantic `AiConfig` to request schemas.
- Update `generate_structured_object` to accept provider/model overrides.
- Add a modest provider request timeout, e.g. 60s.
- Retry once for transient timeout, 429, 5xx, or network failures.
- Do not retry invalid JSON, schema validation failures, unsupported provider, missing key, or missing model errors.
- Do not auto-switch providers/models.
- Preserve deterministic fallback only when deterministic is explicitly selected.
- Ensure provider keys are read only from environment variables.

Done when: Python compile checks pass and deterministic mode still works without API keys.

### Phase D — Provider catalog refresh and minimal frontend controls

Commit: `feat(admin): add per-run ai model controls`

- Add Python AI Service model catalog refresh for providers with practical model-list APIs.
- For OpenAI-compatible providers without a separate documented catalog API, Python attempts a generic `GET /models` request against the provider's server-side configured base URL.
- Add a Next API route/helper that asks Python to refresh a provider's catalog and caches refreshed model IDs in AI Settings.
- Trigger catalog refresh manually only via an Admin User action, not automatically on page load, startup, schedule, or generation failure.
- If refresh fails because auth/config/provider is unavailable, keep any existing cache, return an admin-visible warning, and continue to show curated suggestions plus manual model entry.
- Add a simple authenticated dashboard Lead list route, e.g. `/dashboard/leads`, that links into `/dashboard/review/[leadId]`, rather than deeply customising Payload admin collection views in the first pass.
- The UI should show provider dropdown and model input backed by cached provider suggestions plus curated fallbacks.
- The review route should show generation/QA/outreach action buttons with prerequisite-aware disabled states and clear reasons, rather than allowing known-invalid calls.
- The UI should surface provider/model failures inline or as a toast/banner when possible. Minimum implementation must expose clear API errors and Workflow Run details.
- Manual model ID entry remains allowed.
- Do not display or edit API keys.

Done when: an Admin User can refresh supported provider model lists and trigger at least profile/demo generation with a chosen provider/model from the frontend.

### Phase E — Validation and docs

Commit: `docs(ai): document model selection workflow`

- Run lint/build/Python compile checks.
- Update `.env.example` comments.
- Update `docs/ai-demo-pipeline-plan.md`.
- Copy plan docs to `/mnt/d/docs/miku/Plans/`.

Done when: validation passes and docs explain global defaults, per-run overrides, and secret handling.

## 9. Testing Strategy

- Static checks:
  - `npm run lint`
  - `npm run build`
  - `python3 -m py_compile workers/python/app/main.py workers/python/app/schemas.py workers/python/app/llm.py workers/python/app/jobs/*.py`

- Manual deterministic path:
  - Set `AI_PROVIDER=deterministic`.
  - Trigger profile/demo/QA/outreach without request override.
  - Confirm deterministic output and Workflow Run metadata.

- Manual provider path:
  - Set one key, e.g. `OPENROUTER_API_KEY`.
  - Select `openrouter` and a valid model from UI/request body.
  - Confirm structured output validates and saves.

- Manual override precedence:
  - Configure global default as one provider/model.
  - Send request override as another provider/model.
  - Confirm Workflow Run metadata records the override.

- Security regression:
  - Confirm API keys do not appear in Payload documents, browser responses, Workflow Run metadata, or logs.

## 10. Security Implications

- API keys remain only in environment variables and are never editable in Payload admin.
- Provider/model names are non-secret but should still be validated against an allowlist to avoid unexpected outbound destinations.
- `openai-compatible` should only use the server-side `AI_BASE_URL`; do not accept arbitrary base URLs from request bodies.
- Model catalog refresh may call generic OpenAI-compatible `/models`, but only against server-side configured provider base URLs. The frontend must not supply catalog URLs or base URLs.
- Model catalog refresh failures must not clear existing cache or block manual model entry.
- Do not require catalog metadata proving structured-output support in the first pass. Any allowed provider with a non-empty model may be selected; invalid provider output must fail through Pydantic/Zod validation and Workflow Run error recording.
- Only Admin Users should read or modify AI settings or call generation routes. The current solo-admin MVP may enforce authenticated-only access without adding roles in this feature; explicit role-based access should be handled in a later auth hardening phase.
- Workflow metadata must record provider/model names only, never headers or keys.

## 11. Risks & Tradeoffs

- Payload admin may not provide a nice button/action UI without custom views. Mitigation: use a small custom authenticated Next route/component for run controls.
- Model names change by provider. Mitigation: use a hybrid catalog: cached provider-sync where supported, curated fallbacks, and manual text entry.
- Request overrides add complexity to route bodies. Mitigation: keep the shape tiny and optional.
- Missing provider keys can surprise the user. Mitigation: explicit failure for non-deterministic providers, with clear error/metadata in Workflow Runs.
- `openai-compatible` base URL remains env-only, so frontend can select the model but not the endpoint. This is intentional for safety.

## 12. Open Questions

- Resolved: missing API keys for explicitly selected non-deterministic providers should fail the Workflow Run with an admin-visible provider-configuration error, not silently fall back.
- Resolved: per-run overrides are one execution only and should be recorded in Workflow Run metadata, not persisted as future preferences on Leads or generated artifacts.
- Resolved: model selection should use a hybrid catalog: cached provider sync where supported, generic OpenAI-compatible `/models` refresh against server-side provider base URLs, curated fallback suggestions, and manual model ID input.
- Resolved: model refresh failures should keep any existing cache, show an admin-visible warning, and leave curated suggestions/manual input available.
- Resolved: selection scope should support global defaults, per-operation default override pairs, and optional per-run override pairs. UI should show global defaults first and keep per-operation/per-run controls advanced.
- Resolved: per-run and per-operation overrides should provide provider/model as a pair; provider is required, and model is required unless provider is deterministic.
- Resolved: global and per-operation non-deterministic providers require a model; deterministic providers may leave model blank. If a per-operation provider is blank, ignore the whole per-operation pair and use the global default.
- Resolved: QA, outreach, profile generation, and demo content generation may use different per-operation providers/models because their cost, quality, latency, and safety needs differ.
- Resolved: do not expose temperature, max tokens, top-p, or similar generation parameters in this pass; keep safe per-task defaults in Python.
- Resolved: Python AI Service should perform model catalog refresh because it already owns provider integrations, base URLs, API key lookup, retries, and timeouts. Next requests refresh and caches the non-secret returned model IDs in Payload AI Settings.
- Resolved: model catalog refresh should be manual only for now, triggered by an Admin User action. Do not refresh automatically on page load, startup, schedule, or generation failure.
- Resolved: do not track or require structured-output support metadata in the first pass. Any allowed provider with a non-empty model may be selected; invalid provider output should fail through existing Pydantic/Zod validation and Workflow Run error recording.
- Resolved: Payload AI Settings should be primary for provider/model selection once configured; environment provider/model values are bootstrap/fallback only. API keys remain environment-only.
- Resolved: provider/model failures should be visible in API responses and Workflow Run details at minimum, with frontend inline/toast/banner display when UI controls exist. Use clear error categories such as `provider_not_configured`, `provider_request_failed`, `provider_invalid_output`, `provider_timeout`, and `validation_failed`.
- Resolved: provider calls should use a modest timeout and retry once for transient timeout, 429, 5xx, or network failures only. Do not retry invalid output/validation/configuration errors, and do not auto-switch providers/models.
- Resolved: AI Settings should be Admin User only for read/write. Do not add roles in this feature; authenticated-only access is acceptable for the current solo-admin MVP, with explicit role-based access deferred to a later auth hardening phase.
- Resolved: build a minimal authenticated dashboard Lead list plus custom review route for per-run controls instead of linking from or deeply customising Payload admin collection views in the first pass.
- Resolved: dashboard Lead list should be workflow-oriented, showing business name, city, pipeline status, sales status, demo approval state, latest Demo Site link/status, latest Workflow Run status/error, and a Review button.
- Resolved: per-run action buttons should be visible but disabled when prerequisites are missing, with clear prerequisite reasons.
- Resolved: AI Settings should be a Payload Global. A singleton collection is only an implementation fallback if Global typing becomes unexpectedly awkward.
- Do we want model selection controls inside Payload admin, or a separate custom `/dashboard` route for better UX?
