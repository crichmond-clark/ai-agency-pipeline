# AI Agency Pipeline

Human-in-the-loop pipeline for importing local business leads, generating reviewed concept websites, and preparing controlled outreach drafts.

The application uses Next.js and Payload CMS for state, admin workflows, rendering, screenshots, and email delivery. A Python FastAPI service owns bounded AI provider calls. Real lead data is never sent automatically: demo creation, final approval, draft review, and the explicit send action are separate gates.

## Local checks

```bash
npm ci
npm run lint
npm run typecheck
npm test
cd workers/python && uv sync --frozen && uv run pytest
```

Copy `.env.example` to `.env`, configure `DATABASE_URI` and `PAYLOAD_SECRET`, then start the Python service with `npm run dev:ai` and the app with `npm run dev`. Use fictional sample leads while `PORTFOLIO_MODE=true`.

Read [docs/app-guide.md](docs/app-guide.md) for setup and the [remediation plan](docs/pipeline-review-remediation-plan.md) for current release gates and recovery procedures.
