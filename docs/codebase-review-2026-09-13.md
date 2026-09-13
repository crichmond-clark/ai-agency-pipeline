# Codebase review — 13 September 2026

Reviewed `feature/ai-demo-pipeline` at `e11c889`. Application source was unchanged during this review. This is a repository review, not a deployed-system penetration test.

## Code Review Result: FAIL

### Summary

Good architectural foundation, but not ready for real outreach or a polished public portfolio release. The service boundaries, domain vocabulary, fixed templates, and explicit workflow guards are sensible. The main weakness is that workflow rules live in individual route handlers while ordinary collection edits and concurrent operations can invalidate their assumptions.

### Plan Adherence

- The Payload/Next versus Python boundary follows the ADRs. CSV import creates Leads only, and AI results are validated at both service boundaries.
- Several completed roadmap items are incomplete in practice: styled demo rendering, an end-to-end button-driven review/send workflow, portfolio privacy, and durable prevention of duplicate first sends.
- The hardening plan separates final demo approval from outreach review; I treated that clarification as intentional rather than flagging the older glossary wording as an implementation defect.
- Accepted shared-admin access is not treated as a missing multi-tenant feature.

### Branch Scope

- Branch matches the implementation plan. Working tree was clean at the start.
- This review covers the current repository, not just a proposed diff against main.

### Commit Quality

- Recent commit subjects distinguish documentation, import, UI, and security changes reasonably well.
- Historical user approvals and validation between commits cannot be established from this session; no claim is made that commit permissions were violated.

### Code Quality

- Small files, clear names, pure guard helpers, and centralized AI transport make the project approachable.
- Mutations lack a common transactional workflow layer. “Approved”, “reviewed”, and “QA passed” are mutable values rather than decisions tied to a specific content revision.
- UI completeness and operational setup lag behind the documentation.

### Security

- Auth checks, environment-held secrets, React text rendering, service bearer authentication, and public availability checks are useful controls.
- Portfolio privacy, durable send safety, and dependency maintenance need work before public deployment with real records.

### Testing

- `npm test`: **35 passed across 5 files**.
- `npm run typecheck`: **passed**.
- `npm run lint`: **passed**.
- Python pytest: **3 passed**. The sandboxed FastAPI test client stalled; the same tests passed outside the sandbox in 0.63 seconds.
- Installed locked dependencies for validation; JavaScript dependency install scripts were disabled.
- No production build, database-backed end-to-end test, live AI call, screenshot capture, or real email send was performed.
- Existing tests mainly cover pure helpers and three auth rejection/health cases. They do not establish safe behavior across collection writes, concurrency, partial failures, or Python-to-TypeScript contracts.

### Issues Found

1. **High — first sends are not concurrency-safe or retry-safe.** [Send route](/home/kon/repos/ai-agency-pipeline/app/api/outreach-messages/[outreachMessageId]/send/route.ts:17), [Resend wrapper](/home/kon/repos/ai-agency-pipeline/lib/resend.ts:22). Two requests can load the same eligible state and both send before either saves `sent_at`. A successful provider send followed by a failed database write also leaves a retry path that can resend. There is no provider idempotency key or durable per-lead first-send reservation. Add a unique first-contact operation, atomically claim it before sending, use a stable provider idempotency key, and reconcile uncertain delivery results. A transaction around database updates alone cannot make an external email call atomic.

2. **High — collection edits can bypass workflow gates and preserve stale approvals.** [Leads](/home/kon/repos/ai-agency-pipeline/collections/Leads.ts:28), [Outreach Messages](/home/kon/repos/ai-agency-pipeline/collections/OutreachMessages.ts:17), [Demo Sites](/home/kon/repos/ai-agency-pipeline/collections/DemoSites.ts:19). Authenticated operators can directly change status fields, demo content, and draft copy. No hooks reset review after subject/body edits or clear QA/final approval after demo edits. Thus a reviewed message can be edited and still sent without reviewing the new text. UI `readOnly` settings are not a substitute for field access or server-side invariants. Put transitions and validation at the collection/service boundary; bind review to the content and recipient actually reviewed.

3. **High — “active approved demo” is not a persisted relationship.** [Send route](/home/kon/repos/ai-agency-pipeline/app/api/outreach-messages/[outreachMessageId]/send/route.ts:19), [send guard](/home/kon/repos/ai-agency-pipeline/lib/workflow-guards.ts:45). Approval picks the latest-updated demo, outreach generation independently picks an available demo, and sending loads the draft's referenced demo. The guard compares the draft's demo ID with that same loaded record, so it cannot establish that it is the demo actually approved. It also does not check current QA. A direct helper reproduction returned no block for an approved lead and a demo with failed QA. Persist the approved demo/revision and check it at review/send; invalidate it on relevant changes. The normal QA route changes lead status too, but separate writes and direct edits make a stale approved lead possible.

4. **High — portfolio mode does not protect public lead data.** [Public demo page](/home/kon/repos/ai-agency-pipeline/app/(frontend)/demo/[slug]/page.tsx:38). The page passes real business name, city, phone, and email to the public template without checking `PORTFOLIO_MODE` or `is_sample_lead`. Those flags do not restrict public rendering elsewhere either. Turning portfolio mode on blocks Resend, but an existing real-lead demo still exposes contact details and contact links. Restrict portfolio public pages to sample leads and sanitize the render input, including generated text where necessary.

5. **High-priority release work — vulnerable locked dependencies.** The current npm audit reports **33 affected package entries: 3 critical, 13 high, 16 moderate, 1 low**. These are package findings, not 33 independently exploitable application vulnerabilities. Critical entries include production `next@15.4.11` and development-only `concurrently`/`shell-quote`. Production findings also include Payload, sharp, undici, and image-size. The older “no high/critical” documentation is stale. Next's affected App Router versions include this lockfile version; see the [maintainer's Server Components DoS advisory](https://github.com/vercel/next.js/security/advisories/GHSA-q4gf-8mx6-v5v3). Some critical advisories are environment-specific, including a [Windows-hosted server issue](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36), so do not describe that issue as proven exploitable on this Linux checkout. Update compatible packages in a dedicated change, review transitive findings, and rerun validation; avoid a blind force-fix.

6. **Medium — demo styling is not wired up.** [Home Services template](/home/kon/repos/ai-agency-pipeline/components/demo-templates/HomeServicesTemplate.tsx:15), [frontend layout](/home/kon/repos/ai-agency-pipeline/app/(frontend)/layout.tsx:9), [package manifest](/home/kon/repos/ai-agency-pipeline/package.json). The template is written using Tailwind utility classes, but the repository has no Tailwind dependency, stylesheet, PostCSS configuration, or frontend CSS import. Payload's admin stylesheet lives in a separate route layout. Wire up the stylesheet/build path and verify desktop/mobile output; the current class names alone cannot produce the intended design.

7. **Medium — the UI cannot complete the documented workflow.** [Review actions](/home/kon/repos/ai-agency-pipeline/app/(frontend)/dashboard/review/[leadId]/page.tsx:34), [action controls](/home/kon/repos/ai-agency-pipeline/components/admin/AiRunControls.tsx:31). The page exposes profile/content/QA/outreach generation only. There are no wired buttons for demo-creation approval, capture, final approval/rejection, marking reviewed, or sending. Imported leads initially have a disabled Generate Profile button; the required approval fields are read-only in Payload Admin. Also, successful actions and model refreshes only update a message, leaving server-derived status, enabled buttons, and model suggestions stale until reload. Add the missing guarded actions, show the actual draft/QA/screenshots, and refresh page data after success.

8. **Medium — CSV identity fallback can merge different businesses.** [Identity lookup](/home/kon/repos/ai-agency-pipeline/lib/leads.ts:72). After a new place ID fails to match, the importer falls back to name/city even if the matched existing lead already has a different place ID. A reproduction with `place-B` and a same-name/city `place-A` updated lead A rather than creating B. Fallback should not collapse conflicting authoritative IDs. City is also compared without normalization, fallback identity lacks a database uniqueness constraint, and a fallback-matched lead is not upgraded with the newly acquired place ID. Define the normalized identity policy and enforce it atomically.

9. **Medium — the two validation contracts disagree.** [Python VerifiedFact](/home/kon/repos/ai-agency-pipeline/workers/python/app/schemas.py:30), [Zod profile schema](/home/kon/repos/ai-agency-pipeline/types/ai.ts:6). Python accepts a missing source and serializes it as `source: null`; Zod accepts an omitted source but rejects null. A valid Python profile can therefore fail on arrival in Next. Reproduced the Zod rejection. Python QA also permits arbitrary status/severity strings, whereas Zod uses enums. Align nullability and constraints and exchange realistic serialized fixtures through both validators.

10. **Medium — real demos default to permanent public availability.** [Demo generation](/home/kon/repos/ai-agency-pipeline/app/api/leads/[leadId]/generate-demo-content/route.ts:30), [availability helper](/home/kon/repos/ai-agency-pipeline/lib/demo-availability.ts:16). New demos are public with no expiry; missing expiry is treated as permanent. This contradicts the documented 30–60-day lifespan for real prospects. Regeneration also forces private demos public and retains old QA/screenshots. Set a real-lead expiry, preserve deliberate availability choices, and clear evidence tied to replaced content.

11. **Medium — documented Python startup does not load service settings.** [Startup script](/home/kon/repos/ai-agency-pipeline/package.json:14), [setup instructions](/home/kon/repos/ai-agency-pipeline/docs/app-guide.md:219). The guide says to create `workers/python/.env`, but the command has neither `uv --env-file` nor Uvicorn `--env-file`, and application code does not load dotenv. With settings present only in that file, the service token is absent and generation requests return 401. Load the file explicitly or document exporting variables. Inspection of the installed Uvicorn configuration confirms dotenv loading is conditional on `env_file`.

12. **Medium — QA cannot verify factual claims against source evidence.** [QA job](/home/kon/repos/ai-agency-pipeline/workers/python/app/jobs/qa.py:20), [deterministic checks](/home/kon/repos/ai-agency-pipeline/lib/qa.ts:23). AI QA receives generated content and a URL, but no lead evidence/profile and no fetched page or screenshots. Deterministic QA checks content fields rather than actual rendering/noindex; its fake-review check only searches for “testimonial”. A passing result therefore does not establish factual grounding or rendered-page quality. Supply the trusted evidence and content revision to QA, inspect the rendered page separately, and label deterministic fallback accurately. The existing evidence-grounded roadmap recognizes this direction; harden the current workflow before broadening retrieval infrastructure.

13. **Medium — asynchronous selection errors escape the intended error response.** [AI request selection](/home/kon/repos/ai-agency-pipeline/lib/ai-route.ts:15). Returning `resolveAiSelection(...)` without awaiting it inside the try block lets rejected promises bypass the catch. A reproduction with an OpenAI default and empty model threw instead of returning the intended validation response. Await the selection inside the try block and cover invalid saved settings as well as invalid request overrides.

### Required Fixes (Blocking)

- Before real outreach: durable duplicate-send prevention, edit-safe approvals, an explicit approved demo revision, and portfolio privacy.
- Before public release: dependency remediation and review of applicable advisories.
- Before calling the MVP complete: styling, missing workflow buttons, reliable environment loading, identity rules, schema parity, expiry defaults, and the error-path fix.
- Add integration tests for concurrent sends, provider-success/database-failure, edits after review, direct Payload writes, mismatched demos, portfolio rendering, and cross-language responses.

### Suggestions (Non-blocking)

- Keep the current architecture. Extract shared application operations for approve/generate/review/send so routes remain small and collection hooks can enforce the same rules. A rewrite is unnecessary.
- Add pagination to the dashboard and replace its two per-lead queries. At 50 leads it explicitly performs 101 collection queries before any relationship expansion, and there is no way to navigate to lead 51.
- Add explicit deadlines to AI-service HTTP calls and define one retry budget. The Python wrapper's retry sits on top of SDK retries, while the Next fetch has no application timeout.
- Persist a started Workflow Run before long work, then finish that record. Currently most operations log only at the end; process interruption can leave no run, and a logging failure can obscure a successfully saved result.
- Define a versioned database migration and deployment procedure. No committed migrations or CI workflow were found. Add a concise root README pointing to the app guide and required checks.
- Keep screenshots/content/QA revisions separate enough to prevent stale evidence and public R2 objects outliving the intended demo retention policy.

## Security Review Result: FAIL

### Summary

Not ready for public deployment with real lead data and enabled outreach. This conclusion concerns demonstrated workflow/privacy gaps and unresolved dependency findings, not a claim of a confirmed anonymous account takeover.

### Findings

#### Critical

- No application-specific critical exploit was reproduced. npm reports critical dependency entries; applicability needs deployment-specific assessment.

#### High

- Duplicate-send concurrency and uncertain-delivery retry behavior: issue 1.
- Editable approval/review state and absent approved-revision checks: issues 2–3. These require an authenticated operator or inconsistent stored state; they are not anonymous auth bypasses.
- Portfolio mode exposing real lead details on public pages: issue 4.
- Production dependency remediation: issue 5.

#### Medium

- Permanent real-prospect demos and stale QA retention: issue 10.
- Source-free factual QA: issue 12.

#### Low

- Additional configuration concerns should be assessed in deployment context; none are promoted to blockers merely for missing an optional header.

### Dependency Audit

- npm affected-package counts: critical 3; high 13; moderate 16; low 1.
- This includes development tooling and transitive findings. A full Python dependency vulnerability audit and exhaustive package-age review were not performed.

### Secrets Scan

- Reviewed configuration keeps credentials in environment variables, and `.env` is ignored.
- No credentials were printed or used. An exhaustive current-tree/history secrets scan was not performed, so this is not a certification that the repository history contains no secrets.

### Positive Findings

- Generation/send endpoints authenticate callers. Python fails closed when its service token is missing or wrong.
- Fixed React templates escape text instead of accepting arbitrary generated HTML.
- Expired, removed, and private demos are checked by a shared availability helper.
- Sending checks portfolio mode at both the workflow guard and provider wrapper.

### Required Fixes

Resolve issues 1–5 before enabling production outreach or presenting portfolio mode as privacy-safe.

### Recommendations

Add database-backed and browser-level regression coverage for the actual trust boundaries, and update release documentation from verified behavior rather than endpoint existence.
