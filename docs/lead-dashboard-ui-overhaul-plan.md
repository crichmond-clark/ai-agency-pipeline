# Lead Dashboard UI Overhaul Plan

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

The Lead dashboard predates the redesigned review workspace. It uses inline styles, an eight-column table, unstyled native controls, raw enum values, and text links without consistent hover or focus treatment. Spacing and hierarchy are weak, and the table becomes cramped on laptop and mobile widths. Import success and error messages are not announced consistently to assistive technology, the empty state is not useful, and pagination provides little context.

The page also performs two related-record queries per Lead and links every Demo Site directly to its public route. For 25 Leads this adds 50 queries, while private, expired, removed, or portfolio-blocked demos can send the admin to a 404 page.

## 2. Goals & Non-Goals

Goals:

- Match the review workspace's Tailwind and shadcn visual language.
- Establish clear page hierarchy, consistent spacing, and readable status badges.
- Provide a compact desktop table and purpose-built card layout below the `xl` breakpoint.
- Preserve filters and pagination in responsive, keyboard-accessible controls.
- Give every interactive element visible hover, focus, active, loading, and disabled states.
- Make CSV import understandable and accessible without dominating the page.
- Use authenticated Admin previews for Demo Sites and explain public availability.
- Batch related Demo Site and Workflow Run reads for the current Lead page.

Non-goals:

- No new CRM fields, bulk selection, bulk workflow actions, automatic generation, inline editing, saved filters, sorting controls, or free-text search.
- No changes to import identity rules, workflow state transitions, public Demo Site access policy, or pagination size.
- No new backend endpoints or database migration.

## 3. Proposed Architecture

Keep the route as a server component responsible for authentication, query parsing, and Payload reads. Extract pure filter, pagination, status, and row-presentation helpers so behavior can be tested without rendering the page. Use existing local shadcn primitives and Tailwind tokens; add only small missing primitives needed by the dashboard.

The desktop presentation will reduce eight columns to five: Business, Workflow, Sales, Demo Site, and Action. City and contactability indicators belong with Business; approval and latest-run information belong with Workflow. Below `xl`, render the same row model as cards so content remains readable rather than relying on horizontal scrolling.

CSV import becomes a compact Card using a labelled file input, shadcn Button, and Alert feedback. Filters remain a GET form so URLs stay shareable. Demo links use the authenticated preview route; public availability appears as status rather than an unconditional link.

## 4. Component Breakdown

- `LeadDashboardFilters`: responsive GET filter form, human-readable options, active-filter summary, Apply and Clear actions.
- `ImportLeadsForm`: accessible CSV import Card with loading, success, and error states.
- `LeadDashboardTable`: semantic desktop table with grouped information and an accessible caption.
- `LeadDashboardCards`: laptop/mobile representation using the same row model.
- `LeadStatusBadge`: consistent pipeline, sales, workflow, and availability variants.
- Dashboard query/presentation helpers: validated search parameters, page links, row model creation, and related-record grouping.

## 5. Data Flow

1. Authenticate the Admin User before loading Lead data.
2. Validate query-string filters and page number; ignore unknown enum values.
3. Query 25 Leads using the existing filter semantics.
4. Fetch related Demo Sites and recent Workflow Runs for those Lead IDs in batched reads, then select the newest related record per Lead deterministically.
5. Convert records into one presentation model shared by the table and cards.
6. Render active filters, result count, responsive rows, empty state, and pagination.
7. Link Demo Sites to authenticated Admin preview and display public availability separately.
8. CSV import posts the selected file, announces the result, clears the input on success, and refreshes server data.

## 6. Interface Contracts

No public API or database contract changes.

Existing dashboard query parameters remain:

- `page`: positive integer, defaults to `1`.
- `pipeline_status`: one allowed Pipeline Status or ignored.
- `sales_status`: one allowed Sales Status or ignored.
- `demo_creation_approved`: `yes`, `no`, or ignored.

New internal row model:

```ts
type LeadDashboardRow = {
  lead: Lead
  demoSite?: DemoSite
  workflowRun?: WorkflowRun
  demoPreviewHref?: string
  publicDemoBlockReason?: string
}
```

Filter and pagination links preserve all valid active filters. The Import Leads API request and response remain unchanged. All status labels are presentation-only transformations; stored enum values remain canonical.

## 7. File Changes

Create:

- `components/dashboard/LeadDashboardFilters.tsx` — responsive filter controls.
- `components/dashboard/LeadDashboardResults.tsx` — shared desktop table and responsive cards.
- `lib/lead-dashboard.ts` — pure query/presentation helpers.
- `tests/lead-dashboard.test.ts` — filter, pagination, grouping, and status tests.

Modify:

- `app/(frontend)/dashboard/leads/page.tsx` — new shell, batched loading, results, empty state, and pagination.
- `app/(frontend)/dashboard/leads/ImportLeadsForm.tsx` — shadcn/Tailwind import experience and accessible feedback.
- Existing UI primitives only if a missing reusable control is required.
- `docs/app-guide.md` and the remediation plan — dashboard behavior and implementation status.

Delete:

- Inline `Header`, `Cell`, and `FilterSelect` helpers after their responsibilities move into the dashboard components.

## 8. Implementation Phases

### Phase 1 — Data and presentation foundation

- Branch: `codex/lead-dashboard-ui-overhaul`, created from `codex/fix-admin-demo-preview` after the planning commit is accepted.
- Branch gate: verify a clean worktree before creating the implementation branch.
- Commit policy: atomic commits are already authorized by the user.
- Commits:
  - [ ] `refactor: add Lead dashboard presentation helpers` — validated filter/page helpers, labels, badge variants, row model, and unit tests.
  - [ ] `perf: batch Lead dashboard related records` — replace per-Lead Demo Site and Workflow Run reads with bounded page-level reads and deterministic grouping tests.
- Done when: existing filter/pagination semantics pass tests and one Lead page no longer performs 50 related-record queries.

### Phase 2 — Dashboard layout and navigation

- Branch: continue `codex/lead-dashboard-ui-overhaul` so the feature remains one review unit.
- Commits:
  - [ ] `feat: redesign Lead dashboard header and filters` — responsive page shell, result summary, filter Card, human-readable values, active state, and clear focus/hover styles.
  - [ ] `feat: add responsive Lead results views` — five-column semantic table at `xl`, cards below `xl`, status badges, useful empty state, Admin Demo Site preview, availability messaging, and compact review action.
  - [ ] `feat: improve Lead dashboard pagination` — current-page context, Previous/Next disabled states, preserved filters, and accessible navigation labels.
- Done when: no horizontal compression occurs at laptop widths and every Lead exposes the same essential state in table and card views.

### Phase 3 — Import experience and final polish

- Branch: continue `codex/lead-dashboard-ui-overhaul`.
- Commits:
  - [ ] `refactor: restyle Lead CSV import experience` — shadcn Card/Button/Alert, labelled file input, progress state, `aria-live` success, `role=alert` failure, and responsive spacing.
  - [ ] `style: align Lead dashboard accessibility and interaction states` — keyboard audit, focus-visible rings, hover/pressed states, contrast, long-text wrapping, semantic headings/table caption, and reduced-motion-friendly behavior.
  - [ ] `docs: document the redesigned Lead dashboard` — usage, filters, responsive views, Admin preview behavior, and validation record.
- Done when: typecheck, lint, unit tests, production build, keyboard walkthrough, and laptop/mobile visual checks pass.

## 9. Testing Strategy

- Unit tests cover invalid filter values, page parsing, filter-preserving pagination URLs, empty Lead IDs, related-record grouping, latest-record selection, and human-readable status output.
- Existing import tests remain unchanged; the client form is manually checked for no-file, success, API failure, and network failure states.
- Manual accessibility checks cover keyboard order, visible focus, labels, table semantics, status text independent of colour, and live feedback.
- Responsive checks cover approximately 375 px mobile, 768 px tablet, 1024–1366 px laptop, and wide desktop layouts.
- Functional scenarios cover zero Leads, one Lead, 25 Leads, filtered results, multiple pages, long business names/errors, missing related records, private/expired/portfolio-blocked demos, and authenticated preview links.
- Every commit runs the smallest relevant checks; the final branch runs `npm run typecheck`, `npm run lint`, `npm test`, and a production build.

## 10. Security Implications

The page remains restricted to authenticated Admin Users and displays Lead PII. No PII moves to client-side APIs beyond the already rendered page. Demo navigation uses the authenticated preview route, while public visibility continues to follow availability and Portfolio Mode rules. CSV content remains user-controlled and is rendered as React text, preventing HTML injection; import validation and size policy remain the API's responsibility. No credentials or tokens are exposed.

## 11. Risks & Tradeoffs

- Risk: rendering both table and card markup increases server-rendered HTML. Mitigation: the page remains bounded to 25 Leads and CSS hides the inactive representation; this gives better semantics and readability than a compressed universal table.
- Risk: batching related records can select the wrong item if ordering/grouping is loose. Mitigation: sort by the canonical timestamp and test multiple records per Lead.
- Risk: Workflow Run history can be large. Mitigation: retrieve only fields and records needed to determine the latest run for the 25 visible Leads, with a documented bound.
- Risk: availability state can change between page render and navigation. Mitigation: Admin preview is authenticated and independent of public availability; public status is informational and rechecked by the public route.

## 12. Open Questions

No unresolved decisions. Defaults selected for implementation:

- One implementation branch with atomic commits.
- Five-column desktop table at `xl`; cards below `xl`.
- No free-text search, sorting, bulk actions, or inline editing in this overhaul.
- CSV import remains visible near the top but visually secondary to the Lead results.
- Demo Site navigation uses Admin preview; public availability is a separate status.
