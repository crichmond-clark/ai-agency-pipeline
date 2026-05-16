# JSONB content with Zod validation

Generated business profiles, demo content, QA reports, and outreach drafts are stored as JSONB where useful but validated with Zod at API and rendering boundaries. This keeps the first build flexible while templates and prompts evolve, without allowing invalid or partial AI output to be saved or rendered as if it were safe content.
