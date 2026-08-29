import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, X, Save, CheckCircle, AlertCircle, Copy, Link2, Image, Info, ArrowLeft,
} from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { api } from '../lib/api';
import { useOrg } from '../contexts/OrgContext';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { OrgLayout } from '../components/org/OrgLayout';
import { AdminLayout } from '../components/admin/AdminLayout';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { SignerNameInput } from '../components/ui/SignerNameInput';
import type { Organization } from '../types/certificate';

function buildPublicLink(org: { slug: string } | null) {
  if (!org) return '';
  return `${window.location.origin}/${org.slug}`;
}

interface OrgSettingsPageProps {
  /** If set, the page is rendered in admin mode editing this org. */
  adminOrgId?: string;
}

export function OrgSettingsPage({ adminOrgId }: OrgSettingsPageProps) {
  const isAdminMode = Boolean(adminOrgId);
  const { org: sessionOrg, refreshOrg: refreshSessionOrg } = useOrg();
  const { isAdmin } = useAdminAuth();
  const navigate = useNavigate();

  // Admin mode must be authenticated as admin
  if (isAdminMode && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-500">Доступ запрещён</p>
      </div>
    );
  }

  return (
    <OrgSettingsPageInner
      adminOrgId={adminOrgId}
      sessionOrg={sessionOrg}
      refreshSessionOrg={refreshSessionOrg}
      onNavigateBack={isAdminMode ? () => navigate('/admin') : undefined}
    />
  );
}

interface OrgSettingsPageInnerProps {
  adminOrgId?: string;
  sessionOrg: Organization | null;
  refreshSessionOrg: (updated: Organization) => void;
  onNavigateBack?: () => void;
}

function OrgSettingsPageInner({
  adminOrgId,
  sessionOrg,
  refreshSessionOrg,
  onNavigateBack,
}: OrgSettingsPageInnerProps) {
  const isAdminMode = Boolean(adminOrgId);
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  usePageTitle(isAdminMode ? 'Настройки организации (админ)' : 'Настройки организации');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');

      if (isAdminMode && adminOrgId) {
        const { data, error: apiError } = await api.organizations.get(adminOrgId);
        if (!cancelled) {
          if (apiError || !data) {
            setError('Не удалось загрузить организацию');
            setOrg(null);
          } else {
            setOrg(data as Organization);
          }
          setLoading(false);
        }
      } else {
        if (!cancelled) {
          setOrg(sessionOrg);
          setLoading(false);
        }
      }
    };

    load();
    return () => { cancelled = true; };
  }, [adminOrgId, isAdminMode, sessionOrg]);

  const refreshOrg = (updated: Organization) => {
    setOrg(updated);
    // If the currently logged-in org happens to be the one being edited, keep session in sync
    if (!isAdminMode && sessionOrg?.id === updated.id) {
      refreshSessionOrg(updated);
    }
  };

  const Layout = isAdminMode ? AdminLayout : OrgLayout;

  if (loading) {
    return (
      <Layout title="Настройки организации">
        <div className="p-12 text-center text-gray-500 text-sm">Загрузка...</div>
      </Layout>
    );
  }

  if (!org) {
    return (
      <Layout title="Настройки организации">
        <div className="p-12 text-center text-red-600 text-sm">
          {error || 'Организация не найдена'}
        </div>
      </Layout>
    );
  }

  const title = isAdminMode ? `Настройки: ${org.name || org.inn}` : 'Настройки организации';

  return (
    <Layout title={title} onBack={isAdminMode ? onNavigateBack : undefined}>
      <div className="max-w-2xl space-y-6">
        {isAdminMode && (
          <button
            onClick={onNavigateBack}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад к списку
          </button>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <PublicLinkSection org={org} isAdminMode={isAdminMode} />
        <FullNameSection org={org} onUpdate={refreshOrg} />
        <SignerSection org={org} onUpdate={refreshOrg} />
        <ImageUploadSection org={org} label="QR-код" field="qr_code_url" onUpdate={refreshOrg} />
        <ImageUploadSection org={org} label="Печать (штамп)" field="stamp_url" onUpdate={refreshOrg} />
        <ImageUploadSection org={org} label="Факсимиле подписи" field="facsimile_url" onUpdate={refreshOrg} />
        <PinSection org={org} onUpdate={refreshOrg} isAdminMode={isAdminMode} />
      </div>
    </Layout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 pb-3 border-b border-gray-100 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function PublicLinkSection({ org, isAdminMode }: { org: Organization; isAdminMode: boolean }) {
  const [copied, setCopied] = useState(false);
  const publicLink = buildPublicLink(org);

  const handleCopy = () => {
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Section title="Публичная ссылка">
      <p className="text-sm text-gray-600 mb-3">
        Поделитесь этой ссылкой с плательщиками. Данные организации будут предзаполнены.
      </p>
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
        <Link2 className="w-4 h-4 text-gray-400 shrink-0" />
        <code className="flex-1 text-sm text-gray-700 truncate">{publicLink}</code>
        <button onClick={handleCopy} className="shrink-0 p-1.5 rounded-md hover:bg-gray-200 text-gray-500 transition-colors">
          {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      {org && org.slug === org.inn && !isAdminMode && (
        <div className="flex items-start gap-2 mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            Хотите красивый короткий адрес вместо ИНН? Свяжитесь с администратором для подключения.
          </p>
        </div>
      )}
    </Section>
  );
}

function FullNameSection({ org, onUpdate }: { org: Organization; onUpdate: (o: Organization) => void }) {
  const [fullName, setFullName] = useState(org?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFullName(org?.full_name || '');
  }, [org?.full_name]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    const { data, error: dbError } = await api.organizations.update(org.id, {
      full_name: fullName.trim() || null,
    });

    setSaving(false);
    if (dbError || !data) {
      setError('Ошибка сохранения');
      return;
    }
    onUpdate(data as Organization);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Section title="Полное наименование организации">
      <p className="text-sm text-gray-600 mb-3">
        Полное официальное наименование без сокращений. Используется при заполнении справок вместо краткого названия.
      </p>
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-3">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Краткое название</label>
          <input
            value={(org?.name || '').toUpperCase()}
            disabled
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500 cursor-not-allowed uppercase"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Полное наименование</label>
          <Textarea
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder='Общество с ограниченной ответственностью "Пример"'
            rows={3}
            uppercase
          />
          <p className="text-xs text-gray-400 mt-1">
            Если не заполнено, в справках будет использоваться краткое название.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Сохранение...' : saved ? 'Сохранено' : 'Сохранить'}
        </button>
      </div>
    </Section>
  );
}

function SignerSection({ org, onUpdate }: { org: Organization; onUpdate: (o: Organization) => void }) {
  const [signerName, setSignerName] = useState(org?.signer_full_name || '');
  const [signerPosition, setSignerPosition] = useState(org?.signer_position || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setSignerName(org?.signer_full_name || '');
    setSignerPosition(org?.signer_position || '');
  }, [org?.signer_full_name, org?.signer_position]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    const { data, error: dbError } = await api.organizations.update(org.id, {
      signer_full_name: signerName.trim(),
      signer_position: signerPosition.trim(),
    });

    setSaving(false);
    if (dbError || !data) {
      setError('Ошибка сохранения');
      return;
    }
    onUpdate(data as Organization);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Section title="Подписант по умолчанию">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-3">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ФИО подписанта</label>
          <SignerNameInput
            value={signerName}
            onChange={(fullName) => setSignerName(fullName)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Должность</label>
          <Input
            value={signerPosition}
            onChange={(e) => setSignerPosition(e.target.value)}
            placeholder="Директор"
            uppercase
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Сохранение...' : saved ? 'Сохранено' : 'Сохранить'}
        </button>
      </div>
    </Section>
  );
}

function ImageUploadSection({
  org,
  label,
  field,
  onUpdate,
}: {
  org: Organization;
  label: string;
  field: 'qr_code_url' | 'stamp_url' | 'facsimile_url';
  onUpdate: (o: Organization) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const currentUrl = org[field];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Файл должен быть изображением');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Максимальный размер файла: 2 МБ');
      return;
    }

    setError('');
    setUploading(true);

    const { url: publicUrl, error: uploadError } = await api.uploadAsset(
      org.id,
      field === 'qr_code_url' ? 'qr' : field === 'stamp_url' ? 'stamp' : 'facsimile',
      file
    );

    if (uploadError || !publicUrl) {
      setError('Ошибка загрузки');
      setUploading(false);
      return;
    }

    const { data, error: dbError } = await api.organizations.update(org.id, { [field]: publicUrl });

    setUploading(false);
    if (dbError || !data) {
      setError('Ошибка сохранения');
      return;
    }
    onUpdate(data as Organization);
  };

  const handleRemove = async () => {
    const { data, error: dbError } = await api.organizations.update(org.id, { [field]: null });

    if (!dbError && data) onUpdate(data as Organization);
  };

  return (
    <Section title={label}>
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-3">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {currentUrl ? (
        <div className="flex items-start gap-4">
          <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
            <img src={currentUrl} alt={label} className="w-24 h-24 object-contain" />
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-sm text-gray-700 transition-colors disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              {uploading ? 'Загрузка...' : 'Заменить'}
            </button>
            <button
              onClick={handleRemove}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-red-200 bg-white hover:bg-red-50 text-sm text-red-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Удалить
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-3 w-full p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100 transition-colors text-sm text-gray-600 disabled:opacity-50"
        >
          <Image className="w-5 h-5 text-gray-400" />
          <span>{uploading ? 'Загрузка...' : `Загрузить ${label.toLowerCase()}`}</span>
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
    </Section>
  );
}

function PinSection({
  org,
  onUpdate,
  isAdminMode,
}: {
  org: Organization;
  onUpdate: (o: Organization) => void;
  isAdminMode: boolean;
}) {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newPinConfirm, setNewPinConfirm] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSaved, setPinSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChangePin = async () => {
    setPinError('');
    setPinSaved(false);

    if (!isAdminMode) {
      if (currentPin.length < 6 || currentPin.length > 8) { setPinError('Текущий ПИН-код должен содержать 6–8 цифр'); return; }
    }
    if (newPin.length !== 8) { setPinError('Новый ПИН-код должен содержать 8 цифр'); return; }
    if (newPin !== newPinConfirm) { setPinError('ПИН-коды не совпадают'); return; }

    setSaving(true);

    let result;
    if (isAdminMode) {
      // Admin resets PIN directly without knowing current PIN
      result = await api.organizations.update(org.id, { pin_code: newPin });
    } else {
      result = await api.organizations.changePin(org.id, currentPin, newPin);
    }

    setSaving(false);

    if (result.error || !result.data) {
      setPinError(result.error?.message || 'Ошибка сохранения');
      return;
    }
    onUpdate(result.data as Organization);
    setCurrentPin('');
    setNewPin('');
    setNewPinConfirm('');
    setPinSaved(true);
    setTimeout(() => setPinSaved(false), 2000);
  };

  return (
    <Section title={isAdminMode ? 'Сброс ПИН-кода' : 'Смена ПИН-кода'}>
      {pinError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-3">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{pinError}</p>
        </div>
      )}
      {pinSaved && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-3">
          <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
          <p className="text-sm text-green-700">ПИН-код изменён</p>
        </div>
      )}
      <div className="space-y-3">
        {!isAdminMode && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Текущий ПИН-код</label>
            <input
              type="password"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
              maxLength={8}
              placeholder="6–8 цифр"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 placeholder:text-gray-400"
            />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isAdminMode ? 'Новый ПИН' : 'Новый ПИН'}
            </label>
            <input
              type="password"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
              maxLength={8}
              placeholder="8 цифр"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 placeholder:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Повторите</label>
            <input
              type="password"
              value={newPinConfirm}
              onChange={(e) => setNewPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 8))}
              maxLength={8}
              placeholder="8 цифр"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 placeholder:text-gray-400"
            />
          </div>
        </div>
        <button
          onClick={handleChangePin}
          disabled={saving}
          className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors disabled:opacity-50"
        >
          {saving ? 'Сохранение...' : isAdminMode ? 'Сбросить ПИН-код' : 'Сменить ПИН-код'}
        </button>
      </div>
    </Section>
  );
}
