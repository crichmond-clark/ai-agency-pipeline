# Next.js, Payload CMS, and Python AI service architecture

The application uses Next.js with Tailwind CSS and shadcn/ui for the web app, Payload CMS with hosted Neon Postgres for the backend/admin/data model, and a Python AI Service for bounded AI generation tasks. Payload owns the source-of-truth records, admin authentication, approvals, generated content editing, media, and workflow state; the Python service executes bounded AI jobs and returns validated results to Payload.

This replaces the earlier Supabase-first direction. Supabase Auth/RLS-specific ADRs are superseded by this architecture decision, though their underlying safety intent remains: protected admin access, owner/access rules, and no public exposure of lead data.
