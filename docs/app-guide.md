# AI Agency Pipeline — Full App Guide

## What It Is

A **human-in-the-loop pipeline** for finding local businesses with missing or dated websites, generating an unofficial homepage demo, reviewing it safely, and drafting personalised outreach. It's two services that talk to each other:

1. **Next.js + Payload CMS** (the main app) — admin UI, database, demo rendering, screenshots, deterministic QA, email sending, workflow orchestration
2. **Python FastAPI AI Service** (the AI worker) — all OpenAI/LLM calls for profile generation, demo content, AI QA, and outreach drafts

---

## Architecture Map

```
┌──────────────────────────────────────────────────────────────────┐
│  Next.js App (port 3000)                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │ Payload CMS  │  │  Dashboard   │  │  Public Demo Pages     │  │
│  │ /admin/*     │  │ /dashboard/* │  │  /demo/[slug]          │  │
│  │ - CRUD all   │  │ - Lead list  │  │  - HomeServicesTemplate│  │
│  │   collections│  │ - Review page│  │  - noindex metadata    │  │
│  │ - CSV import │  │ - AI controls│  │  - footer disclaimer   │  │
│  └──────┬───────┘  └──────┬───────┘  └────────────────────────┘  │
│         │                 │                                      │
│  ┌──────▼─────────────────▼──────────────────────────────────┐   │
│  │  API Routes  (/api/*)                                     │   │
│  │  import-leads, generate-profile, generate-demo-content,   │   │
│  │  run-qa, capture-screenshots, approve, reject,            │   │
│  │  generate-outreach-draft, mark-reviewed, send,            │   │
│  │  approve-demo-creation, ai-models/refresh                 │   │
│  └──────────────────────┬────────────────────────────────────┘   │
│                         │                                        │
│  ┌──────────────────────▼────────────────────────────────────┐   │
│  │  lib/ modules                                             │   │
│  │  ai-service-client → HTTP calls to Python service         │   │
│  │  workflow.ts → records every run as a WorkflowRun          │   │
│  │  workflow-guards.ts → approval/review/send gate logic      │   │
│  │  qa.ts → deterministic QA checks                          │   │
│  │  csv.ts → CSV parser                                      │   │
│  │  leads.ts → import + dedup logic                          │   │
│  │  slugify.ts → URL-safe slugs                              │   │
│  │  screenshots.ts → Playwright capture                      │   │
│  │  r2-storage.ts → Cloudflare R2 upload                     │   │
│  │  resend.ts → email sending via Resend                     │   │
│  │  demo-availability.ts → public/expiry/removed checks      │   │
│  │  ai-settings.ts → provider/model resolution chain         │   │
│  └───────────────────────────────────────────────────────────┘   │
│                         │                                        │
│         ┌───────────────┼───────────────┐                       │
│         ▼               ▼               ▼                       │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐              │
│  │  Postgres   │  │ Cloudflare │  │   Resend     │              │
│  │  (via Neon) │  │    R2      │  │   (email)    │              │
│  └────────────┘  └────────────┘  └──────────────┘              │
└──────────────────────────────────────────────────────────────────┘
                         │
              HTTP (Bearer token auth)
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  Python FastAPI AI Service (port 8000)                           │
│  workers/python/app/                                             │
│  ├── main.py          → FastAPI app, endpoints, auth             │
│  ├── llm.py           → OpenAI client, provider routing, retries│
│  ├── schemas.py       → Pydantic models for all I/O             │
│  └── jobs/                                                       │
│      ├── profile.py       → business profile generation          │
│      ├── demo_content.py  → homepage content generation          │
│      ├── qa.py            → AI QA review                         │
│      └── outreach.py      → outreach draft generation            │
│                                                                  │
│  Every job has a deterministic fallback when provider=deterministic│
└──────────────────────────────────────────────────────────────────┘
```

---

## Data Model (7 Payload Collections)

| Collection | Purpose | Key Fields |
|---|---|---|
| **Leads** | Imported businesses | `business_name`, `city`, `email`, `google_place_id`, `pipeline_status`, `sales_status`, `demo_creation_approved_at`, `do_not_contact_at` |
| **BusinessProfiles** | AI-enriched interpretation of a lead | `industry`, `services`, `verified_facts`, `assumptions`, `confidence`, `missing_information` |
| **DemoSites** | Generated demo website | `slug`, `template`, `content` (JSON), `qa_report`, `is_public`, `expires_at`, `removed_at`, screenshots |
| **OutreachMessages** | Editable sales email drafts | `subject`, `body`, `safety_notes`, `status` (draft→reviewed→sent) |
| **ContactAttempts** | Record of actually-sent messages | `channel`, `sent_at`, `provider_message_id` |
| **WorkflowRuns** | Audit log of every pipeline operation | `operation`, `status`, `lead`, `error`, `metadata` |
| **Media** | Screenshots and uploads | `alt`, `filename` |

Plus **Users** (Payload auth) and the **AiSettings** global (admin-editable provider/model config).

---

## Pipeline Flow

```
CSV Import → Lead (status: new)
    ↓ Admin clicks "Approve Demo Creation"
    ↓ demo_creation_approved_at recorded
    ↓
Generate Profile (via Python AI Service)
    → BusinessProfile saved, lead → profile_ready
    ↓
Generate Demo Content (via Python AI Service)
    → DemoSite created with slug + content, lead → demo_ready
    ↓
Capture Screenshots (Playwright → R2)
    ↓
Run QA (deterministic checks + AI QA via Python service)
    → Combined report saved
    → lead → needs_review (if passed) or qa_failed
    ↓
Admin Approves (needs_review → approved)
    ↓ (or Reject → rejected)
    ↓
Generate Outreach Draft (via Python AI Service)
    → OutreachMessage (status: draft)
    ↓
Admin Reviews Draft (draft → reviewed)
    ↓
Admin Clicks Send (reviewed → sent via Resend)
    → ContactAttempt recorded
    → lead.sales_status → contacted
```

## Lead Review Workspace

Open `/dashboard/review/<lead-id>` from the Lead dashboard. The workflow progress bar shows the seven stages from Demo Creation Approval through Send; the highlighted stage is the next decision supported by the current records. Cards below it expose the source Lead Data, Business Profile evidence, Demo Site availability and revision, QA findings, Outreach Draft, and recent Workflow Runs.

Use the action rail on the right (or below the cards on mobile) to run an enabled stage. Disabled actions include the prerequisite that is missing. Rejecting a Demo Site and sending an Outreach Draft require an explicit confirmation. A refreshed page after each successful action is the source of truth for the next available step.

The review workspace uses local shadcn-style primitives in `components/ui` and Tailwind utility classes. New controls should reuse those primitives so focus, hover, disabled, and destructive states remain consistent.

## Lead Dashboard

Open `/dashboard/leads` to view imported Leads. The header shows the number of Leads matching the current filters. Pipeline, sales, and Demo Creation Approval filters use URL query parameters, so filtered pages can be bookmarked and pagination preserves the active selection.

Wide screens use a compact five-column table. Laptop, tablet, and mobile widths use Lead cards so names, statuses, workflow errors, and actions remain readable. Every result links to its review workspace. Generated Demo Sites link to the authenticated Admin preview; public availability is shown separately because private, expired, removed, and Portfolio Mode restricted demos are intentionally unavailable through `/demo/[slug]`.

CSV import remains a manual Admin action. Select a business-finder CSV and choose **Import Leads**; completion or failure is announced in the import Card and the Lead list refreshes after a successful import.

---

## AI Provider System

The provider/model is resolved in this priority order:
1. **Per-request override** — from the `AiRunControls` component on the review page
2. **Per-operation settings** — from the Payload `ai-settings` global
3. **Default settings** — from the `ai-settings` global
4. **Environment variables** — `AI_PROVIDER`, `AI_MODEL`
5. **Deterministic fallback** — hardcoded safe placeholder data

Supported providers: `deterministic`, `opencode-go`, `zai`, `openrouter`, `openai`, `openai-compatible`

Every AI job validates output **twice**: Pydantic in Python, Zod in the Next.js app before saving.

---

## How To Spin It Up Locally

### Prerequisites

- **Node.js** 18+
- **Python** 3.11+
- **PostgreSQL** database (local or hosted Neon)
- **Playwright** browsers (for screenshots)

### 1. Clone and install Node dependencies

```bash
cd /home/kon/repos/ai-agency-pipeline
npm install
```

### 2. Set up your `.env` file

Copy `.env.example` to `.env` and fill in the required values:

```bash
# REQUIRED — core app
DATABASE_URI=postgres://user:password@host:5432/ai_agency_pipeline
PAYLOAD_SECRET=some-long-random-string-at-least-32-chars
NEXT_PUBLIC_SERVER_URL=http://localhost:3000

# REQUIRED — Python AI Service connection
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_TOKEN=some-long-random-service-token
# Same token must be set in Python service's .env

# AI provider — start with deterministic for testing without API keys
AI_PROVIDER=deterministic
AI_MODEL=

# Keep this true for safe local/portfolio testing
PORTFOLIO_MODE=true

# OPTIONAL — only needed for real AI calls (pick one provider)
# OPENAI_API_KEY=sk-...
# OPENROUTER_API_KEY=sk-or-...
# OPENCODE_API_KEY=...
# ZAI_API_KEY=...
# AI_BASE_URL=...  (for openai-compatible)

# OPTIONAL — only needed for real email sending
# RESEND_API_KEY=re_...
# RESEND_FROM_EMAIL=Your Name <you@example.com>

# OPTIONAL — only needed for screenshot capture
# R2_ACCOUNT_ID=...
# R2_ACCESS_KEY_ID=...
# R2_SECRET_ACCESS_KEY=...
# R2_BUCKET=...
# R2_PUBLIC_BASE_URL=https://...
```

**Minimum viable `.env` for testing without external services:**

```
DATABASE_URI=postgres://user:password@localhost:5432/ai_agency_pipeline
PAYLOAD_SECRET=dev-secret-change-me-in-production-abc123
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_TOKEN=dev-ai-service-token
AI_PROVIDER=deterministic
PORTFOLIO_MODE=true
```

### 3. Set up the Python AI Service

```bash
cd workers/python
uv sync
```

Create `workers/python/.env` (or use the repository-root `.env`; `npm run dev:ai` detects either file):

```
AI_SERVICE_TOKEN=dev-ai-service-token
AI_PROVIDER=deterministic
```

### 4. Create the database

Create a PostgreSQL database called `ai_agency_pipeline` (or whatever your `DATABASE_URI` points to). Payload will create the tables on first run.

### 5. Start both services

**Terminal 1 — Python AI Service:**

```bash
cd workers/python
uv run uvicorn app.main:app --env-file .env --reload --port 8000
```

**Terminal 2 — Next.js/Payload app:**

```bash
npm run dev
```

### 6. Create your first admin user

1. Open http://localhost:3000/admin
2. Payload will prompt you to create the first user
3. Create an admin account

---

## Testing Instructions — Full End-to-End Walkthrough

### Step 1: Verify both services are running

```bash
# Python AI Service health check
curl http://localhost:8000/health
# Should return: {"status":"ok"}
```

### Step 2: Import leads via CSV

In the Payload admin (http://localhost:3000/admin), or via curl:

```bash
curl -X POST http://localhost:3000/api/import-leads \
  -H "Content-Type: text/plain" \
  -H "Cookie: payload-token=YOUR_PAYLOAD_TOKEN" \
  --data-binary 'business_name,city,email,phone,website_url,place_id,website_status
"Acme Plumbing","London","info@acme-plumbing.co.uk","020 1234 5678","","ChIJdd4hrwug2EcRmSrV3Vo6llI","no_site"
"Smith Roofing","Manchester","hello@smithroof.com","0161 987 6543","https://smithroof.com","ChIJhw1XZm_pe0gRQPyes-_Srgw","live"'
```

Or manually create leads in the Payload admin under the **Leads** collection.

### Step 3: Run the pipeline via the Dashboard

1. Go to http://localhost:3000/dashboard/leads
2. Find your lead, click **Review**
3. On the review page:
   - Click **"Approve Demo Creation"** (this records `demo_creation_approved_at`)
   - The **"Generate Profile"** button enables — click it
   - The **"Generate Demo Content"** button enables — click it
   - A demo site is created with a slug

### Step 4: View the demo site

Click the demo slug link (or navigate to `http://localhost:3000/demo/{slug}`). You should see the `HomeServicesTemplate` rendered with the generated content, including the footer disclaimer.

### Step 5: Run QA

On the review page, click **"Run QA"**. This:

- Runs deterministic QA checks (schema valid, slug present, is public, disclaimer has "unofficial" + "demonstration", no testimonials)
- Calls the Python AI Service for AI QA
- Combines results into a QA report
- Sets pipeline status to `needs_review` (pass) or `qa_failed` (fail)

### Step 6: Approve

Click **"Approve"** on the lead (only available when `needs_review` + QA passed + demo available).

### Step 7: Generate and review outreach draft

- Click **"Generate Outreach Draft"** (only available when approved + has demo + not do-not-contact)
- The outreach message is created with status `draft`
- Mark it reviewed (in the Payload admin under **Outreach Messages**, or via the review UI)

### Step 8: Send (blocked in portfolio mode)

With `PORTFOLIO_MODE=true`, the send button is blocked. To test real sending:

- Set `PORTFOLIO_MODE=false`
- Configure `RESEND_API_KEY` and `RESEND_FROM_EMAIL`
- All send-block guards must pass: approved, not contacted, not do-not-contact, has email, reviewed outreach, available demo, not portfolio mode

---

## Running the Test Suite

### Node/TypeScript tests (Vitest)

```bash
npm test
```

This runs:

- `tests/slugify.test.ts` — slug generation
- `tests/leads.test.ts` — CSV import dedup/update logic (with fake Payload)
- `tests/qa.test.ts` — deterministic QA pass/fail rules
- `tests/demo-availability.test.ts` — public/expiry/removed checks
- `tests/workflow-guards.test.ts` — approval, outreach review, and send block reasons

### Python tests (pytest)

```bash
cd workers/python
uv run pytest
```

This runs:

- `tests/test_auth.py` — verifies `/health` needs no auth, `/profile` requires valid bearer token

### Type checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

---

## Key Design Decisions (from ADRs)

- **Human-in-the-loop** — no autonomous sending, bulk ops, or auto-generation
- **Demo Creation Approval** is a separate audit field (`demo_creation_approved_at` + `approved_by`), not a pipeline status
- **Pipeline Status** and **Sales Status** are separate fields
- **Do Not Contact** is a separate restriction, not a status
- **Double validation** — Pydantic validates in Python, Zod validates in Next.js before saving
- **Python owns all OpenAI calls** — API keys never touch the Node app
- **Deterministic fallback** — every AI job returns safe placeholder data when provider is `deterministic`, so the whole pipeline works without any LLM API keys
- **Portfolio mode** — blocks all real sending, hides contact data, uses sample leads

---

## What You Need vs What's Optional

| Need for basic testing | Need for full pipeline |
|---|---|
| PostgreSQL database | ↑ plus an AI provider API key (OpenAI, OpenRouter, etc.) |
| `PAYLOAD_SECRET` | ↑ plus R2 credentials for screenshots |
| `AI_SERVICE_TOKEN` | ↑ plus Resend API key for email sending |
| `AI_PROVIDER=deterministic` | |
| `PORTFOLIO_MODE=true` | |
