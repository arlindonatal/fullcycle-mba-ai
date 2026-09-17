import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  const values: Record<string, unknown> = {
    'storage.bucket': 'streamtube-test',
    'storage.endpoint': 'http://minio:9000',
    'storage.publicEndpoint': 'http://localhost:9002',
    'storage.region': 'us-east-1',
    'storage.accessKeyId': 'minioadmin',
    'storage.secretAccessKey': 'minioadmin',
  };
  const config = {
    getOrThrow: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;

  it('uses the host-reachable endpoint in presigned upload URLs', async () => {
    const storage = new StorageService(config);

    const url = await storage.presignPart('videos/source', 'upload-id', 1);

    expect(new URL(url).origin).toBe('http://localhost:9002');
  });

  it('uses the host-reachable endpoint in presigned thumbnail URLs', async () => {
    const storage = new StorageService(config);

    const url = await storage.presignGet('videos/thumbnail.jpg');

    expect(new URL(url).origin).toBe('http://localhost:9002');
  });
});
