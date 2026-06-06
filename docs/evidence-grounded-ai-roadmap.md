# Evidence-Grounded AI Roadmap

## Table of Contents

- [1. Purpose](#1-purpose)
- [2. Current Baseline](#2-current-baseline)
- [3. Roadmap Principles](#3-roadmap-principles)
- [4. Phase Reference](#4-phase-reference)
- [5. Learning Path](#5-learning-path)
- [6. Portfolio Outcomes](#6-portfolio-outcomes)
- [7. Planning Notes](#7-planning-notes)

## 1. Purpose

This document is the high-level reference roadmap for turning the existing AI Demo Website Pipeline into an evidence-grounded AI portfolio project.

The target project pitch is:

> A production-style AI workflow that imports local-business leads, stores trusted evidence, retrieves relevant context with vector search, generates cited business profiles/demo copy/outreach, evaluates quality, traces cost and latency, and keeps an Admin User in control before external actions.

Detailed implementation planning should happen one phase at a time. This document exists so each phase has a clear place in the larger learning path.

## 2. Current Baseline

The app already has important production foundations:

- Next.js + Payload CMS as the source-of-truth app.
- Python FastAPI AI Service for provider calls and structured generation.
- PostgreSQL through Payload.
- Lead import from `business-finder` CSV exports.
- Business Profile, Demo Site, Outreach Message, Contact Attempt, Workflow Run, and Media collections.
- Human approval gates before generation and sending.
- Double validation for AI output: Pydantic in Python, Zod in Payload/Next.
- Service-to-service bearer auth between Payload/Next and the Python AI Service.

The missing AI-engineering layers are evidence storage, embeddings, retrieval, evals, observability, and bounded agent/tool workflows.

## 3. Roadmap Principles

- **Learn one concept at a time.** Each phase should teach a specific AI-engineering idea before it changes the production workflow.
- **Keep the system runnable after every phase.** Do not create a long-lived rewrite branch.
- **Do not bypass existing safety decisions.** Payload owns app state and lifecycle; Python owns provider calls; Admin Users approve risky actions.
- **Prefer inspectable data.** Evidence, chunks, embeddings metadata, retrieval results, eval results, and traces should be visible enough to debug.
- **Ground claims in source material.** AI output should separate Verified Facts, Assumptions, and Missing Information.
- **Portfolio mode stays safe.** Sample leads should remain available, and real sending stays blocked when Portfolio Mode is enabled.

## 4. Phase Reference

### Phase 1 — Evidence and RAG Foundation

**Primary learning goal:** Understand RAG building blocks before using them in generation.

Build:

- Evidence Document and Evidence Chunk storage.
- Deterministic Lead Data evidence ingestion.
- Chunking and content hashing.
- Embedding generation through the Python AI Service.
- pgvector-backed chunk embedding storage.
- Authenticated semantic search endpoint for a Lead.

Done when:

- An Admin User can index one Lead into evidence chunks.
- The app can embed those chunks.
- A query can return the most relevant chunks for that Lead.
- Existing profile/demo/outreach generation still behaves as before.

Detailed plan: [RAG Phase 1 Foundation Plan](rag-phase-1-foundation-plan.md).

### Phase 2 — Grounded Business Profile Generation

**Primary learning goal:** Learn how retrieved evidence becomes controlled LLM context.

Build:

- Retrieve evidence before profile generation.
- Pass retrieved chunks to the Python profile prompt.
- Add citations/source IDs to Verified Facts.
- Refuse unsupported factual claims.
- Save generation provenance on Business Profiles and Workflow Runs.

Done when:

- Business Profiles are generated from retrieved evidence, not only raw Lead fields.
- Verified Facts cite Evidence Chunks.
- Thin evidence produces Missing Information instead of invented copy.

### Phase 3 — Grounded Demo Content and Outreach

**Primary learning goal:** Learn how grounding applies across downstream AI tasks.

Build:

- Retrieve evidence for demo content generation.
- Retrieve evidence for outreach draft generation.
- Add citation/provenance metadata to generated content sections where useful.
- Add deterministic checks that block unsupported risky claims.

Done when:

- Demo Sites and Outreach Drafts can explain which evidence supported their key factual claims.
- Existing human approval gates remain unchanged.

### Phase 4 — Hybrid Retrieval and Retrieval Debugging

**Primary learning goal:** Understand why vector search alone is not always enough.

Build:

- PostgreSQL full-text search over Evidence Chunks.
- Hybrid retrieval combining lexical and vector results.
- Optional reranking step.
- A small retrieval debug UI on the Lead review page.

Done when:

- A developer/Admin User can compare vector-only, keyword-only, and hybrid results for the same query.
- Retrieval behaviour is understandable without reading logs.

### Phase 5 — RAG Evaluation Suite

**Primary learning goal:** Learn how to measure RAG quality instead of relying on vibes.

Build:

- Small gold dataset using sample/sanitised leads.
- Retrieval evals: precision@k, recall@k, citation hit rate.
- Generation evals: faithfulness, answer relevance, unsupported-claim detection.
- CLI or test command for repeatable eval runs.
- Markdown/JSON eval report output.

Done when:

- Retrieval/generation changes can be compared against a baseline.
- The README can show real eval results.

### Phase 6 — Observability and Cost Tracking

**Primary learning goal:** Learn production AI monitoring.

Build:

- Langfuse or equivalent tracing for AI operations.
- Trace IDs stored on Workflow Runs.
- Token, cost, latency, provider, and model metadata.
- Error categories for provider, validation, retrieval, and safety failures.

Done when:

- A Workflow Run can be followed from UI record to LLM/retrieval trace.
- The portfolio demo can show screenshots of trace/cost/latency dashboards.

### Phase 7 — Bounded Research Agent Workflow

**Primary learning goal:** Learn agent/tool orchestration without making the system autonomous or unsafe.

Build:

- A bounded Lead Research workflow with explicit steps:
  1. Load Lead.
  2. Index evidence.
  3. Embed chunks.
  4. Retrieve relevant context.
  5. Generate or refresh Business Profile.
  6. Run checks.
  7. Stop for Admin review.
- Tool interfaces for each step.
- Retry/failure state handling.
- Human approval checkpoint before any downstream risky action.

Done when:

- The app demonstrates agent-style orchestration while preserving existing approval gates.

### Phase 8 — Portfolio Polish and Optional MCP Interface

**Primary learning goal:** Package the project for interviews and demonstrations.

Build:

- Architecture diagrams.
- Sample Lead dataset.
- Demo walkthrough.
- README with setup, decisions, tradeoffs, eval results, and screenshots.
- Optional read-only MCP server exposing safe tools such as `search_leads`, `get_lead_evidence`, and `query_evidence`.

Done when:

- A reviewer can understand the project quickly and run the safe portfolio workflow locally.

## 5. Learning Path

Each implementation phase should follow this teaching loop:

1. **Concept briefing:** explain the new concept in plain language.
2. **Design choice:** compare 2-3 viable implementation options and pick one.
3. **Tiny implementation slice:** make the smallest useful change.
4. **Inspection:** look at database rows, API output, tests, or traces together.
5. **Checkpoint questions:** confirm the concept is understood before continuing.
6. **Commit review:** review the diff before any commit.

## 6. Portfolio Outcomes

By the end of the roadmap, the project should credibly demonstrate:

- RAG pipeline design.
- Evidence ingestion and provenance.
- Vector database usage with PostgreSQL/pgvector.
- Semantic and hybrid search.
- Structured AI generation with citations.
- Eval-driven iteration.
- AI observability and cost tracking.
- Human-in-the-loop safety controls.
- Full-stack production integration across Next.js, Payload, FastAPI, and Postgres.

## 7. Planning Notes

- Phase 1 should not change profile/demo/outreach generation yet. It only creates the retrieval substrate.
- pgvector and Python-owned embedding calls are proposed decisions for Phase 1; record ADRs once approved for implementation.
- Keep `business-finder` as the Lead discovery source unless a future approved ADR changes that boundary.
- Keep provider API keys in the Python AI Service environment. Do not add provider keys to Payload collections or browser-visible settings.
