import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { Save, Printer, CheckCircle, ArrowLeft, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import type { Certificate } from '../types/certificate';
import { OrgLayout } from '../components/org/OrgLayout';
import { FormField } from '../components/ui/FormField';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { DateInput } from '../components/ui/DateInput';
import { SignerNameInput } from '../components/ui/SignerNameInput';

export function OrgCertificateEditPage() {
  usePageTitle('Редактирование справки');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { data } = await api.certificates.get(id);
      setCert(data);
      setLoading(false);
    };
    load();
  }, [id]);

  const updateField = (field: keyof Certificate, value: string | number) => {
    if (!cert) return;
    setCert({ ...cert, [field]: value });
    setSaved(false);
  };

  const handleSave = async () => {
    if (!cert || !id) return;
    setSaving(true);
    await api.certificates.update(id, {
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
      student_last_name: cert.student_last_name,
      student_first_name: cert.student_first_name,
      student_patronymic: cert.student_patronymic,
      student_inn: cert.student_inn,
      student_birth_date: cert.student_birth_date || null,
      student_doc_type_code: cert.student_doc_type_code,
      student_doc_series_number: cert.student_doc_series_number,
      student_doc_issue_date: cert.student_doc_issue_date || null,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    setSaved(true);
  };

  const handleDelete = async () => {
    if (!cert || !id) return;
    const name = `${cert.taxpayer_last_name} ${cert.taxpayer_first_name}`.trim();
    if (!window.confirm(`Удалить справку «${name}»? Действие необратимо.`)) return;
    const { error } = await api.certificates.delete(id);
    if (!error) navigate('/org/dashboard');
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  if (loading) {
    return (
      <OrgLayout>
        <div className="p-12 text-center text-gray-500 text-sm">Загрузка...</div>
      </OrgLayout>
    );
  }

  if (!cert) {
    return (
      <OrgLayout>
        <div className="p-12 text-center text-gray-500 text-sm">Справка не найдена</div>
      </OrgLayout>
    );
  }

  return (
    <OrgLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/org/dashboard')}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад
            </button>
            <div className="text-xs text-gray-500">
              Создана: {formatDate(cert.created_at)}
              {cert.updated_at !== cert.created_at && (
                <> | Обновлена: {formatDate(cert.updated_at)}</>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/org/print/${cert.id}`)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white
                hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Печать
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800
                text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? 'Сохранение...' : saved ? 'Сохранено' : 'Сохранить'}
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center p-2.5 rounded-lg border border-red-200 bg-white
                hover:bg-red-50 text-red-600 transition-colors"
              title="Удалить справку"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title="Административные поля">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Номер справки">
                <Input value={cert.certificate_number} onChange={(e) => updateField('certificate_number', e.target.value)} uppercase />
              </FormField>
              <FormField label="Номер корректировки">
                <Input value={cert.correction_number} onChange={(e) => updateField('correction_number', e.target.value)} uppercase />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Отчётный год">
                <Input value={cert.report_year} onChange={(e) => updateField('report_year', e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="2024" />
              </FormField>
              <FormField label="Статус">
                <select
                  value={cert.status}
                  onChange={(e) => updateField('status', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                >
                  <option value="draft">Черновик</option>
                  <option value="completed">Завершена</option>
                  <option value="printed">Напечатана</option>
                </select>
              </FormField>
            </div>
            <FormField label="ФИО подписанта">
              <SignerNameInput
                value={cert.signer_full_name}
                onChange={(fullName) => updateField('signer_full_name', fullName)}
              />
            </FormField>
            <FormField label="Дата подписи">
              <DateInput value={cert.sign_date || ''} onChange={(iso) => updateField('sign_date', iso)} />
            </FormField>
            <FormField label="Заметки">
              <textarea
                value={cert.admin_notes}
                onChange={(e) => updateField('admin_notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none"
                placeholder="Внутренние заметки..."
              />
            </FormField>
          </Section>

          <Section title="Данные организации">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="ИНН организации">
                <Input value={cert.org_inn} onChange={(e) => updateField('org_inn', e.target.value.replace(/\D/g, '').slice(0, 10))} uppercase />
              </FormField>
              <FormField label="КПП">
                <Input value={cert.org_kpp} onChange={(e) => updateField('org_kpp', e.target.value.replace(/\D/g, '').slice(0, 9))} uppercase />
              </FormField>
            </div>
            <FormField label="Наименование">
              <Textarea
                value={cert.org_name}
                onChange={(e) => updateField('org_name', e.target.value)}
                rows={2}
                uppercase
              />
            </FormField>
          </Section>

          <Section title="Данные налогоплательщика">
            <div className="grid grid-cols-3 gap-3">
              <FormField label="Фамилия">
                <Input value={cert.taxpayer_last_name} onChange={(e) => updateField('taxpayer_last_name', e.target.value)} uppercase />
              </FormField>
              <FormField label="Имя">
                <Input value={cert.taxpayer_first_name} onChange={(e) => updateField('taxpayer_first_name', e.target.value)} uppercase />
              </FormField>
              <FormField label="Отчество">
                <Input value={cert.taxpayer_patronymic} onChange={(e) => updateField('taxpayer_patronymic', e.target.value)} uppercase />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="ИНН">
                <Input value={cert.taxpayer_inn} onChange={(e) => updateField('taxpayer_inn', e.target.value.replace(/\D/g, '').slice(0, 12))} uppercase />
              </FormField>
              <FormField label="Дата рождения">
                <DateInput value={cert.taxpayer_birth_date} onChange={(iso) => updateField('taxpayer_birth_date', iso)} />
              </FormField>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <FormField label="Код документа">
                <Input value={cert.doc_type_code} onChange={(e) => updateField('doc_type_code', e.target.value)} uppercase />
              </FormField>
              <FormField label="Серия и номер">
                <Input value={cert.doc_series_number} onChange={(e) => updateField('doc_series_number', e.target.value)} uppercase />
              </FormField>
              <FormField label="Дата выдачи">
                <DateInput value={cert.doc_issue_date} onChange={(iso) => updateField('doc_issue_date', iso)} />
              </FormField>
            </div>
          </Section>

          <Section title="Оплата">
            <FormField label="Одно лицо">
              <label className="relative inline-flex items-center cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={cert.is_same_person === 1}
                  onChange={(e) => updateField('is_same_person', e.target.checked ? 1 : 0)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                <span className="ml-3 text-sm text-gray-700">{cert.is_same_person === 1 ? 'Да' : 'Нет'}</span>
              </label>
            </FormField>
            <FormField label="Очная форма">
              <label className="relative inline-flex items-center cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={cert.is_full_time === 1}
                  onChange={(e) => updateField('is_full_time', e.target.checked ? 1 : 0)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                <span className="ml-3 text-sm text-gray-700">{cert.is_full_time === 1 ? 'Да' : 'Нет'}</span>
              </label>
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
          </Section>

          {cert.is_same_person === 0 && (
            <Section title="Данные обучаемого (стр. 2)">
              <div className="grid grid-cols-3 gap-3">
                <FormField label="Фамилия">
                  <Input value={cert.student_last_name} onChange={(e) => updateField('student_last_name', e.target.value)} uppercase />
                </FormField>
                <FormField label="Имя">
                  <Input value={cert.student_first_name} onChange={(e) => updateField('student_first_name', e.target.value)} uppercase />
                </FormField>
                <FormField label="Отчество">
                  <Input value={cert.student_patronymic} onChange={(e) => updateField('student_patronymic', e.target.value)} uppercase />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="ИНН">
                  <Input value={cert.student_inn} onChange={(e) => updateField('student_inn', e.target.value.replace(/\D/g, '').slice(0, 12))} uppercase />
                </FormField>
                <FormField label="Дата рождения">
                  <DateInput value={cert.student_birth_date || ''} onChange={(iso) => updateField('student_birth_date', iso)} />
                </FormField>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <FormField label="Код документа">
                  <Input value={cert.student_doc_type_code} onChange={(e) => updateField('student_doc_type_code', e.target.value)} uppercase />
                </FormField>
                <FormField label="Серия и номер">
                  <Input value={cert.student_doc_series_number} onChange={(e) => updateField('student_doc_series_number', e.target.value)} uppercase />
                </FormField>
                <FormField label="Дата выдачи">
                  <DateInput value={cert.student_doc_issue_date || ''} onChange={(iso) => updateField('student_doc_issue_date', iso)} />
                </FormField>
              </div>
            </Section>
          )}
        </div>
      </div>
    </OrgLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 pb-3 border-b border-gray-100">{title}</h3>
      {children}
    </div>
  );
}