import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { VideoTooLargeException } from '../common/exceptions/domain.exception';
import { StorageService } from './storage.service';
import { VideoQueueService } from './video-queue.service';
import { VideosService } from './videos.service';

describe('VideosService', () => {
  const createMultipartUpload = jest.fn();
  const storage = { createMultipartUpload } as unknown as StorageService;
  const queue = {} as VideoQueueService;
  const config = {
    getOrThrow: jest.fn((key: string) => (key === 'storage.maxBytes' ? 10 : 5)),
  } as unknown as ConfigService;
  const dataSource = {} as DataSource;
  const service = new VideosService(dataSource, storage, queue, config);

  it('rejects a declared upload larger than 10 GiB before touching storage', async () => {
    await expect(
      service.startUpload('user', {
        title: 'large',
        content_type: 'video/mp4',
        size_bytes: 11,
      }),
    ).rejects.toBeInstanceOf(VideoTooLargeException);
    expect(createMultipartUpload).not.toHaveBeenCalled();
  });
});
