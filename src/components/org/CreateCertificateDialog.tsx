import { useEffect, useRef, useState } from 'react';
import { X, Link2, Copy, Check } from 'lucide-react';
import { api } from '../../lib/api';
import { FormField } from '../ui/FormField';
import { Input } from '../ui/Input';

interface CreateCertificateDialogProps {
  orgSlug: string;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateCertificateDialog({ orgSlug, onClose, onCreated }: CreateCertificateDialogProps) {
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [patronymic, setPatronymic] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const lastNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    lastNameRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const canSubmit = lastName.trim() !== '' && firstName.trim() !== '' && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');

    const parsed = amount.trim() === '' ? undefined : parseFloat(amount.replace(',', '.'));
    if (parsed !== undefined && (!Number.isFinite(parsed) || parsed < 0)) {
      setError('Сумма должна быть неотрицательным числом');
      setSubmitting(false);
      return;
    }

    const { data, error: apiError } = await api.certificates.createDraft({
      taxpayer_last_name: lastName.trim(),
      taxpayer_first_name: firstName.trim(),
      taxpayer_patronymic: patronymic.trim() || undefined,
      expense_amount: parsed,
    });
    setSubmitting(false);

    if (apiError || !data) {
      setError(apiError?.message || 'Не удалось создать черновик. Попробуйте ещё раз.');
      return;
    }

    setShareLink(`${window.location.origin}/${orgSlug}/${data.id}`);
    setCopied(false);
    setLastName('');
    setFirstName('');
    setPatronymic('');
    setAmount('');
    lastNameRef.current?.focus();
    onCreated();
  };

  const handleCopy = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl border border-gray-200 shadow-lg w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Новая справка</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            title="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Фамилия" required>
            <Input
              ref={lastNameRef}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Иванов"
            />
          </FormField>
          <FormField label="Имя" required>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Иван"
            />
          </FormField>
          <FormField label="Отчество">
            <Input
              value={patronymic}
              onChange={(e) => setPatronymic(e.target.value)}
              placeholder="Иванович"
            />
          </FormField>
          <FormField label="Сумма" hint="можно заполнить позже">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </FormField>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm text-gray-700 transition-colors"
            >
              Закрыть
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>

        {shareLink && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-1.5">
              Черновик создан. Отправьте ссылку плательщику, чтобы он заполнил остальное:
            </p>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-2.5">
              <Link2 className="w-4 h-4 text-gray-400 shrink-0" />
              <code className="flex-1 text-xs text-gray-700 truncate">{shareLink}</code>
              <button
                onClick={handleCopy}
                className="shrink-0 p-1.5 rounded-md hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                title="Копировать ссылку"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
