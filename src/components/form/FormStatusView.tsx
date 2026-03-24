import { FileText, Clock, CheckCircle, Printer } from 'lucide-react';
import type { Certificate } from '../../types/certificate';

interface FormStatusViewProps {
  cert: Certificate;
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; color: string; bg: string }> = {
  draft: {
    label: 'На рассмотрении',
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  completed: {
    label: 'Готова',
    icon: CheckCircle,
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  printed: {
    label: 'Напечатана',
    icon: Printer,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
};

export function FormStatusView({ cert }: FormStatusViewProps) {
  const config = STATUS_CONFIG[cert.status] || STATUS_CONFIG.draft;
  const StatusIcon = config.icon;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 pt-8 pb-6 text-center">
            <div className={`inline-flex items-center justify-center w-14 h-14 ${config.bg} rounded-full mb-5`}>
              <StatusIcon className={`w-7 h-7 ${config.color}`} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">Статус справки</h1>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium mt-2 ${config.bg} ${config.color}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {config.label}
            </div>
          </div>

          <div className="border-t border-gray-100 px-6 py-5 space-y-3">
            <Row label="Налогоплательщик" value={`${cert.taxpayer_last_name} ${cert.taxpayer_first_name} ${cert.taxpayer_patronymic}`.trim()} />
            <Row label="Организация" value={cert.org_name} />
            <Row
              label="Сумма"
              value={`${Number(cert.expense_amount).toLocaleString('ru-RU', { minimumFractionDigits: 2 })} руб.`}
            />
            <Row label="Дата подачи" value={formatDate(cert.created_at)} />
            {cert.sign_date && (
              <Row
                label="Дата подписи"
                value={new Date(cert.sign_date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })}
              />
            )}
          </div>

          <div className="border-t border-gray-100 px-6 py-4">
            <div className="flex items-start gap-2.5 text-xs text-gray-500">
              <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <p>Вы можете вернуться на эту страницу в любое время, чтобы проверить статус вашей справки. Сохраните ссылку в закладках.</p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          ID: {cert.id.slice(0, 8)}
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline gap-4">
      <span className="text-xs text-gray-500 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 text-right truncate">{value}</span>
    </div>
  );
}
