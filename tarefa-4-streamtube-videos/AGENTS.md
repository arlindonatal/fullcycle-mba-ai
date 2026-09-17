# StreamTube — Codex Instructions

This file ports the repository's AI workflow from Claude Code to Codex.

## Scope and workflow

- Work only on the requested phase. Keep research, planning, implementation and progress artifacts consistent with the code.
- Use the project skills in `.agents/skills/` in this order for a new phase: `research`, `plan-context`, `plan-validate`, `plan-resolve`, `plan-build`, then `implement`.
- The legacy `.claude/` directory remains as the source-compatible copy for Claude Code. Codex-specific instructions and skills live in `AGENTS.md` and `.agents/skills/`.
- Before adding a library, inspect its installed version and consult its official documentation. Record newly fixed libraries in `library-refs.md`.

## Project rules

- NestJS backend: `nestjs-project/`; frontend is out of scope unless a phase explicitly includes it.
- Services inside Compose communicate through service names, never `localhost`.
- Do not commit directly to `main`. This course workspace groups tasks in folders; keep all Tarefa 4 changes inside this directory.
- A change is complete only when relevant tests, the full suite, `npx tsc --noEmit`, and `npm run lint` pass.

## Phase 03 — Videos

- Videos belong to a channel. They follow `DRAFT -> PROCESSING -> READY | ERROR`.
- Uploads use S3-compatible MinIO multipart presigned URLs: the API never receives the video bytes, supporting objects up to 10 GB.
- Containers use `http://minio:9000`; URLs returned to local clients use the configurable `S3_PUBLIC_ENDPOINT` (`http://localhost:9002` by default).
- Multipart completion validates the stored object's real size before queueing.
- BullMQ/Redis transports processing jobs to a dedicated worker container. FFprobe extracts metadata and FFmpeg makes a thumbnail.
- The API serves byte ranges for streaming and exposes a download endpoint. Public identity uses an immutable, collision-resistant slug.

See `nestjs-project/AGENTS.md` for backend command and testing conventions.
