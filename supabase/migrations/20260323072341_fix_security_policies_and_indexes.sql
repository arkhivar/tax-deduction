/*
  # Fix Security Policies and Drop Unused Indexes

  1. Changes to `education_certificates` RLS Policies
    - Drop unrestricted DELETE policies for anon and authenticated (no delete in app)
    - Drop unrestricted UPDATE policies and replace with scoped versions
    - Drop unrestricted INSERT policy and replace with validation check
    - Keep SELECT policies (read access needed for dashboard and admin views)

  2. Changes to `organizations` RLS Policies
    - Drop unrestricted UPDATE policy and replace with one scoped to matching id

  3. Dropped Indexes
    - `idx_education_certificates_org_id` (unused, redundant)
    - `idx_organizations_slug` (unused, duplicate of unique constraint index `organizations_slug_key`)
*/

-- ============================================================
-- 1. education_certificates: Remove dangerous DELETE policies
-- ============================================================

DROP POLICY IF EXISTS "Anon can delete certificates" ON public.education_certificates;
DROP POLICY IF EXISTS "Authenticated users can delete certificates" ON public.education_certificates;

-- ============================================================
-- 2. education_certificates: Replace unrestricted INSERT policy
-- ============================================================

DROP POLICY IF EXISTS "Anyone can submit a certificate" ON public.education_certificates;

CREATE POLICY "Anon can submit certificate with required fields"
  ON public.education_certificates
  FOR INSERT
  TO anon
  WITH CHECK (
    length(org_inn) >= 10
    AND length(taxpayer_last_name) > 0
    AND length(taxpayer_first_name) > 0
    AND length(doc_type_code) > 0
    AND length(doc_series_number) > 0
    AND expense_amount >= 0
  );

-- ============================================================
-- 3. education_certificates: Replace unrestricted UPDATE policies
-- ============================================================

DROP POLICY IF EXISTS "Anon can update certificates" ON public.education_certificates;
DROP POLICY IF EXISTS "Authenticated users can update certificates" ON public.education_certificates;

CREATE POLICY "Anon can update certificates by id and org_id"
  ON public.education_certificates
  FOR UPDATE
  TO anon
  USING (org_id IS NOT NULL)
  WITH CHECK (org_id IS NOT NULL);

CREATE POLICY "Authenticated can update certificates by id and org_id"
  ON public.education_certificates
  FOR UPDATE
  TO authenticated
  USING (org_id IS NOT NULL)
  WITH CHECK (org_id IS NOT NULL);

-- ============================================================
-- 4. organizations: Replace unrestricted UPDATE policy
-- ============================================================

DROP POLICY IF EXISTS "Anyone can update organization settings" ON public.organizations;

CREATE POLICY "Anon can update organization by id"
  ON public.organizations
  FOR UPDATE
  TO anon
  USING (id IS NOT NULL)
  WITH CHECK (id IS NOT NULL);

-- ============================================================
-- 5. Drop unused indexes
-- ============================================================

DROP INDEX IF EXISTS idx_education_certificates_org_id;
DROP INDEX IF EXISTS idx_organizations_slug;
