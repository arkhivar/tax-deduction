/*
  # Add slug column to organizations

  1. Modified Tables
    - `organizations`
      - `slug` (text, unique, nullable) - short URL-friendly identifier for public links
        e.g. "org1", "school42", "university-msk"
        Used to generate shareable links like /org1 instead of /form/1234567890

  2. Security
    - Existing RLS policies remain unchanged
    - Slug is readable by anon (needed for public form lookup)

  3. Notes
    - Slug is optional so existing orgs continue to work
    - Unique constraint prevents duplicate slugs
    - Index added for fast lookups by slug
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'slug'
  ) THEN
    ALTER TABLE organizations ADD COLUMN slug text UNIQUE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
