# AI Agency Pipeline Agent Instructions

## Default workflow

For any planning, implementation, refactor, review, or debugging work in this project, read these first:

1. `CONTEXT.md` — domain language and glossary
2. `docs/ai-demo-pipeline-plan.md` — implementation roadmap
3. `docs/adr/*.md` — accepted architecture decisions

Do not ask the user to repeat this instruction. Treat these files as the project source of truth.

## Skill usage

- Use `planning` before non-trivial features, architecture changes, or multi-file changes.
- Use `expert-programming` for implementation after a plan/phase is approved.
- Use `testing` when adding or changing test coverage.
- Use `code-review` after implementation and before declaring work ready.
- Use `security-review` for auth, public demo URLs, email sending, PII, API routes, OpenAI calls, and external integrations.

## Implementation rules

- Follow ADRs unless the user explicitly approves changing one.
- If implementation conflicts with an ADR, stop and ask before coding.
- Keep `CONTEXT.md` domain-focused; do not add implementation stack details there.
- Record new architecture decisions as ADRs in `docs/adr/`.
- Keep `docs/ai-demo-pipeline-plan.md` updated when decisions change.
- Sync plan changes to `/mnt/d/docs/miku/Plans/ai-demo-pipeline-plan.md`.

## Current architecture decisions

- `business-finder` remains the lead discovery app.
- This app imports leads from `business-finder` CSV exports.
- CSV import creates/updates Leads only; it does not generate Business Profiles or demos automatically.
- No duplicate Leads: use Google `place_id`, falling back to normalized business name + city.
- Re-importing updates source/import fields only and must not overwrite human workflow fields.
- Demo creation requires explicit Admin approval before AI generation starts.
- Payload/Next owns app state, admin workflows, rendering, screenshots, deterministic QA, and Resend email sending.
- Python FastAPI AI Service owns OpenAI calls for profile generation, demo content, AI QA, and outreach draft copy.
- AI output is validated twice: Pydantic in Python, Zod in Payload before saving/rendering.
- Payload combines deterministic QA and AI QA into one saved QA report.
