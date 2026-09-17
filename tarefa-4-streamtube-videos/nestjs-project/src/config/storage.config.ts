import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  endpoint: process.env.S3_ENDPOINT ?? 'http://minio:9000',
  publicEndpoint: process.env.S3_PUBLIC_ENDPOINT ?? 'http://localhost:9002',
  region: process.env.S3_REGION ?? 'us-east-1',
  accessKeyId: process.env.S3_ACCESS_KEY ?? 'minioadmin',
  secretAccessKey: process.env.S3_SECRET_KEY ?? 'minioadmin',
  bucket: process.env.S3_BUCKET ?? 'streamtube',
  multipartPartSize: Number(process.env.VIDEO_UPLOAD_PART_SIZE ?? 10485760),
  maxBytes: Number(process.env.VIDEO_MAX_BYTES ?? 10737418240),
}));
