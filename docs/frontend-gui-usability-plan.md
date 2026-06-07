# Frontend GUI Usability and shadcn Design Pass Plan

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

Imported leads can be managed only partially from the dashboard. Core human-in-the-loop actions exist as authenticated API routes, but several approval/review/send steps are missing from the GUI, which forces the operator to use browser console `fetch()` calls. That breaks the MVP workflow and makes the portfolio demo feel unfinished.

The current dashboard also looks custom and rough despite the project standard being Next.js + Tailwind + shadcn/ui. The frontend should use shadcn/ui primitives as the default building blocks, with custom code limited to domain-specific composition and workflow logic.

## 2. Goals & Non-Goals

Goals:

- Make the MVP pipeline usable end-to-end from the GUI for one lead at a time.
- Add visible buttons and disabled-state explanations for every workflow action:
  - Demo Creation Approval
  - Generate Business Profile
  - Generate Demo Content / Demo Site
  - Capture Screenshots
  - Run QA
  - Final Approval
  - Reject
  - Generate Outreach Draft
  - Mark Outreach Draft Reviewed
  - Send Outreach, guarded and confirmation-gated
- Show generated assets in the review screen so the operator can make decisions without opening Payload admin for routine workflow checks.
- Keep server-side guards as the source of truth; frontend buttons should guide but never replace API validation.
- Replace the homegrown-looking UI layer with official shadcn/ui-style primitives and patterns.
- Use shadcn components for layout and interaction wherever practical: cards, buttons, badges, tables, tabs, dialogs, alert dialogs, dropdown menus, forms, textarea, select, tooltip, progress/stepper, skeleton/loading, and toast notifications.
- Add an authenticated MVP readiness/status panel showing whether AI service, screenshots/R2, Resend, and portfolio mode are configured.
- Fix the existing frontend TypeScript issue so `npm run typecheck` can pass for touched code.

Non-Goals:

- No change to the human-in-the-loop architecture or approval rules.
- No autonomous generation, bulk sending, or bulk approvals.
- No redesign of public demo templates beyond consistent links/previews from the dashboard.
- No migration away from Payload collections or current API endpoints.
- No new AI provider logic.
- No full CRM replacement; sales-status editing can stay minimal.
- No real email sending during portfolio/local testing while `PORTFOLIO_MODE=true`.

## 3. Proposed Architecture

Use a shadcn-first dashboard architecture:

```txt
Authenticated dashboard pages
  → server-load lead/profile/demo/outreach/workflow state with Payload
  → pass serializable state to client workflow panels
  → client action buttons call existing authenticated API routes
  → API routes keep guard validation and mutate Payload records
  → client shows toast/result, refreshes route, and advances visible step state
```

Key decisions:

- Keep API routes as the workflow boundary. Do not move approval or send rules into client-only logic.
- Add small client components for actions and confirmations instead of building many bespoke pages.
- Use official shadcn primitives under `components/ui/*`; dashboard/domain components compose them.
- Prefer a single focused review page over scattering actions across Payload admin.
- Show blocked reasons before clicks and also surface exact API errors after clicks.
- Use confirmation dialogs for irreversible/risky actions: reject, final approve, mark reviewed, send.
- Use toast notifications for success/error feedback and `router.refresh()` after successful mutations.

Design direction:

- Use a standard shadcn app-shell style: neutral background, responsive container, top navigation/breadcrumbs, cards, tabs, and clean tables.
- Avoid one-off hardcoded colors like `bg-[#121212]`; use shadcn CSS variables and variants.
- Keep custom styling limited to layout composition and domain-specific status mapping.

## 4. Component Breakdown

- `components/ui/*`: official/generated shadcn primitives only. Existing hand-written primitives should be replaced or aligned with shadcn output.
- `components/dashboard/AppShell.tsx`: authenticated dashboard shell using shadcn button/breadcrumb/card/sidebar-style patterns, not hardcoded custom chrome.
- `components/dashboard/LeadTable.tsx`: lead overview table with shadcn table, badges, row actions, and clearer next-step CTA.
- `components/dashboard/WorkflowStepper.tsx`: domain component showing pipeline progress and blocked/current states using shadcn badges/cards/progress.
- `components/dashboard/WorkflowActionPanel.tsx`: client component for workflow buttons, confirmation dialogs, disabled reasons, loading state, and refresh.
- `components/dashboard/LeadSummaryCard.tsx`: concise lead/contact/source/status facts.
- `components/dashboard/GeneratedAssetsTabs.tsx`: tabs for Business Profile, Demo Site, QA Report, Screenshots, Outreach Draft, and Workflow Runs.
- `components/dashboard/OutreachDraftPanel.tsx`: view/edit/review/send controls for the latest outreach draft.
- `components/dashboard/SystemReadinessCard.tsx`: authenticated capability checklist for AI, R2 screenshots, Resend, portfolio mode, and app URLs.
- Existing API routes: reused for mutations, with small response/error normalization only if needed.

## 5. Data Flow

Primary lead workflow:

```txt
Dashboard /dashboard/leads
  → Admin opens Review
  → Review page loads Lead + latest Business Profile + latest Demo Site + latest Outreach Draft + recent Workflow Runs
  → WorkflowStepper computes current stage and next action
  → Admin clicks Demo Creation Approval
  → POST /api/leads/:leadId/approve-demo-creation
  → route updates audit fields
  → UI refreshes and enables Generate Profile

Generate Profile
  → POST /api/leads/:leadId/generate-profile
  → Payload calls Python AI Service with selected provider/model
  → Business Profile saved, Workflow Run saved, Lead pipeline_status=profile_ready
  → UI refreshes and shows profile tab

Generate Demo Content
  → POST /api/leads/:leadId/generate-demo-content
  → Demo Site saved/public with slug, Workflow Run saved, Lead pipeline_status=demo_ready
  → UI refreshes and shows demo link/preview actions

Optional Capture Screenshots
  → POST /api/demo-sites/:demoSiteId/capture-screenshots
  → blocked with clear UI if R2 not configured
  → screenshots saved into qa_report when configured

Run QA
  → POST /api/demo-sites/:demoSiteId/run-qa
  → deterministic + AI QA combined
  → Lead pipeline_status=needs_review when passed, qa_failed when failed
  → UI refreshes and shows QA findings

Final human decision
  → Approve: POST /api/leads/:leadId/approve, only enabled after needs_review + passing QA + available demo
  → Reject: POST /api/leads/:leadId/reject, confirmation required

Outreach
  → Generate Outreach Draft: POST /api/leads/:leadId/generate-outreach-draft, only after final approval
  → Admin reviews/edits draft in GUI
  → Mark Reviewed: POST /api/outreach-messages/:id/mark-reviewed
  → Send: POST /api/outreach-messages/:id/send, confirmation required and disabled while portfolio mode or Resend missing
```

## 6. Interface Contracts

Existing endpoints to expose from GUI:

- `POST /api/leads/:leadId/approve-demo-creation`
  - Input: authenticated admin session, route param `leadId`
  - Output: `{ lead }`
  - Error cases: `401 Unauthorized`, missing lead/Payload errors

- `POST /api/leads/:leadId/generate-profile`
  - Input: optional `{ ai: { provider, model } }`
  - Output: `{ business_profile }`
  - Error cases: unauthorized, missing Demo Creation Approval, AI service/provider/validation failures

- `POST /api/leads/:leadId/generate-demo-content`
  - Input: optional `{ ai: { provider, model } }`
  - Output: `{ demo_site, content }`
  - Error cases: unauthorized, missing Business Profile, AI service/provider/validation failures

- `POST /api/demo-sites/:demoSiteId/capture-screenshots`
  - Input: route param `demoSiteId`
  - Output: `{ demo_site, screenshots }`
  - Error cases: unavailable demo, missing R2 config, screenshot failure

- `POST /api/demo-sites/:demoSiteId/run-qa`
  - Input: optional `{ ai: { provider, model } }`
  - Output: `{ demo_site, qa_report }`
  - Error cases: unavailable demo, AI QA/provider/validation failures

- `POST /api/leads/:leadId/approve`
  - Input: route param `leadId`
  - Output: `{ lead }`
  - Error cases: unauthorized, lead not `needs_review`, unavailable demo, failing/missing QA report

- `POST /api/leads/:leadId/reject`
  - Input: route param `leadId`
  - Output: `{ lead }`
  - Error cases: unauthorized, Payload errors

- `POST /api/leads/:leadId/generate-outreach-draft`
  - Input: optional `{ ai: { provider, model } }`
  - Output: `{ outreach_message }`
  - Error cases: unauthorized, lead not approved, do-not-contact, no available demo, AI failures

- `POST /api/outreach-messages/:outreachMessageId/mark-reviewed`
  - Input: route param `outreachMessageId`
  - Output: `{ outreach_message }`
  - Error cases: unauthorized, lead not approved, no available demo, outreach not draft, relation mismatch

- `POST /api/outreach-messages/:outreachMessageId/send`
  - Input: route param `outreachMessageId`
  - Output: `{ outreach_message, provider_message_id }`
  - Error cases: unauthorized, portfolio mode, missing Resend, not reviewed, already contacted, missing email, unavailable demo

New or modified interfaces:

- `GET /api/system/status`
  - Input: authenticated admin session
  - Output:
    ```ts
    type SystemStatus = {
      appUrl: string
      portfolioMode: boolean
      aiServiceConfigured: boolean
      aiServiceReachable?: boolean
      aiProvider: string
      databaseConfigured: boolean
      r2Configured: boolean
      resendConfigured: boolean
    }
    ```
  - Error cases: `401 Unauthorized`; AI health check timeout should return `aiServiceReachable: false`, not fail the route

- Optional `PATCH /api/outreach-messages/:outreachMessageId`
  - Input: authenticated admin session, `{ subject: string; body: string }`
  - Output: `{ outreach_message }`
  - Error cases: unauthorized, sent messages cannot be edited, validation errors
  - Note: only add this if inline GUI editing is implemented outside Payload admin.

## 7. File Changes

Create:

- `docs/frontend-gui-usability-plan.md` — this plan.
- `components/dashboard/WorkflowStepper.tsx` — visible pipeline progress and next-step state.
- `components/dashboard/WorkflowActionPanel.tsx` — action buttons, disabled reasons, confirmations, toasts, refresh behavior.
- `components/dashboard/LeadSummaryCard.tsx` — lead facts and contactability summary.
- `components/dashboard/GeneratedAssetsTabs.tsx` — profile/demo/QA/screenshots/outreach/workflow tabs.
- `components/dashboard/OutreachDraftPanel.tsx` — outreach view/edit/review/send controls.
- `components/dashboard/SystemReadinessCard.tsx` — environment/capability checklist.
- `app/api/system/status/route.ts` — authenticated system readiness route.
- Optional tests alongside new domain components where logic is non-trivial.

Modify:

- `components/ui/*` — replace current homegrown primitives with official shadcn-style components.
- `app/(frontend)/globals.css` — move to shadcn CSS variable theme and remove hardcoded custom palette defaults.
- `app/(frontend)/layout.tsx` — add shadcn toast provider if using `sonner`.
- `components/dashboard/AppShell.tsx` — restyle shell using shadcn primitives/variables.
- `components/dashboard/LeadTable.tsx` — fix type issue, improve columns, add clear next action and row actions.
- `components/dashboard/FilterBar.tsx` — use shadcn form/select/button patterns.
- `components/dashboard/StatusBadge.tsx` and `components/dashboard/status.ts` — keep domain mapping, render via shadcn Badge variants.
- `components/admin/AiRunControls.tsx` — fold into the workflow action panel or restyle with shadcn components.
- `app/(frontend)/dashboard/leads/page.tsx` — load data needed for table/status cards and fix current `Row[]` type mismatch.
- `app/(frontend)/dashboard/review/[leadId]/page.tsx` — replace current sparse layout with workflow stepper, action panel, generated asset tabs, system status.
- `app/api/outreach-messages/[outreachMessageId]/send/route.ts` — optionally improve returned error message so GUI can show exact send block reason.
- `package.json` and `package-lock.json` — add shadcn/Radix/sonner dependencies only as required by generated components.

Delete:

- No domain files should be deleted in the first pass.
- Any obsolete hand-written UI primitive code can be replaced in place, not removed as separate public API.

## 8. Implementation Phases

### Phase 1 — shadcn foundation and typecheck baseline

- Branch: `feature/frontend-gui-usability-pass`
- Branch gate: implementation must start by checking `git status --short --branch` and creating/switching to this branch before edits.
- Commit policy: one logical change per commit; ask for approval before each commit unless explicitly told to commit according to the plan.
- Commits:
  - [x] Install/add required shadcn primitives using the project `components.json` setup.
  - [x] Convert `globals.css` and existing `components/ui/*` to shadcn-style CSS variable primitives.
  - [x] Add toast support with `sonner` if generated by shadcn.
  - [x] Fix the existing `LeadTable`/dashboard row TypeScript mismatch.
- Done when: `npm run typecheck` reaches only unrelated pre-existing failures, or passes if no unrelated failures remain; existing dashboard pages still render.

### Phase 2 — lead list usability pass

- Branch: same branch, next commits.
- Commits:
  - [x] Redesign `/dashboard/leads` with shadcn Card/Table/Badge/Button patterns.
  - [x] Add next-step labels per lead, e.g. `Approve demo creation`, `Generate profile`, `Run QA`, `Approve`, `Draft outreach`.
  - [x] Add clearer filters and empty states for imported leads.
  - [x] Add authenticated `SystemReadinessCard` or compact readiness banner.
- Done when: imported Plymouth plumber leads show a clear status, next action, latest workflow result, demo link if present, and a review CTA without needing Payload admin.

### Phase 3 — review page workflow controls

- Branch: same branch, next commits.
- Commits:
  - [x] Add `WorkflowStepper` for demo creation → profile → demo → QA → approval → outreach.
  - [x] Add `WorkflowActionPanel` exposing all existing workflow endpoints from the GUI.
  - [x] Add confirmation dialogs for final approval, rejection, mark reviewed, and send.
  - [x] Preserve AI provider/model override controls inside the action panel using shadcn form controls.
  - [x] Show disabled reasons before click and exact API error messages after failed clicks.
- Done when: one lead can move from imported `new` to `approved` using only buttons on `/dashboard/review/:leadId`, assuming AI/R2 dependencies are configured for the selected steps.

### Phase 4 — generated asset review panels

- Branch: same branch, next commits.
- Commits:
  - [x] Add tabs/cards for Lead Data, Business Profile, Demo Site, QA Report, Screenshots, Outreach Draft, and Workflow Runs.
  - [x] Add demo preview/open actions with visible noindex/unofficial-disclaimer checks from QA where available.
  - [x] Show QA pass/fail findings in a readable shadcn Alert/Card layout.
  - [x] Show recent Workflow Runs with errors and provider/model provenance.
- Done when: an Admin User can inspect generated profile/content/QA/outreach enough to make approval decisions without opening Payload admin for routine review.

### Phase 5 — outreach draft GUI and guarded send UX

- Branch: same branch, next commits.
- Commits:
  - [x] Show latest outreach draft subject/body/safety notes in the review page.
  - [x] Optionally add inline edit/save for draft subject/body, or explicitly deep-link to Payload admin edit if inline editing is deferred.
  - [x] Add Mark Reviewed button wired to `mark-reviewed` endpoint.
  - [x] Add Send button with `AlertDialog` confirmation, disabled reason display, and portfolio/Resend warnings.
  - [x] Add sales-status/contact-attempt summary after send.
- Done when: outreach draft generation, review marking, and send blocking/confirmation are all visible and understandable from GUI. Real send remains blocked while `PORTFOLIO_MODE=true`.

### Phase 6 — validation, polish, and docs sync

- Branch: same branch, final commits.
- Commits:
  - [ ] Add tests for workflow state/next-action helper logic and status labels.
  - [x] Run `npm run typecheck`, `npm run lint`, and `npm run test`.
  - [x] Smoke test local dev startup with Next.js and the Python AI Service.
  - [ ] Update `docs/ai-demo-pipeline-plan.md` with the frontend pass status if scope/decisions changed.
  - [ ] Sync relevant plan updates to `/mnt/d/docs/miku/Plans/ai-demo-pipeline-plan.md` if the main roadmap changes.
- Done when: the dashboard is usable end-to-end from GUI, checks pass or documented dependency issues remain, and docs reflect the implemented UX.

## 9. Testing Strategy

Unit tests:

- Workflow next-action helper: maps lead/profile/demo/QA/outreach state to label, enabled flag, disabled reason.
- Status labels/variants still render expected strings.
- Send/approval disabled reason presentation handles portfolio mode, missing email, missing reviewed draft, QA failure, and unavailable demo.

Integration/manual tests:

- Import CSV → open `/dashboard/leads` → review first lead.
- Click Demo Creation Approval → Generate Profile → Generate Demo Content → open Demo Site.
- Run QA with AI service running and ZAI configured.
- Approve only after QA passes.
- Generate Outreach Draft.
- Mark Outreach Draft Reviewed.
- Verify Send is disabled in portfolio mode with clear copy.
- If Resend is configured and portfolio mode is off in a safe test environment, send one test email only after explicit confirmation.

Validation commands:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run dev:all` for manual smoke testing

Edge cases:

- AI service down.
- ZAI provider key missing/invalid.
- R2 missing when screenshot capture is clicked.
- QA failed state.
- Lead marked do-not-contact.
- Lead has no email.
- Outreach already sent.
- Demo expired/removed/private.

## 10. Security Implications

Data exposed/processed:

- Lead names, city/address/contact info, generated profile content, demo links, QA report, outreach drafts, contact attempts.

Access control:

- All dashboard pages and new system status endpoints must require Payload Auth.
- Public `/demo/:slug` remains public but noindexed and governed by Demo Availability.

Input validation:

- Client action payloads may include provider/model overrides and draft edits.
- Existing API routes validate AI config and workflow guards server-side.
- Any new draft edit route must validate length/content and reject edits to sent messages.

Sensitive data:

- Do not expose API keys, database URLs, service tokens, or provider base URLs in system status.
- System status should expose booleans like `resendConfigured`, not secret values.
- Send action must keep existing no-bulk/no-automatic sending constraints and require explicit confirmation.

XSS/injection:

- Continue rendering structured fields as text/components, not arbitrary AI HTML.
- Outreach body/profile fields shown in dashboard must be escaped by React and not rendered as raw HTML.

## 11. Risks & Tradeoffs

- Risk: Replacing UI primitives creates churn.
  - Mitigation: replace primitives in place and keep domain component names stable.

- Risk: shadcn generated components may require additional Radix dependencies.
  - Mitigation: install only components used by the dashboard pass; avoid large UI libraries until needed.

- Risk: GUI enabled/disabled logic drifts from API guards.
  - Mitigation: frontend shows helpful predictions, but API errors remain authoritative and displayed verbatim.

- Risk: Scope creep into full CRM/dashboard redesign.
  - Mitigation: limit this pass to MVP lead workflow, generated asset review, and guarded outreach.

- Risk: Real sending could happen accidentally during testing.
  - Mitigation: keep `PORTFOLIO_MODE=true` by default, show a warning, and require confirmation when sending is enabled.

- Risk: Screenshot capture may still be unusable without R2 keys.
  - Mitigation: add visible readiness state and disabled/blocking copy rather than hiding the action.

## 12. Open Questions

Resolved implementation assumptions:

- Use npm because `package-lock.json` is present.
- Use one branch: `feature/frontend-gui-usability-pass`.
- Use shadcn/ui primitives as the default; custom dashboard components are allowed only as domain-specific composition over shadcn primitives.
- Keep real email sends blocked in local/portfolio testing.
- Inline outreach editing is desirable, but can be deferred to a Payload admin deep-link if it threatens the first pass size.

Resolved before implementation:

- Outreach draft editing is inline in the dashboard.
- Use a shadcn-style shell and primitives for the dashboard pass.
- Add a dark/light theme toggle using `next-themes`.
