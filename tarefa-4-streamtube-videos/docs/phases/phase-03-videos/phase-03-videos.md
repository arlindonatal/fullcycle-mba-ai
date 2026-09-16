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
| Read READY video, thumbnail, stream, download | yes | yes | yes |

### Error Catalog

`VIDEO_NOT_FOUND` (404), `VIDEO_NOT_OWNED` (403), `VIDEO_UPLOAD_INVALID` (409), `VIDEO_TOO_LARGE` (400), `VIDEO_NOT_READY` (409), `VIDEO_RANGE_INVALID` (416).

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

## Dependency Map

`SI-03.1 → SI-03.2 → SI-03.3 → SI-03.4 → SI-03.5`.

## Deliverables

- Docker Compose brings up API, Postgres, Mailpit, MinIO, Redis and video worker.
- Direct multipart uploads support an object declared up to 10 GiB.
- Completion creates a durable worker job; metadata and thumbnail are persisted.
- Canonical slug is unique; streaming honors one byte range and download is available.
- `npm test`, `npm run test:e2e`, `npx tsc --noEmit` and `npm run lint` pass inside `nestjs-api`.
