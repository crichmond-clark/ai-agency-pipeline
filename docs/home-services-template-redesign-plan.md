# Home Services Template Redesign Plan

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

The public Home Services Demo Page currently looks like a SaaS/dashboard mockup rather than a credible local trade website. It uses card-heavy sections and meta copy such as “Concept mockup” in the hero, which makes generated demos feel artificial and weak.

## 2. Goals & Non-Goals

Goals:

- Redesign the public `HomeServicesTemplate` as an original local-contractor landing page inspired by strong trade websites such as Edwards Plumbing.
- Keep dashboard/admin UI shadcn-based, but avoid shadcn/card visual language on public demo pages.
- Use no service cards or dashboard-style boxed panels.
- Remove meta/demo language from the main page body, keeping clear safety disclosure in the footer.
- Make phone/contact CTAs prominent.
- Keep fixed-template rendering and structured content validation.
- Improve deterministic fallback content so locally generated demos also read like trade websites.

Non-goals:

- Do not copy Edwards Plumbing code, text, images, colours, logo, or exact composition.
- Do not introduce scraped images, AI images, testimonials, fake reviews, ratings, licences, guarantees, or unverified trust claims.
- Do not add new dependencies.
- Do not change dashboard workflow controls.
- Do not redesign every template category; only `home_services` exists today.

## 3. Proposed Architecture

Keep the existing fixed-template architecture:

```txt
AI Service/Pydantic DemoContent
→ Payload/Next Zod validation
→ DemoSites.content JSON
→ /demo/[slug]
→ HomeServicesTemplate
```

The redesign is presentation-first and uses the existing `DemoContent` contract. The template derives safe static structure for contractor UX, such as “Call / Describe the job / Arrange the next step”, without requiring new AI fields.

## 4. Component Breakdown

- `HomeServicesTemplate`: renders the public contractor-style page with full-width bands, dividers, service rows, CTA strips, and footer disclaimer.
- `demo_content.py`: updates prompts and deterministic fallback content to avoid mockup/meta language outside the footer.
- `types/ai.ts`: keeps the existing DemoContent schema unchanged unless validation needs tightening.
- `lib/qa.ts`: optionally tightens deterministic QA to catch forbidden mockup/template language outside the footer.
- Tests: update QA fixtures if wording expectations change.

## 5. Data Flow

1. Admin generates demo content for a Lead.
2. Python AI Service returns structured `DemoContent`.
3. Payload validates and saves content on a Demo Site.
4. Public `/demo/[slug]` fetches available Demo Site and Lead data.
5. `HomeServicesTemplate` renders business name, city, phone, email, hero copy, services, trust bullets, service-area text, contact CTA, and disclaimer.

## 6. Interface Contracts

No interface changes are required.

Existing `DemoContent` remains:

- `hero.eyebrow`
- `hero.headline`
- `hero.subheadline`
- `hero.cta`
- `services[]` with `title` and `description`
- `why_choose_us[]`
- `service_area`
- `contact_cta.headline`
- `contact_cta.body`
- `contact_cta.button_label`
- `footer_disclaimer`

## 7. File Changes

Create:

- `docs/home-services-template-redesign-plan.md` — implementation plan for this pass.

Modify:

- `components/demo-templates/HomeServicesTemplate.tsx` — original no-card contractor landing page.
- `workers/python/app/jobs/demo_content.py` — safer, customer-facing generation prompt and deterministic fallback.
- `lib/qa.ts` and `tests/qa.test.ts` — deterministic guard against template/mockup meta wording outside the footer if needed.
- `docs/ai-demo-pipeline-plan.md` — note the public demo page hardening pass.

Keep:

- `docs/home-services-website-reference-research.md` — research source notes from the reference pass.

## 8. Implementation Phases

### Phase 1 — Original contractor template pass

- Branch: `feature/home-services-template-redesign`
- Branch gate: implementation starts by checking `git status --short --branch` and switching/creating this branch before edits.
- Commit policy: one logical change per commit; ask before committing.
- Commits:
  - [ ] Add reference research and redesign plan docs.
  - [ ] Redesign `HomeServicesTemplate` with no cards and no shadcn landing-page aesthetic.
  - [ ] Update demo-content prompt/fallback and QA guard for meta copy.
  - [ ] Update plan docs and run validation.
- Done when: `npm run typecheck`, `npm run lint`, and `npm run test` pass and the public demo template no longer uses card-like service sections or hero mockup copy.

## 9. Testing Strategy

- TypeScript typecheck for template prop/render changes.
- ESLint for React/Tailwind class and unused import issues.
- Vitest for deterministic QA changes.
- Manual smoke: run `/demo/[slug]` locally after the app is started with existing demo content.

## 10. Security Implications

The public demo URL renders Lead contact data and AI-generated structured content. Existing protections remain:

- Public Demo Pages are noindexed.
- Demo availability rules still gate rendering.
- AI output is rendered as text fields, not arbitrary HTML.
- Footer disclaimer remains required.
- No user-controlled HTML, external scripts, scraped images, testimonials, reviews, or fake trust claims are added.

## 11. Risks & Tradeoffs

- Risk: avoiding all card-like UI may reduce visual grouping.
  - Mitigation: use section bands, dividers, typography, columns, and CTA strips instead.
- Risk: existing generated content may still contain meta wording.
  - Mitigation: improve prompts/fallback and add deterministic QA checks for future generations; existing saved content can be regenerated.
- Risk: no imagery can make the page feel plain compared to real contractor sites.
  - Mitigation: use strong hierarchy, service rows, local CTAs, and colour bands; images can be added later only from approved/evidence-backed assets.

## 12. Open Questions

Resolved for this pass:

- Shadcn is for dashboard/admin UI only, not the public trade landing page.
- No cards on the Home Services Demo Page.
- Edwards Plumbing is an inspiration for contractor conversion structure, not something to copy directly.
