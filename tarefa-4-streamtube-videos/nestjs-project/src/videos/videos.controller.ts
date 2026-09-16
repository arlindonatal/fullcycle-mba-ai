import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import type { Readable } from 'node:stream';
import type { JwtPayload } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CompleteVideoUploadDto } from './dto/complete-video-upload.dto';
import { PresignUploadPartsDto } from './dto/presign-upload-parts.dto';
import { StartVideoUploadDto } from './dto/start-video-upload.dto';
import { VideosService } from './videos.service';

@ApiTags('videos')
@Controller('videos')
export class VideosController {
  constructor(private readonly videos: VideosService) {}
  @Post('uploads')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create draft and direct multipart upload' })
  startUpload(
    @CurrentUser() user: JwtPayload,
    @Body() dto: StartVideoUploadDto,
  ) {
    return this.videos.startUpload(user.sub, dto);
  }
  @Post(':id/upload-parts')
  @ApiBearerAuth('access-token')
  presignParts(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: PresignUploadPartsDto,
  ) {
    return this.videos.presignParts(user.sub, id, dto.part_numbers);
  }
  @Post(':id/uploads/complete')
  @ApiBearerAuth('access-token')
  completeUpload(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CompleteVideoUploadDto,
  ) {
    return this.videos.completeUpload(user.sub, id, dto);
  }
  @Delete(':id/uploads')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  abortUpload(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.videos.abortUpload(user.sub, id);
  }
  @Public()
  @Get(':slug')
  async getVideo(@Param('slug') slug: string) {
    const v = await this.videos.getPublicVideo(slug);
    return {
      id: v.id,
      slug: v.slug,
      title: v.title,
      status: v.status,
      duration_seconds: v.duration_seconds,
      metadata: v.metadata,
      stream_url: `/videos/${v.slug}/stream`,
      download_url: `/videos/${v.slug}/download`,
      thumbnail_url: v.thumbnail_key ? `/videos/${v.slug}/thumbnail` : null,
    };
  }
  @Public()
  @Get(':slug/thumbnail')
  async thumbnail(@Param('slug') slug: string, @Res() response: Response) {
    response.redirect(await this.videos.getThumbnailUrl(slug));
  }
  @Public()
  @Get(':slug/stream')
  async stream(
    @Param('slug') slug: string,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    return this.sendObject(slug, request, response, false);
  }
  @Public()
  @Get(':slug/download')
  async download(
    @Param('slug') slug: string,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    return this.sendObject(slug, request, response, true);
  }
  private async sendObject(
    slug: string,
    request: Request,
    response: Response,
    download: boolean,
  ): Promise<void> {
    const range =
      typeof request.headers.range === 'string'
        ? request.headers.range
        : undefined;
    const { video, total, object } = await this.videos.openDelivery(
      slug,
      range,
    );
    response
      .status(range ? HttpStatus.PARTIAL_CONTENT : HttpStatus.OK)
      .setHeader('Accept-Ranges', 'bytes')
      .setHeader('Content-Type', video.content_type)
      .setHeader('Content-Length', String(object.ContentLength ?? total));
    if (object.ContentRange)
      response.setHeader('Content-Range', object.ContentRange);
    if (download)
      response.setHeader(
        'Content-Disposition',
        `attachment; filename="${video.slug}"`,
      );
    (object.Body as Readable).pipe(response);
  }
}
