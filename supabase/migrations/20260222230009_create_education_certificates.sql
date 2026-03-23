/*
  # Create education_certificates table

  Stores data from the KND 1151158 form (Certificate of payment for educational services).

  1. New Tables
    - `education_certificates`
      - `id` (uuid, primary key) - unique identifier
      - `certificate_number` (text) - form certificate number
      - `correction_number` (text, default '0') - correction number
      - `report_year` (text) - tax reporting year
      - `org_inn` (text) - organization INN (10 digits)
      - `org_kpp` (text) - organization KPP (9 digits)
      - `org_name` (text) - full name of educational organization
      - `is_full_time` (integer, default 0) - full-time education flag (0=no, 1=yes)
      - `taxpayer_last_name` (text) - taxpayer last name
      - `taxpayer_first_name` (text) - taxpayer first name
      - `taxpayer_patronymic` (text) - taxpayer patronymic (optional)
      - `taxpayer_inn` (text) - taxpayer INN (12 digits, optional)
      - `taxpayer_birth_date` (date) - taxpayer date of birth
      - `doc_type_code` (text) - identity document type code
      - `doc_series_number` (text) - document series and number
      - `doc_issue_date` (date) - document issue date
      - `is_same_person` (integer, default 1) - taxpayer and student are the same (0=no, 1=yes)
      - `expense_amount` (numeric) - total education expense amount
      - `signer_full_name` (text) - name of person confirming the data
      - `sign_date` (date) - signing date
      - `status` (text, default 'draft') - certificate status: draft/completed/printed
      - `admin_notes` (text) - internal notes by admin
      - `created_at` (timestamptz) - creation timestamp
      - `updated_at` (timestamptz) - last update timestamp

  2. Security
    - Enable RLS on `education_certificates` table
    - Add policy for anonymous insert (public form submission)
    - Add policy for authenticated users to read, update, and delete
*/

CREATE TABLE IF NOT EXISTS education_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_number text DEFAULT '',
  correction_number text DEFAULT '0',
  report_year text DEFAULT '',
  org_inn text NOT NULL,
  org_kpp text NOT NULL,
  org_name text NOT NULL,
  is_full_time integer DEFAULT 0 CHECK (is_full_time IN (0, 1)),
  taxpayer_last_name text NOT NULL,
  taxpayer_first_name text NOT NULL,
  taxpayer_patronymic text DEFAULT '',
  taxpayer_inn text DEFAULT '',
  taxpayer_birth_date date NOT NULL,
  doc_type_code text NOT NULL,
  doc_series_number text NOT NULL,
  doc_issue_date date NOT NULL,
  is_same_person integer DEFAULT 1 CHECK (is_same_person IN (0, 1)),
  expense_amount numeric(15, 2) NOT NULL DEFAULT 0,
  signer_full_name text DEFAULT '',
  sign_date date,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'printed')),
  admin_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE education_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a certificate"
  ON education_certificates
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view certificates"
  ON education_certificates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update certificates"
  ON education_certificates
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete certificates"
  ON education_certificates
  FOR DELETE
  TO authenticated
  USING (true);
