# Pipeline Review Remediation Plan

Status: proposed for approval; no application implementation authorized by this document alone.

Source: [13 September codebase review](codebase-review-2026-09-13.md), reviewed commit `e11c889` on `feature/ai-demo-pipeline`.

This plan covers all 13 review findings and the associated reliability, testing, and usability improvements. It extends the earlier [hardening plan](pipeline-hardening-remediation-plan.md); its completed checkboxes are historical evidence, not proof that the current release is ready. Complete this work before the [RAG foundation plan](rag-phase-1-foundation-plan.md).

## Table of Contents

- [1. Problem Statement](#1-problem-statement)
- [2. Goals & Non-Goals](#2-goals--non-goals)
- [3. Proposed Architecture](#3-proposed-architecture)
- [4. Component Breakdown](#4-component-breakdown)
- [5. Data Flow](#5-data-flow)
- [6. Interface Contracts](#6-interface-contracts)
- [7. File Changes](#7-file-changes)
- [8. Implementation Phases](#8-implementation-phases)
- [9. Testing Strategy](#9-testing-strategy)
- [10. Security Implications](#10-security-implications)
- [11. Risks & Tradeoffs](#11-risks--tradeoffs)
- [12. Open Questions](#12-open-questions)

## 1. Problem Statement

The basic pipeline exists, but ordinary collection edits, concurrent requests, and partial failures can bypass the intended human review guarantees. The UI cannot yet complete the advertised workflow, portfolio mode does not protect real lead data, and dependency/configuration issues undermine release readiness.

Baseline validation passed 35 TypeScript tests, 3 Python tests, type checking, and lint. Those checks do not cover the actual database/API/browser boundaries where the review found failures. The remediation must fix behavior and prove the fixes with realistic regression tests.

## 2. Goals & Non-Goals

Goals:

- Prevent duplicate first sends across concurrent requests, process interruption, and provider/database uncertainty.
- Make approval, QA, and outreach review apply to the exact records and content reviewed.
- Enforce workflow rules on custom routes, standard Payload APIs, Admin edits, imports, and internal application calls.
- Protect real records in portfolio mode and enforce real-demo expiry.
- Correct CSV identity, cross-language validation, startup configuration, and AI error handling.
- Deliver styled demo pages and a complete review/send UI.
- Add reproducible migrations, CI, bounded external operations, and useful workflow histories.
- Resolve release-blocking dependency findings and document any remaining context-dependent findings.

Non-goals:

- No framework rewrite, auth replacement, multi-tenant permission system, new CRM, bulk sending, automatic follow-ups, or automatic outreach.
- No queues, vector store, embeddings, scraping, or generalized agent orchestration.
- No live provider calls, production database changes, real outreach, deployment, or automatic commits merely because this plan is approved. Those actions retain their normal authorization boundaries.

## 3. Proposed Architecture

Retain Payload/Next ownership of state, workflow, rendering, deterministic QA, screenshots, and Resend; retain Python ownership of AI provider calls and Pydantic validation. Keep pure decision helpers and Zod validation.

### Shared operations and persistence rules

Add narrowly scoped workflow services under `lib/pipeline/`. HTTP routes authenticate and validate input, then invoke these operations. Collection hooks validate direct edits and invalidate dependent state. Protected workflow/audit fields cannot be supplied through ordinary external collection writes.

Every mutation affecting a lead's workflow joins one short database transaction, acquires the lead row lock before related-record locks, re-reads current state, and propagates the same Payload request/transaction into nested writes. New imports acquire a transaction-scoped identity lock before a lead exists. Keep adapter-specific, parameterized lock queries in one database module using the transaction's connection, never a separate pool transaction. Prove rollback and lock behavior against the installed adapter before routing production writes through it. Payload documents request propagation for [transactional Local API work](https://payloadcms.com/docs/database/transactions).

An internal operation capability may authorize protected fields, but it must be a server-created value that cannot be supplied by JSON or request headers. Local API access overrides do not exempt code from workflow hooks. Prevent hook recursion with a narrow operation context while retaining validation.

### Revision-bound decisions

Store explicit source, content, and workflow revisions. Persist `approved_demo_site`, its approved revision, approval time, and approving user on the Lead. QA references the demo revision, source revision, template version, and policy version checked. Outreach review references an immutable fingerprint of recipient, subject, body, demo URL, and approved demo revision.

Changes to rendered lead identity/contact fields, relevant evidence, profile content, demo content/template/slug, draft content, or recipient invalidate the corresponding downstream decisions atomically. Sales status, do-not-contact information, contact history, and demo-creation audit history must not be erased by regeneration. Private/removal/expiry changes block sending immediately. Regeneration preserves deliberate availability choices.

Capture input revisions before slow AI/screenshot operations, release locks while work runs, and compare again in the commit transaction. If input or workflow state changed, record a stale-result failure and return 409 without overwriting current records. This also prevents an in-flight QA result from reversing a later rejection.

### Durable first-send operation

Use a new internal `outreach-send-operations` collection. It represents delivery coordination, not an actual Contact Attempt. Maintain a unique first-send slot per Lead, an immutable provider request snapshot, a stable idempotency key, and explicit states. Create Contact Attempts only after provider acceptance is established.

Do not hold a database transaction open during an email request. Atomically claim the operation after rechecking every guard, then send the frozen snapshot. The claim is the authorization point: an opt-out or removal committed before the claim blocks it; one committed after dispatch authorization cannot recall an already initiated external request. Always permit new do-not-contact/removal restrictions, and prohibit subsequent retries if eligibility changes.

Resend retains idempotency keys for 24 hours according to its [documentation](https://resend.com/docs/dashboard/emails/idempotency-keys). Use a conservative 23-hour retry window from the persisted first dispatch timestamp, always with the same key and body. No automatic retry or automatic sending. Unknown outcomes beyond that window require reconciliation; never generate a fresh key to bypass uncertainty.

### Privacy and lifecycle

Portfolio deployments use a separate sample database and sample asset storage. The application also returns 404 for non-sample public demos in portfolio mode and omits contact links from portfolio rendering. A sample checkbox alone is not a sanitizer: fixtures must contain fictional content and must not be derived by relabeling existing real records.

Real demos expire after 45 days by default; sample demos may be permanent. Existing real demos without an expiry are assigned creation time plus 45 days, so old demos become unavailable without a fresh publication decision. Expired/private/removed demos are not revived by regeneration.

Move screenshot reads behind authenticated admin access/private storage. Existing publicly accessible R2 objects require a reviewed migration inventory and explicit storage cleanup before privacy claims are made; hiding links alone does not revoke old URLs.

## 4. Component Breakdown

| Component | Responsibility |
|---|---|
| `lib/pipeline/transaction.ts` | Shared request transaction, ordered locks, commit/rollback; no provider calls |
| `lib/pipeline/revisions.ts` and collection hooks | Canonical hashes, revision increments, protected fields, invalidation |
| Existing workflow guards | Pure checks against explicit approved demo, current QA, reviewed fingerprint, contactability, and availability |
| `lib/pipeline/operations.ts` | Approval/rejection/review/generation state changes and stale-result handling |
| `lib/pipeline/send-outreach.ts` | Durable first-send claim, delivery result persistence, explicit retry/reconciliation |
| `lib/workflow.ts` | Start and finish one Workflow Run, sanitized errors, stale-run reporting |
| `lib/leads.ts` | Deterministic identity policy, atomic import resolution, useful row-level errors |
| Python schemas/jobs and TS AI schemas/client | Matching contracts, evidence-limited QA, bounded calls and errors |
| Public renderer and screenshot service | Sample-only portfolio projection, lifecycle checks, private artifacts, rendered QA |
| Review UI | Actual content/evidence preview, safe action controls, refreshed state, explicit send confirmation |
| Migrations and CI | Reproducible fresh/upgrade databases and repeatable integration tests |

## 5. Data Flow

### Generate, inspect, and approve

1. Admin imports Lead Data. Import changes only allowed source fields; derived review invalidation is automatic, not a reset of human sales/contactability fields.
2. Admin records Demo Creation Approval with actor/time.
3. Generation validates approval, starts a Workflow Run, records source/workflow revisions, and calls Python outside a transaction.
4. Validated output is saved only if the captured revisions still match. Regeneration invalidates previous QA/approval and preserves availability controls.
5. Capture desktop/mobile artifacts for that exact revision. Render checks and evidence-aware AI QA combine into one report.
6. Admin views content/screenshots/QA and approves a specific demo revision.
7. Python prepares an Outreach Draft using the approved demo URL. Admin edits and reviews the exact recipient/message fingerprint.

### Send and recover

1. Admin explicitly confirms recipient, subject/body, demo, and reviewed fingerprint.
2. Under the lead lock, recheck approval/QA revisions, availability, do-not-contact, portfolio mode, sales/contact history, and draft review. Reserve or atomically claim the durable send operation.
3. Commit the claim; send the immutable snapshot to Resend with its stored idempotency key.
4. On acceptance, atomically mark operation sent, save one Contact Attempt, mark draft sent, and update sales contact metadata. Repeating persistence is idempotent.
5. Timeout, connection loss, unclassified response, or failure after potential provider acceptance becomes `unknown`; no “safe to send again” message.
6. An explicit retry within 23 hours may reuse the exact operation after all current guards pass. Changed content/eligibility, expired key window, or unresolved evidence blocks retry.
7. Reconciliation is a separate admin action: verified provider acceptance finishes local records; a provider-confirmed non-acceptance permits canceling the failed operation and a newly reviewed request. Ambiguous evidence stays blocked. No retry is inferred from page refresh, worker restart, or Workflow Run repair.

## 6. Interface Contracts

### Stored fields

| Record | Added or changed fields/invariants |
|---|---|
| Lead | `source_revision`, `workflow_revision`, `approved_demo_site`, `approved_demo_revision`, `approved_at`, `approved_by`, normalized city and fallback identity; protected derived/audit fields |
| Demo Site | `content_revision`, `source_revision`, `template_version`; QA and screenshot metadata identify checked revisions; real-lead expiry required |
| Outreach Message | `content_revision`, `reviewed_fingerprint`, `reviewed_by`; subject/body edits clear review; sent content immutable |
| Send Operation | UUID ID, Lead, draft, purpose `initial_outreach`, unique nullable `active_slot_key` (`initial:<leadId>`), state, immutable `{from,to,subject,body,demo_url,demo_revision,reviewed_fingerprint}`, unique idempotency key, first dispatch time, last attempt time, provider ID, safe error category, reconciliation actor/evidence |
| Contact Attempt | Unique optional `send_operation` and provider message ID; provider-backed email records cannot be fabricated/changed/deleted via ordinary collection writes |
| Workflow Run | Existing started/succeeded/failed states; error categories such as `stale_input`, `provider_timeout`, `delivery_unknown`, `interrupted`; operation/resource revisions in metadata |

Send operation states: `reserved`, `dispatching`, `unknown`, `failed`, `sent`, `canceled`. `reserved -> dispatching` uses compare-and-set under lock; only its winner calls the provider. A definitive provider rejection becomes `failed`; uncertainty becomes `unknown`. Retries reuse the same snapshot and key. A `sent` operation permanently retains the Lead's first-send slot. A failed operation releases the slot only through explicit cancellation after non-acceptance is established. Historical records remain immutable; canceled rows keep their snapshots but clear the nullable active slot.

A dispatch taking longer than 2 minutes is presented as unknown and requires explicit recovery; timeout never releases its first-send slot. Missing provider message ID is not success. Legacy Lead/contact/sent-draft evidence also blocks sending independently of the new slot.

### Invalidation policy

| Event | Required effect |
|---|---|
| Source fields used in generation/rendering change | Increment source/workflow revisions; clear active approval and dependent draft reviews; retain source records/history and human contactability/sales fields |
| Profile or demo content changes | Increment applicable revisions; clear QA/screenshots/current approval; reset dependent draft review; mark pipeline for regeneration/QA as appropriate |
| Subject/body/recipient/demo URL changes | Clear outreach review; require a new fingerprint review before send |
| QA fails, demo rejected or becomes unavailable | Clear active approval, block send, prevent old async results restoring approval |
| Sales notes/status unrelated to rendering change | Preserve content/QA revisions; enforce first-contact rules from durable history |
| Do-not-contact or removal recorded | Block generation of outreach and future dispatch/retry; retain delivery audit records |

For source changes use `profile_ready` only when the profile matches the new source revision; otherwise `new`. A changed valid demo awaiting fresh QA uses `demo_ready`; failed QA uses `qa_failed`; passing current QA uses `needs_review`. No new pipeline/sales enum values are needed.

### API and service contracts

Keep existing route paths. All mutation routes authenticate, enforce same-origin browser requests, and validate JSON; API clients without Origin still require valid auth. Reuse a consistent response `{error, code, run_id?}`: 400 invalid input/config, 401 unauthenticated, 404 missing/ineligible public resource, 409 stale/blocked/conflicting workflow, 502 provider failure, 504 deadline. Delivery uncertainty is explicitly represented, not a generic retryable error.

- `approve-demo-creation`: empty body; server supplies actor/time; idempotent without rewriting original audit fields.
- `approve`: `{demo_site_id, expected_demo_revision, expected_workflow_revision}`; returns Lead/approval; current passing QA and availability mandatory.
- `reject`: `{expected_workflow_revision}`; clears approval and increments workflow revision.
- `mark-reviewed`: `{expected_content_revision, expected_fingerprint}`; returns reviewed draft; server computes fingerprint from current records.
- `send`: `{confirmed: true, expected_reviewed_fingerprint}`; returns `{operation_id, state, provider_message_id?}`. Already-sent same operation returns existing result without contacting Resend; active dispatch/unknown returns its state with no fresh send.
- New `POST /api/outreach-send-operations/[id]/retry`: `{confirmed: true, expected_reviewed_fingerprint}`; explicitly reuses eligible unchanged operation/key within deadline.
- New `POST /api/outreach-send-operations/[id]/reconcile`: `{outcome: 'accepted'|'not_accepted', provider_message_id?, evidence}`. Authenticated admin confirmation required; known provider IDs checked through server-side provider lookup. With no authoritative evidence, keep unknown. Reconciliation never sends.
- Generation/capture/QA routes retain IDs and AI overrides; responses add run ID and saved revisions; 409 if inputs changed while running. Demo content generation explicitly checks Demo Creation Approval even when a profile already exists.
- Dashboard actions receive server-computed `{enabled, disabledReason, expected revisions/fingerprint}` from the same eligibility checks used by routes.
- Dashboard list accepts validated `page` (default 1), with 25 Leads/page and existing filters. Return/display pagination metadata. Load demos and latest runs in batch, using deterministic grouped queries for latest-per-lead rather than an arbitrary result limit that can omit some Leads.
- CSV import returns `{created, updated, rejected, rows: [{row, action, lead_id?, error?}]}` after prevalidation and per-row atomic processing; reject oversized input above 5 MiB or 5,000 rows with a clear error before persistence.

Core functions:

```ts
withLeadTransaction<T>(leadId: number, req: PayloadRequest,
  action: (req: PayloadRequest) => Promise<T>): Promise<T>
reviewOutreach(input: {id: number; expectedRevision: number; expectedFingerprint: string}, req: PayloadRequest): Promise<OutreachMessage>
sendReviewedOutreach(input: {id: number; confirmed: true; expectedFingerprint: string}, req: PayloadRequest): Promise<SendResult>
startWorkflowRun(input: WorkflowRunInput, req: PayloadRequest): Promise<{id: number}>
finishWorkflowRun(id: number, result: WorkflowRunResult, req: PayloadRequest): Promise<void>
```

### CSV identity rules

Normalize business name and city with Unicode NFKC, trim, whitespace collapse, and lowercase; do not remove accents or meaningful punctuation. Whitespace-only place IDs are absent.

- Incoming place ID: exact ID wins. If absent in DB, upgrade exactly one matching no-ID lead. Never match an existing different place ID. If ambiguity exists, reject the row for review.
- No incoming place ID: match exactly one normalized name/city candidate; multiple candidates are ambiguous. If no candidate, create a no-ID lead using the unique fallback key. Missing name/city with no place ID is rejected.
- Unique index on non-null Google place ID; partial unique fallback index for no-ID Leads. All identity writes, including admin edits, use the same normalized-key transaction lock. This allows distinct place IDs with the same name/city while preventing concurrent duplicate no-ID imports.
- Backfill reports existing duplicate/ambiguous identities without auto-merging/deleting human records. Unresolved conflicts must be settled before enabling constraints on that database.
- Re-import only updates fields actually present in the export; absence does not erase contact data. Source-derived review invalidation is required, but human sales/contactability/approval audit history is preserved.

### AI, QA, and artifact contracts

Align Python and Zod optional fields: optional source/raw profile may be null on the wire and are normalized consistently; status/severity use identical enums; strings and arrays use matching bounds. Save shared JSON contract fixtures generated from real Python serialization. No schema generator or new shared-schema framework.

Extend `/qa` with `{lead_evidence, profile, content, demo_revision, source_revision, demo_url, ai_config}`. Evidence is an allowlisted projection of provided Lead Data with stable field identifiers; raw import instructions are untrusted data, and profile claims alone do not establish verification. Findings include severity, message, and optional evidence reference. A status of passed with an error finding is normalized to failed. The AI service receives no browser credentials and does not fetch arbitrary URLs.

Deterministic QA checks actual HTTP success, rendered disclaimer, robots/noindex metadata, expected revision marker, required sections, viewport overflow and matching screenshot revision. In deterministic-provider mode the report explicitly says AI factual QA was not performed; sample pipeline review may continue, real-lead approval requires a real evidence-aware QA result.

AI provider budget: disable SDK implicit retries, use at most one explicit transient retry, 30-second per-attempt timeout, and a total 65-second Python budget; Next aborts at 70 seconds. No automatic retry for invalid output or invalid configuration. Record safe error categories; do not return raw provider bodies. Screenshot navigation uses the configured server origin, blocks off-origin navigation and unexpected external requests, verifies page status/revision, and closes browser resources on failure. Private artifact reads require admin auth and lead/demo association checks; public storage URLs are not saved in new QA reports.

## 7. File Changes

Create (proposed paths; generated migration filenames include their actual timestamps):

- `lib/pipeline/{transaction,revisions,operations,send-outreach}.ts` and `collections/hooks/workflow.ts` — persistence invariants and shared operations.
- `collections/OutreachSendOperations.ts` — durable delivery coordination.
- `lib/api-errors.ts`, `lib/rendered-qa.ts`, `lib/public-demo.ts` — bounded errors, rendered checks, safe projection.
- `app/api/outreach-send-operations/[id]/{retry,reconcile}/route.ts` — explicit recovery.
- `app/api/demo-sites/[demoSiteId]/screenshots/[viewport]/route.ts` — authenticated artifact reads.
- `app/(frontend)/globals.css`, `postcss.config.mjs` — Tailwind integration.
- `components/admin/WorkflowActions.tsx`, `components/admin/OutreachReview.tsx` — workflow actions and exact-message review.
- `migrations/`, `scripts/audit-existing-data.ts` — baseline/upgrade/backfill with dry-run audit.
- `tests/integration/`, `tests/contracts/`, `tests/e2e/`, shared fixtures, Python schema/QA tests — trust-boundary coverage.
- `.github/workflows/ci.yml`, `README.md`, `docs/deployment.md` — reproducible validation and deployment runbook.
- Proposed ADRs after approval: `0025-revision-bound-workflow-decisions.md`, `0026-durable-initial-outreach-delivery.md`, `0027-private-screenshots-and-demo-retention.md`, `0028-versioned-payload-migrations.md`.

Modify:

- Relevant Lead/Demo/Outreach/Profile/Contact/Workflow collection configs and `payload.config.ts` — hooks, access, relationships, revisions, migrations.
- All existing workflow mutation routes — shared operations, expected revisions, run IDs, consistent error responses.
- `lib/{workflow,workflow-guards,leads,ai-route,ai-service-client,resend,screenshots,r2-storage,qa,demo-availability}.ts` — fixes described above.
- `types/ai.ts`, Python `schemas.py`, `llm.py`, QA job, main/errors — parity and evidence/deadline contracts.
- Review/dashboard/public page files, existing AI action controls, Home Services template — complete UI, refresh, paging, rendering.
- `package.json`, lockfiles, Python project config as needed, `.env.example` — compatible dependency updates and explicit service env loading.
- `docs/{app-guide,ai-demo-pipeline-plan,pipeline-hardening-remediation-plan,evidence-grounded-ai-roadmap}.md` — verified behavior and sequencing.
- `CONTEXT.md` only for domain clarification of active approval/review if necessary; no stack details.

Delete: no source files or business records planned. Public R2 cleanup is a separately reviewed data operation with an inventory and migration verification.

## 8. Implementation Phases

Each major phase below is a separate review/PR unit, sequenced from the previous accepted phase. Use one branch per phase, no branches for individual commits. Target small diffs (roughly 500 handwritten lines per review); if a phase exceeds that, agree a narrower review boundary before implementation continues. Generated lockfiles/migrations are reviewed separately from handwritten logic.

For every phase: start with `git status --short --branch`, preserve unrelated changes, and create/switch to the listed new `codex/` feature branch from the preceding accepted work. Do not implement remediation on the existing `feature/ai-demo-pipeline` branch or on the default branch. The user explicitly requires new feature branches and atomic commits for a clean history.

Commit policy: the user has authorized atomic commits for approved implementation work. Make one logical, independently understandable change per commit, including the tests needed to verify it. Validate that change before proceeding to the next commit, inspect the staged diff, and stage only files belonging to that change. Keep dependency updates, migrations, behavioral fixes, and unrelated documentation changes separate where they can stand independently; do not split inseparable code and tests merely by file type. Use descriptive commit subjects. Do not bundle an entire phase into a catch-all commit or rewrite existing shared history without authorization. No repeated per-commit permission request is needed within an approved phase.

Use `expert-programming` for implementation, `testing` for coverage, then `code-review`; apply `security-review` to relevant boundaries. No subagents are required.

### Phase 1 — Dependencies and reproducible baseline

Branch: `codex/pipeline-baseline`.

- [ ] Capture current audit results, fix compatible dependency versions/overrides and align Next tooling; no blind force-upgrade.
- [ ] Establish migration baseline and isolated PostgreSQL integration fixture; document legacy database baseline versus fresh creation.
- [ ] Add minimal CI for lint, types, unit/Python tests, integration DB and production build with synthetic environment settings.

Done when: clean checkout installation/build/tests pass, fresh database initializes from committed migrations, and high/critical findings are fixed or individually assessed with explicit release disposition. A remaining unmitigated applicable high/critical risk blocks release. No real database is migrated.

### Phase 2 — Revision and mutation boundary

Branch: `codex/pipeline-revisions`.

- [ ] Record proposed ADRs 0025/0028 and add revision/approval migrations plus safe legacy backfill.
- [ ] Implement shared transactions/lead locks, protected fields, collection validation/invalidation, and immutable contact audit writes.
- [ ] Route approval/rejection/review through shared operations; enforce exact approved demo and current QA.

Done when: direct REST/Admin/local writes cannot forge approval; editing approved inputs clears dependent review; rollback/concurrency tests pass. Legacy approvals are marked for re-review, not fabricated from existing status strings. Existing sent history remains a permanent send block.

### Phase 3 — Durable initial delivery

Branch: `codex/pipeline-send-safety`.

- [ ] Add ADR 0026, Send Operations schema, unique slot, snapshot, and contact linkage migration.
- [ ] Implement claim/send/persist flow with stable idempotency key, explicit unknown outcomes and repeat-safe finalization.
- [ ] Implement guarded explicit retry/reconcile endpoints and failure-injection tests.

Done when: parallel sends across two drafts for one Lead yield one provider submission; post-provider DB failure does not allow a new first send; retries use the same snapshot/key; >23-hour uncertain sends stay blocked; recovery never sends automatically. Fake provider only.

### Phase 4 — Import identity and source updates

Branch: `codex/pipeline-import-integrity`.

- [ ] Add normalized identity/backfill audit and safe uniqueness migration.
- [ ] Implement exact-ID/fallback rules, per-identity locking, promotion of no-ID leads and row-level outcomes.
- [ ] Cover conflicting IDs, ambiguous names, Unicode/city normalization, concurrent imports and preserving human workflow history.

Done when: the review's place-A/place-B reproduction no longer overwrites A; concurrent duplicate imports create one Lead; source changes invalidate stale decisions without erasing human contactability/sales data.

### Phase 5 — AI contracts, configuration, and run lifecycle

Branch: `codex/pipeline-ai-contracts`.

- [ ] Align schemas and serialized fixtures; fix missing await in selection error handling and explicit Python `.env` loading.
- [ ] Implement request deadlines, one retry budget, sanitized errors, started/finished Workflow Runs and stale-input rejection for generation.
- [ ] Add valid-token tests for every protected Python endpoint using deterministic/mocked providers.

Done when: Python fixtures parse in Zod, malformed settings return structured errors, documented startup authenticates successfully, timed-out/invalid/stale operations preserve existing valid records and have one terminal run record. Runs left started after interruption are labeled interrupted on an explicit recovery check, never rerun automatically.

### Phase 6 — Public privacy and artifact lifecycle

Branch: `codex/pipeline-demo-privacy`.

- [ ] Add ADR 0027, sample-only portfolio projection, no public portfolio contact links and 45-day real-demo expiry/backfill.
- [ ] Preserve private/removed/expired states on regeneration; invalidate obsolete artifact references.
- [ ] Add private screenshot storage/read endpoint and a dry-run inventory/runbook for migrating old public objects.

Done when: real-lead URLs return 404 in portfolio mode; sample fixtures expose no real contacts; old real demos expire correctly; private screenshot endpoints reject anonymous/foreign-record access. Existing public storage objects remain a release blocker until their migration/removal is explicitly authorized and verified.

### Phase 7 — Styled rendering and trustworthy QA

Branch: `codex/pipeline-demo-qa`.

- [ ] Configure Tailwind frontend stylesheet and capture polished desktop/mobile sample rendering.
- [ ] Add actual rendered-page checks, revision-bound screenshots and deterministic report rules.
- [ ] Supply source evidence to Python QA, align findings/status semantics and clearly label fallback mode.

Done when: missing noindex/disclaimer, broken page status, stale captures and horizontal overflow fail QA; contradictory evidence fixtures fail AI QA handling; a saved pass refers to the exact source/content/template checked. Neither a stale async QA result nor an error-severity finding can restore approval.

### Phase 8 — Complete review and outreach UI

Branch: `codex/pipeline-review-ui`.

- [ ] Add demo-creation approval, capture, QA, final approve/reject controls with shared disabled reasons.
- [ ] Show content, screenshots, evidence/QA, editable draft and reviewed recipient/fingerprint; implement explicit send confirmation and recovery states.
- [ ] Refresh server state/model suggestions after mutations; add pagination and batch dashboard reads.

Done when: an admin completes the sample workflow through buttons without curl or manual status edits; browser tests exercise it and mock delivery confirmation; real sending stays disabled in portfolio mode; newly enabled actions appear without page reload; Lead 26 is reachable and query count stays bounded by page rather than Lead count.

### Phase 9 — Release verification and documentation

Branch: `codex/pipeline-release-checks`.

- [ ] Run full database/browser/concurrency/contract matrix and upgrade migration rehearsal on sanitized legacy fixtures.
- [ ] Finish CI, root README and deployment/recovery/retention procedures; refresh audit and scoped security review.
- [ ] Update roadmap acceptance checkboxes from observed results; sync canonical plan to the external plan location when mounted.

Done when: all release checks pass, unresolved risks have explicit dispositions, migration/restoration is rehearsed, docs match the actual UI, and the final review finds no unresolved high-impact workflow/privacy issues. Deployment and a real-send smoke test require their own explicit authorization and are not implied by this phase.

## 9. Testing Strategy

Use actual PostgreSQL for locks/uniqueness/transactions and actual Payload APIs for access/hook tests. Mocks cannot prove race safety. Providers remain fake, deterministic, or recorded contract fixtures; no billable calls or real messages in CI.

| Regression | Verification |
|---|---|
| Double-send and two drafts/same Lead | Concurrent independent DB connections and fake provider call counter |
| Process failure after dispatch/acceptance | Failure injection before request, after acceptance, before/after each persistence boundary; durable unknown state |
| Retry safety | Same key/body; current eligibility; old window blocked; explicit action required |
| Direct write bypass | Authenticated Payload REST writes to protected fields rejected; permitted edits invalidate review; internal APIs also enforce invariants |
| Approval and async races | Content/lead/reject/opt-out changes during AI/QA/send preparation cannot be overwritten by stale completions |
| Cross-language schema | Python serialization through Zod including null/missing fields, enums, bounds and malformed output |
| CSV identity | Same/different IDs, no-ID promotion, ambiguous matches, city normalization, missing columns, concurrent inserts and legacy duplicates |
| Public privacy | Real record 404 in portfolio mode, sample contacts omitted, expired/removed/private 404, no shared cache leaking a prior public response |
| Rendered QA | HTTP failure, missing noindex/disclaimer, current revision marker, overflow, screenshot failure and stale artifacts |
| UI | Full sample journey, explicit confirmation, stale-state conflict display, success refresh, pagination, keyboard-accessible controls |
| Operations | Documented startup, migration fresh/upgrade/rollback rehearsal, private asset authorization and bounded provider timeout |

Every phase runs relevant new regression tests plus lint/typecheck and existing suites. Release CI adds build, database integration, Playwright workflow, contract tests, npm audit and a Python dependency audit. Tests must cover intended behavior, not just duplicate helper implementation.

Review-to-phase coverage: #1 → 3; #2–3 → 2/3; #4 → 6; #5 → 1/9; #6 → 7; #7 → 8; #8 → 4; #9 → 5; #10 → 2/6; #11 → 5; #12 → 7; #13 → 5. Review suggestions for migrations/CI, deadlines/run logs, pagination and artifact retention are covered by 1/9, 5, 8 and 6 respectively.

## 10. Security Implications

- PII: Lead contact information, generated copy, immutable delivery snapshots and screenshot content. Restrict internal records/artifacts to authenticated admins; keep sample environments physically separate from real data.
- Authorization: derive actor from Payload auth; never trust user-supplied approval fields, fingerprints alone, internal-context flags or provider delivery claims without verification.
- CSRF: authenticate and validate same-origin browser mutations, especially send/recovery; test hostile Origin and normal authenticated API clients.
- Injection: keep parameterized SQL for locks/index operations, React escaped text, fixed templates, configured screenshot origin and no arbitrary AI-provided HTML/URLs.
- Secrets: provider keys remain in their current owning service environment; errors/logs redact secrets and unnecessary message/lead data.
- External effects: retries and reconciliation are explicit actions; first-send records and legacy contact history cannot be deleted to unlock sending.
- Retention: do not claim a demo is private merely because a database flag changed when public screenshot objects remain accessible. Private reads and documented storage cleanup complete the boundary.

## 11. Risks & Tradeoffs

- Exactly-once delivery cannot be guaranteed across independent database/provider systems indefinitely. Durable slots, bounded same-key retries and fail-closed uncertainty prevent blind resends; uncertain delivery may require manual provider investigation.
- Collection hooks can deadlock or recurse. Acquire locks in consistent order, propagate the existing transaction, and test the REST and Local API paths against the actual adapter. No long provider call under a database lock.
- Legacy data may contain contradictory status/history or duplicates. Dry-run audits and migrations preserve records and deny unsafe sends; no automatic business-record merges. Production reconciliation is a separate reviewed data operation.
- Source-field imports necessarily invalidate derived reviews. This preserves the ADR's intent to retain human workflow data while preventing an old approval applying to changed evidence; document the distinction in ADR 0025.
- Existing public demos may expire immediately after backfill. That is the proposed safe default; no retroactive permanent-public exemption for real leads.
- Stricter QA is still imperfect factual verification. Human approval remains mandatory; vector retrieval and scraped sources are deferred to the later roadmap.
- Nine review units cost more coordination than a single large patch. They keep the application runnable and make high-risk changes independently assessable. Avoid unrelated abstraction or redesign.
- Hosting must support the 70-second AI boundary and Playwright runtime. The proposed initial deployment is a persistent Node service with installed Chromium plus the Python service; shorter-timeout serverless hosting needs a separate execution design, not hidden retries.

## 12. Open Questions

The following proposed decisions are concrete defaults for approval, not unresolved implementation forks:

1. **Expiry:** 45 days for real demos; permanent only for sample fixtures; legacy expiry based on creation time.
2. **Outreach review:** exact recipient/content/demo fingerprint; final demo approval and outreach review remain separate gates as in the existing hardening plan.
3. **Storage:** private screenshot objects with authenticated reads; sample and real deployments use separate databases/buckets.
4. **Sending:** one durable first-send slot per Lead; explicit unchanged-snapshot retries within 23 hours; uncertain outcomes beyond that window cannot resend without authoritative reconciliation.
5. **QA:** real-lead approval requires evidence-aware AI QA plus rendered deterministic checks; deterministic fallback is sample-only for final approval.
6. **Deployment:** persistent Node/Chromium and Python processes for this remediation; no queue or serverless execution redesign.
7. **Architecture records:** add ADRs 0025–0028 during implementation after this plan is approved; no existing accepted ADR is silently superseded.

Accepted planning limitations: dependency patch versions are chosen from the fresh audit at Phase 1 and compatibility-tested; real database duplication/public artifact inventories are unknown until authorized deployment preparation. Neither limitation permits automatic destructive cleanup or unsafe release.

External documentation sync: `/mnt/d/docs/miku/Plans` is not mounted/available in this environment as of 13 September 2026. The repository plan is authoritative here. Copy the updated `docs/ai-demo-pipeline-plan.md` to `/mnt/d/docs/miku/Plans/ai-demo-pipeline-plan.md` and this companion plan beside it once that location is available; verify byte equality. Do not create a fake replacement mount directory.

Implementation starts only after explicit approval of the plan or a named phase. The user's subsequent instruction authorizes atomic commits on new feature branches for that approved work; it does not itself authorize deployment, real outreach, or rewriting shared history.
