export interface Certificate {
  id: string;
  org_id: string | null;
  certificate_number: string;
  correction_number: string;
  report_year: string;
  org_inn: string;
  org_kpp: string;
  org_name: string;
  is_full_time: number;
  taxpayer_last_name: string;
  taxpayer_first_name: string;
  taxpayer_patronymic: string;
  taxpayer_inn: string;
  taxpayer_birth_date: string;
  doc_type_code: string;
  doc_series_number: string;
  doc_issue_date: string;
  is_same_person: number;
  expense_amount: number;
  student_last_name: string;
  student_first_name: string;
  student_patronymic: string;
  student_inn: string;
  student_birth_date: string | null;
  student_doc_type_code: string;
  student_doc_series_number: string;
  student_doc_issue_date: string | null;
  signer_full_name: string;
  sign_date: string | null;
  status: 'draft' | 'completed' | 'printed';
  admin_notes: string;
  created_at: string;
  updated_at: string;
}

export interface CertificateFormData {
  org_inn: string;
  org_kpp: string;
  org_name: string;
  is_full_time: number;
  taxpayer_last_name: string;
  taxpayer_first_name: string;
  taxpayer_patronymic: string;
  taxpayer_inn: string;
  taxpayer_birth_date: string;
  doc_type_code: string;
  doc_series_number: string;
  doc_issue_date: string;
  is_same_person: number;
  expense_amount: number;
  student_last_name: string;
  student_first_name: string;
  student_patronymic: string;
  student_inn: string;
  student_birth_date: string;
  student_doc_type_code: string;
  student_doc_series_number: string;
  student_doc_issue_date: string;
}

export interface Organization {
  id: string;
  inn: string;
  kpp: string;
  name: string;
  full_name: string | null;
  slug: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  pin_code: string;
  signer_full_name: string;
  signer_position: string;
  qr_code_url: string | null;
  stamp_url: string | null;
  facsimile_url: string | null;
  created_at: string;
  updated_at: string;
}
