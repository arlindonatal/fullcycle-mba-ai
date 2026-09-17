import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerStorage, ThrottlerStorageService } from '@nestjs/throttler';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { DomainExceptionFilter } from '../src/common/filters/domain-exception.filter';
import { ValidationExceptionFilter } from '../src/common/filters/validation-exception.filter';
import { cleanAllTables } from '../src/test/create-test-data-source';
import { VideoProcessingWorker } from '../src/videos/video-processing.worker';

const execFileAsync = promisify(execFile);

describe('Videos (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let throttlerStorage: ThrottlerStorageService;
  let fixtureDirectory: string;
  let videoBytes: Buffer;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(
      new DomainExceptionFilter(),
      new ValidationExceptionFilter(),
    );
    await app.init();
    moduleFixture.get(VideoProcessingWorker).start();
    dataSource = moduleFixture.get(DataSource);
    throttlerStorage =
      moduleFixture.get<ThrottlerStorageService>(ThrottlerStorage);

    fixtureDirectory = await mkdtemp(join(tmpdir(), 'streamtube-e2e-'));
    const fixture = join(fixtureDirectory, 'fixture.mp4');
    await execFileAsync('ffmpeg', [
      '-y',
      '-f',
      'lavfi',
      '-i',
      'color=c=blue:s=160x120:d=2',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      fixture,
    ]);
    videoBytes = await readFile(fixture);
  });

  afterAll(async () => {
    await app.close();
    await rm(fixtureDirectory, { recursive: true, force: true });
  });

  beforeEach(async () => {
    await cleanAllTables(dataSource);
    throttlerStorage.storage.clear();
  });

  it('uploads, processes, streams and downloads a video through real infrastructure', async () => {
    const accessToken = await registerConfirmAndLogin('video@example.com');

    const started = await request(app.getHttpServer())
      .post('/videos/uploads')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Integration video',
        content_type: 'video/mp4',
        size_bytes: videoBytes.length,
      })
      .expect(201);
    expect(started.body.video.status).toBe('DRAFT');
    expect(started.body.video.slug).toMatch(/^[a-f0-9]{32}$/);

    const parts = await request(app.getHttpServer())
      .post(`/videos/${started.body.video.id}/upload-parts`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ part_numbers: [1] })
      .expect(201);
    const uploadUrl = (parts.body as Array<{ url: string }>)[0]?.url;
    if (!uploadUrl) throw new Error('API did not return a signed part URL');
    const upload = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'video/mp4' },
      body: new Uint8Array(videoBytes),
    });
    expect(upload.status).toBe(200);
    const etag = upload.headers.get('etag');
    expect(etag).toBeTruthy();

    await request(app.getHttpServer())
      .post(`/videos/${started.body.video.id}/uploads/complete`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        upload_id: started.body.upload_id,
        parts: [{ part_number: 1, etag }],
      })
      .expect(201)
      .expect(({ body }) => expect(body.status).toBe('PROCESSING'));

    const slug = started.body.video.slug as string;
    const ready = await waitForReady(slug);
    expect(ready.duration_seconds).toBeGreaterThan(0);
    expect(ready.thumbnail_url).toBe(`/videos/${slug}/thumbnail`);
    expect(ready.stream_url).toBe(`/videos/${slug}/stream`);
    expect(ready.download_url).toBe(`/videos/${slug}/download`);

    await request(app.getHttpServer())
      .get(`/videos/${slug}/thumbnail`)
      .expect(302)
      .expect('Location', /^http:\/\/minio:9000\/streamtube\//);

    await request(app.getHttpServer())
      .get(`/videos/${slug}/stream`)
      .set('Range', 'bytes=0-99')
      .expect(206)
      .expect('Accept-Ranges', 'bytes')
      .expect('Content-Range', new RegExp(`^bytes 0-99/${videoBytes.length}$`))
      .expect(({ body }) => expect(Buffer.from(body)).toHaveLength(100));

    await request(app.getHttpServer())
      .get(`/videos/${slug}/download`)
      .expect(200)
      .expect('Content-Disposition', `attachment; filename="${slug}"`)
      .expect(({ body }) => expect(Buffer.from(body)).toEqual(videoBytes));
  }, 30_000);

  async function registerConfirmAndLogin(email: string): Promise<string> {
    const authService = app.get(AuthService);
    const mailService = (authService as unknown as { mailService: object })
      .mailService;
    let confirmationToken = '';
    jest
      .spyOn(
        mailService as {
          sendConfirmationEmail: (...args: string[]) => Promise<void>;
        },
        'sendConfirmationEmail',
      )
      .mockImplementationOnce(async (_email, _name, token) => {
        confirmationToken = token;
      });
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'password123' })
      .expect(201);
    await request(app.getHttpServer())
      .get('/auth/confirm-email')
      .query({ token: confirmationToken })
      .expect(204);
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'password123' })
      .expect(200);
    return login.body.access_token as string;
  }

  async function waitForReady(slug: string): Promise<Record<string, unknown>> {
    const deadline = Date.now() + 20_000;
    while (Date.now() < deadline) {
      const response = await request(app.getHttpServer()).get(
        `/videos/${slug}`,
      );
      if (response.body.status === 'READY') return response.body;
      if (response.body.status === 'ERROR') {
        throw new Error(
          `Video processing failed: ${JSON.stringify(response.body)}`,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw new Error('Video did not become READY before the timeout');
  }
});
