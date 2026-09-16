import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import {
  VIDEO_PROCESSING_JOB,
  VIDEO_PROCESSING_QUEUE,
} from './video.constants';

@Injectable()
export class VideoQueueService implements OnModuleDestroy {
  private readonly queue: Queue<{ videoId: string }>;

  constructor(config: ConfigService) {
    this.queue = new Queue(VIDEO_PROCESSING_QUEUE, {
      connection: {
        host: config.get<string>('REDIS_HOST') ?? 'redis',
        port: config.get<number>('REDIS_PORT') ?? 6379,
      },
    });
  }

  enqueue(videoId: string): Promise<void> {
    return this.queue
      .add(
        VIDEO_PROCESSING_JOB,
        { videoId },
        {
          jobId: videoId,
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: 100,
          removeOnFail: 100,
        },
      )
      .then(() => undefined);
  }

  onModuleDestroy(): Promise<void> {
    return this.queue.close();
  }
}
