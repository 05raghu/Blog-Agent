CREATE TABLE IF NOT EXISTS "article_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"article_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"author_id" text NOT NULL,
	"parent_comment_id" text,
	"content" text NOT NULL,
	"comment_type" varchar(32) DEFAULT 'suggestion',
	"section" varchar(64),
	"is_resolved" boolean DEFAULT false,
	"resolved_at" timestamp,
	"resolved_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "brand_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"guidelines" text DEFAULT '',
	"strong_exemplars" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"weak_exemplars" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"principles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"desired_patterns" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"prohibited_patterns" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"terminology" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"tone_boundaries" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"approval_status" varchar(16) DEFAULT 'pending',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "revision_history" (
	"id" text PRIMARY KEY NOT NULL,
	"article_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"revision_number" integer NOT NULL,
	"previous_status" varchar(32),
	"new_status" varchar(32),
	"changed_by" text NOT NULL,
	"change_type" varchar(32) NOT NULL,
	"changed_fields" jsonb DEFAULT '{}'::jsonb,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "brief" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "outline" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "content" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "angle" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "target_audience" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "word_count" integer;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "linked_sources" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "briefing_session_id" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "briefing_insights" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "seo_score" integer;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "seo_analysis" jsonb;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "selected_cta" jsonb;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "generated_ctas" jsonb;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "selected_image" jsonb;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "paused_reason" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "blocked_reason" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "publish_date" timestamp;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "article_comments" ADD CONSTRAINT "article_comments_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "article_comments" ADD CONSTRAINT "article_comments_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "revision_history" ADD CONSTRAINT "revision_history_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "revision_history" ADD CONSTRAINT "revision_history_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
