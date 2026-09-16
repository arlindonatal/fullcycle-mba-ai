---
kind: phase-context
name: phase-03-videos
state: complete
---

# Phase 03 — Videos: Context

## Scope

Backend-only delivery: S3-compatible object storage, direct multipart upload up to 10 GiB, draft creation, asynchronous video processing, thumbnail and metadata extraction, unique URLs, streaming and download.

## Inherited constraints

- NestJS 11, TypeORM 0.3 and PostgreSQL 17; global JWT guard, validation and domain-error envelope already exist.
- A channel has one owning user; videos belong to a channel.
- All services run through `nestjs-project/compose.yaml`; container-to-container hosts are Compose service names.
- Migrations are versioned; tests are unit, integration and Supertest E2E.

## Decisions index

| Decision | Chosen path | Affected artifacts |
|---|---|---|
| Queue | BullMQ + Redis | queue producer, worker, Compose |
| Upload | direct S3 multipart presigned URLs | upload endpoints, storage service |
| Processing | FFprobe + FFmpeg worker | worker image, processor |
| Delivery | random slug, range proxy | video entity and public endpoints |
| State | DRAFT → PROCESSING → READY/ERROR | entity, worker, errors |

## Out of scope

Video title editing, publication/visibility, custom thumbnails, frontend upload/player UI, transcoding to multiple qualities, CDN and social interactions are later phases.
