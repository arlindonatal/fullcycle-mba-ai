import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';
import type { Readable } from 'node:stream';
import { StorageService } from './storage.service';
import { VIDEO_PROCESSING_QUEUE } from './video.constants';
import { VideoQueueService } from './video-queue.service';

describe('Video infrastructure (integration)', () => {
  const values: Record<string, unknown> = {
    'storage.bucket': 'streamtube',
    'storage.endpoint': 'http://minio:9000',
    'storage.publicEndpoint': 'http://minio:9000',
    'storage.region': 'us-east-1',
    'storage.accessKeyId': 'minioadmin',
    'storage.secretAccessKey': 'minioadmin',
  };
  const config = {
    getOrThrow: (key: string) => values[key],
    get: (key: string) =>
      key === 'REDIS_HOST'
        ? 'redis'
        : key === 'REDIS_PORT'
          ? 6379
          : key === 'REDIS_DB'
            ? 2
            : undefined,
  } as unknown as ConfigService;
  const storage = new StorageService(config);
  const queue = new VideoQueueService(config);
  const inspectionQueue = new Queue(VIDEO_PROCESSING_QUEUE, {
    connection: { host: 'redis', port: 6379, db: 2 },
  });

  beforeAll(async () => {
    inspectionQueue.on('error', () => undefined);
    await storage.onModuleInit();
  });

  afterAll(async () => {
    await queue.onModuleDestroy();
    await inspectionQueue.close();
  });

  it('completes a real multipart object and reads a byte range from MinIO', async () => {
    const key = `integration/${randomUUID()}`;
    const payload = Buffer.from('streamtube-video-bytes');
    const multipart = await storage.createMultipartUpload(
      key,
      'application/octet-stream',
    );
    expect(multipart.UploadId).toBeDefined();
    const signedUrl = await storage.presignPart(key, multipart.UploadId!, 1);

    const upload = await fetch(signedUrl, { method: 'PUT', body: payload });
    expect(upload.status).toBe(200);
    const etag = upload.headers.get('etag');
    expect(etag).toBeTruthy();

    await storage.completeMultipartUpload(key, multipart.UploadId!, [
      { part_number: 1, etag: etag! },
    ]);
    await expect(storage.headObject(key)).resolves.toMatchObject({
      ContentLength: payload.length,
    });

    const ranged = await storage.getObject(key, 'bytes=2-7');
    const chunks: Buffer[] = [];
    for await (const chunk of ranged.Body as Readable) {
      chunks.push(Buffer.from(chunk as Uint8Array));
    }
    expect(Buffer.concat(chunks).toString()).toBe(
      payload.subarray(2, 8).toString(),
    );

    await storage.deleteObject(key);
  });

  it('persists a processing job in real Redis through BullMQ', async () => {
    const videoId = randomUUID();

    await queue.enqueue(videoId);

    await expect(inspectionQueue.getJob(videoId)).resolves.toMatchObject({
      name: 'process-video',
      data: { videoId },
    });
    await inspectionQueue.remove(videoId);
  });
});
