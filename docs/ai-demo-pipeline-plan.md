# AI Demo Website Pipeline Plan

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

Build a portfolio-worthy, semi-automated pipeline for finding local businesses with missing or dated websites, generating an unofficial homepage demo, reviewing it safely, and drafting personalised outreach.

The system should prove a controlled AI workflow, not a fully autonomous agency bot.

## 2. Goals & Non-Goals

Goals:

- Import local business leads from the existing business-finder CSV export without automatically creating Business Profiles.
- Generate structured business profiles with AI.
- Generate homepage content with AI using strict anti-hallucination rules.
- Render shareable demo pages from fixed templates.
- Capture desktop and mobile screenshots.
- Run deterministic and AI-assisted QA checks.
- Require human approval before outreach.
- Generate editable outreach email drafts.
- Send one approved outreach email via an explicit admin button-click using Resend.
- Track simple lead/demo/outreach statuses.
- Make the project usable as a portfolio demo.

Non-Goals for the first build:

- No fully autonomous outreach.
- No bulk sending.
- No automatic demo generation.
- No automatic follow-ups.
- No email open tracking at first.
- No payment flow.
- No client portal.
- No complex CRM.
- No Google Maps scraping or Places scanning inside this app at first; lead discovery remains in the existing business-finder app.
- No Smartlead/Instantly integration at first.
- No A/B testing.
- No many-template marketplace.
- No paid-client website deployment automation.
- No autonomous claims, image scraping, fake testimonials, or fake reviews.

## 3. Proposed Architecture

Use a Next.js app with Payload CMS as the backend/admin layer, hosted Neon Postgres as the database, and a Python FastAPI AI Service for bounded AI-heavy tasks. Queue-backed AI Workers can be added later if batching, retries, or long-running jobs justify them.

Recommended stack:

- Next.js App Router
- React
- Tailwind CSS
- shadcn/ui
- Payload CMS for backend, admin UI, auth, access control, collections, and media
- Hosted Neon Postgres database
- Python FastAPI AI Service for generation, enrichment, and QA
- OpenAI API for structured generation, called from the Python AI Service
- Playwright for screenshots
- Resend for explicit admin-triggered email sending
- Vercel or Node hosting for the Next.js/Payload app

Initial implementation can call AI Service HTTP endpoints directly from Payload custom actions/endpoints. Add queue-backed AI Workers later with Inngest, Trigger.dev, BullMQ, Redis, or a Python queue stack if batch processing and retries become important.

Core design principle:

```txt
Deterministic workflow + structured AI steps + human approval gate
```

## 4. Component Breakdown

- Payload Admin: manage leads, statuses, generated records, screenshots, QA reports, approvals, and outreach drafts.
- Custom Review UI: add custom Payload views or Next.js routes where the default admin is not enough, including a simple Workflow Run activity log.
- Payload Collections: source-of-truth records for leads, business profiles, demo sites, outreach messages, contact attempts, workflow runs, and media.
- Python AI Service: owns OpenAI calls and exposes HTTP endpoints for profile generation, demo content generation, AI QA, and outreach draft copy generation.
- Demo Renderer: render `/demo/[slug]` pages from saved Payload/Postgres content.
- Template Components: start with one polished `HomeServicesTemplate`; add professional services/hospitality later.
- Screenshot Service: use Playwright from the Next.js/Payload app to capture desktop and mobile screenshots.
- QA Service: Payload/Next runs deterministic QA, Python AI Service runs AI-assisted QA, and Payload combines both into the saved QA report.
- Status Workflow: use separate pipeline and sales status fields.

MVP pipeline statuses:

```txt
new
profile_ready
demo_content_ready
demo_ready
qa_failed
needs_review
approved
rejected
```

MVP sales statuses:

```txt
not_contacted
contacted
replied
call_booked
won
lost
```

`do_not_contact_at` is a separate contactability restriction, not a status.

## 5. Data Flow

```txt
Lead imported from business-finder CSV as Lead only
→ Admin reviews lead
→ Admin gives Demo Creation Approval
→ Generate business profile
→ Generate demo content
→ Select template
→ Create demo_site row and slug
→ Render public demo URL
→ Capture desktop/mobile screenshots
→ Run QA checks
→ Mark needs_review or qa_failed
→ Human approves/rejects/regenerates
→ Generate outreach email draft
→ Admin explicitly clicks Send
→ Resend sends one approved outreach email
→ Track replies/won/lost
```

## 6. Interface Contracts

Payload collections/Postgres tables:

- `leads`: imported business contact/source data, lead source metadata, Google place identity, website status, demo creation approval fields, pipeline status, sales status, contactability fields, owner/access fields.
- `business_profiles`: AI-generated structured business understanding.
- `demo_sites`: selected template, slug, content JSON, screenshots, QA report, availability fields.
- `outreach_messages`: editable email drafts and send/reply metadata.
- `contact_attempts`: actual sent messages/calls and provider metadata.
- `workflow_runs`: end-to-end attempted operations from trigger to saved or failed outcome, including operation, status, timestamps, summaries, errors, related record ids, and data for a simple visible activity log.
- `media`: screenshots and uploaded assets managed by Payload.

Core server functions:

- `generateBusinessProfile(leadId: string)`
  - Input: lead id
  - Output: saved business profile
  - Error cases: missing lead, AI JSON parse failure, Pydantic validation failure, Zod validation failure, low confidence

- `generateDemoContent(leadId: string)`
  - Input: lead + business profile
  - Output: saved demo content JSON
  - Error cases: missing profile, unsafe/unparseable AI output, Pydantic validation failure, Zod validation failure

- `createDemoSite(leadId: string)`
  - Input: lead + profile + content
  - Output: demo slug and demo URL
  - Error cases: duplicate slug, missing content

- `captureScreenshots(demoSiteId: string)`
  - Input: demo site id
  - Output: desktop and mobile screenshot URLs
  - Error cases: page load failure, storage upload failure

- `runQaChecks(demoSiteId: string)`
  - Input: lead + profile + content + page metadata
  - Output: combined deterministic and AI-assisted QA report JSON
  - Error cases: failed checks, missing disclaimer/noindex, AI Service failure, validation failure

- `generateOutreachDraft(leadId: string)`
  - Input: approved or review-ready lead + demo URL
  - Output: saved outreach subject/body and safety notes
  - Error cases: missing demo URL, unsafe wording, AI Service failure, validation failure

- `sendOutreach(leadId: string, outreachMessageId: string)`
  - Input: approved prospect + reviewed outreach draft
  - Output: contact attempt recorded and sales status updated
  - Error cases: portfolio mode, do-not-contact, unapproved pipeline status, missing recipient, missing available demo site, duplicate first send

## 7. File Changes

Expected project structure:

```txt
app/
  (payload)/admin/...
  demo/[slug]/page.tsx
  dashboard/review/[leadId]/page.tsx optional custom review UI
  api/send-outreach/route.ts optional Next route if not handled by Payload endpoint
collections/
  Leads.ts
  BusinessProfiles.ts
  DemoSites.ts
  OutreachMessages.ts
  ContactAttempts.ts
  WorkflowRuns.ts
  Media.ts
components/
  demo-templates/HomeServicesTemplate.tsx
  dashboard/ReviewPanel.tsx
  dashboard/QAReport.tsx
  dashboard/OutreachPreview.tsx
lib/
  payload.ts
  ai-service-client.ts
  resend.ts
  slugify.ts
  template-selector.ts
  qa.ts
workers/
  python/
    app/main.py
    app/jobs/profile.py
    app/jobs/demo_content.py
    app/jobs/qa.py
    app/schemas.py
prompts/
  enrich-business-profile.ts or workers/python/app/prompts/profile.py
  generate-demo-content.ts or workers/python/app/prompts/demo_content.py
  qa-demo-page.ts or workers/python/app/prompts/qa.py
  generate-outreach.ts or workers/python/app/prompts/outreach.py
types/
  lead.ts
  business-profile.ts
  demo-site.ts
  outreach.ts
payload.config.ts
migrations/
```

## 8. Implementation Phases

### Phase 1 — App foundation and database

Branch: `feature/ai-demo-pipeline`

Commits:

- [x] Scaffold Next.js app with Payload CMS. Tailwind/shadcn still pending before custom UI work.
- [x] Configure Payload with hosted Postgres, auth, admin access, and environment variable docs.
- [x] Add Payload collections for leads, business profiles, demo sites, outreach messages, contact attempts, workflow runs, and media.
- [x] Build or configure the lead list and CSV import flow in Payload admin.

Done when: leads can be imported from business-finder CSV as Lead records only, existing leads are updated without duplication, and records can be viewed in the Payload admin/dashboard.

### Phase 2 — AI profile and content generation

Commits:

- [x] Add AI Service client in the Payload/Next app.
- [x] Add Python FastAPI AI Service endpoints for structured business profile and demo content generation.
- [x] Add env-driven AI provider selection for deterministic fallback, OpenCode Go, ZAI, OpenRouter, OpenAI, and custom OpenAI-compatible endpoints.
- [x] Validate AI Service output with Pydantic before returning and Zod before Payload saves or renders it.
- [x] Require explicit Demo Creation Approval before generating/saving structured business profile, recorded with `demo_creation_approved_at` and `demo_creation_approved_by`.
- [x] Generate/save homepage content JSON.
- [x] Show generated data and recent Workflow Runs in Payload admin or custom review page.

Done when: a lead can move from `new` to `profile_ready` with usable demo content saved.

### Phase 3 — Demo rendering

Commits:

- [x] Add `HomeServicesTemplate`.
- [x] Add `/demo/[slug]` route.
- [x] Add slug creation and demo site records.
- [x] Add noindex metadata and footer disclaimer.

Done when: a public demo URL renders from database content.

### Phase 4 — Screenshots and QA

Commits:

- [x] Add Playwright screenshot capture in the Next.js/Payload app.
- [x] Store desktop/mobile screenshots in Cloudflare R2 and save public screenshot URLs in the saved QA report payload.
- [x] Add deterministic QA checks in the Next.js/Payload app.
- [x] Add AI QA review prompt in the Python AI Service.
- [x] Combine deterministic and AI QA results into one saved QA report.
- [x] Show QA report in Payload admin via the Demo Site `qa_report` field.

Done when: each demo has screenshots and a pass/fail QA report.

### Phase 5 — Human review and outreach draft

Commits:

- [x] Add approve/reject actions. Regenerate currently reuses the existing generation endpoints.
- [x] Add outreach draft copy generation via the Python AI Service.
- [x] Add editable outreach preview via Payload `outreach_messages` records and reviewed marker endpoint.
- [x] Add Resend client and admin-triggered send action.
- [x] Enforce send-button blocking rules.
- [x] Add simple status transitions for contacted/replied/won/lost.

Done when: a lead can be generated, reviewed, approved, and sent one outreach email only after explicit admin confirmation.

## 9. Testing Strategy

Unit tests:

- `slugify`
- `template-selector`
- deterministic QA checks
- prompt schema validators
- status transition helpers

Integration/manual tests:

- Import lead from business-finder CSV → admin approves demo creation → generate profile → generate content → render demo.
- Screenshot capture works for desktop and mobile sizes.
- QA fails when disclaimer/noindex is missing.
- Outreach cannot be generated for rejected/do-not-contact leads.
- Send button is blocked unless lead is approved, not contacted, not do-not-contact, has an available demo site, has a reviewed draft, has a recipient email, and portfolio mode is off.

Portfolio demo test case:

- Use fictional/sample businesses only.
- Hide or fake emails/phone numbers.
- Disable real sending in demo mode.

## 10. Security Implications

Data processed:

- Business names, emails, phone numbers, addresses, website URLs, generated outreach copy.

Security requirements:

- Keep OpenAI/Payload/AI Service/Resend keys server-side only; OpenAI keys live only in the Python AI Service.
- Protect Payload admin/dashboard routes with auth before using real leads.
- Sanitize generated content before rendering.
- Do not render arbitrary HTML from AI output; use structured fields only.
- Add noindex/nofollow to demo pages.
- Add clear unofficial disclaimer to every demo page.
- Track `do_not_contact` and respect opt-outs.
- Do not allow autonomous sends, bulk sends, duplicate first sends, or sends in portfolio mode.
- Provide a simple way to remove/disable demo pages if requested.

Suggested extra fields:

```txt
leads.do_not_contact_at
leads.last_contacted_at
leads.pipeline_status
leads.sales_status
demo_sites.is_public
demo_sites.expires_at
demo_sites.removed_at
demo_sites.removal_reason
```

## 11. Risks & Tradeoffs

- Risk: AI invents facts.
  - Mitigation: strict prompts, structured output, deterministic QA, AI QA, human review.

- Risk: outreach feels spammy.
  - Mitigation: short emails, explicit admin-triggered sending only, opt-out support, no bulk sends, no automatic follow-ups.

- Risk: demo implies business approval.
  - Mitigation: disclaimer in footer and outreach; noindex; avoid impersonation language.

- Risk: overbuilding before sales validation.
  - Mitigation: build a vertical slice only; defer CRM, analytics, integrations, payments.

- Risk: portfolio demo exposes real prospect data.
  - Mitigation: add demo/sample mode with fictional leads and disabled sending.

## Skill Checkpoints

Use these skills deliberately during the build:

- `planning`: already used for this reference plan. Reuse when changing scope materially.
- `expert-programming`: use when implementing each phase from this plan.
- `testing`: use before/while adding unit, integration, and Playwright coverage.
- `code-review`: use after each phase before merging or moving on.
- `security-review`: use after code review for auth, public demo URLs, API routes, PII, OpenAI calls, and outreach data.
- `review`: use for branch-level review against `main` or a fixed commit; good before a portfolio release.
- `documentation`: use at the end to write the portfolio README, architecture notes, and demo walkthrough.
- `debugging` / `diagnose`: use only when a workflow, screenshot job, API route, or Supabase integration is failing.
- `performance`: later only, if screenshot capture or batch generation becomes slow.
- `github-projects` / `to-issues`: optional if this plan gets split into tracker issues.
- `orchestration`: optional later if coordinating multiple agents; not needed for the first build.

## 12. Open Questions

- Payload Auth from the start is decided; implementation still needs exact access-control rules and admin route shape.
- Screenshots are stored in Cloudflare R2 using S3-compatible signed PUT requests, with public URLs saved in each Demo Site QA report.
- AI model/provider is env-driven. Supported presets: `opencode-go`, `zai`, `openrouter`, `openai`, `openai-compatible`, and `deterministic` fallback. Per-task model overrides are available with `AI_PROFILE_MODEL`, `AI_DEMO_CONTENT_MODEL`, `AI_QA_MODEL`, and `AI_OUTREACH_MODEL`.
- First real leads are CSV imported from business-finder; sample leads are still needed for portfolio mode.
- What domain/subdomain will host public demo pages?
- What is the minimum acceptable QA pass threshold before human review?
