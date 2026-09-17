# Phase 03 — Library References

| Library / tool | Installed version | Fixed use | Context7 / official reference |
|---|---:|---|---|
| `bullmq` | 5.81.5 | Redis queue producer and dedicated worker; retries/backoff | [Context7](https://context7.com/taskforcesh/bullmq) / [official](https://docs.bullmq.io/) |
| `@aws-sdk/client-s3` | 3.1134.0 | MinIO-compatible multipart/object API | [Context7](https://context7.com/websites/aws_amazon_sdk-for-javascript_v3_developer-guide) / [official](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/) |
| `@aws-sdk/s3-request-presigner` | 3.1134.0 | Signed upload-part and thumbnail URLs | [Context7](https://context7.com/websites/aws_amazon_sdk-for-javascript_v3_developer-guide) / [official](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-s3-request-presigner/) |
| `@nestjs/typeorm` | 11.0.1 | Registers the Video entity in Nest | [Context7](https://context7.com/nestjs/typeorm) / [official](https://docs.nestjs.com/techniques/database) |
| `typeorm` | 0.3.28 | Entity, migration and PostgreSQL persistence | [Context7](https://context7.com/typeorm/typeorm) / [official](https://typeorm.io/migrations) |
| MinIO | RELEASE.2025-09-07T16-13-09Z | Local S3-compatible storage and CORS | [Context7](https://context7.com/minio/docs) / [official](https://min.io/docs/minio/linux/index.html) |
| FFmpeg / FFprobe | 5.1.9 | Metadata inspection and JPEG extraction in worker | [official](https://ffmpeg.org/ffprobe.html) |

Versions were read from the running containers and `package-lock.json` on 2026-09-17. Context7 catalog references and the official documentation were consulted for the implemented APIs. The project-scoped Context7 MCP endpoint is declared in `.codex/config.toml.example`.
