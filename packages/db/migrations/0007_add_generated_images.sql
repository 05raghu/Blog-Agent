-- Add generated_images column to articles table
ALTER TABLE articles ADD COLUMN IF NOT EXISTS generated_images jsonb DEFAULT '[]'::jsonb;
