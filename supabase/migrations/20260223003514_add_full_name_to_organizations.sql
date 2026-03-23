/*
  # Add full_name column to organizations

  1. Modified Tables
    - `organizations`
      - `full_name` (text, nullable) - full legal name of the organization without abbreviations,
        used in certificates. When set, this is prefilled into certificate forms instead of the short name.

  2. Notes
    - The existing `name` column remains as the short/display name
    - `full_name` is optional; when null, the short `name` is used in forms as before
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE organizations ADD COLUMN full_name text;
  END IF;
END $$;
