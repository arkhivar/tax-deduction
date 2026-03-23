/*
  # Add student (learner) fields for certificate page 2

  Page 2 of the education certificate form captures the data of the person
  who actually received the educational services. These fields are filled
  when the taxpayer and the student are NOT the same person (is_same_person = 0).

  1. New Columns on `education_certificates`
    - `student_last_name` (text) - student's last name
    - `student_first_name` (text) - student's first name
    - `student_patronymic` (text) - student's patronymic (optional)
    - `student_inn` (text) - student's INN (optional)
    - `student_birth_date` (date) - student's date of birth
    - `student_doc_type_code` (text) - identity document type code
    - `student_doc_series_number` (text) - identity document series and number
    - `student_doc_issue_date` (date) - identity document issue date

  2. Notes
    - All fields default to empty strings or null since page 2 is only filled
      when taxpayer and student differ
    - No destructive changes to existing data
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'education_certificates' AND column_name = 'student_last_name'
  ) THEN
    ALTER TABLE public.education_certificates ADD COLUMN student_last_name text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'education_certificates' AND column_name = 'student_first_name'
  ) THEN
    ALTER TABLE public.education_certificates ADD COLUMN student_first_name text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'education_certificates' AND column_name = 'student_patronymic'
  ) THEN
    ALTER TABLE public.education_certificates ADD COLUMN student_patronymic text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'education_certificates' AND column_name = 'student_inn'
  ) THEN
    ALTER TABLE public.education_certificates ADD COLUMN student_inn text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'education_certificates' AND column_name = 'student_birth_date'
  ) THEN
    ALTER TABLE public.education_certificates ADD COLUMN student_birth_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'education_certificates' AND column_name = 'student_doc_type_code'
  ) THEN
    ALTER TABLE public.education_certificates ADD COLUMN student_doc_type_code text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'education_certificates' AND column_name = 'student_doc_series_number'
  ) THEN
    ALTER TABLE public.education_certificates ADD COLUMN student_doc_series_number text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'education_certificates' AND column_name = 'student_doc_issue_date'
  ) THEN
    ALTER TABLE public.education_certificates ADD COLUMN student_doc_issue_date date;
  END IF;
END $$;
