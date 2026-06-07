# Home Services Template Variants Plan

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

The componentized demo renderer now supports reusable sections, theme tokens, and whitelisted Home Services variant keys:

```txt
contractor_classic
emergency_first
premium_local
clean_modern
```

However, those variants are currently mostly different section orders. They do not yet feel like distinct templates. The next step is to compose real, visually distinct Home Services variants from the shared section components while keeping the safety properties of fixed reviewed templates.

The intended outcome is that a plumber, cleaner, roofer, landscaper, electrician, or builder demo can look meaningfully tailored without AI generating arbitrary layout code.

## 2. Goals & Non-Goals

Goals:

- Make the four Home Services variants visually and structurally distinct.
- Keep all public Demo Pages custom Tailwind/CSS, not shadcn dashboard UI.
- Preserve the “no cards” direction for trade/home-services public landing pages.
- Reuse existing section components where possible.
- Add variant-aware section rendering through typed props and whitelisted variants.
- Keep current v1 `DemoContent` compatible.
- Make theme presets and variant defaults work together.
- Add deterministic variant selection by business type/industry signals.
- Keep AI-generated variant/theme support optional for now.
- Add tests for variant selection, manifest safety, and rendered-class decisions where practical.

Non-Goals:

- Do not build AI image generation in this pass.
- Do not add a working contact form.
- Do not add testimonials, reviews, ratings, licences, awards, discounts, emergency/24-7 claims, or pricing unless evidence-backed in a later phase.
- Do not add a template marketplace or user-generated templates.
- Do not copy Edwards/Stitch assets, copy, exact layout, or brand identity.
- Do not change the dashboard workflow unless a tiny read-only display is low-risk.
- Do not migrate existing saved Demo Sites; continue rendering old v1 content safely.

## 3. Proposed Architecture

Keep the existing architecture:

```txt
HomeServicesTemplate
→ normalizeHomeServicesContent()
→ DemoPageRenderer
→ getHomeServicesManifest(variant)
→ section components
```

Enhance it in three places:

1. **Variant-aware manifests**
   - Manifests should describe not only section order but section presentation options.

2. **Variant-aware sections**
   - Sections receive `content.variant` and can render different internal layouts from reviewed branches.

3. **Deterministic variant/theme selector**
   - If generated content does not specify a variant, choose one from business profile / lead signals.

### Why not create four totally separate template files?

Separate files would be faster initially, but would duplicate header, footer, CTA, service rendering, safety fallbacks, and theme handling. The componentized renderer exists specifically to avoid that. The variants should be composed from shared sections, with variant-specific branches inside sections only where the layout genuinely differs.

### Variant identity

#### `contractor_classic`

Inspired by strong local contractor sites.

Feel:

- practical
- bold
- phone-first
- high contrast
- strong local service-area messaging

Good for:

- plumbers
- electricians
- roofers
- HVAC
- builders
- general trades

Structure:

```txt
Header
Hero: split hero with contact summary side panel
Services: numbered horizontal service rows
Trust: dark full-width section
Process: 3-step row
CTA: accent band
Footer
```

#### `emergency_first`

For urgent service categories, but without unsupported 24/7 claims.

Feel:

- immediate
- clear contact options
- less polished editorial copy
- “need help quickly?” rather than fake emergency guarantees

Good for:

- plumbers
- drain services
- locksmiths
- HVAC repair
- electricians if service wording supports urgent repairs

Structure:

```txt
Header with phone CTA emphasised
Hero: compact urgent layout with large phone block
CTA: near top
Services: problem-led rows
Trust: practical reassurance
Process: short “call / explain / arrange” row
Footer
```

Copy rules:

- Use “Need help quickly?” not “24/7 emergency service” unless verified.
- Do not claim same-day, rapid response, emergency dispatch, or always available unless evidence-backed.

#### `premium_local`

For higher-trust project work.

Feel:

- spacious
- calmer
- editorial
- premium but still local
- less urgent

Good for:

- landscapers
- builders
- renovations
- decorators
- bathrooms/kitchens
- roofers with non-emergency positioning

Structure:

```txt
Header: quieter nav
Hero: editorial headline and service area intro
Services: large divided sections, more whitespace
Process: consultation/project steps
Trust: muted premium section
CTA: restrained final enquiry band
Footer
```

#### `clean_modern`

For straightforward service businesses.

Feel:

- lighter
- simple
- efficient
- modern but not SaaS

Good for:

- cleaners
- handymen
- maintenance
- pest control
- mobile services

Structure:

```txt
Header
Hero: light split layout
Services: compact list groups
Process: simple rows
CTA: clear but not heavy
Footer
```

## 4. Component Breakdown

### Existing components to make variant-aware

```txt
components/demo-sections/DemoHeader.tsx
components/demo-sections/DemoHero.tsx
components/demo-sections/DemoServices.tsx
components/demo-sections/DemoTrust.tsx
components/demo-sections/DemoProcess.tsx
components/demo-sections/DemoCta.tsx
components/demo-sections/DemoFooter.tsx
```

### New helper files

```txt
lib/demo-variant-selector.ts
lib/demo-variant-styles.ts
```

`demo-variant-selector.ts`:

- chooses default variant when content does not provide one.
- uses safe deterministic signals.

`demo-variant-styles.ts`:

- maps variant + theme tokens to reusable presentation classes.
- keeps conditional styling centralized enough to avoid unreadable section files.

### Optional new sections

Only add these if needed after first implementation:

```txt
components/demo-sections/DemoTopBar.tsx
components/demo-sections/DemoContactSummary.tsx
components/demo-sections/DemoIntro.tsx
```

Avoid adding many new section types at once. Prefer strengthening current sections first.

## 5. Data Flow

### Current flow

```txt
DemoContentPayload
→ normalizeHomeServicesContent()
→ content.variant from content.variant_key or contractor_classic fallback
→ manifest section order
→ sections render one visual style
```

### Proposed flow

```txt
DemoContentPayload + optional BusinessProfile/Lead signals later
→ selectHomeServicesVariant()
→ normalizeHomeServicesContent()
→ resolveDemoTheme()
→ manifest section order + variant-specific presentation
→ sections render fixed reviewed variant branches
```

For this implementation pass, use available content-level data only. Later, when the generator route is updated, pass profile/lead information into selection before saving content.

### Future AI flow

```txt
Python AI Service returns optional variant_key + theme
→ Payload validates variant/theme
→ deterministic selector validates/falls back
→ renderer uses selected variant/theme
```

No AI-generated JSX/HTML/CSS is introduced.

## 6. Interface Contracts

### Variant selector

```ts
export type SelectHomeServicesVariantInput = {
  industry?: string
  services?: Array<{ name?: string; title?: string }>
  websiteStatus?: string
  requestedVariant?: string
}

export function selectHomeServicesVariant(input: SelectHomeServicesVariantInput): HomeServicesVariant
```

Initial deterministic mapping:

```txt
plumber, drain, locksmith, heating, hvac, boiler, electrician repair → emergency_first
builder, renovation, landscaping, roofing, decorator, bathroom, kitchen → premium_local
cleaner, cleaning, maintenance, handyman, pest, mobile valeting → clean_modern
unknown home service → contractor_classic
```

Rules:

- `requestedVariant` wins only if it is whitelisted.
- emergency categories do not automatically create emergency claims; they only choose layout emphasis.
- unknown values fall back to `contractor_classic`.

### Manifest contract

Extend current manifest shape from:

```ts
sections: DemoSectionKey[]
```

to:

```ts
sections: Array<DemoSectionKey | DemoSectionConfig>
```

Possible config:

```ts
type DemoSectionConfig = {
  key: DemoSectionKey
  tone?: 'standard' | 'urgent' | 'premium' | 'light'
  emphasis?: 'phone' | 'services' | 'local' | 'process'
}
```

Recommendation for this pass: keep `sections: DemoSectionKey[]` unless section config is clearly needed. Variant can be read from `content.variant` first.

### Section props

Current:

```ts
export type DemoSectionProps = {
  content: NormalizedHomeServicesContent
  theme: ResolvedDemoTheme
}
```

Keep this. Sections can branch on:

```ts
content.variant
```

Do not pass arbitrary layout config from content JSON.

## 7. File Changes

Expected branch:

```txt
feature/home-services-template-variants
```

Expected additions:

```txt
lib/demo-variant-selector.ts
tests/demo-variant-selector.test.ts
```

Possible additions:

```txt
lib/demo-variant-styles.ts
components/demo-sections/DemoTopBar.tsx
```

Expected modifications:

```txt
components/demo-renderer/types.ts
components/demo-templates/home-services-manifests.ts
components/demo-sections/DemoHeader.tsx
components/demo-sections/DemoHero.tsx
components/demo-sections/DemoServices.tsx
components/demo-sections/DemoTrust.tsx
components/demo-sections/DemoProcess.tsx
components/demo-sections/DemoCta.tsx
components/demo-sections/DemoFooter.tsx
lib/demo-content-normalizer.ts
lib/demo-theme.ts
tests/demo-content-normalizer.test.ts
tests/demo-theme.test.ts
docs/componentized-demo-template-system-plan.md
docs/ai-demo-pipeline-plan.md
```

Optional later modifications:

```txt
workers/python/app/jobs/demo_content.py
workers/python/app/schemas.py
types/ai.ts
app/(frontend)/dashboard/review/[leadId]/page.tsx
components/dashboard/GeneratedAssetsTabs.tsx
```

## 8. Implementation Phases

### Phase 1 — Variant selector and defaults

Goal: choose the right variant deterministically before making layout changes.

Tasks:

- Add `lib/demo-variant-selector.ts`.
- Add unit tests for common trades.
- Update `normalizeHomeServicesContent()` to use selector for unknown/missing `variant_key`.
- Keep explicit valid `variant_key` support.

Commit:

```txt
feat(demo): select home services variants by trade
```

Validation:

```txt
npm run typecheck
npm run lint
npm run test
```

### Phase 2 — Variant theme defaults

Goal: make each variant have a distinct colour mood by default.

Tasks:

- Add or tune theme presets if needed.
- Map variants to default presets when content has no theme.
- Keep AI/content-provided valid theme overrides.
- Ensure no dynamic Tailwind class generation.

Suggested defaults:

```txt
contractor_classic → trade_navy_lime
emergency_first → clean_blue or trade_navy_lime with stronger accent
premium_local → premium_charcoal or heritage_green_gold
clean_modern → clean_blue
```

Commit:

```txt
feat(demo): apply variant theme defaults
```

Validation:

```txt
npm run typecheck
npm run lint
npm run test
```

### Phase 3 — Hero/header variant pass

Goal: make the first screen feel different per variant.

Tasks:

- Update `DemoHeader` for:
  - contractor: strong phone CTA.
  - emergency: phone CTA even more prominent, top local line if useful.
  - premium: quieter/nav-led header.
  - clean: lighter, simpler header.
- Update `DemoHero` for:
  - contractor: current split + contact side panel.
  - emergency: urgent phone-first layout, no unsupported claims.
  - premium: editorial spacious layout.
  - clean: light practical split.

Commit:

```txt
feat(demo): add variant-specific hero layouts
```

Validation:

```txt
npm run typecheck
npm run lint
npm run test
manual review of demo pages
```

### Phase 4 — Services/process/trust variant pass

Goal: make middle-page structure align with the variant.

Tasks:

- `DemoServices`:
  - contractor: numbered rows.
  - emergency: problem-led rows with contact emphasis.
  - premium: spacious divided editorial rows.
  - clean: compact straightforward list.
- `DemoTrust`:
  - contractor/emergency: dark practical reassurance.
  - premium: lighter trust section.
  - clean: may be omitted by manifest or rendered minimally.
- `DemoProcess`:
  - contractor: current 3-step row.
  - emergency: short action steps.
  - premium: consultative project steps.
  - clean: simple checklist-style row without cards.

Commit:

```txt
feat(demo): add variant-specific service sections
```

Validation:

```txt
npm run typecheck
npm run lint
npm run test
manual review of demo pages
```

### Phase 5 — CTA/footer polish

Goal: finish each variant with a cohesive bottom-of-page experience.

Tasks:

- `DemoCta`:
  - contractor: strong accent band.
  - emergency: phone-first urgent CTA without fake response claims.
  - premium: restrained enquiry CTA.
  - clean: lightweight contact strip.
- `DemoFooter`:
  - ensure disclaimer remains visible.
  - keep contact info and business name clear.
  - no fake social links.

Commit:

```txt
feat(demo): polish variant ctas and footers
```

Validation:

```txt
npm run typecheck
npm run lint
npm run test
manual review of demo pages
```

### Phase 6 — Fixture preview route or test fixtures

Goal: make it easy to compare variants while developing.

Option A: Add authenticated preview route:

```txt
/dashboard/demo-preview?variant=contractor_classic
/dashboard/demo-preview?variant=emergency_first
/dashboard/demo-preview?variant=premium_local
/dashboard/demo-preview?variant=clean_modern
```

Option B: Add test fixtures only.

Recommendation: add a simple authenticated preview route if low effort; it will make design iteration much faster.

Commit:

```txt
feat(dashboard): add demo variant preview page
```

Validation:

```txt
npm run typecheck
npm run lint
npm run test
manual browser review
```

### Phase 7 — Docs and roadmap update

Goal: record the variants and how to use them.

Tasks:

- Update this plan with implementation status.
- Update `docs/componentized-demo-template-system-plan.md`.
- Update `docs/ai-demo-pipeline-plan.md`.

Commit:

```txt
docs(demo): document home services variants
```

Validation:

```txt
npm run typecheck
npm run lint
npm run test
```

## 9. Testing Strategy

Unit tests:

- `selectHomeServicesVariant()` maps common trades correctly.
- unknown trades fall back to `contractor_classic`.
- valid requested variant wins.
- invalid requested variant is ignored.
- missing theme uses variant default.
- content-provided valid theme still overrides defaults.
- manifests only contain known section keys.

Existing tests to update:

- `tests/demo-content-normalizer.test.ts`
- `tests/demo-theme.test.ts`

Manual visual QA:

- Generate or preview each variant at desktop width.
- Check mobile layout for each variant.
- Confirm no card-like service boxes are introduced.
- Confirm no unsupported claims appear in static section copy.
- Confirm footer disclaimer remains visible.
- Confirm phone/email CTAs work when provided and degrade safely when missing.

Commands:

```txt
npm run typecheck
npm run lint
npm run test
npm run dev:all
```

## 10. Security Implications

This work should preserve the safe fixed-template model.

Security/safety rules:

- No arbitrary classes from AI.
- No HTML rendering from AI strings.
- No copied third-party assets.
- No fake testimonials/reviews/social links.
- No claim-bearing static copy in variant branches.
- No emergency/24-7/same-day wording unless evidence exists in a future evidence-backed content contract.

Specific caution for `emergency_first`:

The layout can prioritize phone/contact, but the copy must stay generic:

Safe:

```txt
Need help quickly?
Call to discuss the problem and next steps.
```

Unsafe without evidence:

```txt
24/7 emergency dispatch
Same-day response
Available day and night
```

## 11. Risks & Tradeoffs

### Risk: Variant branches make components messy

Mitigation:

- Keep branch logic small.
- Extract helpers only when repeated.
- If a component becomes unreadable, split into internal subcomponents in the same file or `components/demo-sections/variants/`.

### Risk: Too much abstraction before visual quality

Mitigation:

- Prioritize visible difference over perfect abstraction.
- Keep manifest simple unless section config becomes necessary.

### Risk: Clean modern becomes SaaS-like

Mitigation:

- Use trade/local-business language and full-width sections.
- Avoid shadcn cards, rounded dashboard panels, gradient SaaS hero patterns.

### Risk: Premium local looks too generic

Mitigation:

- Use strong service-area copy, bigger typography, and divided editorial sections.
- Avoid luxury clichés unsupported by evidence.

### Risk: Emergency first implies unsupported availability

Mitigation:

- Use phone-first layout only.
- Keep text factual/generic.
- Add QA/static review for banned emergency claims in static component copy.

## 12. Open Questions

1. Should we add a dashboard preview route in this pass, or keep previews manual through generated Demo Sites?
2. Should `variant_key` remain optional inside `DemoContent`, or should it become required once the AI prompt is updated?
3. Should the admin be able to override variant/theme from the review page before QA?
4. Should `clean_modern` keep the trust section omitted by default, or render a lighter version?
5. Are square buttons preferred for all trade variants, or should `clean_modern`/`premium_local` use softened buttons?
6. Should AI-generated images be added immediately after variants, or should we first prove the no-image variants are strong enough?

## Recommended Next Slice

Implement in one branch:

```txt
feature/home-services-template-variants
```

Recommended first PR scope:

```txt
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 7
```

Defer preview route if it slows the pass down. The minimum useful result is four visibly distinct variants using the same safe component system.
