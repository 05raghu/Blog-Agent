-- Drop foreign key constraints that reference uuid columns
ALTER TABLE content_verticals DROP CONSTRAINT IF EXISTS "content_verticals_workspace_id_fkey";
ALTER TABLE content_verticals DROP CONSTRAINT IF EXISTS "content_verticals_strategy_version_id_fkey";

-- Convert strategy_versions table columns to text
ALTER TABLE strategy_versions 
  ALTER COLUMN id DROP DEFAULT,
  ALTER COLUMN id TYPE text USING id::text,
  ALTER COLUMN workspace_id TYPE text USING workspace_id::text;

-- Convert sme_profiles table columns to text
ALTER TABLE sme_profiles
  ALTER COLUMN id DROP DEFAULT,
  ALTER COLUMN id TYPE text USING id::text,
  ALTER COLUMN workspace_id TYPE text USING workspace_id::text;

-- Convert articles table id to text
ALTER TABLE articles
  ALTER COLUMN id DROP DEFAULT,
  ALTER COLUMN id TYPE text USING id::text;

-- Recreate foreign keys with updated column types
ALTER TABLE content_verticals 
  ADD CONSTRAINT "content_verticals_workspace_id_fkey" 
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE content_verticals 
  ADD CONSTRAINT "content_verticals_strategy_version_id_fkey" 
  FOREIGN KEY (strategy_version_id) REFERENCES strategy_versions(id) ON DELETE CASCADE;
