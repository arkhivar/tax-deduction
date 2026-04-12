/*
  # Add admin notes to organizations

  1. Modified Tables
    - `organizations`
      - `admin_notes` (text, default empty string) - Short notes field for super admin

  2. Notes
    - Non-destructive addition of a new column
    - Default empty string so existing rows are unaffected
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE organizations ADD COLUMN admin_notes text DEFAULT '' NOT NULL;
  END IF;
END $$;
