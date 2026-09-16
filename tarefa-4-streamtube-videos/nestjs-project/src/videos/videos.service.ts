import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { Channel } from '../channels/entities/channel.entity';
import {
  VideoNotFoundException,
  VideoNotOwnedException,
  VideoNotReadyException,
  VideoRangeInvalidException,
  VideoTooLargeException,
  VideoUploadInvalidException,
} from '../common/exceptions/domain.exception';
import { CompleteVideoUploadDto } from './dto/complete-video-upload.dto';
import { StartVideoUploadDto } from './dto/start-video-upload.dto';
import { StorageService } from './storage.service';
import { Video, VideoStatus } from './entities/video.entity';
import { VideoQueueService } from './video-queue.service';

@Injectable()
export class VideosService {
  private readonly maxBytes: number;
  private readonly partSize: number;

  constructor(
    private readonly dataSource: DataSource,
    private readonly storage: StorageService,
    private readonly queue: VideoQueueService,
    config: ConfigService,
  ) {
    this.maxBytes = config.getOrThrow<number>('storage.maxBytes');
    this.partSize = config.getOrThrow<number>('storage.multipartPartSize');
  }

  async startUpload(userId: string, dto: StartVideoUploadDto) {
    if (dto.size_bytes > this.maxBytes) throw new VideoTooLargeException();
    const channel = await this.dataSource
      .getRepository(Channel)
      .findOneBy({ user_id: userId });
    if (!channel) throw new VideoNotOwnedException();
    const slug = randomUUID().replaceAll('-', '');
    const storageKey = `videos/${channel.id}/${slug}/source`;
    const multipart = await this.storage.createMultipartUpload(
      storageKey,
      dto.content_type,
    );
    if (!multipart.UploadId)
      throw new Error('Storage did not return an upload ID');
    const video = await this.dataSource.getRepository(Video).save({
      channel_id: channel.id,
      slug,
      title: dto.title,
      status: VideoStatus.DRAFT,
      storage_key: storageKey,
      thumbnail_key: null,
      content_type: dto.content_type,
      size_bytes: String(dto.size_bytes),
      upload_id: multipart.UploadId,
      duration_seconds: null,
      metadata: null,
      error_message: null,
    });
    return {
      video,
      upload_id: multipart.UploadId,
      part_size: this.partSize,
      max_parts: Math.ceil(dto.size_bytes / this.partSize),
    };
  }

  async presignParts(userId: string, id: string, partNumbers: number[]) {
    const video = await this.getOwnedVideo(userId, id);
    if (video.status !== VideoStatus.DRAFT || !video.upload_id)
      throw new VideoUploadInvalidException();
    const maxParts = Math.ceil(Number(video.size_bytes) / this.partSize);
    if (partNumbers.some((part) => part > maxParts))
      throw new VideoUploadInvalidException();
    return Promise.all(
      partNumbers.map(async (part_number) => ({
        part_number,
        url: await this.storage.presignPart(
          video.storage_key,
          video.upload_id!,
          part_number,
        ),
      })),
    );
  }

  async completeUpload(
    userId: string,
    id: string,
    dto: CompleteVideoUploadDto,
  ): Promise<Video> {
    const video = await this.getOwnedVideo(userId, id);
    if (video.status !== VideoStatus.DRAFT || video.upload_id !== dto.upload_id)
      throw new VideoUploadInvalidException();
    await this.storage.completeMultipartUpload(
      video.storage_key,
      dto.upload_id,
      dto.parts,
    );
    video.status = VideoStatus.PROCESSING;
    video.upload_id = null;
    await this.dataSource.getRepository(Video).save(video);
    await this.queue.enqueue(video.id);
    return video;
  }

  async abortUpload(userId: string, id: string): Promise<void> {
    const video = await this.getOwnedVideo(userId, id);
    if (video.status !== VideoStatus.DRAFT || !video.upload_id)
      throw new VideoUploadInvalidException();
    await this.storage.abortMultipartUpload(video.storage_key, video.upload_id);
    await this.dataSource.getRepository(Video).remove(video);
  }

  async getPublicVideo(slug: string): Promise<Video> {
    const video = await this.dataSource
      .getRepository(Video)
      .findOneBy({ slug });
    if (!video) throw new VideoNotFoundException();
    return video;
  }

  async getThumbnailUrl(slug: string): Promise<string> {
    const video = await this.getPublicVideo(slug);
    if (video.status !== VideoStatus.READY || !video.thumbnail_key)
      throw new VideoNotReadyException();
    return this.storage.presignGet(video.thumbnail_key);
  }

  async openDelivery(slug: string, range?: string) {
    const video = await this.getPublicVideo(slug);
    if (video.status !== VideoStatus.READY) throw new VideoNotReadyException();
    const head = await this.storage.headObject(video.storage_key);
    const total = Number(head.ContentLength ?? 0);
    if (range && !/^bytes=\d*-\d*$/.test(range))
      throw new VideoRangeInvalidException();
    return {
      video,
      total,
      range,
      object: await this.storage.getObject(video.storage_key, range),
    };
  }

  private async getOwnedVideo(userId: string, id: string): Promise<Video> {
    const video = await this.dataSource.getRepository(Video).findOneBy({ id });
    if (!video) throw new VideoNotFoundException();
    const channel = await this.dataSource
      .getRepository(Channel)
      .findOneBy({ id: video.channel_id });
    if (!channel || channel.user_id !== userId)
      throw new VideoNotOwnedException();
    return video;
  }
}
