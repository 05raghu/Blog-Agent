ALTER TABLE "sme_profiles" DROP CONSTRAINT "sme_profiles_workspace_id_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "sources" DROP CONSTRAINT "sources_workspace_id_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "strategy_versions" DROP CONSTRAINT "strategy_versions_workspace_id_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "articles" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "articles" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "sme_profiles" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "sme_profiles" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "sme_profiles" ALTER COLUMN "workspace_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "sources" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "sources" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "sources" ALTER COLUMN "workspace_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "strategy_versions" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "strategy_versions" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "strategy_versions" ALTER COLUMN "workspace_id" SET DATA TYPE text;