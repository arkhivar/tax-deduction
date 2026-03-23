import type { Certificate } from '../../types/certificate';
import { CellRow, LabeledCells, DateCells } from './CellRow';
import { padChars, formatDateToCells } from './printHelpers';

interface PrintPage2Props {
  cert: Certificate;
}

export function PrintPage2({ cert }: PrintPage2Props) {
  const orgInnChars = padChars(cert.org_inn, 12);
  const orgKppChars = padChars(cert.org_kpp, 9);
  const lastNameChars = padChars(cert.student_last_name, 36);
  const firstNameChars = padChars(cert.student_first_name, 36);
  const patronymicChars = padChars(cert.student_patronymic, 36);
  const innChars = padChars(cert.student_inn, 12);
  const birthDate = formatDateToCells(cert.student_birth_date || '');
  const docCodeChars = padChars(cert.student_doc_type_code, 2);
  const docSeriesChars = padChars(cert.student_doc_series_number, 20);
  const issueDate = formatDateToCells(cert.student_doc_issue_date || '');
  const signDate = formatDateToCells(cert.sign_date || '');

  return (
    <div
      className="bg-white text-black font-serif print:shadow-none shadow-lg"
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
            <LabeledCells label="ИНН" chars={orgInnChars} />
          </div>
          <div className="flex items-baseline gap-2">
            <LabeledCells label="КПП" chars={orgKppChars} />
            <span className="text-[10px]">Стр.</span>
            <CellRow chars={['0', '0', '2']} />
          </div>
        </div>
      </div>

      <p className="text-[10px] mb-2 mt-4">
        Данные физического лица, которому оказаны образовательные услуги<sup>1</sup>:
      </p>

      <div className="space-y-1 mb-2">
        <LabeledCells label="Фамилия" chars={lastNameChars} className="block" />
        <LabeledCells label="Имя" chars={firstNameChars} className="block" />
        <div className="flex items-baseline gap-0.5">
          <span className="text-[10px]">Отчество<sup>1</sup></span>
          <CellRow chars={patronymicChars} />
        </div>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-2">
        <div className="flex items-baseline gap-0.5">
          <span className="text-[10px]">ИНН<sup>2</sup></span>
          <CellRow chars={innChars} />
        </div>
        <span className="inline-flex items-baseline gap-1">
          <span className="text-[10px]">Дата рождения</span>
          <DateCells {...birthDate} />
        </span>
      </div>

      <p className="text-[10px] mb-1">Сведения о документе, удостоверяющем личность:</p>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-1">
        <LabeledCells label="Код вида документа" chars={docCodeChars} />
        <LabeledCells label="Серия и номер" chars={docSeriesChars} />
      </div>
      <div className="mb-3">
        <span className="inline-flex items-baseline gap-1">
          <span className="text-[10px]">Дата выдачи</span>
          <DateCells {...issueDate} />
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

      <div className="flex items-baseline gap-4">
        <span className="text-[10px]">_______________</span>
        <span className="text-[8px] text-gray-500">(подпись)</span>
        <span className="inline-flex items-baseline gap-1 ml-auto">
          <DateCells {...signDate} />
        </span>
        <span className="text-[8px] text-gray-500">(дата)</span>
      </div>
    </div>
  );
}
