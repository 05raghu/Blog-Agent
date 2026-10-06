ALTER TABLE "assets" ALTER COLUMN "workspace_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "audit_events" ALTER COLUMN "workspace_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "claims" ALTER COLUMN "workspace_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "content_touches" ALTER COLUMN "workspace_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "content_verticals" ALTER COLUMN "workspace_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "content_verticals" ALTER COLUMN "strategy_version_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "document_chunks" ALTER COLUMN "workspace_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "workspace_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "insights" ALTER COLUMN "workspace_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "integration_connections" ALTER COLUMN "workspace_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "job_runs" ALTER COLUMN "workspace_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "lead_events" ALTER COLUMN "workspace_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "memberships" ALTER COLUMN "workspace_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "url_aliases" ALTER COLUMN "workspace_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "workspaces" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "workspaces" ALTER COLUMN "id" DROP DEFAULT;