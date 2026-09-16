import { MigrationInterface, QueryRunner } from 'typeorm';
export class CreateVideos1780000000000 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.query(
      `CREATE TYPE "videos_status_enum" AS ENUM ('DRAFT','PROCESSING','READY','ERROR')`,
    );
    await q.query(
      `CREATE TABLE "videos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "channel_id" uuid NOT NULL, "slug" varchar(32) NOT NULL, "title" varchar(255) NOT NULL, "status" "videos_status_enum" NOT NULL DEFAULT 'DRAFT', "storage_key" varchar(512) NOT NULL, "thumbnail_key" varchar(512), "content_type" varchar(255) NOT NULL, "size_bytes" bigint NOT NULL, "upload_id" varchar(255), "duration_seconds" double precision, "metadata" jsonb, "error_message" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_videos_id" PRIMARY KEY ("id"), CONSTRAINT "UQ_videos_slug" UNIQUE ("slug"), CONSTRAINT "FK_videos_channel" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE)`,
    );
  }
  public async down(q: QueryRunner): Promise<void> {
    await q.query('DROP TABLE "videos"');
    await q.query('DROP TYPE "videos_status_enum"');
  }
}
