ALTER TABLE "topic_candidates" ADD COLUMN IF NOT EXISTS "source_content" text;
ALTER TABLE "topic_candidates" ADD COLUMN IF NOT EXISTS "source_filename" text;
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "source_content" text;
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "source_filename" text;
