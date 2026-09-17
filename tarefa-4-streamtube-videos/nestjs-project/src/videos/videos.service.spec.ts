import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { Channel } from '../channels/entities/channel.entity';
import {
  VideoSizeMismatchException,
  VideoTooLargeException,
} from '../common/exceptions/domain.exception';
import { Video, VideoStatus } from './entities/video.entity';
import { StorageService } from './storage.service';
import { VideoQueueService } from './video-queue.service';
import { VideosService } from './videos.service';

describe('VideosService', () => {
  const storage = {
    createMultipartUpload: jest.fn(),
    completeMultipartUpload: jest.fn(),
    headObject: jest.fn(),
    deleteObject: jest.fn(),
  } as unknown as jest.Mocked<StorageService>;
  const queue = {
    enqueue: jest.fn(),
  } as unknown as jest.Mocked<VideoQueueService>;
  const videoRepository = {
    findOneBy: jest.fn(),
    save: jest.fn(),
  };
  const channelRepository = {
    findOneBy: jest.fn(),
  };
  const dataSource = {
    getRepository: jest.fn((entity: unknown) =>
      entity === Video ? videoRepository : channelRepository,
    ),
  } as unknown as DataSource;
  const config = {
    getOrThrow: jest.fn((key: string) => (key === 'storage.maxBytes' ? 10 : 5)),
  } as unknown as ConfigService;
  const service = new VideosService(dataSource, storage, queue, config);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects a declared upload larger than the limit before touching storage', async () => {
    await expect(
      service.startUpload('user', {
        title: 'large',
        content_type: 'video/mp4',
        size_bytes: 11,
      }),
    ).rejects.toBeInstanceOf(VideoTooLargeException);
    expect(storage.createMultipartUpload).not.toHaveBeenCalled();
  });

  it('deletes a completed object whose real size exceeds the hard limit', async () => {
    const video = ownedDraft('8');
    storage.headObject.mockResolvedValue({ ContentLength: 11, $metadata: {} });

    await expect(complete(video)).rejects.toBeInstanceOf(
      VideoTooLargeException,
    );

    expect(storage.deleteObject).toHaveBeenCalledWith(video.storage_key);
    expect(video.status).toBe(VideoStatus.ERROR);
    expect(queue.enqueue).not.toHaveBeenCalled();
  });

  it('rejects a completed object larger than its declared size', async () => {
    const video = ownedDraft('8');
    storage.headObject.mockResolvedValue({ ContentLength: 9, $metadata: {} });

    await expect(complete(video)).rejects.toBeInstanceOf(
      VideoSizeMismatchException,
    );

    expect(storage.deleteObject).toHaveBeenCalledWith(video.storage_key);
    expect(queue.enqueue).not.toHaveBeenCalled();
  });

  it('persists the real size and enqueues a valid completed object', async () => {
    const video = ownedDraft('8');
    storage.headObject.mockResolvedValue({ ContentLength: 7, $metadata: {} });

    await expect(complete(video)).resolves.toMatchObject({
      status: VideoStatus.PROCESSING,
      size_bytes: '7',
    });

    expect(storage.deleteObject).not.toHaveBeenCalled();
    expect(queue.enqueue).toHaveBeenCalledWith(video.id);
  });

  function ownedDraft(size: string): Video {
    const video = {
      id: 'video-id',
      channel_id: 'channel-id',
      storage_key: 'videos/channel/source',
      upload_id: 'upload-id',
      status: VideoStatus.DRAFT,
      size_bytes: size,
      error_message: null,
    } as Video;
    videoRepository.findOneBy.mockResolvedValue(video);
    channelRepository.findOneBy.mockResolvedValue({
      id: 'channel-id',
      user_id: 'user-id',
    } as Channel);
    videoRepository.save.mockImplementation(async (value) => value);
    return video;
  }

  function complete(video: Video): Promise<Video> {
    return service.completeUpload('user-id', video.id, {
      upload_id: 'upload-id',
      parts: [{ part_number: 1, etag: 'etag' }],
    });
  }
});
