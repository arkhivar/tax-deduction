import { useState, useCallback } from 'react';
import { Building2, User, GraduationCap, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import type { CertificateFormData } from '../../types/certificate';
import { FormField } from '../ui/FormField';
import { Input } from '../ui/Input';
import { DateInput } from '../ui/DateInput';
import { Select } from '../ui/Select';
import { SectionHeader } from '../ui/SectionHeader';
import { DOC_TYPE_OPTIONS, validateForm, type FormErrors } from './formHelpers';
import { toCyrillicText, toCyrillicName } from '../../lib/cyrillic';
import { useInnLookup } from '../../hooks/useInnLookup';

const initialFormData: CertificateFormData = {
  org_inn: '',
  org_kpp: '',
  org_name: '',
  report_year: '',
  is_full_time: 0,
  taxpayer_last_name: '',
  taxpayer_first_name: '',
  taxpayer_patronymic: '',
  taxpayer_inn: '',
  taxpayer_birth_date: '',
  doc_type_code: '21',
  doc_series_number: '',
  doc_issue_date: '',
  is_same_person: 1,
  expense_amount: 0,
  student_last_name: '',
  student_first_name: '',
  student_patronymic: '',
  student_inn: '',
  student_birth_date: '',
  student_doc_type_code: '03',
  student_doc_series_number: '',
  student_doc_issue_date: '',
};

export function CertificateForm() {
  const [formData, setFormData] = useState<CertificateFormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [innLoading, setInnLoading] = useState(false);

  const updateField = <K extends keyof CertificateFormData>(key: K, value: CertificateFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleInnResult = useCallback((result: { found: boolean; name?: string; full_name?: string; kpp?: string }) => {
    if (result.found) {
      setFormData((prev) => ({
        ...prev,
        org_name: result.full_name || result.name || prev.org_name,
        org_kpp: result.kpp || prev.org_kpp,
      }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next.org_name;
        delete next.org_kpp;
        return next;
      });
    }
  }, []);

  const lookupInn = useInnLookup(handleInnResult, setInnLoading);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    const { error } = await api.certificates.create(formData);
    setSubmitting(false);

    if (error) {
      setSubmitError('Не удалось отправить форму. Попробуйте позже.');
      return;
    }

    setSubmitted(true);
    notifyParentResize();
  };

  const notifyParentResize = () => {
    try {
      window.parent.postMessage(
        { type: 'form-resize', height: document.body.scrollHeight },
        '*'
      );
    } catch {
      // postMessage can fail in cross-origin iframes — ignore
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Справка отправлена</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Ваши данные приняты. Мы свяжемся с вами после обработки справки.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setFormData(initialFormData);
          }}
          className="mt-8 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
        >
          Заполнить ещё одну справку
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600 mb-4">
          <FileText className="w-3.5 h-3.5" />
          Форма по КНД 1151158
        </div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">
          Справка об оплате образовательных услуг
        </h1>
        <p className="text-sm text-gray-500 mt-2">для представления в налоговый орган</p>
      </div>

      {submitError && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{submitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <OrgSection formData={formData} errors={errors} updateField={updateField} innLoading={innLoading} lookupInn={lookupInn} />
        <TaxpayerSection formData={formData} errors={errors} updateField={updateField} />
        <EducationSection formData={formData} errors={errors} updateField={updateField} />
        {formData.is_same_person === 0 && (
          <StudentSection formData={formData} errors={errors} updateField={updateField} />
        )}

        <div className="pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="
              w-full py-3 px-6 rounded-lg font-medium text-white text-sm
              bg-blue-600 hover:bg-blue-700 active:bg-blue-800
              disabled:bg-blue-400 disabled:cursor-not-allowed
              transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2
            "
          >
            {submitting ? 'Отправка...' : 'Отправить справку'}
          </button>
        </div>
      </form>
    </div>
  );
}

interface SectionProps {
  formData: CertificateFormData;
  errors: FormErrors;
  updateField: <K extends keyof CertificateFormData>(key: K, value: CertificateFormData[K]) => void;
}

interface OrgSectionProps extends SectionProps {
  innLoading: boolean;
  lookupInn: (inn: string) => void;
}

function OrgSection({ formData, errors, updateField, innLoading, lookupInn }: OrgSectionProps) {
  const handleInnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    updateField('org_inn', value);
    if (value.length === 10) {
      lookupInn(value);
    }
  };

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 shadow-sm">
      <SectionHeader
        icon={Building2}
        title="Данные образовательной организации"
        description="ИП, осуществляющего образовательную деятельность"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="ИНН организации" required hint="10 цифр" error={errors.org_inn}>
          <div className="relative">
            <Input
              value={formData.org_inn}
              onChange={handleInnChange}
              placeholder="0000000000"
              maxLength={10}
              hasError={!!errors.org_inn} uppercase />
            {innLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
              </div>
            )}
          </div>
        </FormField>
        <FormField label="КПП" required hint="9 цифр" error={errors.org_kpp}>
          <Input
            value={formData.org_kpp}
            onChange={(e) => updateField('org_kpp', e.target.value.replace(/\D/g, '').slice(0, 9))}
            placeholder="000000000"
            maxLength={9}
            hasError={!!errors.org_kpp}
          />
        </FormField>
      </div>
      <FormField label="Наименование организации" required error={errors.org_name}>
        <Input
          value={formData.org_name}
          onChange={(e) => updateField('org_name', toCyrillicText(e.target.value))}
          placeholder="Полное наименование образовательной организации"
          hasError={!!errors.org_name} uppercase />
      </FormField>
      <FormField label="Обучение на очной форме" error={errors.is_full_time}>
        <div className="flex items-center gap-6 mt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="is_full_time"
              checked={formData.is_full_time === 1}
              onChange={() => updateField('is_full_time', 1)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Да</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="is_full_time"
              checked={formData.is_full_time === 0}
              onChange={() => updateField('is_full_time', 0)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Нет</span>
          </label>
        </div>
      </FormField>
    </section>
  );
}

function TaxpayerSection({ formData, errors, updateField }: SectionProps) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 shadow-sm">
      <SectionHeader
        icon={User}
        title="Данные налогоплательщика"
        description="Физическое лицо (или его супруг/супруга), оплатившее образовательные услуги"
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="Фамилия" required error={errors.taxpayer_last_name}>
          <Input
            value={formData.taxpayer_last_name}
            onChange={(e) => updateField('taxpayer_last_name', toCyrillicName(e.target.value))}
            placeholder="Иванов"
            hasError={!!errors.taxpayer_last_name} uppercase />
        </FormField>
        <FormField label="Имя" required error={errors.taxpayer_first_name}>
          <Input
            value={formData.taxpayer_first_name}
            onChange={(e) => updateField('taxpayer_first_name', toCyrillicName(e.target.value))}
            placeholder="Иван"
            hasError={!!errors.taxpayer_first_name} uppercase />
        </FormField>
        <FormField label="Отчество" hint="при наличии">
          <Input
            value={formData.taxpayer_patronymic}
            onChange={(e) => updateField('taxpayer_patronymic', toCyrillicName(e.target.value))}
            placeholder="Иванович" uppercase />
        </FormField>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="ИНН налогоплательщика" hint="12 цифр, при наличии">
          <Input
            value={formData.taxpayer_inn}
            onChange={(e) => updateField('taxpayer_inn', e.target.value.replace(/\D/g, '').slice(0, 12))}
            placeholder="000000000000"
            maxLength={12}
          />
        </FormField>
        <FormField label="Дата рождения" required error={errors.taxpayer_birth_date}>
          <DateInput
            value={formData.taxpayer_birth_date}
            onChange={(iso) => updateField('taxpayer_birth_date', iso)}
            hasError={!!errors.taxpayer_birth_date}
          />
        </FormField>
      </div>
      <div className="pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">
          Документ, удостоверяющий личность
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label="Код вида документа" required error={errors.doc_type_code}>
            <Select
              value={formData.doc_type_code}
              onChange={(e) => updateField('doc_type_code', e.target.value)}
              options={DOC_TYPE_OPTIONS}
              hasError={!!errors.doc_type_code}
            />
          </FormField>
          <FormField label="Серия и номер" required error={errors.doc_series_number}>
            <Input
              value={formData.doc_series_number}
              onChange={(e) => updateField('doc_series_number', e.target.value)}
              placeholder="00 00 000000"
              hasError={!!errors.doc_series_number} uppercase />
          </FormField>
          <FormField label="Дата выдачи" required error={errors.doc_issue_date}>
            <DateInput
            value={formData.doc_issue_date}
            onChange={(iso) => updateField('doc_issue_date', iso)}
              hasError={!!errors.doc_issue_date}
          />
          </FormField>
        </div>
      </div>
    </section>
  );
}

function EducationSection({ formData, errors, updateField }: SectionProps) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 shadow-sm">
      <SectionHeader
        icon={GraduationCap}
        title="Сведения об обучении"
        description="Информация о расходах на образовательные услуги"
      />
      <FormField label="Налогоплательщик и обучаемый являются одним лицом">
        <div className="flex items-center gap-6 mt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="is_same_person"
              checked={formData.is_same_person === 1}
              onChange={() => updateField('is_same_person', 1)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Да</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="is_same_person"
              checked={formData.is_same_person === 0}
              onChange={() => updateField('is_same_person', 0)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Нет</span>
          </label>
        </div>
      </FormField>
      <FormField
        label="Сумма расходов на образовательные услуги (руб.)"
        required
        error={errors.expense_amount}
      >
        <Input
          type="number"
          min="0"
          step="0.01"
          value={formData.expense_amount || ''}
          onChange={(e) => updateField('expense_amount', parseFloat(e.target.value) || 0)}
          placeholder="0.00"
          hasError={!!errors.expense_amount}
        />
      </FormField>
    </section>
  );
}

function StudentSection({ formData, errors, updateField }: SectionProps) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 shadow-sm">
      <SectionHeader
        icon={User}
        title="Данные обучаемого (стр. 2)"
        description="Физическое лицо, которому оказаны образовательные услуги"
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="Фамилия" required error={errors.student_last_name}>
          <Input
            value={formData.student_last_name}
            onChange={(e) => updateField('student_last_name', toCyrillicName(e.target.value))}
            placeholder="Иванов"
            hasError={!!errors.student_last_name} uppercase />
        </FormField>
        <FormField label="Имя" required error={errors.student_first_name}>
          <Input
            value={formData.student_first_name}
            onChange={(e) => updateField('student_first_name', toCyrillicName(e.target.value))}
            placeholder="Петр"
            hasError={!!errors.student_first_name} uppercase />
        </FormField>
        <FormField label="Отчество" hint="при наличии">
          <Input
            value={formData.student_patronymic}
            onChange={(e) => updateField('student_patronymic', toCyrillicName(e.target.value))}
            placeholder="Иванович" uppercase />
        </FormField>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="ИНН обучаемого" hint="12 цифр, при наличии">
          <Input
            value={formData.student_inn}
            onChange={(e) => updateField('student_inn', e.target.value.replace(/\D/g, '').slice(0, 12))}
            placeholder="000000000000"
            maxLength={12}
          />
        </FormField>
        <FormField label="Дата рождения" required error={errors.student_birth_date}>
          <DateInput
            value={formData.student_birth_date}
            onChange={(iso) => updateField('student_birth_date', iso)}
            hasError={!!errors.student_birth_date}
          />
        </FormField>
      </div>
      <div className="pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">
          Документ, удостоверяющий личность обучаемого
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label="Код вида документа" required error={errors.student_doc_type_code}>
            <Select
              value={formData.student_doc_type_code}
              onChange={(e) => updateField('student_doc_type_code', e.target.value)}
              options={DOC_TYPE_OPTIONS}
              hasError={!!errors.student_doc_type_code}
            />
          </FormField>
          <FormField label="Серия и номер" required error={errors.student_doc_series_number}>
            <Input
              value={formData.student_doc_series_number}
              onChange={(e) => updateField('student_doc_series_number', e.target.value)}
              placeholder="00 00 000000"
              hasError={!!errors.student_doc_series_number} uppercase />
          </FormField>
          <FormField label="Дата выдачи" required error={errors.student_doc_issue_date}>
            <DateInput
            value={formData.student_doc_issue_date}
            onChange={(iso) => updateField('student_doc_issue_date', iso)}
              hasError={!!errors.student_doc_issue_date}
          />
          </FormField>
        </div>
      </div>
    </section>
  );
}