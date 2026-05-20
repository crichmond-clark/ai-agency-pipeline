# Frontend Redesign Plan

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

The frontend currently renders important workflow screens with inline styles and browser-default controls. Tailwind class names already exist in the demo template, but Tailwind is not installed or configured, so the public demo page and internal dashboard do not present the project professionally.

The app needs a small, polished, maintainable UI layer for one Admin User: clear lead management, workflow review, status visibility, and professional-looking generated Demo Sites.

## 2. Goals & Non-Goals

Goals:

- Configure Tailwind CSS so existing utility classes work.
- Add shadcn/ui-compatible primitives for polished, consistent internal screens.
- Replace inline-styled dashboard pages with reusable components.
- Improve the home page, lead dashboard, lead review page, import form, AI action panel presentation, and Home Services Template.
- Keep Payload admin as-is; custom polish applies to the frontend app routes.
- Preserve all existing server-side workflow rules, auth checks, data fetching, statuses, and send/generation guards.
- Maintain ADR 0002: Demo Sites use fixed reviewed templates and structured content, never arbitrary AI-generated HTML.
- Keep changes small and easy to review.

Non-Goals:

- Do not redesign Payload CMS admin internals.
- Do not add a separate design system package or large UI library such as MUI/Ant/Chakra.
- Do not change database schemas or workflow business logic.
- Do not add new AI generation features.
- Do not add public marketing pages beyond the existing app home page and Demo Site template.
- Do not introduce complex animations unless they are trivial CSS transitions.

## 3. Proposed Architecture

Use Tailwind CSS plus shadcn/ui-style local components.

Key decisions:

- Install and configure Tailwind CSS, PostCSS, `tailwindcss-animate`, `class-variance-authority`, `clsx`, `tailwind-merge`, and `lucide-react`.
- Add `components.json` for shadcn conventions, but keep generated components local under `components/ui/`.
- Add `lib/utils.ts` with `cn()` for class merging.
- Add global CSS variables for a clean admin theme: slate/zinc neutrals, white cards, subtle borders, blue primary, emerald/amber/red status accents.
- Keep internal dashboard components separate from public Demo Site template components.
- Keep data fetching in existing server pages. Extract only presentational UI and formatting helpers unless a component must be client-side.
- Use server components by default; use client components only for import/upload and AI run interactions.

Visual direction:

- Internal app: calm SaaS admin interface with clear information hierarchy, responsive cards, status badges, and well-spaced controls.
- Public Demo Sites: warmer small-business landing page style with polished marketing sections, stronger CTA hierarchy, and clear unofficial disclaimer.

## 4. Component Breakdown

- `app/(frontend)/layout.tsx`: imports global styles and applies base body classes.
- `app/(frontend)/globals.css`: Tailwind layers, CSS variables, body defaults, focus styles.
- `components/ui/*`: local shadcn-style primitives for Button, Card, Badge, Input, Label, Select, Table, Alert, Separator, Tabs/Skeleton only as needed.
- `components/dashboard/AppShell.tsx`: page chrome for internal dashboard routes, including title, description, and nav links.
- `components/dashboard/StatusBadge.tsx`: maps pipeline, sales, workflow, approval, and do-not-contact states to consistent badge variants.
- `components/dashboard/InfoGrid.tsx`: compact label/value display for lead metadata.
- `components/dashboard/LeadTable.tsx`: responsive lead rows with clear actions and status badges.
- `components/dashboard/FilterBar.tsx`: styled filters for pipeline/sales/demo-approval query params.
- `app/(frontend)/dashboard/leads/ImportLeadsForm.tsx`: keep upload logic, replace inline UI with cards, inputs, alerts, and buttons.
- `components/admin/AiRunControls.tsx`: preserve behavior, improve layout, disabled reasons, and action hierarchy.
- `app/(frontend)/dashboard/review/[leadId]/page.tsx`: compose summary cards, workflow actions, generated asset links, and warning states.
- `components/demo-templates/HomeServicesTemplate.tsx`: polish public-facing fixed template while keeping structured content-only rendering.

## 5. Data Flow

No data flow changes.

Current flow remains:

1. Authenticated Admin User visits `/dashboard/leads`.
2. Server page checks Payload auth and queries leads, latest Demo Site, and latest Workflow Run.
3. Page renders filtered lead data using styled dashboard components.
4. Admin uploads CSV through `ImportLeadsForm`; existing `/api/import-leads` endpoint imports records and the page refreshes.
5. Admin opens `/dashboard/review/[leadId]`.
6. Server page checks Payload auth and queries Lead, Business Profile, Demo Site, Outreach Draft, and AI settings.
7. Review page renders status summaries and existing AI action controls.
8. Public `/demo/[slug]` validates Demo Availability and renders the fixed Home Services Template from structured content.

## 6. Interface Contracts

No API, database, or AI-service interfaces are added or changed.

Modified UI-level contracts:

- `StatusBadge`
  - Input: `{ type: 'pipeline' | 'sales' | 'workflow' | 'approval' | 'contactability'; value?: string | boolean | null }`
  - Output: styled badge with human-readable label.
  - Error cases: unknown values render as neutral badges.

- `AppShell`
  - Input: `{ title: string; description?: string; actions?: ReactNode; children: ReactNode }`
  - Output: authenticated app page layout.
  - Error cases: none; auth still handled by page-level server code.

- `LeadTable`
  - Input: existing dashboard row shape `{ lead, demoSite?, workflowRun? }[]` from `/dashboard/leads`.
  - Output: accessible table on desktop, acceptable horizontal overflow on narrow screens.
  - Error cases: empty rows render an empty state.

- `HomeServicesTemplate`
  - Existing props unchanged: `businessName`, optional `city`, `phone`, `email`, `content`.
  - Output: polished public Demo Site page with noindex metadata still handled by route.
  - Error cases: content validation remains in `/demo/[slug]/page.tsx` via Zod.

## 7. File Changes

Create:

- `tailwind.config.ts` — Tailwind content paths, theme tokens, animation plugin.
- `postcss.config.mjs` — Tailwind/PostCSS integration.
- `components.json` — shadcn component conventions.
- `app/(frontend)/globals.css` — Tailwind layers and app theme variables.
- `lib/utils.ts` — `cn()` helper.
- `components/ui/button.tsx` — Button primitive.
- `components/ui/card.tsx` — Card primitive.
- `components/ui/badge.tsx` — Badge primitive.
- `components/ui/input.tsx` — Input primitive.
- `components/ui/label.tsx` — Label primitive.
- `components/ui/select.tsx` — Select primitive or native select wrapper if Radix is avoided.
- `components/ui/table.tsx` — Table primitive.
- `components/ui/alert.tsx` — Alert primitive.
- `components/ui/separator.tsx` — Separator primitive.
- `components/dashboard/AppShell.tsx` — internal route page shell.
- `components/dashboard/StatusBadge.tsx` — centralized status visuals.
- `components/dashboard/InfoGrid.tsx` — reusable details grid.
- `components/dashboard/LeadTable.tsx` — styled lead table.
- `components/dashboard/FilterBar.tsx` — styled dashboard filters.
- `components/dashboard/EmptyState.tsx` — reusable empty state.

Modify:

- `package.json` — add Tailwind/shadcn-related dependencies and scripts only if needed.
- `app/(frontend)/layout.tsx` — import globals and apply base styling.
- `app/(frontend)/page.tsx` — replace bare landing page with polished entry screen.
- `app/(frontend)/dashboard/leads/page.tsx` — replace inline styles with components.
- `app/(frontend)/dashboard/leads/ImportLeadsForm.tsx` — styled import card and alerts.
- `app/(frontend)/dashboard/review/[leadId]/page.tsx` — styled review layout and summaries.
- `components/admin/AiRunControls.tsx` — styled controls without changing endpoints/behavior.
- `components/demo-templates/HomeServicesTemplate.tsx` — polished fixed public template.
- `docs/ai-demo-pipeline-plan.md` — update if implementation details diverge from the existing Tailwind/shadcn recommendation.
- `/mnt/d/docs/miku/Plans/ai-demo-pipeline-plan.md` — sync any plan changes if the main roadmap is updated.

Delete:

- None planned.

## 8. Implementation Phases

### Phase 1 — UI foundation

- Branch: `feature/frontend-redesign`
- Commits:
  - [ ] Add Tailwind, PostCSS, shadcn config, global CSS, and `cn()` helper.
  - [ ] Add core local UI primitives: Button, Card, Badge, Input, Label, Table, Alert, Separator.
  - [ ] Update frontend layout and home page to prove Tailwind works.
- Done when: `npm run lint`, `npm run typecheck`, and `npm run build` pass, and the home page renders with Tailwind styling.

### Phase 2 — Dashboard lead list polish

- Branch: `feature/frontend-redesign`
- Commits:
  - [ ] Add dashboard shell, status badges, empty state, filter bar, and lead table components.
  - [ ] Replace `/dashboard/leads` inline styling with the new dashboard components.
  - [ ] Restyle CSV import form with clear success/error states.
- Done when: an authenticated Admin User can import leads, filter leads, open review links, and see latest Demo Site/Workflow Run data with no workflow behavior changes.

### Phase 3 — Review workflow polish

- Branch: `feature/frontend-redesign`
- Commits:
  - [ ] Restyle `/dashboard/review/[leadId]` with summary cards, metadata grid, Demo Site/Outreach/Profile sections, and warnings.
  - [ ] Restyle `AiRunControls` while preserving all existing endpoints, disabled reasons, provider/model controls, and refresh behavior.
- Done when: an authenticated Admin User can review a lead and run all existing enabled actions exactly as before, with clearer disabled states and visual hierarchy.

### Phase 4 — Public Demo Site template polish

- Branch: `feature/frontend-redesign`
- Commits:
  - [ ] Upgrade `HomeServicesTemplate` visual design: header/hero, CTA, services cards, trust section, service area, contact section, footer disclaimer.
  - [ ] Verify responsive behavior for desktop and mobile screenshot capture sizes.
- Done when: `/demo/[slug]` renders a professional noindexed Demo Site from existing structured content, remains unavailable when Demo Availability checks fail, and does not render arbitrary HTML.

### Phase 5 — QA, docs, and release check

- Branch: `feature/frontend-redesign`
- Commits:
  - [ ] Add or update focused tests for status formatting helpers and any non-trivial UI logic.
  - [ ] Run lint, typecheck, tests, and build.
  - [ ] Update project plan docs if final implementation differs materially from this plan.
- Done when: validation commands pass and the redesign is ready for code review.

## 9. Testing Strategy

Unit tests:

- Status label/variant mapping renders expected values for known pipeline, sales, workflow, approval, and contactability states.
- Unknown status values fall back to a neutral display.
- Any formatting helper for workflow summaries handles missing data.

Integration/manual tests:

- `/` renders polished landing page.
- `/dashboard/leads` redirects/shows unauthorized state when not authenticated, and renders when authenticated.
- Lead filters preserve existing query-param behavior.
- CSV import still posts `text/csv` to `/api/import-leads`, shows success/error messages, clears file input on success, and refreshes route.
- `/dashboard/review/[leadId]` loads Lead, Business Profile, Demo Site, Outreach Draft, AI settings, and action states correctly.
- AI action controls still call the same endpoints with the same provider/model override behavior.
- `/demo/[slug]` renders only available Demo Sites and keeps noindex metadata.

Validation commands:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

Visual checks:

- Desktop width around 1440px.
- Laptop width around 1024px.
- Mobile width around 390px.
- Screenshot capture viewport sizes already used by the app.

## 10. Security Implications

Data exposed or processed:

- The redesigned dashboard displays existing Lead contact data, generated profiles, Demo Site links, Outreach Draft status, and Workflow Run summaries.
- The public Demo Site displays existing allowed business fields and structured demo content.

Security requirements:

- Preserve Payload auth checks on dashboard pages.
- Do not move private data fetching into unauthenticated client-side calls.
- Do not expose AI provider keys, Resend keys, Payload secrets, or service tokens.
- Do not render arbitrary HTML from AI output; continue rendering structured fields only.
- Preserve noindex/nofollow metadata and Demo Availability checks for public Demo Sites.
- Preserve action disabled states as UI hints, but rely on existing server-side guards for enforcement.
- Keep upload handling unchanged: CSV parsing remains server-side in the existing import endpoint.

Injection risks:

- Avoid `dangerouslySetInnerHTML`.
- Treat all Lead and AI-generated text as plain React text nodes.
- Links use existing internal routes or `tel:`/`mailto:` from stored fields as currently implemented.

## 11. Risks & Tradeoffs

- Risk: shadcn/Radix dependency set adds more packages than needed.
  - Mitigation: start with minimal local primitives; only add Radix components when a native element is insufficient.

- Risk: styling work accidentally changes workflow behavior.
  - Mitigation: keep data fetching and endpoint construction in existing pages/components; extract presentational pieces only.

- Risk: Tailwind v4 vs v3 setup mismatch with Next 15.
  - Mitigation: choose one stable setup during Phase 1 and prove it with build before touching the dashboard.

- Risk: public Demo Site polish could imply business endorsement.
  - Mitigation: preserve and visually retain the unofficial Concept Mockup disclaimer.

- Risk: review page could become over-designed for a single-user tool.
  - Mitigation: prioritize clarity, compactness, and action visibility over decorative UI.

## 12. Open Questions

Resolved before implementation:

- Use shadcn/ui-style local components? Yes.
- Redesign Payload admin? No.
- Change workflow/data model? No.
- Keep public Demo Site a fixed template? Yes, required by ADR 0002.
- Use Tailwind? Yes, required by current roadmap/ADR and current code already assumes it.
- Use a large UI framework? No.

Accepted implementation choice:

- If shadcn CLI has React 19/Next 15 friction, manually add equivalent local components following shadcn conventions instead of blocking the redesign.
