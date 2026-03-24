import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, AlertCircle, Lock, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { CertificateFormData } from '../../types/certificate';
import { validateForm, type FormErrors } from './formHelpers';
import { CellInput, LabeledCellInput, DateCellInput, AmountCellInput } from './CellInput';
import { CellRow, LabeledCells } from '../print/CellRow';
import { padChars } from '../print/printHelpers';
import { DocTypeSelect } from './DocTypeSelect';
import { useInnLookup } from '../../hooks/useInnLookup';

interface PdfFormProps {
  formId: string;
  orgId?: string;
  orgInn?: string;
  orgKpp?: string;
  orgName?: string;
  orgLocked?: boolean;
  onNewForm?: () => void;
}

const initialFormData: CertificateFormData = {
  org_inn: '',
  org_kpp: '',
  org_name: '',
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

export function PdfForm({ formId, orgId, orgInn, orgKpp, orgName, orgLocked = false, onNewForm }: PdfFormProps) {
  const [formData, setFormData] = useState<CertificateFormData>({
    ...initialFormData,
    org_inn: orgInn || '',
    org_kpp: orgKpp || '',
    org_name: orgName || '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [innLoading, setInnLoading] = useState(false);
  const [pageCount, setPageCount] = useState('2');

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

  useEffect(() => {
    if (orgInn) setFormData((p) => ({ ...p, org_inn: orgInn }));
    if (orgKpp) setFormData((p) => ({ ...p, org_kpp: orgKpp }));
    if (orgName) setFormData((p) => ({ ...p, org_name: orgName }));
  }, [orgInn, orgKpp, orgName]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    const insertData: Record<string, unknown> = { ...formData, id: formId };
    if (orgId) insertData.org_id = orgId;
    const { error } = await supabase.from('education_certificates').insert([insertData]);
    setSubmitting(false);

    if (error) {
      setSubmitError('Не удалось отправить форму. Попробуйте позже.');
      return;
    }

    setSubmitted(true);
  };

  if (submitted) {
    const currentUrl = window.location.href;
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-3">Справка отправлена</h2>
        <p className="text-gray-600 text-sm max-w-md text-center">
          Ваши данные приняты. Образовательная организация сформирует справку.
        </p>
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 max-w-md w-full">
          <p className="text-xs text-gray-500 mb-1.5">Сохраните эту ссылку для отслеживания статуса:</p>
          <div className="flex items-center gap-2">
            <code className="text-xs text-gray-700 bg-white border border-gray-200 rounded px-2 py-1 flex-1 truncate">
              {currentUrl}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(currentUrl)}
              className="shrink-0 px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Копировать
            </button>
          </div>
        </div>
        {onNewForm && (
          <button
            onClick={onNewForm}
            className="mt-8 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
          >
            Заполнить ещё одну справку
          </button>
        )}
      </div>
    );
  }

  const orgNameLines = splitToInputLines(formData.org_name, 40, 4);

  return (
    <form onSubmit={handleSubmit}>
      {submitError && (
        <div className="mb-4 flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded text-[11px]">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-red-700">{submitError}</p>
        </div>
      )}

      <div
        className="bg-white text-black font-serif shadow-lg mx-auto"
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '10mm 15mm',
          fontSize: '10px',
          lineHeight: '1.4',
          boxSizing: 'border-box',
        }}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="border-2 border-black p-1 text-center font-mono text-[9px] leading-tight">
            <div className="border border-black px-2 py-0.5 mb-0.5">||||||||||||||||</div>
            <div className="flex gap-4 justify-center">
              <span>2710</span>
              <span>1018</span>
            </div>
            <div className="text-[8px] mt-0.5">Форма по КНД 1151158</div>
          </div>

          <div className="flex flex-col gap-1 items-end">
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] whitespace-nowrap">ИНН</span>
              {orgLocked ? (
                <CellRow chars={padChars(formData.org_inn, 12)} />
              ) : (
                <span className="relative">
                  <CellInput
                    value={formData.org_inn}
                    maxLength={12}
                    onChange={(v) => {
                      updateField('org_inn', v);
                      if (v.length === 10) lookupInn(v);
                    }}
                    filter="digits"
                    hasError={!!errors.org_inn}
                  />
                  {innLoading && (
                    <Loader2 className="absolute -right-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-500 animate-spin" />
                  )}
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[10px] whitespace-nowrap">КПП</span>
              {orgLocked ? (
                <CellRow chars={padChars(formData.org_kpp, 9)} />
              ) : (
                <CellInput
                  value={formData.org_kpp}
                  maxLength={9}
                  onChange={(v) => updateField('org_kpp', v)}
                  filter="digits"
                  hasError={!!errors.org_kpp}
                />
              )}
              <span className="text-[10px]">Стр.</span>
              <CellRow chars={['0', '0', '1']} />
            </div>
          </div>
        </div>

        <div className="text-right text-[8px] text-gray-500 mb-4">Форма по КНД 1151158</div>

        <div className="text-center mb-4">
          <div className="font-bold text-[13px]">Справка</div>
          <div className="text-[11px]">об оплате образовательных услуг для представления</div>
          <div className="text-[11px]">в налоговый орган</div>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-3">
          <LabeledCells label="Номер справки" chars={padChars('', 12)} />
          <LabeledCells label="Номер корректировки" chars={padChars('', 3)} />
          <span className="inline-flex items-baseline gap-1">
            <span className="text-[10px]">Отчетный год</span>
            <CellRow chars={padChars('', 4)} />
          </span>
          <span className="text-[8px] text-gray-400 italic">(заполняется организацией)</span>
        </div>

        <div className="mb-2">
          <p className="text-[10px] mb-1">
            Данные образовательной организации/индивидуального предпринимателя,
            осуществляющего образовательную деятельность:
          </p>
          {orgLocked ? (
            orgNameLines.map((line, i) => (
              <div key={i} className="mb-0.5">
                <CellRow chars={padChars(line, 40)} />
              </div>
            ))
          ) : (
            orgNameLines.map((line, i) => (
              <div key={i} className="mb-0.5">
                <CellInput
                  value={line}
                  maxLength={40}
                  onChange={(v) => handleOrgNameLineChange(formData.org_name, i, v, 40, (name) => updateField('org_name', name))}
                  filter="cyrillic"
                  hasError={!!errors.org_name && i === 0}
                />
              </div>
            ))
          )}
          <p className="text-[8px] text-gray-500 text-center mt-0.5">
            (наименование образовательной организации/фамилия, имя, отчество
            <sup>1</sup> индивидуального предпринимателя)
          </p>
        </div>

        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-[10px]">Обучение проводилось на очной форме обучения</span>
          <CellInput
            value={String(formData.is_full_time)}
            maxLength={1}
            onChange={(v) => updateField('is_full_time', v === '1' ? 1 : 0)}
            filter="flag"
          />
          <span className="text-[9px] text-gray-600 ml-2">0 - нет / 1 - да</span>
        </div>

        <p className="text-[10px] mb-2">
          Данные физического лица (его супруга/супруги), оплатившего образовательные услуги
          (далее - налогоплательщик)
        </p>

        <div className="space-y-1 mb-2">
          <LabeledCellInput
            label="Фамилия"
            value={formData.taxpayer_last_name}
            maxLength={36}
            onChange={(v) => updateField('taxpayer_last_name', v)}
            filter="cyrillic_name"
            hasError={!!errors.taxpayer_last_name}
            className="block"
          />
          <LabeledCellInput
            label="Имя"
            value={formData.taxpayer_first_name}
            maxLength={36}
            onChange={(v) => updateField('taxpayer_first_name', v)}
            filter="cyrillic_name"
            hasError={!!errors.taxpayer_first_name}
            className="block"
          />
          <div className="flex items-baseline gap-0.5">
            <span className="text-[10px]">Отчество<sup>1</sup></span>
            <CellInput
              value={formData.taxpayer_patronymic}
              maxLength={36}
              onChange={(v) => updateField('taxpayer_patronymic', v)}
              filter="cyrillic_name"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-2">
          <div className="flex items-baseline gap-0.5">
            <span className="text-[10px]">ИНН<sup>2</sup></span>
            <CellInput
              value={formData.taxpayer_inn}
              maxLength={12}
              onChange={(v) => updateField('taxpayer_inn', v)}
              filter="digits"
            />
          </div>
          <span className="inline-flex items-baseline gap-1">
            <span className="text-[10px]">Дата рождения</span>
            <DateCellInput
              value={formData.taxpayer_birth_date}
              onChange={(v) => updateField('taxpayer_birth_date', v)}
              hasError={!!errors.taxpayer_birth_date}
            />
          </span>
        </div>

        <p className="text-[10px] mb-1">Сведения о документе, удостоверяющем личность:</p>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-1">
          <div className="flex items-baseline gap-1">
            <span className="text-[10px]">Код вида документа</span>
            <DocTypeSelect
              value={formData.doc_type_code}
              onChange={(v) => updateField('doc_type_code', v)}
              hasError={!!errors.doc_type_code}
            />
            <CellInput
              value={formData.doc_type_code}
              maxLength={2}
              onChange={(v) => updateField('doc_type_code', v)}
              filter="digits"
              hasError={!!errors.doc_type_code}
            />
          </div>
          <LabeledCellInput
            label="Серия и номер"
            value={formData.doc_series_number}
            maxLength={20}
            onChange={(v) => updateField('doc_series_number', v)}
            hasError={!!errors.doc_series_number}
          />
        </div>
        <div className="mb-3">
          <span className="inline-flex items-baseline gap-1">
            <span className="text-[10px]">Дата выдачи</span>
            <DateCellInput
              value={formData.doc_issue_date}
              onChange={(v) => updateField('doc_issue_date', v)}
              hasError={!!errors.doc_issue_date}
            />
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-[10px]">Налогоплательщик и обучаемый являются одним лицом</span>
          <CellInput
            value={String(formData.is_same_person)}
            maxLength={1}
            onChange={(v) => updateField('is_same_person', v === '1' ? 1 : 0)}
            filter="flag"
          />
          <span className="text-[9px] text-gray-600 ml-2">0 - нет / 1 - да</span>
        </div>

        <div className="flex items-baseline gap-1 mb-6">
          <span className="text-[10px]">Сумма расходов на оказанные образовательные услуги</span>
          <AmountCellInput
            value={formData.expense_amount}
            onChange={(v) => updateField('expense_amount', v)}
            hasError={!!errors.expense_amount}
          />
        </div>

        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-center text-[10px] mb-2">
              <div className="font-bold">Достоверность и полноту сведений,</div>
              <div className="font-bold">указанных в настоящей справке,</div>
              <div className="font-bold">подтверждаю:</div>
            </div>
            {[0, 1, 2].map((i) => (
              <div key={i} className="mb-0.5">
                <CellRow chars={padChars('', 20)} />
              </div>
            ))}
            <p className="text-[8px] text-gray-500 text-center mt-0.5">(фамилия, имя, отчество)</p>
            <div className="flex items-center gap-1 mt-1">
              <Lock className="w-2.5 h-2.5 text-gray-400" />
              <span className="text-[7px] text-gray-400 italic">заполняется организацией</span>
            </div>
          </div>
          <div className="border border-gray-400 w-24 h-24 flex items-center justify-center text-[9px] text-gray-400">
            Зона QR-кода
          </div>
        </div>

        <div className="flex items-baseline gap-4 mb-4">
          <span className="text-[10px]">Подпись _______________</span>
          <span className="inline-flex items-baseline gap-1">
            <span className="text-[10px]">Дата</span>
            <CellRow chars={padChars('', 2)} />
            <span className="mx-0.5 text-[10px]">.</span>
            <CellRow chars={padChars('', 2)} />
            <span className="mx-0.5 text-[10px]">.</span>
            <CellRow chars={padChars('', 4)} />
          </span>
        </div>

        <div className="flex items-baseline gap-1 mb-6">
          <span className="text-[10px]">Справка составлена на</span>
          <CellInput value={pageCount} maxLength={3} onChange={setPageCount} filter="digits" />
          <span className="text-[10px]">страницах</span>
        </div>

        <div className="border-t border-gray-300 pt-2 text-[8px] text-gray-500 space-y-0.5">
          <p><sup>1</sup> Отчество указывается при наличии (относится ко всем листам документа).</p>
          <p><sup>2</sup> ИНН указывается при наличии.</p>
        </div>
      </div>

      <div
        className="bg-white text-black font-serif shadow-lg mx-auto mt-8"
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '10mm 15mm',
          fontSize: '10px',
          lineHeight: '1.4',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="border-2 border-black p-1 text-center font-mono text-[9px] leading-tight">
            <div className="border border-black px-2 py-0.5 mb-0.5">||||||||||||||||</div>
            <div className="flex gap-4 justify-center">
              <span>2710</span>
              <span>1025</span>
            </div>
          </div>

          <div className="flex flex-col gap-1 items-end">
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] whitespace-nowrap">ИНН</span>
              <CellRow chars={padChars(formData.org_inn, 12)} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[10px] whitespace-nowrap">КПП</span>
              <CellRow chars={padChars(formData.org_kpp, 9)} />
              <span className="text-[10px]">Стр.</span>
              <CellRow chars={['0', '0', '2']} />
            </div>
          </div>
        </div>

        <p className="text-[10px] mb-2 mt-4">
          Данные физического лица, которому оказаны образовательные услуги<sup>1</sup>:
        </p>

        <div className="space-y-1 mb-2">
          <LabeledCellInput
            label="Фамилия"
            value={formData.student_last_name}
            maxLength={36}
            onChange={(v) => updateField('student_last_name', v)}
            filter="cyrillic_name"
            hasError={!!errors.student_last_name}
            className="block"
          />
          <LabeledCellInput
            label="Имя"
            value={formData.student_first_name}
            maxLength={36}
            onChange={(v) => updateField('student_first_name', v)}
            filter="cyrillic_name"
            hasError={!!errors.student_first_name}
            className="block"
          />
          <div className="flex items-baseline gap-0.5">
            <span className="text-[10px]">Отчество<sup>1</sup></span>
            <CellInput
              value={formData.student_patronymic}
              maxLength={36}
              onChange={(v) => updateField('student_patronymic', v)}
              filter="cyrillic_name"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-2">
          <div className="flex items-baseline gap-0.5">
            <span className="text-[10px]">ИНН<sup>2</sup></span>
            <CellInput
              value={formData.student_inn}
              maxLength={12}
              onChange={(v) => updateField('student_inn', v)}
              filter="digits"
            />
          </div>
          <span className="inline-flex items-baseline gap-1">
            <span className="text-[10px]">Дата рождения</span>
            <DateCellInput
              value={formData.student_birth_date}
              onChange={(v) => updateField('student_birth_date', v)}
              hasError={!!errors.student_birth_date}
            />
          </span>
        </div>

        <p className="text-[10px] mb-1">Сведения о документе, удостоверяющем личность:</p>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-1">
          <div className="flex items-baseline gap-1">
            <span className="text-[10px]">Код вида документа</span>
            <DocTypeSelect
              value={formData.student_doc_type_code}
              onChange={(v) => updateField('student_doc_type_code', v)}
              hasError={!!errors.student_doc_type_code}
            />
            <CellInput
              value={formData.student_doc_type_code}
              maxLength={2}
              onChange={(v) => updateField('student_doc_type_code', v)}
              filter="digits"
              hasError={!!errors.student_doc_type_code}
            />
          </div>
          <LabeledCellInput
            label="Серия и номер"
            value={formData.student_doc_series_number}
            maxLength={20}
            onChange={(v) => updateField('student_doc_series_number', v)}
            hasError={!!errors.student_doc_series_number}
          />
        </div>
        <div className="mb-3">
          <span className="inline-flex items-baseline gap-1">
            <span className="text-[10px]">Дата выдачи</span>
            <DateCellInput
              value={formData.student_doc_issue_date}
              onChange={(v) => updateField('student_doc_issue_date', v)}
              hasError={!!errors.student_doc_issue_date}
            />
          </span>
        </div>

        <div className="flex-1" />

        <div className="border-t border-gray-300 pt-2 text-[8px] text-gray-500 space-y-0.5 mb-4">
          <p><sup>1</sup> Данные заполняются, если налогоплательщик и обучаемый не являются одним лицом.</p>
          <p><sup>2</sup> ИНН указывается при наличии.</p>
        </div>

        <div className="text-center text-[10px] mb-2">
          <div>Достоверность и полноту сведений, указанных на данной странице, подтверждаю:</div>
        </div>

        <div className="flex items-baseline gap-4 mb-4">
          <span className="text-[10px]">_______________</span>
          <span className="text-[8px] text-gray-500">(подпись)</span>
          <span className="inline-flex items-baseline gap-1 ml-auto">
            <CellRow chars={padChars('', 2)} />
            <span className="mx-0.5 text-[10px]">.</span>
            <CellRow chars={padChars('', 2)} />
            <span className="mx-0.5 text-[10px]">.</span>
            <CellRow chars={padChars('', 4)} />
          </span>
          <span className="text-[8px] text-gray-500">(дата)</span>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={submitting}
            className="
              w-full py-2.5 px-6 rounded border border-black font-serif text-[12px]
              bg-white hover:bg-gray-50 active:bg-gray-100
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-150
            "
          >
            {submitting ? 'Отправка...' : 'Отправить данные для формирования справки'}
          </button>
          {Object.keys(errors).length > 0 && (
            <p className="text-[9px] text-red-600 text-center mt-2">
              Пожалуйста, заполните все обязательные поля (выделены красным)
            </p>
          )}
        </div>
      </div>
    </form>
  );
}

function splitToInputLines(text: string, charsPerLine: number, maxLines: number): string[] {
  const lines: string[] = [];
  let remaining = text;
  while (remaining.length > 0 || lines.length === 0) {
    lines.push(remaining.slice(0, charsPerLine));
    remaining = remaining.slice(charsPerLine);
    if (lines.length >= maxLines) break;
  }
  while (lines.length < maxLines) {
    lines.push('');
  }
  return lines;
}

function handleOrgNameLineChange(
  currentFullName: string,
  lineIndex: number,
  newLineValue: string,
  charsPerLine: number,
  setName: (name: string) => void
) {
  const lines = splitToInputLines(currentFullName, charsPerLine, 4);
  lines[lineIndex] = newLineValue;
  const joined = lines.join('').replace(/\s+$/, '');
  setName(joined);
}
