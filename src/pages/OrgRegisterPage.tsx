import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, AlertCircle, CheckCircle, Copy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useOrg } from '../contexts/OrgContext';
import type { Organization } from '../types/certificate';

export function OrgRegisterPage() {
  const [inn, setInn] = useState('');
  const [kpp, setKpp] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registeredOrg, setRegisteredOrg] = useState<Organization | null>(null);
  const [copied, setCopied] = useState(false);
  const { login } = useOrg();
  const navigate = useNavigate();

  const publicLink = `${window.location.origin}/${registeredOrg?.slug || inn}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (inn.length !== 10) { setError('ИНН должен содержать 10 цифр'); return; }
    if (kpp.length !== 9) { setError('КПП должен содержать 9 цифр'); return; }
    if (!name.trim()) { setError('Укажите наименование организации'); return; }
    if (pin.length !== 6) { setError('ПИН-код должен содержать 6 цифр'); return; }
    if (pin !== pinConfirm) { setError('ПИН-коды не совпадают'); return; }

    setLoading(true);
    const { data, error: dbError } = await supabase
      .from('organizations')
      .insert([{
        inn,
        kpp,
        name: name.trim(),
        slug: inn,
        contact_email: email.trim() || null,
        pin_code: pin,
      }])
      .select()
      .maybeSingle();

    setLoading(false);

    if (dbError) {
      if (dbError.code === '23505') {
        setError('Организация с таким ИНН уже зарегистрирована');
      } else {
        setError('Ошибка регистрации. Попробуйте позже.');
      }
      return;
    }

    if (data) {
      const orgData = data as Organization;
      login(orgData);
      setRegisteredOrg(orgData);
      setRegistered(true);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (registered) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Организация зарегистрирована</h2>
          <p className="text-sm text-gray-600 mb-6">
            Поделитесь этой ссылкой с плательщиками -- они смогут заполнить справку онлайн:
          </p>
          <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-2 mb-6">
            <code className="flex-1 text-sm text-gray-800 truncate text-left">{publicLink}</code>
            <button
              onClick={handleCopy}
              className="shrink-0 p-2 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              title="Копировать"
            >
              {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <button
            onClick={() => navigate('/org/dashboard')}
            className="px-6 py-2.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-colors"
          >
            Перейти в личный кабинет
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-white border border-gray-200 rounded-lg mb-4">
            <FileText className="w-6 h-6 text-gray-700" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">Регистрация организации</h1>
          <p className="text-sm text-gray-500 mt-1">Сервис формирования справок КНД 1151158</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ИНН</label>
              <input
                type="text"
                value={inn}
                onChange={(e) => setInn(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10 цифр"
                maxLength={10}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
                  placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">КПП</label>
              <input
                type="text"
                value={kpp}
                onChange={(e) => setKpp(e.target.value.replace(/\D/g, '').slice(0, 9))}
                placeholder="9 цифр"
                maxLength={9}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
                  placeholder:text-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Наименование организации</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Полное наименование"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
                placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email для связи</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="необязательно"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
                placeholder:text-gray-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ПИН-код</label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6 цифр"
                maxLength={6}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
                  placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Повторите ПИН</label>
              <input
                type="password"
                value={pinConfirm}
                onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6 цифр"
                maxLength={6}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
                  placeholder:text-gray-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium
              transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Регистрация...' : 'Зарегистрировать'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Уже зарегистрированы?{' '}
          <Link to="/org/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Войти
          </Link>
        </p>

        <p className="text-center mt-6">
          <Link to="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Вернуться к форме
          </Link>
        </p>
      </div>
    </div>
  );
}
