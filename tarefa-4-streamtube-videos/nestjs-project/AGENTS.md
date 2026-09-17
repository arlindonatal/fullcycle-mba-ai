# NestJS Backend — Codex Instructions

## Commands

Run all Node/npm commands inside the `nestjs-api` container. Start infrastructure with `docker compose up -d`, verify `db` with `docker compose exec db pg_isready -U streamtube`, and use `docker compose exec nestjs-api` for npm, npx, migrations, lint and tests.

Integration and E2E tests share services and run serially. Test suffixes are contractual: `*.spec.ts` unit, `*.integration-spec.ts` integration, `*.e2e-spec.ts` end-to-end.

## Architecture

- Controllers own HTTP concerns; services own domain workflows; entities and repositories own persistence.
- Use `DomainException` and existing filters for domain errors.
- Keep TypeScript strict and use DTO validation.
- Register new TypeORM entities in the module and migration; never rely on `synchronize`.

## Videos phase

- Object storage is MinIO through the AWS S3 client. Video bytes go directly from clients to MinIO with multipart presigned URLs.
- Use `S3_ENDPOINT` for container-to-container access and `S3_PUBLIC_ENDPOINT` only for URLs returned to clients.
- Tests use the isolated `streamtube_test` PostgreSQL database and isolated Redis databases; integration/E2E suites run serially.
- BullMQ uses the `redis` Compose host. Only the `video-worker` process consumes jobs.
- FFprobe/FFmpeg run only in the worker. Temporary files must be removed in a `finally` block.
- Streaming accepts one valid `Range` header and returns `206` plus S3 object bytes; download returns `Content-Disposition: attachment`.
