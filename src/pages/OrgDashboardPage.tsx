import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { RefreshCw, Eye, Printer, Search, Filter, Copy, CheckCircle, Link2 } from 'lucide-react';
import { api } from '../lib/api';
import type { Certificate } from '../types/certificate';
import { useOrg } from '../contexts/OrgContext';
import { OrgLayout } from '../components/org/OrgLayout';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Черновик', color: 'bg-yellow-100 text-yellow-800' },
  completed: { label: 'Завершена', color: 'bg-green-100 text-green-800' },
  printed: { label: 'Напечатана', color: 'bg-blue-100 text-blue-800' },
};

export function OrgDashboardPage() {
  usePageTitle('Личный кабинет');
  const { org } = useOrg();
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const publicLink = `${window.location.origin}/${org?.slug || org?.inn}`;

  const fetchCertificates = async () => {
    if (!org) return;
    setLoading(true);
    const { data } = await api.certificates.list({
      orgId: org.id,
      status: statusFilter,
    });
    setCertificates(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCertificates();
  }, [statusFilter, org?.id]);

  const filtered = certificates.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.taxpayer_last_name.toLowerCase().includes(q) ||
      c.taxpayer_first_name.toLowerCase().includes(q) ||
      c.org_name.toLowerCase().includes(q) ||
      c.org_inn.includes(q)
    );
  });

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2,
    }).format(amount);

  const handleCopy = () => {
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = {
    total: certificates.length,
    draft: certificates.filter((c) => c.status === 'draft').length,
    completed: certificates.filter((c) => c.status === 'completed').length,
    printed: certificates.filter((c) => c.status === 'printed').length,
  };

  return (
    <OrgLayout>
      <div className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link2 className="w-4 h-4 text-gray-400" />
              <code className="text-sm text-gray-700 truncate">{publicLink}</code>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-300
                bg-white hover:bg-gray-50 text-sm text-gray-700 transition-colors shrink-0"
            >
              {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Скопировано' : 'Копировать ссылку'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Всего', value: stats.total, color: 'text-gray-900' },
            { label: 'Черновики', value: stats.draft, color: 'text-yellow-700' },
            { label: 'Завершены', value: stats.completed, color: 'text-green-700' },
            { label: 'Напечатаны', value: stats.printed, color: 'text-blue-700' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по ФИО, ИНН..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
                placeholder:text-gray-400"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-9 pr-8 py-2.5 rounded-lg border border-gray-300 bg-white text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
                  appearance-none cursor-pointer"
              >
                <option value="all">Все статусы</option>
                <option value="draft">Черновики</option>
                <option value="completed">Завершённые</option>
                <option value="printed">Напечатанные</option>
              </select>
            </div>
            <button
              onClick={fetchCertificates}
              className="p-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
              title="Обновить"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500 text-sm">Загрузка...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm">
              {searchQuery ? 'Ничего не найдено' : 'Справки отсутствуют. Поделитесь ссылкой с плательщиками.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/60">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Дата</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Налогоплательщик</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Сумма</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Статус</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((cert) => {
                    const status = STATUS_LABELS[cert.status] || STATUS_LABELS.draft;
                    return (
                      <tr key={cert.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {formatDate(cert.created_at)}
                        </td>
                        <td className="px-4 py-3 text-gray-900 font-medium">
                          {cert.taxpayer_last_name} {cert.taxpayer_first_name}
                          {cert.taxpayer_patronymic ? ` ${cert.taxpayer_patronymic}` : ''}
                        </td>
                        <td className="px-4 py-3 text-gray-900 text-right whitespace-nowrap font-mono">
                          {formatAmount(cert.expense_amount)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => navigate(`/org/certificates/${cert.id}`)}
                              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                              title="Просмотреть"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => navigate(`/org/print/${cert.id}`)}
                              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                              title="Печать"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </OrgLayout>
  );
}
