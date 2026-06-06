# RAG Phase 1 Foundation Plan

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
- [13. Teaching Checkpoints](#13-teaching-checkpoints)

## 1. Problem Statement

The current AI Demo Website Pipeline generates Business Profiles, Demo Sites, QA reports, and Outreach Drafts from Lead data and structured records. It already separates Verified Facts from Assumptions, but it does not yet have a durable evidence store or retrieval layer.

That means the app cannot yet answer:

- What exact source material supports this generated claim?
- Which chunks of evidence were shown to the model?
- Can we search a Lead's evidence semantically?
- Can we improve generation by retrieving only relevant context?

Phase 1 solves the foundation only: store evidence, chunk it, embed it, and retrieve it. It should not change profile/demo/outreach generation behaviour yet. That keeps the learning scope focused on RAG basics before we wire retrieval into LLM prompts.

## 2. Goals & Non-Goals

Goals:

- Add admin-protected Evidence Document and Evidence Chunk records.
- Convert existing Lead Data into deterministic evidence text.
- Chunk evidence using a simple, inspectable chunking strategy.
- Generate embeddings through the Python AI Service, preserving the existing rule that provider calls stay out of Payload/Next.
- Store embeddings in PostgreSQL using pgvector.
- Add authenticated endpoints to index, embed, and semantically search evidence for one Lead.
- Record indexing/embedding attempts through Workflow Runs and embedding-specific metadata.
- Add tests for the pure logic: evidence text building, chunking, content hashing, deterministic embedding behaviour, and auth boundaries.
- Keep every implementation step teachable and reviewable.

Non-Goals for Phase 1:

- No changes to Business Profile generation prompts.
- No changes to Demo Site or Outreach Draft generation prompts.
- No website crawling beyond already-imported Lead fields and `source_payload`.
- No hybrid keyword+vector retrieval yet.
- No reranking yet.
- No Langfuse/LangSmith tracing yet.
- No eval suite yet.
- No autonomous agent workflow.
- No MCP server.
- No bulk indexing across all Leads until single-Lead indexing is understood and tested.

## 3. Proposed Architecture

Use a small RAG foundation inside the existing app boundary:

```txt
Payload/Next app
  ├── Evidence Documents and Chunks are visible/admin-protected Payload collections
  ├── Lead review/API actions orchestrate indexing, embedding, and search
  ├── Raw SQL helper stores/searches vectors in pgvector
  └── Workflow Runs record high-level attempts

Python AI Service
  ├── /embeddings endpoint owns embedding provider calls
  ├── deterministic fallback supports local tests and learning
  └── service-to-service bearer auth remains required

PostgreSQL
  ├── Payload-managed tables for evidence metadata
  └── custom pgvector table for chunk vectors
```

### Key decisions proposed for approval

1. **Use pgvector first.**
   - Why: the app already uses PostgreSQL, and portfolio reviewers recognise pgvector as a pragmatic production vector-store choice.
   - Alternative: external vector DB such as Qdrant/Pinecone. Useful later, but it adds infrastructure before the basics are understood.

2. **Keep embeddings provider calls in Python.**
   - Why: ADR 0014 says the Python AI Service owns provider calls. Embeddings are provider calls too.
   - Alternative: call embeddings from Next.js. Simpler code path, but it splits AI secrets and provider logic across services.

3. **Keep evidence metadata in Payload collections, but vectors in a custom SQL table.**
   - Why: Payload collections make documents/chunks inspectable in admin, while pgvector similarity search needs a real `vector` column.
   - Alternative: store embeddings as JSON in Payload only. Easier, but not a real vector database and not suitable for similarity search.

4. **Start with Lead Data evidence only.**
   - Why: website crawling introduces HTTP, robots, scraping, parsing, and legal/ethical decisions. Lead Data gives a clean first RAG slice.
   - Alternative: crawl websites in Phase 1. More impressive, but too much concept load for the first learning phase.

## 4. Component Breakdown

### 4.1 Evidence Documents Payload collection

Represents one source item attached to a Lead.

Examples:

- canonical Lead Data document
- imported `source_payload` document
- future website page document
- future manual note document

Responsibilities:

- Preserve source-level provenance.
- Store raw/plain text used for chunking.
- Track source type, URL/label, hash, status, and errors.
- Stay admin-protected like Leads and Business Profiles.

### 4.2 Evidence Chunks Payload collection

Represents a searchable section of an Evidence Document.

Responsibilities:

- Store chunk text and metadata visible in Payload admin.
- Track chunk order, hash, token estimate, embedding status, embedding model, and embedded timestamp.
- Link back to both Lead and Evidence Document.

### 4.3 Embedding Runs collection or metadata record

Represents one embedding batch attempt.

Responsibilities:

- Track provider/model/dimensions for a batch.
- Track chunk count, status, error, start/end timestamps.
- Make embedding work auditable separately from generated Business Profiles or Demo Sites.

Implementation choice during Phase 1:

- Prefer a small `embedding-runs` Payload collection if the extra admin visibility is worth it.
- Otherwise store detailed embedding metadata on Workflow Run `metadata` and defer the collection.

### 4.4 pgvector embedding table

Stores vectors for Evidence Chunks.

Proposed shape:

```sql
create extension if not exists vector;

create table if not exists evidence_chunk_embeddings (
  chunk_id integer primary key references evidence_chunks(id) on delete cascade,
  embedding vector(1536) not null,
  provider text not null,
  model text not null,
  dimensions integer not null default 1536,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists evidence_chunk_embeddings_embedding_idx
  on evidence_chunk_embeddings using ivfflat (embedding vector_cosine_ops);
```

The exact table name must match the actual Payload table name generated for `evidence-chunks`; verify during implementation before running SQL.

### 4.5 Evidence indexing service in Payload/Next

Responsibilities:

- Load a Lead.
- Build deterministic source text from Lead fields.
- Hash source text.
- Create/update Evidence Documents idempotently.
- Split source text into chunks.
- Create/update Evidence Chunks idempotently.
- Mark stale chunks when source text changes.

### 4.6 Chunking utility

Start simple and inspectable:

- Split by headings/blank lines first.
- Merge small paragraphs until target size.
- Keep chunks around 300-600 words or equivalent character count.
- Add overlap only if we see a retrieval problem.

This is intentionally not token-perfect in Phase 1. The learning goal is to understand chunk shape and provenance.

### 4.7 Python embeddings endpoint

Responsibilities:

- Require the existing service bearer token.
- Accept a list of texts.
- Return embeddings, model, provider, and dimensions.
- Support deterministic fallback for tests/local learning.
- Support a real embedding provider when configured.

Initial real provider target:

- `openai` with `text-embedding-3-small`, fixed at 1536 dimensions.

### 4.8 Vector search service in Payload/Next

Responsibilities:

- Embed a user query by calling the Python AI Service.
- Search pgvector for the nearest chunks scoped to one Lead.
- Return chunks with similarity/distance score and source metadata.
- Avoid exposing evidence for unauthenticated users.

## 5. Data Flow

### Index Lead Evidence

```txt
Admin User clicks/runs Index Evidence for Lead
→ Next route authenticates Admin User
→ Payload loads Lead
→ buildLeadEvidenceText(lead) creates canonical text
→ content hash is calculated
→ Evidence Document is created or updated
→ chunkEvidenceText(text) produces ordered chunks
→ Evidence Chunks are created/updated
→ Workflow Run records success/failure
→ response returns document/chunk counts
```

### Embed Lead Evidence

```txt
Admin User clicks/runs Embed Evidence for Lead
→ Next route authenticates Admin User
→ Payload loads pending/stale Evidence Chunks
→ Next calls Python /embeddings with chunk texts
→ Python validates token and returns vectors
→ Next upserts vectors into pgvector table
→ Evidence Chunks are marked embedded
→ Workflow Run and optional Embedding Run record success/failure
→ response returns embedded/failed counts
```

### Search Lead Evidence

```txt
Admin User posts a search query for Lead
→ Next route authenticates Admin User
→ Next calls Python /embeddings for query text
→ Next runs pgvector similarity search scoped to Lead's chunks
→ Payload loads chunk/document metadata for matched ids
→ response returns ranked chunks, scores, and source info
```

## 6. Interface Contracts

### Payload collection: `evidence-documents`

Fields:

- `lead`: relationship to `leads`, required.
- `source_type`: select: `lead_data`, `source_payload`, `website_page`, `manual_note`.
- `source_title`: text, required.
- `source_url`: text, optional.
- `content_hash`: text, required.
- `raw_text`: textarea, required.
- `status`: select: `pending`, `indexed`, `failed`, default `pending`.
- `last_indexed_at`: date, optional.
- `error`: textarea, optional.
- `metadata`: json, optional.

Access:

- create/read/update/delete: authenticated Admin User only, matching existing collection access style for Phase 1.

### Payload collection: `evidence-chunks`

Fields:

- `lead`: relationship to `leads`, required.
- `document`: relationship to `evidence-documents`, required.
- `chunk_index`: number, required.
- `chunk_text`: textarea, required.
- `content_hash`: text, required.
- `token_estimate`: number, optional.
- `embedding_status`: select: `pending`, `embedded`, `stale`, `failed`, default `pending`.
- `embedding_provider`: text, optional.
- `embedding_model`: text, optional.
- `embedding_dimensions`: number, optional.
- `embedded_at`: date, optional.
- `metadata`: json, optional.

Access:

- create/read/update/delete: authenticated Admin User only.

### Optional Payload collection: `embedding-runs`

Fields:

- `lead`: relationship to `leads`, required.
- `status`: select: `started`, `succeeded`, `failed`, required.
- `provider`: text, optional.
- `model`: text, optional.
- `dimensions`: number, optional.
- `chunk_count`: number, optional.
- `started_at`: date, required.
- `finished_at`: date, optional.
- `error`: textarea, optional.
- `metadata`: json, optional.

### Next route: `POST /api/leads/[leadId]/index-evidence`

Input:

```json
{
  "force": false
}
```

Output:

```json
{
  "lead_id": 123,
  "documents_created": 1,
  "documents_updated": 0,
  "chunks_created": 3,
  "chunks_updated": 0,
  "chunks_marked_stale": 0
}
```

Error cases:

- `401` unauthenticated.
- `404` Lead not found.
- `400` invalid request.
- `500` indexing failure, recorded as Workflow Run.

### Next route: `POST /api/leads/[leadId]/embed-evidence`

Input:

```json
{
  "force": false
}
```

Output:

```json
{
  "lead_id": 123,
  "embedded_chunks": 3,
  "skipped_chunks": 0,
  "failed_chunks": 0,
  "provider": "openai",
  "model": "text-embedding-3-small",
  "dimensions": 1536
}
```

Error cases:

- `401` unauthenticated.
- `404` Lead not found.
- `409` no Evidence Chunks exist; index evidence first.
- `400` provider/config/validation failure.
- failure recorded as Workflow Run and optional Embedding Run.

### Next route: `POST /api/leads/[leadId]/search-evidence`

Input:

```json
{
  "query": "What services does this business offer?",
  "limit": 5
}
```

Output:

```json
{
  "lead_id": 123,
  "query": "What services does this business offer?",
  "results": [
    {
      "chunk_id": 456,
      "document_id": 789,
      "score": 0.82,
      "chunk_text": "...",
      "source_type": "lead_data",
      "source_title": "Lead Data",
      "source_url": null,
      "chunk_index": 0
    }
  ]
}
```

Error cases:

- `401` unauthenticated.
- `400` empty query or invalid limit.
- `409` no embedded chunks exist.

### Python route: `POST /embeddings`

Input:

```json
{
  "texts": ["Business name: A and B Roofing"],
  "input_type": "document",
  "embedding_config": {
    "provider": "openai",
    "model": "text-embedding-3-small"
  }
}
```

Output:

```json
{
  "provider": "openai",
  "model": "text-embedding-3-small",
  "dimensions": 1536,
  "items": [
    { "index": 0, "embedding": [0.01, -0.02] }
  ]
}
```

Error cases:

- `401` invalid/missing service token.
- `400` unsupported provider/model or invalid input.
- `400` provider returned wrong dimensions.
- `400/5xx` provider/network failure using existing ProviderError shape.

### TypeScript functions

```ts
buildLeadEvidenceText(lead: LeadLike): string
chunkEvidenceText(input: { text: string; targetChars?: number; overlapChars?: number }): EvidenceChunkDraft[]
indexLeadEvidence(payload: Payload, leadId: string | number, options?: { force?: boolean }): Promise<IndexEvidenceResult>
embedLeadEvidence(payload: Payload, leadId: string | number, options?: { force?: boolean }): Promise<EmbedEvidenceResult>
searchLeadEvidence(payload: Payload, input: { leadId: string | number; query: string; limit?: number }): Promise<EvidenceSearchResult[]>
```

## 7. File Changes

Create:

- `collections/EvidenceDocuments.ts` — Payload collection for source evidence records.
- `collections/EvidenceChunks.ts` — Payload collection for chunk records.
- `collections/EmbeddingRuns.ts` — optional Payload collection for embedding batch attempts.
- `lib/evidence/build-lead-evidence.ts` — deterministic Lead-to-text mapper.
- `lib/evidence/chunk-text.ts` — simple chunking helper.
- `lib/evidence/hash.ts` — stable SHA-256 helper for idempotence.
- `lib/evidence/index-lead-evidence.ts` — create/update evidence docs and chunks.
- `lib/evidence/embed-lead-evidence.ts` — call Python embeddings and store pgvector rows.
- `lib/evidence/search-evidence.ts` — embed query and search pgvector rows.
- `lib/vector-store.ts` — raw SQL helper for pgvector setup/upsert/search.
- `app/api/leads/[leadId]/index-evidence/route.ts` — authenticated indexing endpoint.
- `app/api/leads/[leadId]/embed-evidence/route.ts` — authenticated embedding endpoint.
- `app/api/leads/[leadId]/search-evidence/route.ts` — authenticated search endpoint.
- `workers/python/app/jobs/embeddings.py` — embedding generation and deterministic fallback.
- `tests/evidence.test.ts` — TypeScript unit tests for evidence text, chunking, hashing.
- `workers/python/tests/test_embeddings.py` — Python tests for embedding endpoint/auth/deterministic dimensions.
- `scripts/sql/001_pgvector_evidence_embeddings.sql` — manual SQL setup if Payload migrations are not enabled.

Modify:

- `payload.config.ts` — register new Payload collections.
- `collections/WorkflowRuns.ts` — add `evidence_indexing` and `embedding_generation` operation values.
- `lib/workflow.ts` — allow new operation names.
- `lib/ai-service-client.ts` — add `requestEmbeddings` service client.
- `workers/python/app/main.py` — register `/embeddings` route.
- `workers/python/app/schemas.py` — add embedding request/response schemas.
- `workers/python/app/llm.py` — add embedding provider resolution or helper functions.
- `workers/python/pyproject.toml` — only if new direct dependencies are needed.
- `package.json` — add a direct SQL client dependency only if the chosen implementation needs it.
- `docs/app-guide.md` — after implementation, document evidence indexing/search usage.
- `docs/adr/` — after approval, add ADRs for pgvector and Python-owned embeddings if accepted.

Delete:

- None.

## 8. Implementation Phases

### Phase 1A — Confirm storage strategy and add ADRs

- Branch: `feature/rag-foundation`
- Branch gate: implementation must start by checking `git status --short --branch` and creating/switching to this branch before edits.
- Commit policy: one logical change per commit; ask before committing.
- Commits:
  - [ ] Add ADR: pgvector is the first vector store.
  - [ ] Add ADR: Python AI Service owns embedding provider calls.
- Done when: storage/provider ownership decisions are documented and no code has changed yet.

### Phase 1B — Add evidence metadata collections

- Branch: `feature/rag-foundation`
- Commits:
  - [ ] Add Evidence Documents collection.
  - [ ] Add Evidence Chunks collection.
  - [ ] Optionally add Embedding Runs collection.
  - [ ] Register collections in Payload config.
  - [ ] Extend Workflow Run operation options.
- Done when: the app typechecks and Payload can expose the new collections in admin.

### Phase 1C — Build deterministic Lead Data indexing

- Branch: `feature/rag-foundation`
- Commits:
  - [ ] Add Lead-to-evidence text builder.
  - [ ] Add content hash helper.
  - [ ] Add chunking helper.
  - [ ] Add idempotent `indexLeadEvidence` service.
  - [ ] Add authenticated `index-evidence` route.
  - [ ] Add TypeScript unit tests.
- Done when: one Lead can be indexed into Evidence Documents and Evidence Chunks without calling an LLM.

### Phase 1D — Add embedding endpoint in Python

- Branch: `feature/rag-foundation`
- Commits:
  - [ ] Add embedding schemas.
  - [ ] Add deterministic embedding fallback with fixed 1536 dimensions.
  - [ ] Add real provider embedding helper for the approved provider/model.
  - [ ] Add `/embeddings` endpoint with service-token auth.
  - [ ] Add Python tests.
- Done when: `/embeddings` returns stable vectors in deterministic mode and rejects unauthenticated requests.

### Phase 1E — Store chunk vectors in pgvector

- Branch: `feature/rag-foundation`
- Commits:
  - [ ] Add pgvector SQL setup script or migration.
  - [ ] Add vector-store helper for upsert/search.
  - [ ] Add `requestEmbeddings` in the TypeScript AI service client.
  - [ ] Add `embedLeadEvidence` service.
  - [ ] Add authenticated `embed-evidence` route.
  - [ ] Mark chunks embedded/stale/failed correctly.
- Done when: pending chunks can be embedded and stored as pgvector rows.

### Phase 1F — Add semantic search endpoint

- Branch: `feature/rag-foundation`
- Commits:
  - [ ] Add query embedding flow.
  - [ ] Add Lead-scoped vector search.
  - [ ] Add authenticated `search-evidence` route.
  - [ ] Return chunk/document metadata and similarity score.
  - [ ] Add tests for validation and pure search result mapping where possible.
- Done when: a query returns ranked Evidence Chunks for one Lead.

### Phase 1G — Documentation and learning review

- Branch: `feature/rag-foundation`
- Commits:
  - [ ] Update `docs/app-guide.md` with the evidence indexing/search workflow.
  - [ ] Add a short README section or command examples if useful.
  - [ ] Review the full diff before merge.
- Done when: a future reader can run the Phase 1 workflow and understand what each RAG component does.

## 9. Testing Strategy

Unit tests:

- `buildLeadEvidenceText` includes important Lead fields and omits empty values.
- `chunkEvidenceText` preserves order and produces stable chunk indexes.
- `hashText` produces stable hashes for unchanged content.
- Indexing is idempotent: running twice should not duplicate documents/chunks.
- Changed Lead Data marks affected chunks stale or updates them predictably.

Python tests:

- `/embeddings` rejects missing/invalid bearer token.
- deterministic embeddings return the configured dimension count.
- deterministic embeddings are stable for the same input text.
- invalid input is rejected.

Integration/manual checks:

- Create/import one sample Lead.
- Run `index-evidence`; inspect Evidence Document and Evidence Chunks in Payload admin.
- Run `embed-evidence`; inspect chunk embedding metadata and pgvector rows.
- Run `search-evidence` with a plain-English query; inspect returned chunks.
- Existing profile/demo/outreach generation still works.

Validation commands:

```bash
npm run lint
npm run typecheck
npm run test
cd workers/python && uv run pytest
```

## 10. Security Implications

Data processed:

- Business names, addresses, phone numbers, emails, website URLs, source import payloads, and derived text chunks.

Security requirements:

- Evidence collections must use authenticated access controls from the start.
- Evidence search routes must authenticate the Admin User before returning chunks.
- Do not expose evidence chunks on public Demo Pages.
- Provider API keys remain in Python service environment variables only.
- The `/embeddings` endpoint must require the existing service bearer token.
- Do not send unnecessary PII to embedding providers; Phase 1 should make the data being embedded inspectable.
- Search must be Lead-scoped to avoid accidentally mixing evidence from different Leads.
- Avoid logging full evidence text in provider errors or Workflow Run error fields.

Prompt-injection note:

- Phase 1 does not feed retrieved text into generation yet, so prompt injection risk is limited. The risk becomes more important in Phase 2 when evidence chunks enter prompts.

## 11. Risks & Tradeoffs

- Risk: Payload does not manage pgvector columns cleanly.
  - Mitigation: use Payload collections for inspectable metadata and a small raw SQL table for vectors.

- Risk: fixed 1536 dimensions make model swaps harder.
  - Mitigation: lock Phase 1 to `text-embedding-3-small`; revisit multi-dimension storage later only if needed.

- Risk: deterministic embeddings do not behave like semantic embeddings.
  - Mitigation: use deterministic embeddings for tests and local plumbing only; use a real embedding provider for meaningful retrieval demos.

- Risk: chunking strategy is too simple.
  - Mitigation: keep it simple for learning; improve after retrieval evals show concrete failures.

- Risk: indexing source payloads may embed unnecessary PII.
  - Mitigation: start with canonical Lead Data text, keep source payload inclusion explicit, and inspect chunks before using real provider calls.

- Risk: adding direct SQL access duplicates database configuration.
  - Mitigation: reuse `DATABASE_URI`, keep SQL helper isolated, and add tests/docs around setup.

## 12. Open Questions

These must be resolved or explicitly accepted before Phase 1 implementation begins:

1. Does the local/hosted Postgres database support `create extension vector`?
2. Should Phase 1 create a dedicated `embedding-runs` collection, or is Workflow Run metadata enough for now?
3. Which real embedding provider/model should be used first?
   - Proposed: `openai` + `text-embedding-3-small`.
4. Should `source_payload` be indexed in Phase 1, or only canonical Lead Data fields?
   - Proposed: index canonical Lead Data first; add `source_payload` only after inspecting sample rows.
5. Should the first search interface be API-only, or should we add a tiny dashboard search box in Phase 1?
   - Proposed: API-only in Phase 1; debug UI in Phase 4.
6. What migration approach should be used for the custom pgvector table if Payload migrations are not currently enabled?

## 13. Teaching Checkpoints

Before implementation, learn/confirm:

- What RAG is and why it is different from fine-tuning.
- What an Evidence Document is.
- What an Evidence Chunk is and why chunk size matters.
- What an embedding is.
- Why vector similarity search can find related meaning instead of exact words.
- Why metadata filters are mandatory for multi-record apps.
- Why idempotent indexing matters.
- Why provider calls stay in the Python AI Service.

After Phase 1C, you should be able to answer:

- How did one Lead become one or more Evidence Documents?
- How did each Evidence Document become chunks?
- What makes chunk IDs/order stable enough to debug?
- What happens if the Lead changes?

After Phase 1E, you should be able to answer:

- Where is the human-readable chunk text stored?
- Where is the vector stored?
- Why are those not necessarily the same table?
- What does embedding dimension mean?

After Phase 1F, you should be able to answer:

- What path does a search query take through the system?
- Why does the query need an embedding too?
- Why must search be scoped to one Lead?
- What does a similarity score tell us, and what does it not tell us?

We should not move to Phase 2 until these questions are comfortable.
