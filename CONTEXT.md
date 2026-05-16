# AI Demo Website Pipeline

A human-in-the-loop pipeline for turning local business leads into reviewed demo websites and outreach drafts.

## Language

**Business**:
The real-world organisation the pipeline may research, demo, contact, or sell to.

**Lead**:
A business record containing raw contact, source, status, and contactability data before approval.
_Avoid_: Prospect, customer, client, Business Profile

**Lead Data**:
The raw provided or imported fields about a business.
_Avoid_: Business Profile

**Lead Source**:
The origin system or import that produced a lead.
_Avoid_: Business Profile

**Website Status**:
A lead field describing the discovered state of a business's web presence.
Allowed values: `no_site`, `social_only`, `third_party_platform`, `broken`, `live`, `unknown`.
_Avoid_: Website Assessment

**Business Profile**:
The structured AI-enriched interpretation of lead data, including industry, services, verified facts, assumptions, confidence, and missing information.
_Avoid_: Lead Data, Lead

**Verified Fact**:
Information explicitly present in lead data or trusted source material.
_Avoid_: Assumption

**Assumption**:
Plausible but unverified information that may guide generic copy but must not be presented as a factual claim.
_Avoid_: Verified Fact

**Prospect**:
A lead with an approved demo and outreach draft that is ready for sales contact.
_Avoid_: Lead, customer, client

**Customer**:
A prospect who has paid for website work or an ongoing service.
_Avoid_: Client

**Demo Site**:
The generated, public-but-noindexed website concept for a lead.
_Avoid_: Demo, mockup, generated website

**Home Services Template**:
The first demo site template category, covering local trades such as roofers, plumbers, electricians, landscapers, builders, and cleaners.
_Avoid_: Local Trades Template as the canonical internal name

**Demo Page**:
An individual rendered page inside a demo site.
_Avoid_: Demo Site when referring to one page

**Demo Availability**:
Whether a demo site is currently viewable by public URL.
_Avoid_: Approval

**Concept Mockup**:
Prospect-facing wording for describing a demo site as unofficial and exploratory.
_Avoid_: Internal domain usage

**Demo Creation Approval**:
A human decision to start demo generation for a lead.
_Avoid_: Approval, QA Pass

**QA Pass**:
An automated result indicating that no blocking factual, ethical, or rendering issues were detected.
_Avoid_: Approval

**Approval**:
A human decision that a lead's active demo site and outreach draft are safe to use for sales contact.
_Avoid_: Demo Creation Approval, QA Pass

**Outreach Draft**:
An editable sales message prepared for contacting a prospect.
_Avoid_: Email when referring to the unsent draft

**Contact Attempt**:
A specific sent message or call to a prospect.
_Avoid_: Outreach Draft

**Follow-up**:
A contact attempt after the first contact attempt.
_Avoid_: Contact Attempt when sequence position matters

**Pipeline Status**:
The current production and review state of a lead or demo site.
Allowed values: `new`, `profile_ready`, `demo_content_ready`, `demo_ready`, `qa_failed`, `needs_review`, `approved`, `rejected`.
_Avoid_: Sales Status when referring to demo generation or approval

**Sales Status**:
The current commercial outcome or state of a prospect or customer.
Allowed values: `not_contacted`, `contacted`, `replied`, `call_booked`, `won`, `lost`.
_Avoid_: Pipeline Status when referring to sales outcomes

**Do Not Contact**:
A contactability restriction that prevents outreach to a lead, prospect, or customer.
_Avoid_: Pipeline Status, Sales Status

**Portfolio Mode**:
A safe demonstration mode that uses sample leads and prevents exposure or contact of real prospects.
_Avoid_: Production Mode

**Sample Lead**:
A fictional or sanitised lead used for portfolio demonstrations.
_Avoid_: Real Lead

**Admin User**:
The authenticated operator who manages leads, demo sites, QA, approvals, and sales tracking.
_Avoid_: Customer, Prospect

**Workflow Run**:
A recorded end-to-end attempt to execute one pipeline operation from trigger to saved or failed outcome.
_Avoid_: Business Profile, Demo Site, Outreach Draft

**Screenshot Capture**:
The generation of desktop and mobile images for a demo site.
_Avoid_: QA Pass

## Relationships

- A **Business** may be represented by exactly one **Lead** in the MVP.
- **Lead Data** is the source material for a **Business Profile**.
- Human-entered or imported business/contact/source fields belong to the **Lead**; AI-interpreted or structured fields belong to the **Business Profile**.
- A **Lead Source** may produce many **Leads**.
- The system must not create duplicate **Leads** for the same Google `place_id`; if `place_id` is missing, use normalized business name + city as the fallback identity.
- Re-importing an existing **Lead** may update source/import fields, but must not overwrite human workflow fields.
- **Website Status** belongs to the **Lead** and is imported from the lead source when available.
- A **Business Profile** may contain **Verified Facts** and **Assumptions**, but must distinguish them.
- **Demo Sites** may use **Verified Facts** and generic industry language, but must not present **Assumptions** as facts.
- A **Lead** may have zero or more **Demo Sites**.
- A **Demo Site** has exactly one **Demo Page** in the MVP.
- The first template is the **Home Services Template**, with “Home Services / Local Trades” acceptable as a UI label.
- The MVP **Home Services Template** supports header, hero, services, why-choose-us, service area, contact CTA, and footer disclaimer sections.
- The MVP **Home Services Template** does not support testimonials, reviews, ratings, before/after images, certification badges, team photos, blog posts, booking calendars, submitting forms, AI-generated images, or scraped business images/logos.
- Only one **Demo Site** should be the active approved demo for outreach.
- **Demo Availability** is controlled separately from **Approval**, using public, expiry, and removal fields.
- A **Demo Site** is viewable only when it is public, not removed, and not expired.
- Real prospect **Demo Sites** should expire after 30–60 days; sample portfolio **Demo Sites** may be permanent.
- **Demo Creation Approval** permits demo generation to begin and is recorded with `demo_creation_approved_at` and `demo_creation_approved_by` fields rather than as a Pipeline Status.
- A **QA Pass** permits human review but does not permit outreach by itself.
- **Approval** permits outreach and converts a **Lead** into a **Prospect**.
- The system generates **Outreach Drafts**; an **Admin User** may manually trigger a **Contact Attempt** from inside the app in the MVP.
- A **Contact Attempt** must never be sent without explicit button-click confirmation by an **Admin User**.
- The first send button is enabled only when there is no **Do Not Contact** restriction, **Pipeline Status** is `approved`, **Sales Status** is `not_contacted`, an active publicly available **Demo Site** exists, an **Outreach Draft** exists, the draft has been reviewed or explicitly accepted, a recipient email exists, and **Portfolio Mode** is off.
- No bulk sending, automatic sending, duplicate first sends, sending after QA failure, or sending for private, removed, or expired demo sites is allowed in the MVP.
- A **Follow-up** is a **Contact Attempt** after the first **Contact Attempt**.
- **Pipeline Status** and **Sales Status** are separate fields.
- A **Pipeline Status** tracks demo production, QA, review, approval, and rejection states.
- A **Sales Status** tracks contact, reply, call, won, and lost outcomes.
- **Do Not Contact** is a separate restriction, not a **Pipeline Status** or **Sales Status**.
- **Do Not Contact** blocks outreach draft generation, contact attempts, and follow-ups.
- **Portfolio Mode** uses **Sample Leads**, disables contact attempts, hides or replaces real contact data, and may keep demo sites permanent.
- An **Admin User** can access the dashboard and run generation/review actions.
- Public **Demo Pages** do not require admin authentication but must satisfy **Demo Availability** rules.
- Failed generation, QA, screenshot, and outreach-preparation attempts are recorded as **Workflow Runs** rather than partial target records.
- Only valid outputs create or update **Business Profiles**, **Demo Sites**, and **Outreach Drafts**.
- **Screenshot Capture** is treated as a workflow step and may run in a local script, server-side function, or later background worker.
- A **Prospect** becomes a **Customer** after purchase.

## Example dialogue

> **Dev:** "Can a **Lead** be emailed automatically once the **Demo Site** gets a **QA Pass**?"
> **Domain expert:** "No — **QA Pass** only permits review. The lead becomes a **Prospect** after human **Approval** of the **Demo Site** and **Outreach Draft**."

## Flagged ambiguities

- "lead", "prospect", "customer", and "client" were initially used loosely. Resolved: use **Lead** before approval, **Prospect** after approval, and **Customer** after purchase. Avoid **client**.
- "demo", "demo page", "demo site", "concept", and "mockup" were initially overlapping. Resolved: use **Demo Site** internally, **Demo Page** for rendered pages, and **Concept Mockup** only for prospect-facing wording.
- "business profile" could mean raw data or AI interpretation. Resolved: use **Lead Data** for raw/imported fields and **Business Profile** for structured AI enrichment.
- "outdated website" is a judgement requiring evidence. Resolved: use **Website Status** for discovered web-presence state, not subjective design quality.
- Lead discovery already exists outside this context. Resolved: imported leads should record their **Lead Source**, e.g. business-finder CSV import.
- "outreach" could mean a draft, a sent message, or a whole sequence. Resolved: use **Outreach Draft** for generated editable copy, **Contact Attempt** for a sent message/call, and **Follow-up** for later contact attempts. MVP contact attempts may be sent from inside the app only after explicit admin button-click confirmation.
- Status initially mixed production workflow states with sales outcomes. Resolved: use separate **Pipeline Status** and **Sales Status** fields.
- "do not contact" looked like a status but is really a contactability restriction. Resolved: model **Do Not Contact** separately, e.g. `do_not_contact_at` and optional reason.
- Demo pages could have been permanent by default. Resolved: model **Demo Availability** separately with public, expiry, and removal fields.
- Portfolio examples could accidentally expose real prospect data. Resolved: use **Portfolio Mode** with **Sample Leads** and disabled contact attempts.
