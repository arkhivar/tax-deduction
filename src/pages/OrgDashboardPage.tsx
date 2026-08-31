import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { RefreshCw, Pencil, Printer, Search, Filter, CheckCircle, Link2, Plus, Sparkles, Copy, Check, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { getPublicOrigin } from '../lib/publicLink';
import type { Certificate, Organization } from '../types/certificate';
import { useOrg } from '../contexts/OrgContext';
import { OrgLayout } from '../components/org/OrgLayout';
import { CreateCertificateDialog } from '../components/org/CreateCertificateDialog';
import { InlineEditCell } from '../components/org/InlineEditCell';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Черновик', color: 'bg-yellow-100 text-yellow-800' },
  completed: { label: 'Завершена', color: 'bg-green-100 text-green-800' },
  printed: { label: 'Напечатана', color: 'bg-blue-100 text-blue-800' },
};

export function OrgDashboardPage() {
  usePageTitle('Личный кабинет');
  const { org, refreshOrg } = useOrg();
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [premiumSending, setPremiumSending] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (certId: string) => {
    const link = `${getPublicOrigin()}/${org?.slug || org?.inn}/${certId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(certId);
    setTimeout(() => setCopiedId((prev) => (prev === certId ? null : prev)), 2000);
  };

  const handleDelete = async (cert: Certificate) => {
    const name = `${cert.taxpayer_last_name} ${cert.taxpayer_first_name}`.trim();
    if (!window.confirm(`Удалить справку «${name}»? Действие необратимо.`)) return;
    const { error } = await api.certificates.delete(cert.id);
    if (!error) {
      setCertificates((prev) => prev.filter((c) => c.id !== cert.id));
    }
  };

  const publicLink = `${getPublicOrigin()}/${org?.slug || org?.inn}`;

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

  const handlePremiumRequest = async () => {
    if (!org) return;
    setPremiumSending(true);
    const { data } = await api.organizations.requestPremium(org.id);
    setPremiumSending(false);
    if (data) refreshOrg(data as Organization);
  };

  // Inline table editing (draft rows only): apply the PATCH response to local state
  const applyUpdate = async (id: string, fields: Record<string, unknown>): Promise<boolean> => {
    const { data, error } = await api.certificates.update(id, fields);
    if (error || !data) return false;
    setCertificates((prev) => prev.map((c) => (c.id === id ? { ...c, ...(data as Certificate) } : c)));
    return true;
  };

  const saveTaxpayerName = (cert: Certificate, raw: string) => {
    const parts = raw.split(/\s+/).filter(Boolean);
    if (parts.length < 2) return Promise.resolve(false);
    return applyUpdate(cert.id, {
      taxpayer_last_name: parts[0].toUpperCase(),
      taxpayer_first_name: parts[1].toUpperCase(),
      taxpayer_patronymic: parts.slice(2).join(' ').toUpperCase(),
    });
  };

  const saveAmount = (cert: Certificate, raw: string) => {
    const amount = parseFloat(raw.replace(/\s/g, '').replace(',', '.'));
    if (isNaN(amount) || amount < 0) return Promise.resolve(false);
    return applyUpdate(cert.id, { expense_amount: amount });
  };

  return (
    <OrgLayout>
      <div className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Link2 className="w-4 h-4 text-gray-400 shrink-0" />
            <code className="text-sm text-gray-700 truncate">{publicLink}</code>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3 pt-3 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              Плательщики находят вашу организацию только по ИНН. Хотите брендированную ссылку
              вида <code className="text-gray-800">{getPublicOrigin()}/speak</code>? Сделаем короткий
              узнаваемый адрес — бесплатно для организаций с оборотом до 10&nbsp;млн&nbsp;₽.
            </p>
            {org?.premium_requested_at ? (
              <span className="flex items-center gap-1.5 text-sm text-green-700 shrink-0">
                <CheckCircle className="w-4 h-4" />
                Заявка принята — мы свяжемся с вами
              </span>
            ) : (
              <button
                onClick={handlePremiumRequest}
                disabled={premiumSending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-900 hover:bg-gray-800
                  text-white text-sm font-medium transition-colors shrink-0 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {premiumSending ? 'Отправка...' : 'Хочу брендированную ссылку'}
              </button>
            )}
          </div>
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
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-colors"
              title="Новая справка"
            >
              <Plus className="w-4 h-4" />
              Новая справка
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
                          <InlineEditCell
                            value={`${cert.taxpayer_last_name} ${cert.taxpayer_first_name}${cert.taxpayer_patronymic ? ` ${cert.taxpayer_patronymic}` : ''}`}
                            disabled={cert.status !== 'draft'}
                            onSave={(raw) => saveTaxpayerName(cert, raw)}
                          >
                            {cert.taxpayer_last_name} {cert.taxpayer_first_name}
                            {cert.taxpayer_patronymic ? ` ${cert.taxpayer_patronymic}` : ''}
                          </InlineEditCell>
                        </td>
                        <td className="px-4 py-3 text-gray-900 text-right whitespace-nowrap font-mono">
                          <InlineEditCell
                            value={String(cert.expense_amount)}
                            disabled={cert.status !== 'draft'}
                            inputClassName="text-right font-mono"
                            onSave={(raw) => saveAmount(cert, raw)}
                          >
                            {formatAmount(cert.expense_amount)}
                          </InlineEditCell>
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
                              title="Редактировать"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCopyLink(cert.id)}
                              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                              title="Копировать ссылку для плательщика"
                            >
                              {copiedId === cert.id ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => navigate(`/org/print/${cert.id}`)}
                              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                              title="Печать"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(cert)}
                              className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                              title="Удалить"
                            >
                              <Trash2 className="w-4 h-4" />
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

      {createOpen && org && (
        <CreateCertificateDialog
          orgSlug={org.slug || org.inn}
          onClose={() => setCreateOpen(false)}
          onCreated={fetchCertificates}
        />
      )}
    </OrgLayout>
  );
}
