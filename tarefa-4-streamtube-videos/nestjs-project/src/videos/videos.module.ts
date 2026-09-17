import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Video } from './entities/video.entity';
import { StorageService } from './storage.service';
import { VideoProcessingWorker } from './video-processing.worker';
import { VideoQueueService } from './video-queue.service';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
@Module({
  imports: [TypeOrmModule.forFeature([Video])],
  controllers: [VideosController],
  providers: [
    VideosService,
    StorageService,
    VideoQueueService,
    VideoProcessingWorker,
  ],
})
export class VideosModule {}
