import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { Worker } from 'bullmq';
import { DataSource } from 'typeorm';
import {
  VIDEO_PROCESSING_JOB,
  VIDEO_PROCESSING_QUEUE,
} from './video.constants';
import { Video, VideoStatus } from './entities/video.entity';
import { StorageService } from './storage.service';

const execFileAsync = promisify(execFile);

@Injectable()
export class VideoProcessingWorker
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private worker: Worker<{ videoId: string }> | undefined;
  private readonly logger = new Logger(VideoProcessingWorker.name);
  private shuttingDown = false;

  constructor(
    private readonly dataSource: DataSource,
    private readonly storage: StorageService,
    private readonly config: ConfigService,
  ) {}

  onApplicationBootstrap(): void {
    if (this.config.get<string>('VIDEO_WORKER_ENABLED') !== 'true') return;
    this.start();
  }

  start(): void {
    if (this.worker) return;
    this.worker = new Worker(
      VIDEO_PROCESSING_QUEUE,
      async (job) => {
        if (job.name === VIDEO_PROCESSING_JOB)
          await this.process(job.data.videoId);
      },
      {
        connection: {
          host: this.config.get<string>('REDIS_HOST') ?? 'redis',
          port: this.config.get<number>('REDIS_PORT') ?? 6379,
          db: this.config.get<number>('REDIS_DB') ?? 0,
        },
        concurrency: 1,
      },
    );
    this.worker.on('error', (error) => {
      if (!this.shuttingDown)
        this.logger.error('Video processing worker error', error.stack);
    });
  }

  async onApplicationShutdown(): Promise<void> {
    this.shuttingDown = true;
    await this.worker?.close();
  }

  private async process(videoId: string): Promise<void> {
    const repository = this.dataSource.getRepository(Video);
    const video = await repository.findOneBy({ id: videoId });
    if (!video || video.status === VideoStatus.READY) return;
    video.status = VideoStatus.PROCESSING;
    video.error_message = null;
    await repository.save(video);
    const directory = await mkdtemp(join(tmpdir(), 'streamtube-video-'));
    const source = join(directory, 'source');
    const thumbnail = join(directory, 'thumbnail.jpg');
    try {
      await this.storage.downloadToFile(video.storage_key, source);
      const { stdout } = await execFileAsync('ffprobe', [
        '-v',
        'error',
        '-print_format',
        'json',
        '-show_format',
        '-show_streams',
        source,
      ]);
      const metadata = JSON.parse(stdout) as { format?: { duration?: string } };
      await execFileAsync('ffmpeg', [
        '-y',
        '-ss',
        '00:00:01',
        '-i',
        source,
        '-frames:v',
        '1',
        '-q:v',
        '2',
        thumbnail,
      ]);
      const thumbnailKey = `videos/${video.channel_id}/${video.slug}/thumbnail.jpg`;
      await this.storage.uploadFile(thumbnailKey, thumbnail, 'image/jpeg');
      video.status = VideoStatus.READY;
      video.thumbnail_key = thumbnailKey;
      video.duration_seconds = Number(metadata.format?.duration ?? 0) || null;
      video.metadata = metadata as Record<string, unknown>;
      await repository.save(video);
    } catch (error) {
      video.status = VideoStatus.ERROR;
      video.error_message =
        error instanceof Error
          ? error.message.slice(0, 1000)
          : 'Video processing failed';
      await repository.save(video);
      throw error;
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }
}
