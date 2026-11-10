ALTER TABLE "topic_candidates" ADD COLUMN IF NOT EXISTS "source" varchar(16) NOT NULL DEFAULT 'manual';
