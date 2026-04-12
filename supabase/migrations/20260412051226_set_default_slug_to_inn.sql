/*
  # Set default slug to INN for all organizations

  1. Modified Tables
    - `organizations`
      - Backfill: sets `slug` = `inn` for all rows where slug is currently NULL
      - Make `slug` NOT NULL with default '' (will be set to INN on insert via app logic)

  2. Notes
    - Every organization now has a slug (either a custom premium slug or their INN)
    - This enables all orgs to share a public link like /their-slug
    - Non-destructive: existing custom slugs are preserved
*/

UPDATE organizations SET slug = inn WHERE slug IS NULL;

ALTER TABLE organizations ALTER COLUMN slug SET NOT NULL;
ALTER TABLE organizations ALTER COLUMN slug SET DEFAULT '';
