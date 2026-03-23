/*
  # Add org_id to education_certificates

  1. Modified Tables
    - `education_certificates`
      - Added `org_id` (uuid, nullable) - foreign key to organizations.id
      - Nullable so existing rows and forms without a specific org still work

  2. Security
    - Added anon SELECT policy so org portal (PIN-based, no Supabase auth) can read certificates
    - Added anon UPDATE policy so org portal can edit certificates
    - Added anon DELETE policy so org portal can delete certificates

  3. Notes
    - Authorization is handled at the application level via PIN verification
    - The org_id column links certificates to the organization that created them
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'education_certificates' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE education_certificates ADD COLUMN org_id uuid REFERENCES organizations(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_education_certificates_org_id
  ON education_certificates(org_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'education_certificates' AND policyname = 'Anon can view certificates'
  ) THEN
    CREATE POLICY "Anon can view certificates"
      ON education_certificates
      FOR SELECT
      TO anon
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'education_certificates' AND policyname = 'Anon can update certificates'
  ) THEN
    CREATE POLICY "Anon can update certificates"
      ON education_certificates
      FOR UPDATE
      TO anon
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'education_certificates' AND policyname = 'Anon can delete certificates'
  ) THEN
    CREATE POLICY "Anon can delete certificates"
      ON education_certificates
      FOR DELETE
      TO anon
      USING (true);
  END IF;
END $$;
