# Home Services Website Reference Research

## Table of Contents

- [1. Purpose](#1-purpose)
- [2. Research Constraints](#2-research-constraints)
- [3. Shortlist of Useful References](#3-shortlist-of-useful-references)
- [4. Reusable Patterns](#4-reusable-patterns)
- [5. Patterns to Avoid in This Project](#5-patterns-to-avoid-in-this-project)
- [6. Recommended Direction for the Demo Template](#6-recommended-direction-for-the-demo-template)
- [7. Implications for the AI Demo Content Contract](#7-implications-for-the-ai-demo-content-contract)
- [8. Source Pages](#8-source-pages)

## 1. Purpose

The generated **Demo Site** currently feels weak because the page reads too much like a website-design mockup and not enough like a real local-trade homepage. This document collects references from real home-services websites and turns them into reusable patterns for improving `HomeServicesTemplate` without copying any site's code, copy, branding, testimonials, imagery, badges, or claims.

The goal is a fixed, reviewed template that looks credible even when AI-generated content is mediocre.

## 2. Research Constraints

- Use references for layout/content patterns only.
- Do not copy text, imagery, branding, HTML, or CSS from these sites.
- Do not render testimonials, ratings, years in business, licences, certifications, awards, service guarantees, or emergency availability unless those facts are present in Lead Data or later evidence.
- Keep the existing architecture decision: Demo Sites use fixed templates populated by structured AI content, not AI-generated layouts or arbitrary HTML.
- The public Demo Page must still include a clear unofficial-demo disclaimer and `noindex` behaviour.

## 3. Shortlist of Useful References

### 3.1 Edwards Plumbing

- URL: <https://www.edwardsplumbingllc.com/>
- Source note: direct fetch returned 403, but Site Builder Report's review includes enough structural notes.
- Why useful:
  - Strong first impression with real team/van imagery.
  - Phone and estimate CTA are prominent early.
  - Simple navigation and service hierarchy.
  - Local service area appears early.
- What to adapt:
  - Header with phone CTA.
  - Hero focused on service area + immediate action.
  - Simple service list/cards instead of overexplaining obvious services.
- What not to adapt without evidence:
  - Team/family imagery.
  - Review counts, licensing, bonding, insurance, or offer/coupon claims.

### 3.2 Circle Plumbing and Heating

- URL: <https://www.circleplumbingandheating.com/>
- Why useful:
  - Above-the-fold copy immediately says the business is local: “Alaskan-owned and operated”.
  - Phone number and schedule CTA are very prominent.
  - The homepage has quick paths for quote, residential, and commercial enquiries.
  - Reviews and family/company story appear high enough to support trust.
- What to adapt:
  - A service-first hero with phone CTA.
  - A compact “what do you need?” row after the hero.
  - Separate cards for quote, residential, commercial, or equivalent generic service intents.
- What not to adapt without evidence:
  - Ownership history, experience duration, awards, certifications, reviews.

### 3.3 Aloha Plumbing

- URL: <https://alohaplumbingatx.com/>
- Why useful:
  - The site leads with a human/trust angle and direct call/book actions.
  - It uses educational content as authority: YouTube plumbing videos and DIY resources.
  - Reviews are prominent and detailed.
  - The final contact section is simple and human.
- What to adapt:
  - Friendly, owner-operated tone.
  - “Helpful local resource” positioning when supported by evidence.
  - Final contact block with direct phone/email.
- What not to adapt without evidence:
  - Testimonials, specialist claims, video authority, installer/certification claims.

### 3.4 Aspen Mountain Plumbing

- URL: <https://www.aspenmtnplumbing.com/>
- Why useful:
  - Very clear service taxonomy: plumbing, drains, bathroom, kitchen, heating, air conditioning.
  - Strong location/service-area browsing.
  - Prominent scheduling and phone CTA.
  - FAQ and article sections answer common customer questions.
- What to adapt:
  - Service cards grouped by customer need.
  - Service-area section that makes locality obvious.
  - FAQ-style “common questions” section if we add safe generic questions later.
- What not to adapt without evidence:
  - Ratings, reviews, completed jobs, satisfaction metrics, “licensed technician” claims.

### 3.5 Yuras Roofing Company

- URL: <https://www.yurasroofing.com/>
- Why useful:
  - Straightforward contractor homepage: service area, phone, contact CTA, services, story, testimonials, contact.
  - Service cards are concise and practical.
  - Strong local/family/trade credibility structure.
- What to adapt:
  - A clear “Services include” section.
  - A local service-area CTA near the hero.
  - A final contact panel with phone and area.
- What not to adapt without evidence:
  - Years in business, family history, warranties, licences, insurance, testimonials.

### 3.6 ToddSunn Company

- URL: <https://www.toddsunn.com/>
- Why useful:
  - Excellent reference for small owner-operated trades.
  - The page quickly answers: who, what service, where, phone, and why call.
  - Copy is plain and specific, not over-designed.
  - Services are written around practical customer outcomes.
- What to adapt:
  - Simple personal/local structure for small businesses.
  - Short intro section after the hero.
  - Service copy that explains practical outcomes without hype.
- What not to adapt without evidence:
  - Personal biography, licence, testimonials, named neighbourhoods beyond Lead Data.

### 3.7 The Cleaning Company VA

- URL: <https://www.thecleaningcompanyva.com/>
- Why useful:
  - Strong benefit-led headline: freeing up customer time.
  - Simple service choices: house cleaning, office cleaning, move-in/move-out.
  - Owner story builds trust.
  - Estimate CTA is direct and low-friction.
- What to adapt:
  - Benefit-led copy for non-emergency services.
  - “What can we help you with?” service section.
  - Direct estimate/contact block.
- What not to adapt without evidence:
  - Owner story, testimonials, environmental claims, year founded.

### 3.8 Maid to Shine

- URL: <https://www.maidtoshinecleaners.com/>
- Why useful:
  - Clear promise: “Come Home and Relax”.
  - Process section is simple: “We Clean / You Relax / Repeat”.
  - Trust points are structured as customer concerns: same cleaner, communication, products, punctuality.
- What to adapt:
  - A three-step “how it works” section.
  - Trust items phrased around customer concerns.
  - Benefit-led service framing.
- What not to adapt without evidence:
  - Review counts, client counts, satisfaction percentages, product certifications.

### 3.9 Smith Handyman Service

- URL: <https://smithhandymanservice.com/>
- Why useful:
  - Good broad-services pattern for handyman/local trades.
  - Hero quickly states service category, pricing posture, insurance/licensing, and location.
  - Large services grid makes broad capability scannable.
  - Upfront pricing and contact CTA appear again later.
- What to adapt:
  - Broad service grid for leads with multiple service types.
  - “Simple, upfront contact/pricing” structure, but only as generic enquiry language unless pricing evidence exists.
  - Clear repeated CTAs.
- What not to adapt without evidence:
  - Award claims, licences, insurance, social feeds, before/after photos, testimonials.

### 3.10 Schmitt + Company

- URL: <https://www.schmittcompany.com/>
- Why useful:
  - Premium contractor layout with very strong spacing, typography, and visual hierarchy.
  - Minimal copy lets high-quality project imagery do the work.
  - Good reference for calm, confident layout rather than urgent lead-gen design.
- What to adapt:
  - Generous spacing.
  - Calm typography.
  - A restrained, premium visual direction for higher-end contractors.
- What not to adapt for the current MVP:
  - Heavy project-gallery dependency. The MVP does not have scraped/owned project images.

## 4. Reusable Patterns

### 4.1 Above-the-fold essentials

Strong home-services sites answer these immediately:

- What does the business do?
- Where does it serve?
- How do I contact it?
- What should I click next?

Template implication:

- Header: business name, city/service area, phone CTA if available.
- Hero: customer-facing service promise, not “website concept” language.
- Primary CTA: phone when available; otherwise contact section.
- Secondary CTA: “Request a quote” / “Send an enquiry”.

### 4.2 Service cards should be short

The best trade sites do not overexplain common services. Service cards should be scannable.

Template implication:

- Use 3–6 service cards.
- Each card should answer:
  - customer problem
  - service category
  - practical outcome
- Avoid long generic paragraphs.

### 4.3 Trust should be structural, not fabricated

Real websites lean heavily on reviews, licences, badges, family history, years in business, warranties, and team photos. The MVP cannot safely invent any of these.

Template implication:

Use safe generic trust structure:

- “Clear contact details”
- “Local service area”
- “Straightforward enquiry process”
- “Services explained in plain language”

Only render stronger trust claims when supported by evidence.

### 4.4 A simple process section helps every vertical

Useful pattern from cleaning and handyman sites:

1. Call or send an enquiry.
2. Describe the job.
3. Arrange the next step.

Template implication:

Add a generic “How to get help” section. This works for plumbers, electricians, roofers, cleaners, landscapers, and handymen without inventing operational details.

### 4.5 Locality is conversion-critical

Strong examples repeat locality in the hero, service area, contact, and footer.

Template implication:

- Use the Lead city if available.
- Use “nearby areas” only as generic language.
- Do not invent neighbourhood lists.

### 4.6 Contact blocks should repeat

Many references make phone/contact available at the top, middle, and bottom.

Template implication:

- Header phone CTA.
- Hero CTA.
- Final CTA card with phone/email.
- Footer contact summary.

## 5. Patterns to Avoid in This Project

Avoid these unless evidence exists:

- Testimonials or review snippets.
- Star ratings or review counts.
- “Licensed”, “insured”, “certified”, “approved”, “NATE”, “Master Plumber”, etc.
- “Family-owned”, “since 19xx”, “decades of experience”.
- “Emergency”, “24/7”, “same-day”, or “open now”.
- Guarantees, warranties, discounts, free estimates, or pricing claims.
- Before/after images or project galleries.
- Team photos, vans, uniforms, logos, or scraped images.
- Submission forms that imply the business has configured form handling.
- Meta copy in the customer-facing page body, such as “this layout”, “this mockup”, “this concept homepage”, or “this demo shows”.

The footer can and should disclose the Demo Site is unofficial. The hero should not.

## 6. Recommended Direction for the Demo Template

Use a hybrid of:

- **Circle Plumbing** for phone-first service UX.
- **Yuras Roofing** for no-nonsense contractor structure.
- **ToddSunn** for small-business plain-language trust.
- **The Cleaning Company / Maid to Shine** for benefit-led copy and simple process.

Recommended page structure:

1. Thin unofficial-demo banner.
2. Sticky-ish header with business name, city, phone/contact CTA.
3. Hero with service category + city + primary CTA.
4. “What do you need help with?” service cards.
5. “Why this page helps customers” transformed into customer-facing trust items, not meta language.
6. “How to get help” three-step process.
7. Service area block.
8. Final contact CTA.
9. Footer with full unofficial-demo disclaimer.

The design should be conservative and conversion-oriented:

- Light background with one dark hero band.
- One primary colour and one accent colour.
- Large type, obvious spacing, rounded cards.
- Icons are acceptable; fake photos are not.
- No complex animations.

## 7. Implications for the AI Demo Content Contract

The current `DemoContent` schema is probably too thin. A stronger but still safe contract would support:

```txt
hero:
  eyebrow
  headline
  subheadline
  primary_cta
  secondary_cta

services[]:
  title
  customer_problem
  outcome

trust_items[]:
  title
  body
  evidence_level: generic | verified

process_steps[]:
  title
  body

service_area:
  headline
  body

contact_cta:
  headline
  body
  primary_button_label
  secondary_button_label

footer_disclaimer
```

Prompt requirements:

- Write as if the page belongs to the local business's customers.
- Do not mention that the layout is a concept except in the disclaimer.
- Use verified facts from the Business Profile where available.
- Use generic industry language only where facts are missing.
- Keep service descriptions practical and short.
- Do not create unsupported trust claims.

## 8. Source Pages

Primary inspiration/research pages:

- Site Builder Report: Plumbing Websites — <https://www.sitebuilderreport.com/inspiration/plumbing-websites>
- Site Builder Report: Contractor Websites — <https://www.sitebuilderreport.com/inspiration/contractor-websites>
- Site Builder Report: Handyman Websites — <https://www.sitebuilderreport.com/inspiration/handyman-websites>
- Site Builder Report: Cleaning Websites — <https://www.sitebuilderreport.com/inspiration/cleaning-websites>
- Site Builder Report: Construction Websites — <https://www.sitebuilderreport.com/inspiration/construction-websites>

Direct reference sites fetched during research:

- Circle Plumbing and Heating — <https://www.circleplumbingandheating.com/>
- Aloha Plumbing — <https://alohaplumbingatx.com/>
- Aspen Mountain Plumbing — <https://www.aspenmtnplumbing.com/>
- Yuras Roofing Company — <https://www.yurasroofing.com/>
- ToddSunn Company — <https://www.toddsunn.com/>
- The Cleaning Company VA — <https://www.thecleaningcompanyva.com/>
- Maid to Shine — <https://www.maidtoshinecleaners.com/>
- Smith Handyman Service — <https://smithhandymanservice.com/>
- Schmitt + Company — <https://www.schmittcompany.com/>

Research date: 2026-06-07.
