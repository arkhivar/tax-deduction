import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle, Printer, Plus, Link2, Copy, Check } from 'lucide-react';
import type { Certificate } from '../../types/certificate';
import { getPublicUrl } from '../../lib/publicLink';

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
  const [copied, setCopied] = useState(false);
  const shareUrl = getPublicUrl();
  const displayUrl = shareUrl.length > 44 ? `${shareUrl.slice(0, 44)}…` : shareUrl;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}`;
  const vkUrl = `https://vk.com/share.php?url=${encodeURIComponent(shareUrl)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const config = STATUS_CONFIG[cert.status] || STATUS_CONFIG.draft;
  const StatusIcon = config.icon;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
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
                value={new Date(cert.sign_date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              />
            )}
          </div>

          <div className="border-t border-gray-100 px-6 py-4 space-y-4">
            <div className="flex items-start gap-2.5 text-xs text-gray-500">
              <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <p>Вы можете вернуться на эту страницу в любое время, чтобы проверить статус вашей справки. Сохраните ссылку в закладках.</p>
            </div>

            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
              <Link2 className="w-4 h-4 text-gray-400 shrink-0" />
              <code className="flex-1 text-sm text-gray-700 truncate text-left">{displayUrl}</code>
              <button
                onClick={handleCopy}
                className="shrink-0 p-2 rounded-md hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                title="Копировать ссылку"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Поделиться:</span>
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#229ED9]/10 text-[#229ED9] text-xs font-medium hover:bg-[#229ED9]/20 transition-colors"
              >
                Telegram
              </a>
              <a
                href={vkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#0077FF]/10 text-[#0077FF] text-xs font-medium hover:bg-[#0077FF]/20 transition-colors"
              >
                VK
              </a>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Заполнить новую форму
          </Link>
        </div>

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
