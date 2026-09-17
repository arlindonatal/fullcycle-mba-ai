# Phase 03 — Upload and Processing of Videos

## Technical Specifications

### Data Model

`videos`: UUID, `channel_id`, immutable unique `slug`, title, MIME type, declared byte size, status (`DRAFT`, `PROCESSING`, `READY`, `ERROR`), source/thumbnail object keys, multipart upload id, duration, JSON metadata, error message and timestamps. FK points to `channels.id`.

### API Contracts

| Method | Route | Auth | Contract |
|---|---|---|---|
| POST | `/videos/uploads` | owner | creates DRAFT + multipart upload; returns video, upload ID and part sizing |
| POST | `/videos/:id/upload-parts` | owner | returns presigned URLs for requested part numbers |
| POST | `/videos/:id/uploads/complete` | owner | completes parts, enters PROCESSING and queues job |
| DELETE | `/videos/:id/uploads` | owner | aborts an incomplete multipart upload |
| GET | `/videos/:slug` | public | video metadata/status and canonical URLs |
| GET | `/videos/:slug/thumbnail` | public | redirects to a temporary thumbnail URL |
| GET | `/videos/:slug/stream` | public | emits full or single-range bytes (`206`) |
| GET | `/videos/:slug/download` | public | attachment bytes |

### Authorization Matrix

| Action | Anonymous | Authenticated non-owner | Channel owner |
|---|---:|---:|---:|
| Start/complete/abort upload | no | no | yes |
| Read video metadata/status | yes | yes | yes |
| Read READY thumbnail, stream and download | yes | yes | yes |

### Error Catalog

`VIDEO_NOT_FOUND` (404), `VIDEO_NOT_OWNED` (403), `VIDEO_UPLOAD_INVALID` (409), `VIDEO_TOO_LARGE` (400), `VIDEO_SIZE_MISMATCH` (400), `VIDEO_NOT_READY` (409), `VIDEO_RANGE_INVALID` (416).

### Events / Messages

Queue `video-processing`; job `process-video`; payload `{ videoId }`. Completion enqueue follows successful S3 multipart completion. Worker retries three times with exponential backoff and updates the persisted status.

## Step Implementations

### SI-03.1 — Storage, schema and local infrastructure

Add MinIO, Redis and FFmpeg-ready worker service; add environment validation, S3 service, video migration/entity and module registration.

### SI-03.2 — Queue and dedicated worker

Add BullMQ producer/worker contract and worker process that reads object bytes, runs FFprobe/FFmpeg, stores thumbnail and persists metadata/status.

### SI-03.3 — Direct multipart upload workflow

Create authenticated draft/start, part URL, complete and abort endpoints. Enforce 10 GiB declaration and ownership.

### SI-03.4 — Public delivery

Add unique-slug detail, thumbnail, byte-range streaming and download endpoints.

### SI-03.5 — Tests, OpenAPI and closeout

Add focused unit/integration/E2E coverage, update OpenAPI-related contracts and Codex instructions; run full DoD checks.

### SI-03.6 — Client-reachable local presigned URLs

Separate the S3 endpoint used by containers from the endpoint embedded in presigned URLs. Keep `http://minio:9000` for API/worker operations and use a configurable host-reachable local endpoint (default `http://localhost:9002`) for upload-part and thumbnail URLs. Configure MinIO CORS for direct browser uploads.

**Tests:** unit coverage proves that signatures use the external endpoint while server operations keep using the internal endpoint.

### SI-03.7 — Enforce the actual uploaded size

After multipart completion, inspect the stored object with `HeadObject`. Reject and delete objects larger than 10 GiB or larger than the declared size, persist `ERROR`, clear the upload id, and never enqueue processing for invalid objects.

**Tests:** unit coverage for valid completion, real oversize rejection and queue suppression.

### SI-03.8 — Compose full-stack startup

Make `nestjs-api` start the NestJS application automatically, add health checks and ensure PostgreSQL, Mailpit, Redis, MinIO, API and worker start together through `docker compose up`.

**Tests:** Compose health/status verification and an HTTP health request from the host.

### SI-03.9 — Real video integration and E2E coverage

Add `*.integration-spec.ts` tests against real PostgreSQL, MinIO and Redis plus `*.e2e-spec.ts` HTTP coverage for authentication, draft creation, direct multipart upload, processing, unique URL, thumbnail, byte-range streaming and download. Use a tiny FFmpeg-generated fixture and the real worker.

**Tests:** `npm run test:integration` and `npm run test:e2e` exercise the Phase 03 flow without replacing MinIO, Redis or PostgreSQL with mocks.

### SI-03.10 — Workflow artifact reconciliation

Record installed library versions and official/Context7 references, align every SI reference, make `validation.md` end in `status: clean`, and record status plus tests for every SI in `progress.md`. Keep Codex/Claude instructions consistent with runtime behavior.

### SI-03.11 — Definition of Done and Git Flow closeout

Run unit, integration and E2E suites, TypeScript and lint inside the container. Commit on `feature/task-4-compliance`, merge through `dev`, and then publish the integrated result to `main` as required by the course repository delivery.

## Dependency Map

`SI-03.1 → SI-03.2 → SI-03.3 → SI-03.4 → SI-03.5`.

Corrective chain: `SI-03.6 → SI-03.7 → SI-03.8 → SI-03.9 → SI-03.10 → SI-03.11`.

## Deliverables

- Docker Compose brings up API, Postgres, Mailpit, MinIO, Redis and video worker.
- Direct multipart uploads support an object declared up to 10 GiB.
- Completion creates a durable worker job; metadata and thumbnail are persisted.
- Canonical slug is unique; streaming honors one byte range and download is available.
- `npm test`, `npm run test:e2e`, `npx tsc --noEmit` and `npm run lint` pass inside `nestjs-api`.
