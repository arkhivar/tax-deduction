import { useState, useEffect } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import {
  Clock, Cpu, MemoryStick, LogIn, ShieldAlert, CheckCircle, XCircle, Building2, RefreshCw,
} from 'lucide-react';
import { api } from '../lib/api';
import type { AdminOverview } from '../lib/api';
import { AdminLayout } from '../components/admin/AdminLayout';

function formatUptime(sec: number) {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d}д ${h}ч`;
  if (h > 0) return `${h}ч ${m}м`;
  return `${m}м`;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AdminHomePage() {
  usePageTitle('Административная панель');
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    setLoading(true);
    const { data } = await api.admin.overview();
    if (data) setData(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const sys = data?.system;
  const memUsedPct = sys ? Math.round(((sys.memTotalMb - sys.memFreeMb) / sys.memTotalMb) * 100) : 0;

  return (
    <AdminLayout title="Обзор">
      <div className="space-y-5">
        {loading && !data ? (
          <div className="p-12 text-center text-gray-500 text-sm">Загрузка...</div>
        ) : !data || !sys ? (
          <div className="p-12 text-center text-gray-500 text-sm">Не удалось загрузить данные</div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                <LogIn className="w-4 h-4 text-green-500" />
                <div className="text-sm">
                  <span className="text-gray-500">Входы за 24ч:</span>{' '}
                  <span className="font-semibold text-gray-900">{data.logins24h}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                <div className="text-sm">
                  <span className="text-gray-500">Неудачные попытки:</span>{' '}
                  <span className="font-semibold text-red-600">{data.failed24h}</span>{' '}
                  <span className="text-gray-400 text-xs">за 24ч / {data.failed7d} за 7д</span>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                <Clock className="w-4 h-4 text-blue-500" />
                <div className="text-sm">
                  <span className="text-gray-500">Аптайм:</span>{' '}
                  <span className="font-semibold text-gray-900">{formatUptime(sys.hostUptimeSec)}</span>{' '}
                  <span className="text-gray-400 text-xs">API {formatUptime(sys.apiUptimeSec)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                <Cpu className="w-4 h-4 text-violet-500" />
                <div className="text-sm">
                  <span className="text-gray-500">Load:</span>{' '}
                  <span className="font-semibold text-gray-900">{sys.loadavg.join(' / ')}</span>{' '}
                  <span className="text-gray-400 text-xs">{sys.cpus} CPU</span>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                <MemoryStick className="w-4 h-4 text-teal-500" />
                <div className="text-sm">
                  <span className="text-gray-500">RAM:</span>{' '}
                  <span className="font-semibold text-gray-900">{memUsedPct}%</span>{' '}
                  <span className="text-gray-400 text-xs">
                    {sys.memTotalMb - sys.memFreeMb} / {sys.memTotalMb} МБ
                  </span>
                </div>
              </div>
              <button
                onClick={fetchOverview}
                className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
                title="Обновить"
              >
                <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/60">
                <h2 className="text-sm font-medium text-gray-700">Последние входы</h2>
              </div>
              {data.recentEvents.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">Событий пока нет</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-100">
                      {data.recentEvents.map((e, i) => (
                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{formatTime(e.created_at)}</td>
                          <td className="px-4 py-2.5">
                            {e.role === 'admin' ? (
                              <span className="text-gray-900 font-medium">Администратор</span>
                            ) : (
                              <span className="text-gray-900">
                                {e.org_name || <span className="font-mono text-gray-500">{e.inn || '—'}</span>}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            {e.success ? (
                              <span className="inline-flex items-center gap-1 text-xs text-green-700">
                                <CheckCircle className="w-3.5 h-3.5" /> успешно
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-red-600">
                                <XCircle className="w-3.5 h-3.5" /> отказ
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-xs text-gray-400">{e.ip || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/60">
                <h2 className="text-sm font-medium text-gray-700">Активные организации за 7 дней</h2>
              </div>
              {data.activeOrgs.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">Никто не входил за последние 7 дней</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {data.activeOrgs.map((o) => (
                    <div key={o.id} className="flex items-center gap-3 px-4 py-2.5">
                      <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-900 truncate flex-1">{o.name || o.inn}</span>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{formatTime(o.last_login_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-xs text-gray-400">
              Node {sys.node} · глубокий мониторинг — в Zabbix
            </p>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
