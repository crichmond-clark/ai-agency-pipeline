# Componentized Demo Template System Plan

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

The current Home Services Template is a single fixed React component with one hard-coded visual direction. It is safer than arbitrary AI-generated HTML, but it limits demo quality and variation. The Stitch AI React app in `edwards-plumbing.zip` shows a stronger trade-site direction: prominent phone CTA, image-led hero, top contact bar, local-area emphasis, bold section rhythm, trust-oriented copy hierarchy, and a configurable-feeling colour palette.

We want to turn that direction into a reusable **componentized template system** so Demo Sites can look more bespoke per Lead without giving AI control over arbitrary markup or unsafe claims.

The core challenge is to support visual variety — different layouts, colour themes, hero treatments, service section structures, and optional image treatments — while preserving the existing architecture decisions:

- Demo Sites use fixed, reviewed templates.
- AI returns structured JSON only.
- Python validates with Pydantic.
- Payload/Next validates with Zod.
- Rendering remains deterministic and safe.
- Demo copy must not invent unsupported factual claims.

## 2. Goals & Non-Goals

Goals:

- Create a reusable library of public demo-page sections inspired by the Stitch app's structure, not its specific copy or business identity.
- Allow multiple Home Services visual variants from shared section components.
- Make colours easy to change per business, trade, or generated brand direction.
- Support AI-generated images where explicitly allowed, while preventing fake business/team/logo implications.
- Keep dashboard/admin UI shadcn-based, but keep public landing pages custom Tailwind/CSS.
- Preserve the no-card preference for trade landing pages unless a future template explicitly opts into a non-trade aesthetic.
- Keep rendering fixed and reviewed; AI may choose from whitelisted variants/tokens, not write JSX/HTML/CSS.
- Add a small design-token layer for themeable colours, typography tone, section density, button shape, and image treatment.
- Enable future templates beyond `home_services` without needing a rewrite.
- Make generated pages feel less repetitive across Leads.

Non-Goals:

- Do not copy Edwards Plumbing's copy, logo, images, brand identity, phone, claims, or exact composition.
- Do not import the Stitch app wholesale into production.
- Do not let AI generate arbitrary React components, HTML, CSS, Tailwind class strings, or JavaScript.
- Do not add unsupported testimonials, reviews, ratings, certifications, licences, discounts, emergency claims, pricing, warranties, family-owned claims, awards, or years-in-business claims.
- Do not add working contact forms in the MVP unless the Contact Attempt workflow is explicitly extended.
- Do not build a full template marketplace yet.
- Do not make Payload schema changes until the content contract is approved.

## 3. Proposed Architecture

Introduce a public-demo rendering layer with three separate concepts:

```txt
DemoContent = what the page says
DemoTheme = how the brand feels
DemoTemplateManifest = which reviewed layout/sections render it
```

Today, `DemoContent` is a thin structure:

```txt
hero
services
why_choose_us
service_area
contact_cta
footer_disclaimer
```

We should evolve it into a richer but still safe contract:

```txt
demo_content:
  template_key: home_services
  variant_key: contractor_classic | emergency_first | premium_local | clean_modern
  theme: generated or selected visual tokens
  sections: structured copy buckets
  media: optional safe generated image descriptors/URLs
```

The renderer will work like this:

1. `selectTemplate()` chooses a template family such as `home_services`.
2. A `selectVariant()` helper chooses a reviewed layout variant inside that family.
3. A `resolveDemoTheme()` helper turns structured theme tokens into CSS variables.
4. The selected template renders from a manifest of fixed section components.
5. Section components receive sanitized copy and theme tokens, never arbitrary class names from AI.

### Key architectural decision

Use **CSS variables scoped to each Demo Page** for theme colours instead of hard-coded Tailwind arbitrary colours inside every section.

Example:

```tsx
<main style={toDemoThemeStyle(theme)} className="demo-theme min-h-screen bg-[var(--demo-bg)] text-[var(--demo-text)]">
```

Then section components use stable semantic tokens:

```tsx
className="bg-[var(--demo-primary)] text-[var(--demo-on-primary)]"
className="text-[var(--demo-accent)]"
className="border-[var(--demo-border)]"
```

This makes colour changes easy without creating invalid dynamic Tailwind classes.

### Template variation model

Do not create unlimited free-form templates. Start with one template family and 3-4 variants:

1. `contractor_classic`
   - Closest to the Stitch direction.
   - Top info bar, strong header, image-led hero, service rows, CTA band, contact/footer.
   - Good for plumbers, electricians, roofers, builders, HVAC.

2. `emergency_first`
   - Phone-first hero, urgent but safe CTA language, service-area block high up.
   - Only uses emergency/24-7 language if verified evidence exists; otherwise wording is generic: “Need help quickly?”
   - Good for plumbers, locksmiths, HVAC, drainage.

3. `premium_local`
   - More spacious, calm, fewer sections, higher-end typography.
   - Good for landscapers, builders, renovations, decorators.

4. `clean_modern`
   - Lighter palette, simple split sections, process rows.
   - Good for cleaners, handymen, maintenance, general trades.

Each variant is composed from shared reviewed sections, not separately hand-coded from scratch.

### AI's role

AI can suggest:

- `variant_key` from a whitelist.
- `theme_preset` from a whitelist.
- colour tokens as hex values within validation rules.
- safe image prompt descriptors for AI image generation.
- structured content for approved fields.

AI cannot provide:

- JSX.
- HTML.
- CSS.
- Tailwind class names.
- arbitrary section names.
- unsupported factual claims.
- external image URLs scraped from a business site.

## 4. Component Breakdown

### New directories

```txt
components/demo-renderer/
  DemoPageRenderer.tsx
  DemoThemeProvider.tsx
  types.ts

components/demo-sections/
  DemoTopBar.tsx
  DemoHeader.tsx
  DemoHero.tsx
  DemoImageHero.tsx
  DemoIntroSplit.tsx
  DemoServiceRows.tsx
  DemoServiceColumns.tsx
  DemoTrustStrip.tsx
  DemoProcessRows.tsx
  DemoCtaBand.tsx
  DemoContactBlock.tsx
  DemoFooter.tsx
  DemoDisclaimer.tsx

demo-templates/
  manifests.ts
  home-services.ts
  theme-presets.ts
  theme-utils.ts
  variant-selector.ts
```

Existing `components/demo-templates/HomeServicesTemplate.tsx` can either:

- become a thin adapter around `DemoPageRenderer`, or
- be replaced by `components/demo-templates/HomeServicesTemplateV2.tsx` during migration.

### `DemoPageRenderer`

Responsible for:

- receiving business fields, generated content, and selected theme/variant.
- resolving the template manifest.
- applying theme CSS variables.
- rendering sections in manifest order.
- ensuring footer disclaimer always appears.

It does **not** decide business facts or claims.

### `DemoThemeProvider`

Responsible for:

- turning `DemoTheme` into safe CSS custom properties.
- applying default/fallback colours when values are missing.
- enforcing readable contrast where possible.

Theme variables:

```txt
--demo-bg
--demo-surface
--demo-text
--demo-muted
--demo-primary
--demo-primary-strong
--demo-on-primary
--demo-accent
--demo-on-accent
--demo-border
--demo-hero-overlay
```

Optional style tokens:

```txt
button_style: square | softened | pill
section_density: compact | standard | spacious
hero_style: split | full_bleed | editorial
font_tone: practical | premium | bold
```

### Section components

Each section should be dumb and deterministic.

Good section examples from the Stitch app to adapt safely:

- `DemoTopBar`
  - area + phone + optional availability wording.
  - no social links unless present in Lead Data/evidence.

- `DemoHeader`
  - business name, nav anchors, phone CTA.
  - optional simple generated text mark/icon, but no fake logo.

- `DemoHero`
  - headline/subheadline/buttons.
  - optional AI-generated generic trade image.
  - no real-business/team/van implication unless evidence-backed.

- `DemoIntroSplit`
  - “Local help for X in Y” style intro.
  - safe assumptions framed generically.

- `DemoServiceRows`
  - full-width/divided service list, not boxed cards.
  - optional icons from whitelist.

- `DemoTrustStrip`
  - only generic process/trust copy unless verified facts exist.
  - no fake reviews/licences/ratings.

- `DemoProcessRows`
  - “Call / Discuss / Agree next step” style.
  - safe for all trades.

- `DemoCtaBand`
  - strong phone/contact CTA.
  - may use background image treatment.

- `DemoContactBlock`
  - phone/email/service area.
  - no working form by default; use mailto/tel links.

- `DemoFooter`
  - nav/contact/disclaimer.

### Template manifests

A manifest defines layout order and required sections.

Example:

```ts
export const homeServicesManifests = {
  contractor_classic: {
    label: 'Contractor classic',
    sections: [
      'top_bar',
      'header',
      'image_hero',
      'intro_split',
      'service_rows',
      'trust_strip',
      'process_rows',
      'cta_band',
      'contact_block',
      'footer',
    ],
  },
  premium_local: {
    label: 'Premium local',
    sections: [
      'header',
      'editorial_hero',
      'intro_split',
      'service_columns',
      'process_rows',
      'cta_band',
      'footer',
    ],
  },
}
```

## 5. Data Flow

### Current flow

```txt
Lead + Business Profile
→ Python AI Service generates DemoContent
→ Payload validates DemoContentSchema
→ Demo Site content saved as JSON
→ /demo/[slug] renders HomeServicesTemplate
```

### Proposed flow

```txt
Lead + Business Profile
→ Payload selects template family candidate
→ Python AI Service generates DemoContentV2:
    copy sections
    variant_key candidate
    theme candidate
    optional image prompts/descriptors
→ Python validates Pydantic schema
→ Payload validates Zod schema
→ Payload normalizes theme and variant
→ Demo Site saves:
    template = home_services
    content = DemoContentV2-compatible JSON
→ /demo/[slug]
    resolves template manifest
    resolves theme tokens
    renders fixed section components
→ QA checks content + theme + rendered constraints
```

### Colour/theme generation

Theme choice should combine deterministic defaults and optional AI suggestions.

Deterministic baseline:

```txt
industry = plumber/electrician/roofer/cleaner/etc
→ recommended preset = trade_navy_lime / safety_blue_orange / garden_green / clean_blue
```

AI can suggest:

```json
{
  "theme": {
    "preset": "trade_navy_lime",
    "primary": "#0b2240",
    "accent": "#a3e635",
    "background": "#f7f1e8",
    "button_style": "square",
    "hero_style": "full_bleed"
  }
}
```

Payload clamps/validates:

- hex format only.
- no transparent text colours.
- required contrast fallback if too low.
- unknown preset falls back to industry default.
- unknown style token falls back to template default.

### AI image flow

AI images are allowed, but should be treated as generic concept imagery unless proven otherwise.

Recommended MVP-safe image rules:

- Images must be generated by our AI pipeline or selected from approved generic placeholders.
- Image prompts must say “generic”, “not a real business”, and avoid logos, readable text, licence plates, real people likeness, uniforms with business names, awards, badges, or certification marks.
- Rendered alt text must not imply the image is the actual business, owner, team, van, or premises.
- If no generated image exists, use gradient/texture/illustration fallback.

Possible future collection support:

```txt
demo_sites.hero_image_url
demo_sites.hero_image_prompt
demo_sites.image_generation_status
```

For first implementation, do not block the component system on image generation. Support optional `media.hero_image_url` in JSON if present, otherwise use safe visual fallback.

## 6. Interface Contracts

### TypeScript Zod schema proposal

Add alongside existing schema first for backward compatibility:

```ts
export const DemoThemeSchema = z.object({
  preset: z.enum([
    'trade_navy_lime',
    'heritage_green_gold',
    'clean_blue',
    'premium_charcoal',
    'warm_builder',
  ]).default('trade_navy_lime'),
  primary: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  background: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  surface: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  text: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  button_style: z.enum(['square', 'softened', 'pill']).default('square'),
  section_density: z.enum(['compact', 'standard', 'spacious']).default('standard'),
  hero_style: z.enum(['split', 'full_bleed', 'editorial']).default('full_bleed'),
})

export const DemoMediaSchema = z.object({
  hero_image_url: z.string().url().optional(),
  hero_image_alt: z.string().min(1).optional(),
  hero_image_prompt: z.string().min(1).optional(),
}).default({})

export const DemoContentV2Schema = z.object({
  schema_version: z.literal(2),
  template_key: z.literal('home_services'),
  variant_key: z.enum(['contractor_classic', 'emergency_first', 'premium_local', 'clean_modern']),
  theme: DemoThemeSchema,
  media: DemoMediaSchema,
  hero: z.object({ eyebrow: z.string(), headline: z.string(), subheadline: z.string(), primary_cta: z.string(), secondary_cta: z.string().optional() }),
  intro: z.object({ headline: z.string(), body: z.string() }).optional(),
  services: z.array(z.object({ title: z.string(), description: z.string(), icon: z.string().optional() })).min(1),
  trust_points: z.array(z.object({ title: z.string(), body: z.string(), evidence_backed: z.boolean().default(false) })).default([]),
  process_steps: z.array(z.object({ title: z.string(), body: z.string() })).default([]),
  service_area: z.string(),
  contact_cta: z.object({ headline: z.string(), body: z.string(), button_label: z.string() }),
  footer_disclaimer: z.string().min(1),
})
```

Keep `DemoContentSchema` v1 temporarily and support both:

```ts
export const AnyDemoContentSchema = z.union([DemoContentSchema, DemoContentV2Schema])
```

### Python Pydantic schema proposal

Mirror the fields in `workers/python/app/schemas.py`:

```py
class DemoTheme(BaseModel):
    preset: Literal['trade_navy_lime', 'heritage_green_gold', 'clean_blue', 'premium_charcoal', 'warm_builder'] = 'trade_navy_lime'
    primary: HexColor | None = None
    accent: HexColor | None = None
    background: HexColor | None = None
    surface: HexColor | None = None
    text: HexColor | None = None
    button_style: Literal['square', 'softened', 'pill'] = 'square'
    section_density: Literal['compact', 'standard', 'spacious'] = 'standard'
    hero_style: Literal['split', 'full_bleed', 'editorial'] = 'full_bleed'
```

Use simple regex validation for hex colours if Pydantic colour utilities are not already available.

### Template selector contract

Replace current one-template selector:

```ts
export type DemoTemplate = 'home_services'

export type HomeServicesVariant = 'contractor_classic' | 'emergency_first' | 'premium_local' | 'clean_modern'

export function selectTemplate(profile: BusinessProfilePayload): DemoTemplate
export function selectVariant(input: { lead: Lead; profile: BusinessProfilePayload; content?: unknown }): HomeServicesVariant
```

Initial logic can be deterministic:

- plumbing/HVAC/locksmith/drainage → `emergency_first` if safe, else `contractor_classic`.
- landscaping/building/renovation/decorating → `premium_local`.
- cleaning/maintenance/handyman → `clean_modern`.
- unknown home services → `contractor_classic`.

AI-suggested `variant_key` may override only if it is valid.

## 7. File Changes

Expected implementation branch:

```txt
feature/componentized-demo-templates
```

Expected file additions:

```txt
components/demo-renderer/DemoPageRenderer.tsx
components/demo-renderer/DemoThemeProvider.tsx
components/demo-renderer/types.ts
components/demo-sections/DemoTopBar.tsx
components/demo-sections/DemoHeader.tsx
components/demo-sections/DemoHero.tsx
components/demo-sections/DemoIntroSplit.tsx
components/demo-sections/DemoServiceRows.tsx
components/demo-sections/DemoTrustStrip.tsx
components/demo-sections/DemoProcessRows.tsx
components/demo-sections/DemoCtaBand.tsx
components/demo-sections/DemoContactBlock.tsx
components/demo-sections/DemoFooter.tsx
components/demo-templates/home-services-manifests.ts
lib/demo-theme.ts
lib/demo-content-normalizer.ts
lib/demo-variant-selector.ts
tests/demo-theme.test.ts
tests/demo-content-normalizer.test.ts
tests/demo-variant-selector.test.ts
```

Expected file modifications:

```txt
components/demo-templates/HomeServicesTemplate.tsx
lib/template-selector.ts
types/ai.ts
workers/python/app/schemas.py
workers/python/app/jobs/demo_content.py
lib/qa.ts
tests/qa.test.ts
docs/ai-demo-pipeline-plan.md
CONTEXT.md, only if domain terms need updating
```

Possible later files if image generation is added:

```txt
app/api/leads/[leadId]/generate-demo-image/route.ts
workers/python/app/jobs/demo_image.py
collections/DemoSites.ts
```

## 8. Implementation Phases

### Phase 0 — Source preservation and safety cleanup

Purpose: keep `edwards-plumbing.zip` as reference material without accidentally shipping/copying it.

Tasks:

- Move `edwards-plumbing.zip` out of the repo or add it to `.gitignore` if it should remain local.
- Add a short note in the plan/research docs that it is reference-only.
- Do not commit Stitch assets or copied component files directly.

Commit:

```txt
chore(demo): ignore local template reference archives
```

Validation:

```txt
git status --short
```

### Phase 1 — Theme token foundation

Purpose: make the current template colour-configurable before adding many variants.

Tasks:

- Add `DemoThemeSchema` in `types/ai.ts`.
- Add `lib/demo-theme.ts` with presets and `resolveDemoTheme()`.
- Add CSS-variable style generation with safe fallbacks.
- Update `HomeServicesTemplate` to use theme variables rather than hard-coded colours.
- Keep v1 content compatible by supplying default theme when content has no `theme` field.

Commit:

```txt
feat(demo): add theme tokens for demo pages
```

Validation:

```txt
npm run typecheck
npm run lint
npm run test
```

### Phase 2 — Section component extraction

Purpose: turn the single Home Services component into reusable section building blocks.

Tasks:

- Extract header/top bar/hero/services/process/CTA/footer into `components/demo-sections/*`.
- Keep visual output close to the current redesigned template to reduce risk.
- Ensure sections accept normalized props, not raw unknown JSON.
- Preserve no-card trade-page aesthetic.

Commit:

```txt
refactor(demo): extract reusable public demo sections
```

Validation:

```txt
npm run typecheck
npm run lint
npm run test
```

### Phase 3 — Template manifest and renderer

Purpose: make different page compositions possible without arbitrary code.

Tasks:

- Add `DemoPageRenderer`.
- Add `home-services-manifests.ts` with `contractor_classic` first.
- Make `HomeServicesTemplate` a thin adapter around the renderer.
- Add tests for unknown variant fallback.

Commit:

```txt
feat(demo): render home services pages from manifests
```

Validation:

```txt
npm run typecheck
npm run lint
npm run test
```

### Phase 4 — Add visual variants

Purpose: create real template variety.

Tasks:

- Implement `emergency_first`, `premium_local`, and `clean_modern` manifests.
- Add variant selector helper.
- Keep each variant composed from reviewed sections.
- Add a local fixture/demo preview route if useful, e.g. `/dashboard/demo-preview` behind auth, or simple test fixtures only.

Commit:

```txt
feat(demo): add home services layout variants
```

Validation:

```txt
npm run typecheck
npm run lint
npm run test
```

### Phase 5 — DemoContent v2 schema and AI prompt update

Purpose: let AI produce variant/theme-aware structured content.

Tasks:

- Add `DemoContentV2Schema` in TypeScript.
- Add matching Pydantic models.
- Update Python demo content prompt to return schema version, variant key, theme, intro, trust points, process steps, and media descriptors.
- Keep backwards compatibility for existing v1 saved Demo Sites.
- Update QA to validate v2-specific safety rules.

Commit:

```txt
feat(ai): generate variant-aware demo content
```

Validation:

```txt
npm run typecheck
npm run lint
npm run test
npm run dev:all
```

### Phase 6 — Business-specific colour selection

Purpose: make colours feel tailored without manual design work.

Tasks:

- Add deterministic industry-to-theme presets.
- Allow AI-suggested hex colours, but normalize with contrast and whitelist checks.
- Add fallback if contrast fails.
- Add tests for invalid hex, low contrast, unknown presets, and missing values.

Commit:

```txt
feat(demo): tailor demo themes by business type
```

Validation:

```txt
npm run typecheck
npm run lint
npm run test
```

### Phase 7 — Optional AI image support

Purpose: use AI images safely when configured.

Tasks:

- Decide image provider and storage path.
- Add optional image fields to Demo Site content or collection.
- Generate/store generic trade imagery.
- Add image safety prompt rules.
- Render images only when present and valid.
- Add QA checks that alt/copy does not imply real business/team/van unless evidence-backed.

Commit:

```txt
feat(demo): support safe generated hero imagery
```

Validation:

```txt
npm run typecheck
npm run lint
npm run test
manual screenshot review
```

This phase can be delayed. The component/theme system should not depend on it.

### Phase 8 — Review UI support

Purpose: make template/theme choices visible and adjustable through GUI.

Tasks:

- Show selected template/variant/theme on the review page.
- Add “Regenerate demo content” with variant/theme preservation or override.
- Optional: add simple admin-only selector to switch variant/theme before QA approval.
- Record changes in Workflow Runs.

Commit:

```txt
feat(dashboard): expose demo template controls
```

Validation:

```txt
npm run typecheck
npm run lint
npm run test
manual end-to-end lead flow
```

## 9. Testing Strategy

Unit tests:

- `resolveDemoTheme()` returns valid CSS variables.
- invalid hex values are ignored or replaced.
- low-contrast colour pairs fall back.
- unknown theme preset falls back.
- unknown variant falls back to `contractor_classic`.
- v1 demo content normalizes into renderer props.
- v2 demo content normalizes into renderer props.
- no unsafe section key can render.
- QA catches unsupported testimonials/reviews/emergency/licence claims.
- QA excludes footer disclaimer from meta-copy checks where appropriate.

Type tests / TypeScript checks:

- section components accept typed props only.
- manifests cannot reference unknown section keys.
- renderer handles every declared section key.

Integration/manual tests:

- Generate a plumber lead and verify contractor/emergency styling.
- Generate a cleaner lead and verify clean_modern styling.
- Generate a builder/landscaper lead and verify premium_local styling.
- Open public `/demo/[slug]` on mobile and desktop.
- Run QA after generation.
- Capture screenshots if R2 is configured.
- Confirm old v1 Demo Sites still render.

Validation commands:

```txt
npm run typecheck
npm run lint
npm run test
npm run dev:all
```

## 10. Security Implications

Positive security properties:

- AI still cannot generate markup or scripts.
- Section components are reviewed code.
- Theme tokens are validated primitive values.
- Template variant keys are whitelisted.
- Content is double-validated.
- Public demo pages remain deterministic.

Risks:

- AI-generated images may imply fake real-world proof if not labelled/prompted carefully.
- Theme colours can harm accessibility if contrast is not checked.
- More optional content fields increase hallucination surface area.
- Variant/theme selection can become a hidden claim generator if labels imply unsupported facts, e.g. `licensed_premium`.

Mitigations:

- Use generic image prompts and safe alt text.
- Add colour contrast fallback.
- Keep claim-bearing fields marked evidence-backed or generic.
- QA should scan all customer-facing fields for banned unsupported claims.
- Do not render review/testimonial/video/blog sections unless supported by real evidence and approved in a later ADR.

## 11. Risks & Tradeoffs

### Risk: over-abstraction too early

A renderer/manifest system could become too abstract for one template.

Mitigation: implement in small phases. First add theme tokens, then extract sections, then add manifests.

### Risk: pages become samey despite variants

If content remains thin, layout variation alone may not be enough.

Mitigation: expand content contract modestly with intro, trust points, process steps, and service section shape.

### Risk: AI theme choices look bad

AI may choose ugly or inaccessible colours.

Mitigation: use presets first, AI suggestions second, contrast normalization always.

### Risk: unsupported claims sneak into richer sections

More sections mean more places for bad claims.

Mitigation: enforce claim rules in prompts, Pydantic/Zod schemas, QA checks, and renderer fallbacks.

### Tradeoff: Tailwind classes vs CSS variables

Tailwind arbitrary hard-coded colours are simple but hard to theme. CSS variables are slightly more complex but make per-business colours easy and safe.

Recommendation: use CSS variables.

### Tradeoff: AI images now vs later

AI images improve perceived quality but add safety/storage/provider complexity.

Recommendation: design renderer to support optional images now, but implement image generation as a later phase.

## 12. Open Questions

1. Should variant/theme selection be fully automatic at first, or should the admin be able to pick from 3-4 variants before generation?
2. Do we want `DemoContentV2` stored inside existing `demo_sites.content` only, or should template/theme/variant be promoted to first-class Demo Site fields?
3. Which image generation provider should be used if we add AI images?
4. Should AI images be generated during demo content generation or as a separate explicit workflow action?
5. Are “cards” banned across all public demo templates, or only trade/home-services templates?
6. Should we keep the current single template as `contractor_classic`, or treat it as legacy and create the Stitch-inspired variant as a new default?
7. Should the reference zip stay in the repo root locally, be moved to `docs/reference/`, or be deleted after extracting lessons?

## Recommended MVP Slice

For the next implementation pass, do **not** build everything above. The best slice is:

```txt
Phase 0 → Phase 1 → Phase 2 → Phase 3 → one new Stitch-inspired contractor_classic/default variant
```

That gives us:

- reusable components,
- themeable colours,
- safer architecture,
- one noticeably better trade-page template,
- no schema migration risk yet,
- no AI image/provider complexity yet.

Implementation status on `feature/componentized-demo-templates`:

- Phase 0 complete: local reference archives are ignored by git.
- Phase 1 complete: demo theme tokens and safe CSS-variable style generation exist in `lib/demo-theme.ts`.
- Phase 2 complete: the Home Services page is split into reviewed reusable section components under `components/demo-sections/`.
- Phase 3 complete: `DemoPageRenderer` renders whitelisted section manifests for Home Services variants while preserving v1 demo content compatibility.

Then follow with:

```txt
Phase 4 → Phase 5 → Phase 6
```

Once the renderer shape feels right.
