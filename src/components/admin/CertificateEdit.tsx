import { useState, useEffect } from 'react';
import { Save, Printer, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Certificate } from '../../types/certificate';
import { AdminLayout } from './AdminLayout';
import { FormField } from '../ui/FormField';
import { Input } from '../ui/Input';

interface CertificateEditProps {
  certificateId: string;
  onBack: () => void;
  onPrint: (id: string) => void;
}

export function CertificateEdit({ certificateId, onBack, onPrint }: CertificateEditProps) {
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadCertificate();
  }, [certificateId]);

  const loadCertificate = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('education_certificates')
      .select('*')
      .eq('id', certificateId)
      .maybeSingle();
    setCert(data);
    setLoading(false);
  };

  const updateField = (field: keyof Certificate, value: string | number) => {
    if (!cert) return;
    setCert({ ...cert, [field]: value });
    setSaved(false);
  };

  const handleSave = async () => {
    if (!cert) return;
    setSaving(true);
    await supabase
      .from('education_certificates')
      .update({
        certificate_number: cert.certificate_number,
        correction_number: cert.correction_number,
        report_year: cert.report_year,
        signer_full_name: cert.signer_full_name,
        sign_date: cert.sign_date || null,
        status: cert.status,
        admin_notes: cert.admin_notes,
        org_inn: cert.org_inn,
        org_kpp: cert.org_kpp,
        org_name: cert.org_name,
        is_full_time: cert.is_full_time,
        taxpayer_last_name: cert.taxpayer_last_name,
        taxpayer_first_name: cert.taxpayer_first_name,
        taxpayer_patronymic: cert.taxpayer_patronymic,
        taxpayer_inn: cert.taxpayer_inn,
        taxpayer_birth_date: cert.taxpayer_birth_date,
        doc_type_code: cert.doc_type_code,
        doc_series_number: cert.doc_series_number,
        doc_issue_date: cert.doc_issue_date,
        is_same_person: cert.is_same_person,
        expense_amount: cert.expense_amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', certificateId);
    setSaving(false);
    setSaved(true);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <AdminLayout title="Загрузка..." onBack={onBack}>
        <div className="p-12 text-center text-gray-500 text-sm">Загрузка справки...</div>
      </AdminLayout>
    );
  }

  if (!cert) {
    return (
      <AdminLayout title="Не найдено" onBack={onBack}>
        <div className="p-12 text-center text-gray-500 text-sm">Справка не найдена</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Редактирование справки" onBack={onBack}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-gray-500">
            Создана: {formatDate(cert.created_at)}
            {cert.updated_at !== cert.created_at && (
              <> | Обновлена: {formatDate(cert.updated_at)}</>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPrint(cert.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white
                hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Печать
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700
                text-white text-sm font-medium transition-colors disabled:bg-blue-400"
            >
              {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? 'Сохранение...' : saved ? 'Сохранено' : 'Сохранить'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AdminFieldsSection cert={cert} updateField={updateField} />
          <OrgDataSection cert={cert} updateField={updateField} />
          <TaxpayerDataSection cert={cert} updateField={updateField} />
          <PaymentSection cert={cert} updateField={updateField} />
        </div>
      </div>
    </AdminLayout>
  );
}

interface FieldSectionProps {
  cert: Certificate;
  updateField: (field: keyof Certificate, value: string | number) => void;
}

function AdminFieldsSection({ cert, updateField }: FieldSectionProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 pb-3 border-b border-gray-100">
        Административные поля
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Номер справки">
          <Input
            value={cert.certificate_number}
            onChange={(e) => updateField('certificate_number', e.target.value)}
          />
        </FormField>
        <FormField label="Номер корректировки">
          <Input
            value={cert.correction_number}
            onChange={(e) => updateField('correction_number', e.target.value)}
          />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Отчётный год">
          <Input
            value={cert.report_year}
            onChange={(e) => updateField('report_year', e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="2024"
          />
        </FormField>
        <FormField label="Статус">
          <select
            value={cert.status}
            onChange={(e) => updateField('status', e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          >
            <option value="draft">Черновик</option>
            <option value="completed">Завершена</option>
            <option value="printed">Напечатана</option>
          </select>
        </FormField>
      </div>
      <FormField label="ФИО подписанта">
        <Input
          value={cert.signer_full_name}
          onChange={(e) => updateField('signer_full_name', e.target.value)}
          placeholder="Фамилия Имя Отчество"
        />
      </FormField>
      <FormField label="Дата подписи">
        <Input
          type="date"
          value={cert.sign_date || ''}
          onChange={(e) => updateField('sign_date', e.target.value)}
        />
      </FormField>
      <FormField label="Заметки администратора">
        <textarea
          value={cert.admin_notes}
          onChange={(e) => updateField('admin_notes', e.target.value)}
          rows={3}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
            placeholder:text-gray-400 resize-none"
          placeholder="Внутренние заметки..."
        />
      </FormField>
    </div>
  );
}

function OrgDataSection({ cert, updateField }: FieldSectionProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 pb-3 border-b border-gray-100">
        Данные организации
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="ИНН организации">
          <Input
            value={cert.org_inn}
            onChange={(e) => updateField('org_inn', e.target.value.replace(/\D/g, '').slice(0, 10))}
          />
        </FormField>
        <FormField label="КПП">
          <Input
            value={cert.org_kpp}
            onChange={(e) => updateField('org_kpp', e.target.value.replace(/\D/g, '').slice(0, 9))}
          />
        </FormField>
      </div>
      <FormField label="Наименование организации">
        <textarea
          value={cert.org_name}
          onChange={(e) => updateField('org_name', e.target.value)}
          rows={2}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none"
        />
      </FormField>
      <FormField label="Очная форма обучения">
        <div className="flex items-center gap-4 mt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={cert.is_full_time === 1}
              onChange={() => updateField('is_full_time', 1)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm">Да</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={cert.is_full_time === 0}
              onChange={() => updateField('is_full_time', 0)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm">Нет</span>
          </label>
        </div>
      </FormField>
    </div>
  );
}

function TaxpayerDataSection({ cert, updateField }: FieldSectionProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 pb-3 border-b border-gray-100">
        Данные налогоплательщика
      </h3>
      <div className="grid grid-cols-3 gap-3">
        <FormField label="Фамилия">
          <Input
            value={cert.taxpayer_last_name}
            onChange={(e) => updateField('taxpayer_last_name', e.target.value)}
          />
        </FormField>
        <FormField label="Имя">
          <Input
            value={cert.taxpayer_first_name}
            onChange={(e) => updateField('taxpayer_first_name', e.target.value)}
          />
        </FormField>
        <FormField label="Отчество">
          <Input
            value={cert.taxpayer_patronymic}
            onChange={(e) => updateField('taxpayer_patronymic', e.target.value)}
          />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="ИНН">
          <Input
            value={cert.taxpayer_inn}
            onChange={(e) => updateField('taxpayer_inn', e.target.value.replace(/\D/g, '').slice(0, 12))}
          />
        </FormField>
        <FormField label="Дата рождения">
          <Input
            type="date"
            value={cert.taxpayer_birth_date}
            onChange={(e) => updateField('taxpayer_birth_date', e.target.value)}
          />
        </FormField>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <FormField label="Код документа">
          <Input
            value={cert.doc_type_code}
            onChange={(e) => updateField('doc_type_code', e.target.value)}
          />
        </FormField>
        <FormField label="Серия и номер">
          <Input
            value={cert.doc_series_number}
            onChange={(e) => updateField('doc_series_number', e.target.value)}
          />
        </FormField>
        <FormField label="Дата выдачи">
          <Input
            type="date"
            value={cert.doc_issue_date}
            onChange={(e) => updateField('doc_issue_date', e.target.value)}
          />
        </FormField>
      </div>
    </div>
  );
}

function PaymentSection({ cert, updateField }: FieldSectionProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 pb-3 border-b border-gray-100">
        Сведения об обучении и оплате
      </h3>
      <FormField label="Налогоплательщик и обучаемый - одно лицо">
        <div className="flex items-center gap-4 mt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={cert.is_same_person === 1}
              onChange={() => updateField('is_same_person', 1)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm">Да</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={cert.is_same_person === 0}
              onChange={() => updateField('is_same_person', 0)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm">Нет</span>
          </label>
        </div>
      </FormField>
      <FormField label="Сумма расходов (руб.)">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={cert.expense_amount}
          onChange={(e) => updateField('expense_amount', parseFloat(e.target.value) || 0)}
        />
      </FormField>
    </div>
  );
}
