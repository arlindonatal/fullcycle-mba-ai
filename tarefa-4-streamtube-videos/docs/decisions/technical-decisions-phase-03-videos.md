---
kind: technical-decision
scope_type: phase
slug: phase-03-videos
related_phases: [3]
status: decided
date: 2026-09-16
---

# Technical Decisions — Phase 03: Videos

## TD-03.1: Queue and worker

**Scope:** Backend / infrastructure  
**Capability:** Serviço de processamento em segundo plano (filas); processamento automático após upload.

**Options:**

1. **BullMQ + Redis** — Redis-backed jobs, retries and isolated Node worker. Pros: Nest-compatible, durable queue semantics, retries and horizontal workers. Cons: adds Redis.
2. **RabbitMQ** — broker with rich routing. Pros: broad messaging features. Cons: extra operational model disproportionate to one job type.
3. **PostgreSQL polling** — jobs table polled by a process. Pros: no new service. Cons: polling, locking and retries would be custom code.

**Recommendation and Decision:** **BullMQ + Redis**, with one `video-worker` Compose service. Jobs contain only `videoId`; the database and object storage remain the sources of truth. The worker retries three times with exponential backoff and records a terminal failure as `ERROR`.

**Libraries:** `bullmq`.

## TD-03.2: Large-upload protocol

**Scope:** Cross-layer  
**Capability:** Upload de vídeos com suporte a arquivos de até 10GB sem impacto na performance; pré-cadastro como rascunho.

**Options:**

1. **S3 multipart presigned URLs** — API creates a draft and multipart upload; browser sends parts directly to storage. Pros: no API buffering, resumable parts, S3-compatible. Cons: client performs multipart completion handshake.
2. **API streaming proxy** — API pipes request to storage. Pros: simple client. Cons: API remains in the 10GB data path and is a scaling bottleneck.
3. **Tus server** — resumable protocol service. Pros: mature resumability. Cons: additional protocol/server while storage already speaks S3 multipart.

**Recommendation and Decision:** **S3 multipart presigned URLs** using MinIO locally. Parts are 10 MiB, valid for 15 minutes; the API rejects declared uploads over 10 GiB. A draft row and upload ID are created before URLs are issued.

**Libraries:** `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`.

## TD-03.3: Processing and thumbnail

**Scope:** Backend / infrastructure  
**Capability:** Extração de duração/metadados; geração automática de thumbnail.

**Options:**

1. **FFprobe + FFmpeg in worker** — inspect source and extract a JPEG frame. Pros: established tooling and no API CPU cost. Cons: worker image needs binaries and temporary disk.
2. **Managed transcoding service** — cloud job service. Pros: managed scale. Cons: not reproducible in the local Compose stack.

**Recommendation and Decision:** **FFprobe + FFmpeg in the worker container**. The worker downloads the source to a temporary directory, writes metadata plus a JPEG thumbnail to MinIO, and always removes temporary files.

## TD-03.4: Public identity and delivery

**Scope:** Backend  
**Capability:** URL única; streaming; download.

**Options:**

1. **Immutable random slug + API byte-range proxy** — public URL identifies the row; API passes a single `Range` to S3. Pros: collision-resistant and works without public buckets. Cons: API remains on playback path.
2. **Title slug + CDN redirect** — readable URLs and direct storage delivery. Pros: cache-friendly. Cons: title conflicts/mutations and public-storage policy.

**Recommendation and Decision:** **Immutable 32-hex random slug and API byte-range proxy**. The unique database constraint is the final collision guard. `GET /videos/:slug/stream` forwards one valid range and returns `206`; `GET /videos/:slug/download` returns an attachment.

## TD-03.5: Video state machine

**Scope:** Backend  
**Capability:** Pré-cadastro, processamento automático e recuperação de falhas.

**Options:**

1. **DRAFT → PROCESSING → READY | ERROR** — explicit persisted states. Pros: observable and retryable. Cons: requires guarded transitions.
2. **Boolean processed flag** — smaller model. Pros: fewer fields. Cons: cannot distinguish uploading, processing and failure.

**Recommendation and Decision:** **DRAFT → PROCESSING → READY | ERROR**. Completion atomically marks `PROCESSING` and enqueues the job; a worker retry re-enters `PROCESSING`; any processing exception stores a bounded error message and marks `ERROR`.

## Sources

- BullMQ documents Redis-backed queues, workers and retries: https://docs.bullmq.io/
- NestJS queue integration: https://docs.nestjs.com/techniques/queues
- Amazon S3 presigned uploads and multipart constraints: https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html
- Amazon S3 `GetObject` Range behavior: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObject.html
- FFprobe reference: https://ffmpeg.org/ffprobe.html
