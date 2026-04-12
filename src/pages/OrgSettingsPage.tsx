import { useState, useRef } from 'react';
import { Upload, X, Save, CheckCircle, AlertCircle, Copy, Link2, Image, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useOrg } from '../contexts/OrgContext';
import { OrgLayout } from '../components/org/OrgLayout';
import type { Organization } from '../types/certificate';

function buildPublicLink(org: { slug: string; inn: string } | null) {
  if (!org) return '';
  return `${window.location.origin}/${org.slug}`;
}

export function OrgSettingsPage() {
  const { org, refreshOrg } = useOrg();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState(org?.full_name || '');
  const [fullNameSaving, setFullNameSaving] = useState(false);
  const [fullNameSaved, setFullNameSaved] = useState(false);
  const [fullNameError, setFullNameError] = useState('');

  const [signerName, setSignerName] = useState(org?.signer_full_name || '');
  const [signerPosition, setSignerPosition] = useState(org?.signer_position || '');

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newPinConfirm, setNewPinConfirm] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSaved, setPinSaved] = useState(false);

  const [copied, setCopied] = useState(false);
  const publicLink = buildPublicLink(org);

  const handleSaveFullName = async () => {
    if (!org) return;
    setFullNameSaving(true);
    setFullNameError('');
    const { data, error: dbError } = await supabase
      .from('organizations')
      .update({
        full_name: fullName.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', org.id)
      .select()
      .maybeSingle();

    setFullNameSaving(false);
    if (dbError || !data) {
      setFullNameError('Ошибка сохранения');
      return;
    }
    refreshOrg(data as Organization);
    setFullNameSaved(true);
    setTimeout(() => setFullNameSaved(false), 2000);
  };

  const handleSaveSigner = async () => {
    if (!org) return;
    setSaving(true);
    setError('');
    const { data, error: dbError } = await supabase
      .from('organizations')
      .update({
        signer_full_name: signerName.trim(),
        signer_position: signerPosition.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', org.id)
      .select()
      .maybeSingle();

    setSaving(false);
    if (dbError || !data) {
      setError('Ошибка сохранения');
      return;
    }
    refreshOrg(data as Organization);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleChangePin = async () => {
    if (!org) return;
    setPinError('');
    setPinSaved(false);

    if (currentPin !== org.pin_code) { setPinError('Неверный текущий ПИН-код'); return; }
    if (newPin.length !== 6) { setPinError('Новый ПИН-код должен содержать 6 цифр'); return; }
    if (newPin !== newPinConfirm) { setPinError('ПИН-коды не совпадают'); return; }

    const { data, error: dbError } = await supabase
      .from('organizations')
      .update({ pin_code: newPin, updated_at: new Date().toISOString() })
      .eq('id', org.id)
      .select()
      .maybeSingle();

    if (dbError || !data) { setPinError('Ошибка сохранения'); return; }
    refreshOrg(data as Organization);
    setCurrentPin('');
    setNewPin('');
    setNewPinConfirm('');
    setPinSaved(true);
    setTimeout(() => setPinSaved(false), 2000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <OrgLayout>
      <div className="max-w-2xl space-y-6">
        <Section title="Публичная ссылка">
          <p className="text-sm text-gray-600 mb-3">
            Поделитесь этой ссылкой с плательщиками. Данные вашей организации будут предзаполнены.
          </p>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
            <Link2 className="w-4 h-4 text-gray-400 shrink-0" />
            <code className="flex-1 text-sm text-gray-700 truncate">{publicLink}</code>
            <button onClick={handleCopy} className="shrink-0 p-1.5 rounded-md hover:bg-gray-200 text-gray-500 transition-colors">
              {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          {org && org.slug === org.inn && (
            <div className="flex items-start gap-2 mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                Хотите красивый короткий адрес вместо ИНН? Свяжитесь с администратором для подключения.
              </p>
            </div>
          )}
        </Section>

        <Section title="Полное наименование организации">
          <p className="text-sm text-gray-600 mb-3">
            Полное официальное наименование без сокращений. Используется при заполнении справок вместо краткого названия.
          </p>
          {fullNameError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-3">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{fullNameError}</p>
            </div>
          )}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Краткое название</label>
              <input
                value={org?.name || ''}
                disabled
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Полное наименование</label>
              <textarea
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder='Общество с ограниченной ответственностью "Пример"'
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 placeholder:text-gray-400 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                Если не заполнено, в справках будет использоваться краткое название.
              </p>
            </div>
            <button
              onClick={handleSaveFullName}
              disabled={fullNameSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {fullNameSaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {fullNameSaving ? 'Сохранение...' : fullNameSaved ? 'Сохранено' : 'Сохранить'}
            </button>
          </div>
        </Section>

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
              <input
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Фамилия Имя Отчество"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Должность</label>
              <input
                value={signerPosition}
                onChange={(e) => setSignerPosition(e.target.value)}
                placeholder="Директор"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 placeholder:text-gray-400"
              />
            </div>
            <button
              onClick={handleSaveSigner}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? 'Сохранение...' : saved ? 'Сохранено' : 'Сохранить'}
            </button>
          </div>
        </Section>

        <ImageUploadSection label="QR-код" field="qr_code_url" fileName="qr" />
        <ImageUploadSection label="Печать (штамп)" field="stamp_url" fileName="stamp" />
        <ImageUploadSection label="Факсимиле подписи" field="facsimile_url" fileName="facsimile" />

        <Section title="Смена ПИН-кода">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Текущий ПИН-код</label>
              <input
                type="password"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                placeholder="6 цифр"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 placeholder:text-gray-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Новый ПИН</label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  placeholder="6 цифр"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Повторите</label>
                <input
                  type="password"
                  value={newPinConfirm}
                  onChange={(e) => setNewPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  placeholder="6 цифр"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 placeholder:text-gray-400"
                />
              </div>
            </div>
            <button
              onClick={handleChangePin}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
            >
              Сменить ПИН-код
            </button>
          </div>
        </Section>
      </div>
    </OrgLayout>
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

function ImageUploadSection({
  label,
  field,
  fileName,
}: {
  label: string;
  field: 'qr_code_url' | 'stamp_url' | 'facsimile_url';
  fileName: string;
}) {
  const { org, refreshOrg } = useOrg();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const currentUrl = org?.[field];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !org) return;

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

    const ext = file.name.split('.').pop() || 'png';
    const path = `${org.id}/${fileName}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('org-assets')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setError('Ошибка загрузки');
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('org-assets').getPublicUrl(path);

    const { data, error: dbError } = await supabase
      .from('organizations')
      .update({ [field]: urlData.publicUrl, updated_at: new Date().toISOString() })
      .eq('id', org.id)
      .select()
      .maybeSingle();

    setUploading(false);
    if (dbError || !data) {
      setError('Ошибка сохранения');
      return;
    }
    refreshOrg(data as Organization);
  };

  const handleRemove = async () => {
    if (!org) return;
    const { data, error: dbError } = await supabase
      .from('organizations')
      .update({ [field]: null, updated_at: new Date().toISOString() })
      .eq('id', org.id)
      .select()
      .maybeSingle();

    if (!dbError && data) refreshOrg(data as Organization);
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
