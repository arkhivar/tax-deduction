import type { CertificateFormData } from '../../types/certificate';
import { isCyrillicText, isCyrillicName } from '../../lib/cyrillic';

export type FormErrors = Partial<Record<keyof CertificateFormData, string>>;

export const DOC_TYPE_OPTIONS = [
  { value: '21', label: '21 - Паспорт гражданина РФ' },
  { value: '03', label: '03 - Свидетельство о рождении' },
  { value: '07', label: '07 - Военный билет' },
  { value: '10', label: '10 - Паспорт иностранного гражданина' },
  { value: '12', label: '12 - Вид на жительство' },
  { value: '14', label: '14 - Временное удостоверение личности' },
  { value: '22', label: '22 - Загранпаспорт гражданина РФ' },
];

export function validateForm(data: CertificateFormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.org_inn || data.org_inn.length !== 10) {
    errors.org_inn = 'Введите 10 цифр ИНН организации';
  }
  if (!data.org_kpp || data.org_kpp.length !== 9) {
    errors.org_kpp = 'Введите 9 цифр КПП';
  }
  if (!data.org_name.trim()) {
    errors.org_name = 'Укажите наименование организации';
  } else if (!isCyrillicText(data.org_name)) {
    errors.org_name = 'Используйте только русские буквы';
  }
  if (!data.taxpayer_last_name.trim()) {
    errors.taxpayer_last_name = 'Обязательное поле';
  } else if (!isCyrillicName(data.taxpayer_last_name)) {
    errors.taxpayer_last_name = 'Используйте только русские буквы';
  }
  if (!data.taxpayer_first_name.trim()) {
    errors.taxpayer_first_name = 'Обязательное поле';
  } else if (!isCyrillicName(data.taxpayer_first_name)) {
    errors.taxpayer_first_name = 'Используйте только русские буквы';
  }
  if (data.taxpayer_patronymic.trim() && !isCyrillicName(data.taxpayer_patronymic)) {
    errors.taxpayer_patronymic = 'Используйте только русские буквы';
  }
  if (!data.taxpayer_birth_date) {
    errors.taxpayer_birth_date = 'Укажите дату рождения';
  }
  if (!data.doc_type_code) {
    errors.doc_type_code = 'Выберите тип документа';
  }
  if (!data.doc_series_number.trim()) {
    errors.doc_series_number = 'Укажите серию и номер';
  }
  if (!data.doc_issue_date) {
    errors.doc_issue_date = 'Укажите дату выдачи';
  }
  if (!data.expense_amount || data.expense_amount <= 0) {
    errors.expense_amount = 'Укажите сумму расходов';
  }

  return errors;
}
