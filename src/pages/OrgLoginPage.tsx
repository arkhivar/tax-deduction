import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useOrg } from '../contexts/OrgContext';

export function OrgLoginPage() {
  const [searchParams] = useSearchParams();
  const slugParam = searchParams.get('slug');

  const [inn, setInn] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(!!slugParam);
  const { login } = useOrg();
  const navigate = useNavigate();

  useEffect(() => {
    if (!slugParam) return;
    const resolve = async () => {
      const isInn = /^\d{10}$/.test(slugParam);
      const { data } = isInn
        ? await supabase.from('organizations').select('inn').eq('inn', slugParam).maybeSingle()
        : await supabase.from('organizations').select('inn').eq('slug', slugParam).maybeSingle();
      if (data) setInn(data.inn);
      setResolving(false);
    };
    resolve();
  }, [slugParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (inn.length !== 10) {
      setError('ИНН должен содержать 10 цифр');
      return;
    }
    if (pin.length !== 6) {
      setError('ПИН-код должен содержать 6 цифр');
      return;
    }

    setLoading(true);
    const { data, error: dbError } = await supabase
      .from('organizations')
      .select('*')
      .eq('inn', inn)
      .maybeSingle();

    setLoading(false);

    if (dbError || !data) {
      setError('Организация с таким ИНН не найдена');
      return;
    }

    if (data.pin_code !== pin) {
      setError('Неверный ПИН-код');
      return;
    }

    login(data);
    navigate('/org/dashboard');
  };

  if (resolving) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-sm text-gray-500">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-white border border-gray-200 rounded-lg mb-4">
            <FileText className="w-6 h-6 text-gray-700" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">Вход для организации</h1>
          <p className="text-sm text-gray-500 mt-1">КНД 1151158</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ИНН организации</label>
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium
              transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Нет аккаунта?{' '}
          <Link to="/org/register" className="text-blue-600 hover:text-blue-700 font-medium">
            Зарегистрировать организацию
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
