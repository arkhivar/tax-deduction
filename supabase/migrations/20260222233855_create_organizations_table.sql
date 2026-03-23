/*
  # Create organizations table

  1. New Tables
    - `organizations`
      - `id` (uuid, primary key)
      - `inn` (text, unique, 10 digits) - the org's tax ID, used as URL slug
      - `kpp` (text, 9 digits) - org registration reason code
      - `name` (text) - full legal name of the organization
      - `contact_email` (text, nullable) - contact email
      - `contact_phone` (text, nullable) - contact phone
      - `pin_code` (text) - 6-digit PIN for org portal access
      - `signer_full_name` (text, default empty) - default signer name
      - `signer_position` (text, default empty) - default signer position
      - `qr_code_url` (text, nullable) - URL to QR code image in storage
      - `stamp_url` (text, nullable) - URL to stamp image in storage
      - `facsimile_url` (text, nullable) - URL to signature facsimile in storage
      - `created_at` (timestamptz) - creation timestamp
      - `updated_at` (timestamptz) - last update timestamp

  2. Security
    - Enable RLS on `organizations` table
    - anon can INSERT (registration)
    - anon can SELECT by inn (for login and public form lookup)
    - anon can UPDATE by inn (for settings changes with PIN verification done client-side)

  3. Notes
    - PIN-based auth is lightweight: INN + PIN checked client-side
    - The inn column is unique and serves as the URL slug for payer forms
*/

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inn text UNIQUE NOT NULL,
  kpp text NOT NULL DEFAULT '',
  name text NOT NULL DEFAULT '',
  contact_email text,
  contact_phone text,
  pin_code text NOT NULL DEFAULT '',
  signer_full_name text NOT NULL DEFAULT '',
  signer_position text NOT NULL DEFAULT '',
  qr_code_url text,
  stamp_url text,
  facsimile_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can register an organization"
  ON organizations
  FOR INSERT
  TO anon
  WITH CHECK (
    length(inn) = 10
    AND length(pin_code) = 6
  );

CREATE POLICY "Anyone can look up organization by INN"
  ON organizations
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can update organization settings"
  ON organizations
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
