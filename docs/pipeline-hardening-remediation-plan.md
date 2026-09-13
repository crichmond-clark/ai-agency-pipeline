# Pipeline Hardening Remediation Plan

Status note (13 September 2026): this document records the earlier hardening pass. Follow-up findings and proposed fixes are tracked in the [Pipeline Review Remediation Plan](pipeline-review-remediation-plan.md). Completed checkboxes here do not indicate that the follow-up review passed.

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

The AI demo pipeline implementation covers the planned feature phases, but the code/security review found deploy-blocking gaps before the branch can safely handle real lead data or send outreach:

- Payload collections lack explicit access controls for lead PII, demo records, outreach drafts, contact attempts, workflow logs, media, and business profiles.
- Workflow mutation endpoints allow unsafe state transitions, especially final Approval and Outreach Draft review.
- Demo Site `expires_at` is stored but not enforced for public demo rendering, QA/outreach selection, or sending.
- The Python AI Service endpoints are unauthenticated, so exposing the service would allow unauthorised AI spend and arbitrary provider calls.
- Environment configuration can fail open with empty secrets/connection strings.
- No test coverage exists for workflow guards, demo availability, import identity, validators, or send blocking rules.
- Dependency audit currently reports moderate vulnerabilities.

This plan hardens the existing MVP without changing the core product scope.

## 2. Goals & Non-Goals

Goals:

- Lock all Payload data collections and globals to authenticated Admin Users unless explicitly public.
- Preserve public Demo Page access while preventing public Payload API access to source records.
- Enforce server-side workflow guards for Demo Creation Approval, profile generation, demo content generation, QA, final Approval, Outreach Draft review, and send.
- Enforce Demo Availability consistently: public, not removed, and not expired.
- Add service-to-service authentication between Payload/Next and the Python AI Service.
- Fail fast on missing required production environment variables.
- Add focused unit/integration tests for the security-critical state machine and validation helpers.
- Resolve or document dependency audit findings and upgrade safely where possible.
- Record any new architecture decisions as ADRs.

Non-Goals:

- No new CRM features.
- No background queue implementation.
- No role hierarchy beyond authenticated Admin User unless Payload already makes it trivial.
- No bulk sends, follow-ups, open tracking, or external sales tooling.
- No redesign of the dashboard UI beyond showing better blocked reasons where needed.
- No migration from Payload auth to another provider.

## 3. Proposed Architecture

Use a small hardening layer rather than a broad refactor:

1. **Access helper module**
   - Add reusable Payload access helpers such as `authenticated`, `authenticatedOrLocalAPI`, and collection-specific wrappers if needed.
   - Apply explicit `access` blocks to every collection and sensitive global.
   - Keep public `/demo/[slug]` as the only unauthenticated path that can display a Demo Site.

2. **Workflow guard module**
   - Add pure functions in `lib/workflow-guards.ts` for state decisions:
     - `getDemoAvailabilityBlockReason(demoSite, now)`
     - `getApprovalBlockReason({ lead, demoSite })`
     - `getOutreachReviewBlockReason({ lead, demoSite, outreach })`
     - `getSendBlockReason({ lead, demoSite, outreach, now, portfolioMode })`
   - API routes call these guards before mutating state.
   - Tests exercise these functions directly.

3. **AI Service auth**
   - Use a simple shared bearer token for MVP service-to-service calls.
   - Next/Payload sends `Authorization: Bearer ${AI_SERVICE_TOKEN}` to Python.
   - Python requires the same `AI_SERVICE_TOKEN` for all non-health endpoints.
   - `/health` remains unauthenticated for local health checks.
   - If `AI_SERVICE_TOKEN` is missing outside deterministic/local mode, fail closed.

4. **Demo availability as one contract**
   - A Demo Site is available only when:
     - `is_public === true`
     - `removed_at` is empty
     - `expires_at` is empty or in the future
   - Use this contract in demo page rendering, outreach draft generation, QA/screenshot actions where relevant, and send guard.

5. **Fail-fast configuration**
   - Add `lib/env.ts` for required env access in server code.
   - Require `DATABASE_URI` and `PAYLOAD_SECRET` at app boot.
   - Require feature-specific envs at call sites: R2 for screenshots, Resend for sends, AI token for AI calls.

6. **Tests before merge**
   - Add a test runner if none exists. Prefer `vitest` for TypeScript unit tests because it is lightweight and works well with pure helper modules.
   - Add Python tests only if AI service auth/validation can be tested simply with `pytest` and FastAPI `TestClient`; otherwise cover it with a minimal Python test suite.

This approach keeps the first remediation pass small: mostly guards, access config, env validation, and tests around high-risk logic.

## 4. Component Breakdown

- **Payload access controls**
  - Responsibility: ensure records are not readable or mutable without an authenticated Admin User.
  - Boundary: collection/global configs only; no workflow decisions.

- **Workflow guard functions**
  - Responsibility: pure state-machine decisions and human-readable blocked reasons.
  - Boundary: no database calls, no email, no AI calls.

- **API route mutations**
  - Responsibility: authenticate request, load records, call guard, mutate only if allowed, record Workflow Runs where appropriate.
  - Boundary: route handlers should not inline complex guard rules.

- **Demo availability helper**
  - Responsibility: one canonical availability check for public pages and outreach/send workflow.
  - Boundary: no Payload access logic.

- **AI Service client/auth**
  - Responsibility: add bearer token on Next/Payload requests; reject missing/invalid token in Python.
  - Boundary: no user auth; this is service-to-service auth only.

- **Environment validation**
  - Responsibility: fail fast for core app config and fail closed at feature boundaries.
  - Boundary: no secrets stored in Payload/browser responses.

- **Tests**
  - Responsibility: prevent regressions in guard logic, demo availability, import identity, send blocking, and AI service auth.

## 5. Data Flow

### Admin workflow after hardening

```txt
Authenticated Admin User
→ API route authenticates with Payload auth
→ Route loads Lead / Demo Site / Outreach Draft
→ Route calls pure workflow guard
→ If blocked: return 409 with safe reason and do not mutate
→ If allowed: perform state transition / external action
→ Record Workflow Run for long-running or external actions
→ Return updated record summary
```

### Public Demo Page after hardening

```txt
Anonymous visitor requests /demo/[slug]
→ Server loads Demo Site internally by slug
→ Check Demo Availability: public + not removed + not expired
→ Validate content with Zod
→ Render fixed template with escaped React text
→ Otherwise 404
```

### AI request after hardening

```txt
Authenticated Admin User triggers generation in Payload/Next
→ Next resolves non-secret provider/model selection
→ Next sends POST to AI Service with Authorization bearer token
→ Python validates bearer token before parsing/running job
→ Python validates output with Pydantic
→ Next validates response with Zod
→ Payload saves only valid output
```

### Outreach send after hardening

```txt
Admin clicks Send
→ Payload auth required
→ Load Outreach Draft, Lead, Demo Site
→ Send guard checks portfolio mode, approval, not contacted, do-not-contact, reviewed draft, recipient email, active demo availability, no previous send
→ If allowed, Resend sends one email
→ Contact Attempt recorded
→ Lead sales_status becomes contacted
```

## 6. Interface Contracts

### `authenticated` Payload access helper

- Function: `authenticated({ req }): boolean`
- Input: Payload access args containing `req.user`
- Output: `true` only when `req.user` exists
- Error cases: none; fail closed to `false`

### `isDemoSiteAvailable`

- Function: `isDemoSiteAvailable(demoSite, now = new Date()): boolean`
- Input:
  - `is_public?: boolean | null`
  - `removed_at?: string | null`
  - `expires_at?: string | null`
- Output: `true` only when public, not removed, and not expired
- Error cases:
  - Invalid `expires_at` should be treated as unavailable

### `getDemoAvailabilityBlockReason`

- Function: `getDemoAvailabilityBlockReason(demoSite, now = new Date()): string | null`
- Input: nullable Demo Site availability fields
- Output:
  - `null` if available
  - user-safe reason string if unavailable
- Error cases: null demo returns `Available public demo site is required`

### `getApprovalBlockReason`

- Function: `getApprovalBlockReason({ lead, demoSite, now }): string | null`
- Required rules:
  - Lead `pipeline_status` must be `needs_review`
  - Demo Site must be available
  - Demo Site `qa_report.status` must be `passed`
- Output: `null` if final Approval may be recorded; otherwise reason string

### `getOutreachReviewBlockReason`

- Function: `getOutreachReviewBlockReason({ lead, demoSite, outreach, now }): string | null`
- Required rules:
  - Lead must be `approved`
  - Lead must not have `do_not_contact_at`
  - Demo Site must be available
  - Outreach status must be `draft`
  - Outreach must belong to the same Lead and Demo Site loaded by route
- Output: `null` if draft may be marked reviewed; otherwise reason string

### `getSendBlockReason`

- Function: `getSendBlockReason({ lead, outreach, demoSite, now, portfolioMode }): string | null`
- Required rules:
  - Portfolio Mode blocks sends
  - Lead must be `approved`
  - Lead sales status must be `not_contacted`
  - Lead must not be Do Not Contact
  - Lead must have recipient email
  - Outreach must be `reviewed`
  - Outreach must not have `sent_at`
  - Demo Site must be available
  - Outreach must belong to the loaded Lead and Demo Site
- Output: `null` if send may proceed; otherwise reason string

### AI Service auth

- Header: `Authorization: Bearer <AI_SERVICE_TOKEN>`
- Protected endpoints:
  - `POST /profile`
  - `POST /demo-content`
  - `POST /qa`
  - `POST /outreach-draft`
  - `POST /models/refresh`
- Unprotected endpoint:
  - `GET /health`
- Error cases:
  - Missing/invalid token: `401 {"detail":"Unauthorized"}`
  - Missing server token: fail closed for protected endpoints

### Environment helper

- Function: `requiredEnv(name: string): string`
- Output: env value
- Error cases: throws clear startup/runtime error if missing

## 7. File Changes

Create:

- `lib/access.ts` — reusable Payload access helpers.
- `lib/env.ts` — required env helper and feature-specific env helpers if useful.
- `lib/demo-availability.ts` — canonical Demo Site availability logic.
- `lib/workflow-guards.ts` — pure approval/review/send guard functions.
- `tests/demo-availability.test.ts` — availability edge cases.
- `tests/workflow-guards.test.ts` — approval/review/send guard coverage.
- `tests/slugify.test.ts` — planned slug coverage.
- `tests/qa.test.ts` — deterministic QA coverage.
- `workers/python/tests/test_auth.py` — AI Service bearer token coverage.
- `docs/adr/0024-service-to-service-ai-auth.md` — decision for shared bearer token auth.

Modify:

- `payload.config.ts` — use fail-fast env helper for `DATABASE_URI` and `PAYLOAD_SECRET`.
- `collections/*.ts` — add explicit authenticated access controls.
- `globals/AiSettings.ts` — keep authenticated access and align helper usage.
- `app/demo/[slug]/page.tsx` — enforce `expires_at` and canonical availability helper.
- `app/api/leads/[leadId]/approve/route.ts` — require guard before final Approval.
- `app/api/outreach-messages/[outreachMessageId]/mark-reviewed/route.ts` — require review guard.
- `app/api/outreach-messages/[outreachMessageId]/send/route.ts` — replace inline guard with shared guard and enforce expiry/relationships.
- `app/api/leads/[leadId]/generate-profile/route.ts` — update existing Business Profile for regeneration instead of violating unique lead constraint.
- `app/api/leads/[leadId]/generate-demo-content/route.ts` — optionally set sensible `expires_at` for real leads and avoid publishing demos without explicit availability rules.
- `app/api/leads/[leadId]/generate-outreach-draft/route.ts` — use canonical demo availability helper.
- `app/api/demo-sites/[demoSiteId]/capture-screenshots/route.ts` — avoid screenshotting unavailable/expired demo sites.
- `app/api/demo-sites/[demoSiteId]/run-qa/route.ts` — use canonical availability rules where applicable.
- `lib/ai-service-client.ts` — attach AI Service bearer token and fail closed when required.
- `workers/python/app/main.py` — require bearer token on protected endpoints.
- `workers/python/requirements.txt` — add test dependencies only if using Python tests (`pytest`, `httpx`) or document why not.
- `package.json` — add `test`, possibly `typecheck`, and `audit` scripts.
- `package-lock.json` — update after dependency/test runner changes and safe audit fixes.
- `.env.example` — add `AI_SERVICE_TOKEN`, clarify required vs optional keys, clarify `PORTFOLIO_MODE=true` for safe local testing.
- `next.config.mjs` — add security headers.
- `docs/ai-demo-pipeline-plan.md` — update implementation/testing status after remediation is implemented.
- `/mnt/d/docs/miku/Plans/ai-demo-pipeline-plan.md` — sync plan updates after implementation if that file exists.

Delete:

- None planned.

## 8. Implementation Phases

### Phase 1 — Access controls and fail-fast env

- Branch: `feature/pipeline-hardening` or continue current `feature/ai-demo-pipeline` if this remediation is folded into the existing PR.
- Commits:
  - [x] Add `lib/access.ts` and apply authenticated access rules to all Payload collections/globals.
  - [x] Add `lib/env.ts` and require `DATABASE_URI` / `PAYLOAD_SECRET` in `payload.config.ts`.
  - [x] Update `.env.example` with required/optional sections and `AI_SERVICE_TOKEN` placeholder.
- Done when:
  - Payload collection APIs require auth.
  - App fails clearly if DB URI or Payload secret is missing.
  - Existing admin/dashboard flows still compile.

### Phase 2 — Canonical availability and workflow guards

- Branch: same as Phase 1.
- Commits:
  - [x] Add `lib/demo-availability.ts` and enforce availability in `/demo/[slug]`.
  - [x] Add `lib/workflow-guards.ts` for approval, outreach review, and send decisions.
  - [x] Refactor approval, mark-reviewed, send, outreach generation, screenshot, and QA routes to use guards/helpers.
  - [x] Fix Business Profile regeneration to update existing profile for a Lead.
- Done when:
  - Expired Demo Sites return 404 publicly and cannot be used for outreach/send.
  - Final Approval cannot be recorded unless QA passed and status is `needs_review`.
  - Outreach Drafts cannot be reviewed unless the Lead and Demo Site are safe.
  - Send guard covers expiry and record relationships.
  - Re-running profile generation does not fail on the unique Lead relationship.

### Phase 3 — AI Service authentication

- Branch: same as Phase 1.
- Commits:
  - [x] Add ADR `0024-service-to-service-ai-auth.md`.
  - [x] Add bearer token to `lib/ai-service-client.ts`.
  - [x] Add FastAPI dependency/middleware to protect all non-health endpoints.
  - [x] Document local setup for `AI_SERVICE_TOKEN` in `.env.example`.
- Done when:
  - Calls from Next/Payload succeed with matching token.
  - Direct unauthenticated requests to Python generation endpoints return 401.
  - `/health` still returns 200 without auth.

### Phase 4 — Tests for security-critical behavior

- Branch: same as Phase 1.
- Commits:
  - [x] Add Vitest and TS test scripts.
  - [x] Add tests for `slugify`, deterministic QA, demo availability, workflow guards, and CSV duplicate/update behavior.
  - [x] Add Python auth tests for AI Service protected endpoints.
  - [x] Add package scripts for `test`, `test:python` if used, and `typecheck`.
- Done when:
  - `npm test` passes.
  - `npm run lint` passes after dependencies are installed.
  - `npm run build` or `npm run typecheck` passes.
  - Python AI Service auth tests pass if included.

### Phase 5 — Dependency audit, headers, documentation, final review

- Branch: same as Phase 1.
- Commits:
  - [x] Add baseline security headers in `next.config.mjs`.
  - [x] Run safe dependency updates / `npm audit fix` where compatible; document remaining transitive moderate findings if no safe fix exists.
  - [ ] Update `docs/ai-demo-pipeline-plan.md` and sync `/mnt/d/docs/miku/Plans/ai-demo-pipeline-plan.md`.
  - [ ] Run code review and security review again.
- Done when:
  - `npm audit` has no high/critical vulnerabilities; moderate findings are either fixed or documented with a reason.
  - Security headers are present for app routes.
  - Docs reflect the hardened implementation.
  - Follow-up code/security review has no Critical/High blockers.

## 9. Testing Strategy

Unit tests:

- `slugify`:
  - trims/lowercases
  - converts ampersands
  - strips punctuation
  - falls back to `demo`
  - includes stable Lead id suffix
- `demo-availability`:
  - public and no expiry passes
  - private fails
  - removed fails
  - expired fails
  - future expiry passes
  - invalid expiry fails closed
- `workflow-guards`:
  - final Approval blocked before `needs_review`
  - final Approval blocked without QA pass
  - final Approval blocked for expired/removed/private demo
  - Outreach review blocked for unapproved lead, Do Not Contact, unavailable demo, non-draft message, wrong relationships
  - Send blocked for Portfolio Mode, already contacted, Do Not Contact, missing email, unreviewed draft, already sent, unavailable demo, wrong relationships
  - Send allowed only for the valid approved/reviewed/not-contacted case
- `qa`:
  - fails invalid content schema
  - fails missing disclaimer
  - fails private demo
  - passes valid demo content
- CSV import:
  - dedupes by `google_place_id`
  - dedupes by normalized business name + city fallback
  - re-import updates source/import fields but does not overwrite workflow fields

Integration/manual tests:

- Login required for all admin/dashboard/API mutation routes.
- Anonymous public Demo Page can render only available demo sites.
- Expired demo returns 404.
- Direct Python `/profile` without bearer token returns 401.
- Next/Payload generation succeeds when `AI_SERVICE_TOKEN` matches.
- Full local happy path: import lead → approve demo creation → generate profile → generate demo content → screenshot → QA → approve → generate outreach → mark reviewed → send blocked in portfolio mode.

Validation before merging:

```txt
npm install
npm run lint
npm test
npm run build
python -m pytest workers/python/tests
npm audit --audit-level=high
```

If Python tests are not added, replace the pytest command with a documented manual `curl` check for protected endpoints.

## 10. Security Implications

Data exposed or processed:

- Lead PII: business names, emails, phone numbers, addresses, source payloads.
- Generated Business Profiles and Demo Site content.
- Outreach Drafts and sent Contact Attempts.
- Workflow Run errors and metadata.
- Provider model names and non-secret AI settings.

Access model:

- Payload admin/dashboard/API mutation routes require authenticated Payload Admin User.
- Payload collection APIs should be authenticated by explicit collection access rules.
- Public Demo Pages remain unauthenticated but expose only fixed-template demo content for available Demo Sites.
- Python AI Service uses service-to-service bearer token auth and should not be publicly callable without that token.

User-controlled inputs:

- CSV import text.
- Lead fields edited in Payload Admin.
- AI provider/model override names.
- Demo slugs in public URLs.
- Outreach draft content edited by Admin User.

Validation requirements:

- CSV parsed into known Lead fields only.
- AI provider is allowlisted; non-deterministic provider requires model.
- AI output validated with Pydantic and Zod.
- Public Demo Site content validated with Zod before render.
- Workflow guards validate state and relationships server-side.

Injection risks:

- XSS: mitigated by React escaped text and fixed templates; continue avoiding arbitrary HTML.
- SQL injection: Payload query APIs are used; no raw SQL planned.
- SSRF: screenshot capture and AI QA URLs must remain internally constructed from configured base URL + saved slug, not arbitrary user input.
- Command injection/path traversal: no shell/path use from user input planned.

Secrets:

- `PAYLOAD_SECRET`, DB URI, AI provider keys, R2 keys, Resend key, and `AI_SERVICE_TOKEN` remain environment-only.
- Do not store secrets in Payload globals, Workflow Runs, or browser responses.

## 11. Risks & Tradeoffs

- Risk: Payload access controls might block server-side internal reads used by public `/demo/[slug]`.
  - Mitigation: verify Payload local API behaviour; if needed, use an explicit internal access bypass supported by Payload local API, not public API access.

- Risk: Shared bearer token is simpler than OAuth/mTLS but less robust if leaked.
  - Mitigation: keep token server-side only, rotate via env, restrict AI Service network exposure where hosted, and document as MVP service auth.

- Risk: Strict final Approval guard may block current manual workflow until QA report shape is consistent.
  - Mitigation: write tests against the actual saved `qa_report` shape and update route code to normalise it.

- Risk: Dependency audit fixes may require Payload/Next version changes.
  - Mitigation: avoid force-upgrading to incompatible versions in the hardening branch; document remaining moderate transitive issues if no safe patch exists.

- Risk: Adding tests introduces new tooling and package-lock churn.
  - Mitigation: keep to one lightweight runner and pure unit tests first.

## 12. Open Questions

Resolved for implementation:

- **Should final Approval require a reviewed Outreach Draft?** No. Final Approval means the Lead's active Demo Site is safe for sales contact. Outreach Draft review is a separate required gate before Send.
- **Should public Demo Pages stay unauthenticated?** Yes, but only when the Demo Site is available and noindexed.
- **Should AI Service auth use shared bearer token?** Yes for MVP; document in ADR 0024.
- **Should expired sample portfolio demos remain viewable?** Yes only if `expires_at` is empty. Sample portfolio Demo Sites can be permanent by leaving `expires_at` unset.
- **Should `npm audit --force` be used?** No. Use safe fixes first; document remaining moderate transitive findings if force would downgrade or break Payload/Next.

Accepted risks before implementation:

- Payload does not yet have fine-grained roles; authenticated Admin User is the MVP permission boundary.
- Rate limiting is not a Phase 1 blocker if routes are authenticated and admin-only, but should be added before broader public/team use.
