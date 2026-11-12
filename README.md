# AI Knowledge Assistant API

A backend API for building a private, PDF-backed knowledge assistant. A user registers, uploads a PDF, and waits while a background worker extracts its text, splits it into token-aware chunks, creates vector embeddings, and stores them in PostgreSQL. Once processing completes, the user can ask questions about that specific document or request a whole-document summary.

This repository contains the backend only—there is no browser client. Its public interface is the JSON/HTTP API described below.

## What it does

- Registers and authenticates users with short-lived bearer tokens.
- Accepts PDFs up to 10 MiB and keeps the uploaded file on the local filesystem.
- Processes PDFs asynchronously: extract text, preserve page numbers, chunk text, embed chunks, and index them for similarity search.
- Answers questions from the most relevant chunks of the requested document, returning page/chunk citations and similarity scores.
- Produces large-document summaries through token-bounded section summaries followed by a final synthesis.
- Enforces document ownership on read, question, and summary operations.

## Request and processing flow

```mermaid
flowchart LR
    Client[API client] -->|register / login| Auth[Express API]
    Auth -->|Argon2id password check| PG[(PostgreSQL + pgvector)]
    Auth -->|15-minute JWT| Client

    Client -->|POST /documents<br/>Bearer token + PDF| Upload[Express API]
    Upload -->|write file| Disk[(uploads/)]
    Upload -->|create PENDING → QUEUED document| PG
    Upload -->|enqueue process-pdf job| Redis[(Redis / BullMQ)]
    Redis --> Worker[PDF worker<br/>concurrency: 2]
    Worker -->|extract per-page text| Disk
    Worker -->|token-aware chunks<br/>with overlap| Gemini[Google Gemini API]
    Worker -->|768-dim document embeddings| Gemini
    Worker -->|chunks + vectors; COMPLETED| PG

    Client -->|POST /documents/:id/ask| API2[Express API]
    API2 -->|JWT + document ownership| PG
    API2 -->|query embedding| Gemini
    API2 -->|cosine search; top 5 above 0.70| PG
    API2 -->|grounded answer + sources| Gemini
    Gemini --> Client

    Client -->|POST /documents/:id/summarize| API3[Express API]
    API3 -->|ordered chunks| PG
    API3 -->|token-bounded map then reduce summary| Gemini
    Gemini --> Client
```

The upload endpoint returns after the job is queued; it does not wait for extraction or embedding. Poll `GET /documents/:id` and use the document `status` before calling question or summary endpoints.

## Architecture

| Layer | Responsibility | Implementation evidence |
| --- | --- | --- |
| HTTP API | Routing, JSON parsing, CORS, authentication, and request validation | `src/app.ts`, `src/routes/`, `src/controllers/` |
| Authentication | Email/password accounts, Argon2id hashes, signed JWT access tokens | `src/services/auth.service.ts`, `password.service.ts`, `jwt.service.ts` |
| Storage | Relational users/documents/chunks and vector columns | `src/prisma/contract.prisma` |
| Ingestion | Disk upload, PDF text extraction, per-page chunking, embedding creation | `upload.middleware.ts`, `pdf-extraction.service.ts`, `chunking.service.ts` |
| Background execution | Durable Redis-backed jobs, retries, exponential backoff, worker concurrency | `pdf-processing.queue.ts`, `pdf-processing.worker.ts` |
| Retrieval and generation | Gemini embeddings, pgvector cosine similarity, grounded question answering, hierarchical summaries | `semantic-search.service.ts`, `rag.service.ts`, `gemini-token.service.ts` |

## Requirements

- Node.js compatible with the dependencies (the Prisma scaffold notes Node 24 LTS or newer).
- PostgreSQL 15+ with the `vector` extension available.
- Redis, reachable from the API process and worker.
- A Google Gemini API key and embedding/generation models enabled for it.

## Setup

Install dependencies, create local configuration, create the upload directory, and initialize the database. The current `.env.example` only supplies `DATABASE_URL`; the API checks all of the variables below during startup.

```bash
npm install
cp .env.example .env
mkdir -p uploads
```

Populate `.env` with values appropriate to the local environment:

```dotenv
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/knowledge_assistant"

REDIS_HOST=127.0.0.1
REDIS_PORT=6379

GEMINI_API_KEY=replace-me
EMBEDDING_MODEL=gemini-embedding-2
GENERATION_MODEL=replace-with-an-enabled-Gemini-generation-model

# Values are token counts, not character counts.
CHUNK_SIZE=800
CHUNK_OVERLAP=100
SUMMARY_BATCH_TOKEN_LIMIT=12000

# Base64 encoding of at least 32 random bytes.
JWT_SECRET=replace-with-a-base64-encoded-secret
```

For example, generate the JWT secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Apply the checked-in Prisma contract/migrations using the Prisma workflow configured in `prisma.config.ts`. The available CLI commands can be inspected with `npx prisma --help`; use the database migration procedure appropriate to the target environment before starting the API.

Run the API and its worker in separate terminals:

```bash
npm run dev
npm run worker
```

The API listens on `PORT` (default `3000` after validation) and the worker consumes the `pdf-processing` queue. A production build can be checked with `npm run build`; `npm start` runs the compiled API, while the worker is currently run through `npm run worker`.

## API reference

All authenticated endpoints require `Authorization: Bearer <accessToken>`.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/health` | No | Liveness response |
| `GET` | `/db` | No | Checks the database with `SELECT NOW()` |
| `POST` | `/auth/register` | No | Creates an account and returns an access token |
| `POST` | `/auth/login` | No | Authenticates and returns an access token |
| `GET` | `/users/me` | Yes | Current user profile |
| `POST` | `/documents` | Yes | Upload a PDF (`multipart/form-data`, field name `file`; optional `title`) |
| `GET` | `/documents/user` | Yes | List the caller's documents |
| `GET` | `/documents/:id` | Yes | Get one of the caller's documents, including processing status |
| `POST` | `/documents/:documentId/ask` | Yes | Ask a question about one document |
| `POST` | `/documents/:documentId/summarize` | Yes | Create a hierarchical summary of one document |

### Example session

```bash
# Register (or use /auth/login) and retain accessToken from the response.
curl -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"ada@example.com","password":"a-strong-password","name":"Ada"}'

# Queue a PDF. Substitute ACCESS_TOKEN with the response token.
curl -X POST http://localhost:3000/documents \
  -H 'Authorization: Bearer ACCESS_TOKEN' \
  -F 'file=@./document.pdf' \
  -F 'title=Reference document'

# Poll until status is COMPLETED.
curl http://localhost:3000/documents/1 \
  -H 'Authorization: Bearer ACCESS_TOKEN'

# Ask a document-scoped question.
curl -X POST http://localhost:3000/documents/1/ask \
  -H 'Authorization: Bearer ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"question":"What are the main conclusions?"}'
```

An answer has the shape:

```json
{
  "answer": "...",
  "sources": [
    { "chunkIndex": 3, "pageNumber": 2, "similarity": 0.82 }
  ]
}
```

## Design decisions and evidence

These are implementation-backed rationales, not assumptions about unimplemented features.

| Decision | Why this fits the problem | Evidence in this repository |
| --- | --- | --- |
| Asynchronous PDF ingestion with BullMQ + Redis | Extraction and one embedding call per chunk can take substantially longer than an HTTP request. Queuing returns an upload response promptly and isolates retryable work. | Jobs have 3 attempts with exponential backoff; the worker has concurrency `2`. See `src/queues/pdf-processing.queue.ts` and `src/workers/pdf-processing.worker.ts`. |
| PostgreSQL plus pgvector | Document metadata, ownership, chunks, and embeddings share one transactional relational store. The query filters on `documentId` and ranks embeddings by cosine similarity without a separate vector database. | `DocumentChunk.embedding` is `pgvector.Vector(768)` in `src/prisma/contract.prisma`; `semantic-search.service.ts` uses cosine similarity. |
| Page-preserving, token-aware overlapping chunks | Page numbers enable useful citations, model token counts cap context unit size, and overlap reduces loss at chunk boundaries. | `chunkPages` keeps `pageNumber`, calculates token bounds via Gemini, and applies `CHUNK_OVERLAP`. |
| Separate document/query embedding tasks | Retrieval benefits from distinguishing stored passages from a search query. | The worker calls `generateEmbedding(..., "retrieval_document")`; search calls it with `"retrieval_query"`. |
| Fixed retrieval policy | Limiting retrieval to the top five chunks above a similarity threshold bounds prompt size and avoids generating from weak matches. | `askDocument` requests `limit = 5`, `minSimilarity = 0.70`; an empty result returns no sources. |
| Grounded generation and prompt-injection resistance | Uploaded document text is untrusted input. The generation prompts say to use only supplied context and not follow instructions found inside it. | System instructions in `src/services/rag.service.ts` include both constraints and use temperature `0.2`. |
| Hierarchical summarization | A whole document may not fit into one generation prompt. Summarizing token-bounded batches and then reducing their summaries scales with document length. | `createSummaryBatches`, `createBatchSummary`, and `createFinalSummary` implement the map/reduce flow. |
| JWT and ownership checks at the controller boundary | Authentication alone is insufficient for a multi-user document store; every document read, question, and summary must be scoped to its owner. | `authenticate` sets `req.user`; controllers call `getDocumentForUser` before retrieving or generating. |
| Argon2id password hashing | The code uses a memory-hard password-hashing scheme instead of storing passwords or using a fast digest. | `password.service.ts` selects `argon2id` with explicit memory/time/parallelism settings. |

## Data model and lifecycle

`User` owns many `Document` records. A document owns many `DocumentChunk` records, which are deleted with the document. Each chunk has its source page, token count, text, ordinal index, and optional 768-dimensional embedding. `Session` and `RefreshToken` tables exist in the contract, although the currently exposed authentication routes return only 15-minute access JWTs and do not yet expose refresh-token endpoints.

Normal document states written by the application are `PENDING`, `QUEUED`, `EXTRACTING`, `CHUNKING`, `COMPLETED`, and—in the event that queueing itself fails—`FAILED`.

## Operational notes and current boundaries

- Uploads are local files under `uploads/`, which is deliberately not tracked. They need durable/shared storage if API and workers run on different machines or containers.
- The worker retries failed jobs, but its failure handler only logs the error; it does **not** currently update a document to `FAILED` after processing failure. Consumers should treat a long-lived non-`COMPLETED` status as requiring operational investigation.
- The API accepts a PDF based on the request MIME type and limits it to 10 MiB. It does not currently expose deletion, antivirus scanning, rate limiting, refresh tokens, or an HTTP endpoint for job progress.
- `GET /db` exposes database connectivity without authentication. Restrict or remove it before exposing the service publicly.
- `cors()` is configured with defaults, so deployers should set an explicit origin policy for a production client.
- Generated summaries and answers depend on the configured Gemini models and API availability; source citations are retrieved chunks, not independently verified claims.

## Development

```bash
npm run build
```

The TypeScript compilation currently succeeds with this command. The repository includes a few ad hoc root-level test scripts (`test-rag.ts`, `test-embedding.ts`, and `test-gemini-embedder.ts`), but no automated test runner or CI test command is configured.
