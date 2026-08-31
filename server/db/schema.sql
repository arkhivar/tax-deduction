-- ============================================================
-- KND 1151158 -- Consolidated Database Schema
-- Merged from 10 Supabase migrations, adapted for plain PostgreSQL
-- ============================================================

-- Enable crypto (for gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- Table: organizations
-- ============================================================
CREATE TABLE IF NOT EXISTS organizations (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  inn             text        UNIQUE NOT NULL,          -- 10 digits, tax ID
  kpp             text        NOT NULL DEFAULT '',      -- 9 digits
  name            text        NOT NULL DEFAULT '',      -- short display name
  full_name       text,                                -- full legal name (nullable)
  slug            text        UNIQUE NOT NULL DEFAULT '',-- URL slug (defaults to INN)
  contact_email   text,
  contact_phone   text,
  pin_code        text        NOT NULL DEFAULT '',      -- 8-digit PIN (legacy 6-digit still allowed at login)
  signer_full_name text       NOT NULL DEFAULT '',
  signer_position text        NOT NULL DEFAULT '',
  qr_code_url     text,
  stamp_url       text,
  facsimile_url   text,
  facsimile_dx    real        NOT NULL DEFAULT 0,        -- facsimile alignment: shift right, mm
  facsimile_dy    real        NOT NULL DEFAULT 0,        -- facsimile alignment: shift down, mm
  facsimile_rotation real     NOT NULL DEFAULT 0,        -- facsimile alignment: rotation, degrees
  admin_notes     text        NOT NULL DEFAULT '',
  premium_requested_at timestamptz,                      -- set when org clicks the branded-link CTA
  last_login_at   timestamptz,                           -- last successful org login
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

-- Facsimile alignment (for databases created before these columns existed)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS facsimile_dx real NOT NULL DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS facsimile_dy real NOT NULL DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS facsimile_rotation real NOT NULL DEFAULT 0;

-- ============================================================
-- Table: login_events -- auth audit log (org + admin logins)
-- ============================================================
CREATE TABLE IF NOT EXISTS login_events (
  id         bigserial   PRIMARY KEY,
  role       text        NOT NULL DEFAULT 'org',   -- 'org' | 'admin'
  org_id     uuid        REFERENCES organizations(id) ON DELETE SET NULL,
  inn        text,                                 -- attempted INN (org logins)
  success    boolean     NOT NULL,
  ip         text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_events_created ON login_events(created_at DESC);

-- ============================================================
-- Table: education_certificates
-- ============================================================
CREATE TABLE IF NOT EXISTS education_certificates (
  id                      uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                  uuid            REFERENCES organizations(id) ON DELETE SET NULL,
  certificate_number      text            DEFAULT '',
  correction_number       text            DEFAULT '0',
  report_year             text            DEFAULT '',
  org_inn                 text            NOT NULL,
  org_kpp                 text            NOT NULL,
  org_name                text            NOT NULL,
  is_full_time            integer         DEFAULT 0 CHECK (is_full_time IN (0, 1)),
  taxpayer_last_name      text            NOT NULL,
  taxpayer_first_name     text            NOT NULL,
  taxpayer_patronymic     text            DEFAULT '',
  taxpayer_inn            text            DEFAULT '',
  taxpayer_birth_date     date            NOT NULL,
  doc_type_code           text            NOT NULL,
  doc_series_number       text            NOT NULL,
  doc_issue_date          date            NOT NULL,
  is_same_person          integer         DEFAULT 1 CHECK (is_same_person IN (0, 1)),
  expense_amount          numeric(15, 2)  NOT NULL DEFAULT 0,
  -- Student fields (page 2, filled when is_same_person = 0)
  student_last_name       text            NOT NULL DEFAULT '',
  student_first_name      text            NOT NULL DEFAULT '',
  student_patronymic      text            NOT NULL DEFAULT '',
  student_inn             text            NOT NULL DEFAULT '',
  student_birth_date      date,
  student_doc_type_code   text            NOT NULL DEFAULT '',
  student_doc_series_number text          NOT NULL DEFAULT '',
  student_doc_issue_date  date,
  -- Admin/org fields
  signer_full_name        text            DEFAULT '',
  sign_date               date,
  status                  text            DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'printed')),
  admin_notes             text            DEFAULT '',
  created_at              timestamptz     DEFAULT now(),
  updated_at              timestamptz     DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_certificates_org_id ON education_certificates(org_id);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON education_certificates(status);
CREATE INDEX IF NOT EXISTS idx_certificates_created ON education_certificates(created_at DESC);

-- ============================================================
-- Grants
-- ============================================================
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO knd_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO knd_app;
