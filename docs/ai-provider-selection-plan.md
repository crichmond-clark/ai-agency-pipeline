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
- Allow per-run provider/model overrides from generation actions.
- Keep provider API keys in `.env`; never store or expose secret values in Payload documents or browser responses.
- Support at minimum `opencode-go`, `zai`, `openrouter`, `openai`, `openai-compatible`, and `deterministic`.
- Keep the Python AI Service as the owner of model calls and structured output validation.
- Record selected provider/model metadata on Workflow Runs for traceability.
- Preserve deterministic fallback when no provider is configured.

Non-Goals:

- No frontend editing of API keys.
- No OAuth/subscription-login model access.
- No model catalog syncing from provider APIs in the first pass.
- No per-user API keys.
- No cost tracking beyond workflow metadata.
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

Non-secret selection state lives in Payload:

```txt
AiSettings global/collection
  default_provider
  default_model
  profile_model
  demo_content_model
  qa_model
  outreach_model
```

Generation requests may include a non-secret override:

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
request override > Payload AI settings task override > Payload AI settings default > Python env default > deterministic fallback
```

Payload/Next resolves the non-secret provider/model selection and sends it to the Python AI Service in each request. Python validates the provider against its allowlist, looks up the matching server-side API key from environment variables, and calls the provider.

This preserves ADR 0014/0017: Python owns model calls; Payload owns workflow state and admin actions.

## 4. Component Breakdown

- `AiSettings` Payload global/collection: stores non-secret provider/model defaults.
- AI model configuration constants: shared TypeScript provider/model options for admin fields and request validation.
- Admin/frontend controls: simple selector UI or Payload admin fields for choosing provider/model.
- API routes: parse optional per-run provider/model override, merge with saved settings, and pass selection to `lib/ai-service-client.ts`.
- AI service client: includes provider/model selection in request bodies.
- Python schemas: add optional `ai_config` to profile, demo content, QA, and outreach request schemas.
- Python provider client: accept request-level provider/model overrides before falling back to environment defaults.
- Workflow Runs: save provider/model metadata for successful and failed AI operations.

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
No provider selected, provider is deterministic, or provider key missing
→ Python deterministic fallback generates safe output
→ Workflow Run metadata records deterministic/fallback mode
```

## 6. Interface Contracts

- Payload global/collection: `ai-settings`
  - Fields:
    - `default_provider`: enum `deterministic | opencode-go | zai | openrouter | openai | openai-compatible`
    - `default_model`: string
    - `profile_model`: string optional
    - `demo_content_model`: string optional
    - `qa_model`: string optional
    - `outreach_model`: string optional
    - `openai_compatible_base_url_label`: optional non-secret note/name only; actual `AI_BASE_URL` stays in `.env`
  - Output: non-secret settings available to authenticated Admin Users.

- Next API route request bodies:
  - Existing generation routes accept optional body:
    ```ts
    type AiSelectionOverride = {
      ai?: {
        provider?: AiProvider
        model?: string
      }
    }
    ```
  - Error cases:
    - unknown provider: `400`
    - model not allowed/empty: `400`
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

- `collections/AiSettings.ts` or `globals/AiSettings.ts` — non-secret AI provider/model settings.
- `lib/ai-provider-options.ts` — TypeScript provider allowlist, default model suggestions, and validation helpers.
- `lib/ai-settings.ts` — load settings and resolve per-task provider/model config.
- `components/admin/AiRunControls.tsx` or equivalent minimal client component — optional per-run selector UI if custom routes are added.

Modify:

- `payload.config.ts` — register the `AiSettings` global/collection.
- `lib/ai-service-client.ts` — send optional `ai_config` to Python.
- `app/api/leads/[leadId]/generate-profile/route.ts` — parse override, resolve settings, pass config, record metadata.
- `app/api/leads/[leadId]/generate-demo-content/route.ts` — same.
- `app/api/demo-sites/[demoSiteId]/run-qa/route.ts` — same.
- `app/api/leads/[leadId]/generate-outreach-draft/route.ts` — same.
- `workers/python/app/schemas.py` — add `AiConfig` and request fields.
- `workers/python/app/llm.py` — accept request-level provider/model overrides and return selected config metadata if needed.
- `.env.example` — clarify env keys store secrets only; frontend controls store provider/model names only.
- `docs/ai-demo-pipeline-plan.md` — reference admin-selectable AI settings.

Delete:

- None.

## 8. Implementation Phases

### Phase A — Settings model and resolver

Commit: `feat(ai): add admin model settings`

- Add Payload AI settings storage for non-secret provider/model names.
- Add TypeScript provider/model allowlist and resolver.
- Register settings in Payload config.
- Keep existing env behavior as fallback.

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
- Preserve deterministic fallback for missing/unsupported config.
- Ensure provider keys are read only from environment variables.

Done when: Python compile checks pass and deterministic mode still works without API keys.

### Phase D — Minimal frontend controls

Commit: `feat(admin): add per-run ai model controls`

- Add a simple authenticated custom admin/frontend control surface if Payload default admin actions cannot pass request bodies directly.
- The UI should show provider dropdown and model text input/suggestions, then call the existing API routes.
- Do not display or edit API keys.

Done when: an Admin User can trigger at least profile/demo generation with a chosen provider/model from the frontend.

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
- Only authenticated Admin Users can read or modify AI settings or call generation routes.
- Workflow metadata must record provider/model names only, never headers or keys.

## 11. Risks & Tradeoffs

- Payload admin may not provide a nice button/action UI without custom views. Mitigation: use a small custom authenticated Next route/component for run controls.
- Model names change by provider. Mitigation: allow model as a string with suggestions rather than a hard-coded exhaustive enum.
- Request overrides add complexity to route bodies. Mitigation: keep the shape tiny and optional.
- Missing provider keys can surprise the user. Mitigation: deterministic fallback plus clear error/metadata in Workflow Runs.
- `openai-compatible` base URL remains env-only, so frontend can select the model but not the endpoint. This is intentional for safety.

## 12. Open Questions

- Should missing API keys silently fall back to deterministic output, or return an explicit admin-visible error when a non-deterministic provider is selected?
- Should model suggestions be hard-coded from Pi-known defaults, manually curated, or stored in settings?
- Should AI Settings be a Payload Global or a singleton Collection? Global is simpler, but a collection may be easier if Payload local API typing is awkward.
- Do we want model selection controls inside Payload admin, or a separate custom `/dashboard` route for better UX?
