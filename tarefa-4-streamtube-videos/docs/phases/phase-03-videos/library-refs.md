# Phase 03 — Library References

| Library / tool | Fixed use | Reference |
|---|---|---|
| `bullmq` | Redis queue producer and dedicated worker; retries/backoff | https://docs.bullmq.io/ |
| `@aws-sdk/client-s3` | MinIO-compatible S3 multipart/object API | https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/ |
| `@aws-sdk/s3-request-presigner` | Signed multipart-part and thumbnail URLs | https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-s3-request-presigner/ |
| FFmpeg / FFprobe | Metadata inspection and JPEG extraction in worker | https://ffmpeg.org/ffprobe.html |

The implementations use the versions resolved in `nestjs-project/package-lock.json`; no API is assumed from a different major version.
