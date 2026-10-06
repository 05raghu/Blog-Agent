-- Drop dependent tables first
DROP TABLE IF EXISTS content_verticals CASCADE;
DROP TABLE IF EXISTS article_documents CASCADE;
DROP TABLE IF EXISTS url_aliases CASCADE;

-- Drop the main tables with UUID columns
DROP TABLE IF EXISTS strategy_versions CASCADE;
DROP TABLE IF EXISTS sme_profiles CASCADE;
DROP TABLE IF EXISTS articles CASCADE;

-- Recreate strategy_versions with TEXT columns
CREATE TABLE "strategy_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"version" integer NOT NULL,
	"offerings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"icps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"geographies" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"competitors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"editorial_verticals" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"content_mix" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"quality_thresholds" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source_policy" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"approval_policy" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sme_policies" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Recreate sme_profiles with TEXT columns
CREATE TABLE "sme_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"user_id" text NOT NULL,
	"expertise" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"biography" text,
	"preferred_topics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"capacity_hours_per_month" integer DEFAULT 3,
	"attribution_rules" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"past_contributions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Recreate articles with TEXT id
CREATE TABLE "articles" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"content_id" text NOT NULL,
	"topic_id" text NOT NULL,
	"strategy_id" text NOT NULL,
	"topic_title" text,
	"content_class" character varying(32) DEFAULT 'expert_pov',
	"assigned_sme" text,
	"owner" text NOT NULL,
	"status" character varying(32) DEFAULT 'not_started',
	"planned_publish_date" timestamp,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
