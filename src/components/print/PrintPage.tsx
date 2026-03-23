import type { Certificate } from '../../types/certificate';
import { CellRow, LabeledCells, DateCells } from './CellRow';
import {
  padChars,
  formatDateToCells,
  formatAmountToCells,
  splitTextToLines,
} from './printHelpers';

interface PrintPageProps {
  cert: Certificate;
}

export function PrintPage({ cert }: PrintPageProps) {
  const orgInnChars = padChars(cert.org_inn, 12);
  const orgKppChars = padChars(cert.org_kpp, 9);
  const certNumChars = padChars(cert.certificate_number, 12);
  const corrNumChars = padChars(cert.correction_number.padStart(3, '0'), 3);
  const yearChars = padChars(cert.report_year, 4);
  const orgNameLines = splitTextToLines(cert.org_name, 40);
  const lastNameChars = padChars(cert.taxpayer_last_name, 36);
  const firstNameChars = padChars(cert.taxpayer_first_name, 36);
  const patronymicChars = padChars(cert.taxpayer_patronymic, 36);
  const taxInnChars = padChars(cert.taxpayer_inn, 12);
  const birthDate = formatDateToCells(cert.taxpayer_birth_date);
  const docCodeChars = padChars(cert.doc_type_code, 2);
  const docSeriesChars = padChars(cert.doc_series_number, 20);
  const issueDate = formatDateToCells(cert.doc_issue_date);
  const amount = formatAmountToCells(cert.expense_amount);
  const signerLines = splitTextToLines(cert.signer_full_name, 20);
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
            <LabeledCells label="ИНН" chars={orgInnChars} />
          </div>
          <div className="flex items-baseline gap-2">
            <LabeledCells label="КПП" chars={orgKppChars} />
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
        <LabeledCells label="Номер справки" chars={certNumChars} />
        <LabeledCells label="Номер корректировки" chars={corrNumChars} />
        <span className="inline-flex items-baseline gap-1">
          <span className="text-[10px]">Отчетный год</span>
          <CellRow chars={yearChars} />
        </span>
      </div>

      <div className="mb-2">
        <p className="text-[10px] mb-1">
          Данные образовательной организации/индивидуального предпринимателя,
          осуществляющего образовательную деятельность:
        </p>
        {orgNameLines.map((line, i) => (
          <div key={i} className="mb-0.5">
            <CellRow chars={line} />
          </div>
        ))}
        <p className="text-[8px] text-gray-500 text-center mt-0.5">
          (наименование образовательной организации/фамилия, имя, отчество
          <sup>1</sup> индивидуального предпринимателя)
        </p>
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-[10px]">Обучение проводилось на очной форме обучения</span>
        <CellRow chars={[String(cert.is_full_time)]} />
        <span className="text-[9px] text-gray-600 ml-2">0 - нет / 1 - да</span>
      </div>

      <p className="text-[10px] mb-2">
        Данные физического лица (его супруга/супруги), оплатившего образовательные услуги
        (далее - налогоплательщик)
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
          <CellRow chars={taxInnChars} />
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

      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-[10px]">Налогоплательщик и обучаемый являются одним лицом</span>
        <CellRow chars={[String(cert.is_same_person)]} />
        <span className="text-[9px] text-gray-600 ml-2">0 - нет / 1 - да</span>
      </div>

      <div className="flex items-baseline gap-1 mb-6">
        <span className="text-[10px]">Сумма расходов на оказанные образовательные услуги</span>
        <CellRow chars={amount.integer} />
        <span className="text-[10px] font-bold">0</span>
        <span className="text-[10px]">.</span>
        <CellRow chars={amount.decimal} />
      </div>

      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-center text-[10px] mb-2">
            <div className="font-bold">Достоверность и полноту сведений,</div>
            <div className="font-bold">указанных в настоящей справке,</div>
            <div className="font-bold">подтверждаю:</div>
          </div>
          {signerLines.slice(0, 3).map((line, i) => (
            <div key={i} className="mb-0.5">
              <CellRow chars={line} />
            </div>
          ))}
          <p className="text-[8px] text-gray-500 text-center mt-0.5">(фамилия, имя, отчество)</p>
        </div>
        <div className="border border-gray-400 w-24 h-24 flex items-center justify-center text-[9px] text-gray-400">
          Зона QR-кода
        </div>
      </div>

      <div className="flex items-baseline gap-4 mb-4">
        <span className="text-[10px]">Подпись _______________</span>
        <span className="inline-flex items-baseline gap-1">
          <span className="text-[10px]">Дата</span>
          <DateCells {...signDate} />
        </span>
      </div>

      <div className="flex items-baseline gap-1 mb-8">
        <span className="text-[10px]">Справка составлена на</span>
        <CellRow chars={padChars('2', 3)} />
        <span className="text-[10px]">страницах</span>
      </div>

      <div className="border-t border-gray-300 pt-2 text-[8px] text-gray-500 space-y-0.5">
        <p><sup>1</sup> Отчество указывается при наличии (относится ко всем листам документа).</p>
        <p><sup>2</sup> ИНН указывается при наличии.</p>
      </div>
    </div>
  );
}
