import { useState, useEffect, useRef } from 'react';
import {
  RefreshCw, Search, KeyRound, Copy, Check, Save, FileText, Clock,
  Pencil, X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Organization } from '../../types/certificate';
import { AdminLayout } from './AdminLayout';

interface OrgStats {
  org_id: string;
  total: number;
  pending: number;
}

interface OrganizationListProps {
  onBack: () => void;
}

const RESERVED_SLUGS = ['form', 'org', 'print', 'admin', 'api', 'login', 'register', 's'];

export function OrganizationList({ onBack }: OrganizationListProps) {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, OrgStats>>({});
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const noteInputRef = useRef<HTMLTextAreaElement>(null);

  const [editingSlugId, setEditingSlugId] = useState<string | null>(null);
  const [slugDraft, setSlugDraft] = useState('');
  const [slugError, setSlugError] = useState('');
  const [savingSlug, setSavingSlug] = useState(false);
  const slugInputRef = useRef<HTMLInputElement>(null);

  const fetchOrgs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });
    setOrgs(data || []);
    setLoading(false);
  };

  const fetchStats = async () => {
    const { data } = await supabase
      .from('education_certificates')
      .select('org_id, status');

    if (!data) return;

    const map: Record<string, OrgStats> = {};
    let globalTotal = 0;
    let globalPending = 0;

    for (const row of data) {
      if (!row.org_id) continue;
      if (!map[row.org_id]) {
        map[row.org_id] = { org_id: row.org_id, total: 0, pending: 0 };
      }
      map[row.org_id].total++;
      globalTotal++;
      if (row.status === 'draft') {
        map[row.org_id].pending++;
        globalPending++;
      }
    }

    map['__global__'] = { org_id: '__global__', total: globalTotal, pending: globalPending };
    setStats(map);
  };

  useEffect(() => {
    fetchOrgs();
    fetchStats();
  }, []);

  useEffect(() => {
    if (editingNoteId && noteInputRef.current) {
      noteInputRef.current.focus();
    }
  }, [editingNoteId]);

  useEffect(() => {
    if (editingSlugId && slugInputRef.current) {
      slugInputRef.current.focus();
      slugInputRef.current.select();
    }
  }, [editingSlugId]);

  const resetPin = async (orgId: string) => {
    setResettingId(orgId);
    const newPin = String(Math.floor(100000 + Math.random() * 900000));
    const { error } = await supabase
      .from('organizations')
      .update({ pin_code: newPin, updated_at: new Date().toISOString() })
      .eq('id', orgId);

    if (!error) {
      setOrgs((prev) =>
        prev.map((o) => (o.id === orgId ? { ...o, pin_code: newPin } : o))
      );
    }
    setResettingId(null);
  };

  const copyPin = (orgId: string, pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedId(orgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const startEditNote = (org: Organization) => {
    setEditingNoteId(org.id);
    setNotesDraft((prev) => ({ ...prev, [org.id]: org.admin_notes || '' }));
  };

  const saveNote = async (orgId: string) => {
    setSavingNoteId(orgId);
    const notes = notesDraft[orgId] ?? '';
    const { error } = await supabase
      .from('organizations')
      .update({ admin_notes: notes, updated_at: new Date().toISOString() })
      .eq('id', orgId);

    if (!error) {
      setOrgs((prev) =>
        prev.map((o) => (o.id === orgId ? { ...o, admin_notes: notes } : o))
      );
    }
    setSavingNoteId(null);
    setEditingNoteId(null);
  };

  const cancelEditNote = () => {
    setEditingNoteId(null);
  };

  const startEditSlug = (org: Organization) => {
    setEditingSlugId(org.id);
    setSlugDraft(org.slug);
    setSlugError('');
  };

  const cancelEditSlug = () => {
    setEditingSlugId(null);
    setSlugError('');
  };

  const saveSlug = async (orgId: string) => {
    setSlugError('');
    const trimmed = slugDraft.trim().toLowerCase();

    if (!trimmed) {
      setSlugError('Slug не может быть пустым');
      return;
    }
    if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(trimmed)) {
      setSlugError('Латинские буквы, цифры, дефис');
      return;
    }
    if (trimmed.length < 3) {
      setSlugError('Минимум 3 символа');
      return;
    }
    if (RESERVED_SLUGS.includes(trimmed)) {
      setSlugError('Зарезервировано');
      return;
    }

    setSavingSlug(true);
    const { error } = await supabase
      .from('organizations')
      .update({ slug: trimmed, updated_at: new Date().toISOString() })
      .eq('id', orgId);

    setSavingSlug(false);
    if (error) {
      if (error.code === '23505') {
        setSlugError('Уже занят');
      } else {
        setSlugError('Ошибка');
      }
      return;
    }

    setOrgs((prev) =>
      prev.map((o) => (o.id === orgId ? { ...o, slug: trimmed } : o))
    );
    setEditingSlugId(null);
  };

  const filtered = orgs.filter((o) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.inn.includes(q) ||
      o.name.toLowerCase().includes(q) ||
      (o.full_name || '').toLowerCase().includes(q) ||
      o.slug.toLowerCase().includes(q) ||
      (o.admin_notes || '').toLowerCase().includes(q)
    );
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const globalStats = stats['__global__'];
  const isPremiumSlug = (org: Organization) => org.slug !== org.inn;

  return (
    <AdminLayout title="Организации" onBack={onBack}>
      <div className="space-y-4">
        {globalStats && (
          <div className="flex gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
              <FileText className="w-4 h-4 text-blue-500" />
              <div className="text-sm">
                <span className="text-gray-500">Всего заявок:</span>{' '}
                <span className="font-semibold text-gray-900">{globalStats.total}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
              <Clock className="w-4 h-4 text-amber-500" />
              <div className="text-sm">
                <span className="text-gray-500">Ожидают:</span>{' '}
                <span className="font-semibold text-amber-600">{globalStats.pending}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по ИНН, названию, slug, заметкам..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
                placeholder:text-gray-400"
            />
          </div>
          <button
            onClick={() => { fetchOrgs(); fetchStats(); }}
            className="p-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
            title="Обновить"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="text-xs text-gray-500">
          Всего организаций: {orgs.length}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500 text-sm">Загрузка...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm">
              {searchQuery ? 'Ничего не найдено' : 'Организации отсутствуют'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/60">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Организация</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Slug</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Заявки</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Заметка</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Дата</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">PIN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((org) => {
                    const orgStat = stats[org.id];
                    const isEditingNote = editingNoteId === org.id;
                    const isEditingSlug = editingSlugId === org.id;
                    const premium = isPremiumSlug(org);

                    return (
                      <tr key={org.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 text-gray-900 max-w-[220px]">
                          <div
                            className="truncate font-medium cursor-default"
                            title={`ИНН: ${org.inn}${org.kpp ? ` / КПП: ${org.kpp}` : ''}${org.full_name ? `\n${org.full_name}` : ''}`}
                          >
                            {org.name || org.full_name || '-'}
                          </div>
                          <div className="text-[11px] text-gray-400 mt-0.5 font-mono">
                            {org.inn}{org.kpp ? ` / ${org.kpp}` : ''}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap max-w-[180px]">
                          {isEditingSlug ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <input
                                  ref={slugInputRef}
                                  value={slugDraft}
                                  onChange={(e) => setSlugDraft(e.target.value.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase().slice(0, 40))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveSlug(org.id);
                                    if (e.key === 'Escape') cancelEditSlug();
                                  }}
                                  maxLength={40}
                                  className="w-28 text-xs px-2 py-1 rounded border border-blue-300 bg-white
                                    focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-mono"
                                />
                                <button
                                  onClick={() => saveSlug(org.id)}
                                  disabled={savingSlug}
                                  className="p-1 rounded hover:bg-blue-50 text-blue-500 transition-colors"
                                  title="Сохранить"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={cancelEditSlug}
                                  className="p-1 rounded hover:bg-gray-100 text-gray-400 transition-colors"
                                  title="Отмена"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              {slugError && (
                                <p className="text-[11px] text-red-500">{slugError}</p>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 group">
                              <span className={`text-xs font-mono truncate ${premium ? 'text-teal-700 font-medium' : 'text-gray-500'}`}>
                                /{org.slug}
                              </span>
                              <button
                                onClick={() => startEditSlug(org)}
                                className="p-0.5 rounded hover:bg-gray-100 text-gray-300 hover:text-gray-500
                                  opacity-0 group-hover:opacity-100 transition-all"
                                title="Изменить slug"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {orgStat ? (
                            <div className="inline-flex items-center gap-1.5">
                              <span className="font-medium text-gray-900">{orgStat.total}</span>
                              {orgStat.pending > 0 && (
                                <span className="text-[11px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                                  {orgStat.pending}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-300">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 max-w-[200px]">
                          {isEditingNote ? (
                            <div className="flex items-start gap-1">
                              <textarea
                                ref={noteInputRef}
                                value={notesDraft[org.id] ?? ''}
                                onChange={(e) =>
                                  setNotesDraft((prev) => ({ ...prev, [org.id]: e.target.value }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    saveNote(org.id);
                                  }
                                  if (e.key === 'Escape') cancelEditNote();
                                }}
                                rows={2}
                                className="flex-1 text-xs px-2 py-1.5 rounded border border-blue-300 bg-white
                                  focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                                placeholder="Заметка..."
                              />
                              <button
                                onClick={() => saveNote(org.id)}
                                disabled={savingNoteId === org.id}
                                className="p-1 rounded hover:bg-blue-50 text-blue-500 hover:text-blue-600 transition-colors mt-0.5"
                                title="Сохранить"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => startEditNote(org)}
                              className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 transition-colors
                                truncate min-h-[20px] rounded px-1 py-0.5 -mx-1 hover:bg-gray-100"
                              title={org.admin_notes || 'Нажмите, чтобы добавить заметку'}
                            >
                              {org.admin_notes || (
                                <span className="text-gray-300 italic">+ заметка</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                          {formatDate(org.created_at)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex items-center gap-1">
                            <code className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-800">
                              {org.pin_code}
                            </code>
                            <button
                              onClick={() => copyPin(org.id, org.pin_code)}
                              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Копировать PIN"
                            >
                              {copiedId === org.id ? (
                                <Check className="w-3.5 h-3.5 text-green-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => resetPin(org.id)}
                              disabled={resettingId === org.id}
                              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-amber-600
                                disabled:opacity-50 transition-colors"
                              title="Сгенерировать новый PIN"
                            >
                              <KeyRound className={`w-3.5 h-3.5 ${resettingId === org.id ? 'animate-spin' : ''}`} />
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
    </AdminLayout>
  );
}
