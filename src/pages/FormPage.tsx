import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { PdfForm } from '../components/form/PdfForm';
import { FormStatusView } from '../components/form/FormStatusView';
import { supabase } from '../lib/supabase';
import type { Certificate } from '../types/certificate';

function generateId(): string {
  return crypto.randomUUID();
}

export function FormPage() {
  const { orgInn, slug, formId } = useParams<{ orgInn?: string; slug?: string; formId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const identifier = orgInn || slug;

  const [orgData, setOrgData] = useState<{ id: string; inn: string; kpp: string; name: string; full_name: string | null } | null>(null);
  const [loadingOrg, setLoadingOrg] = useState(!!identifier);
  const [notFound, setNotFound] = useState(false);

  const [existingCert, setExistingCert] = useState<Certificate | null>(null);
  const [checkingForm, setCheckingForm] = useState(!!formId);

  useEffect(() => {
    if (!formId) {
      const newId = generateId();
      const path = location.pathname.replace(/\/$/, '');
      if (path === '' || path === '/form') {
        navigate(`/s/${newId}`, { replace: true });
      } else if (orgInn) {
        navigate(`/form/${orgInn}/${newId}`, { replace: true });
      } else if (slug) {
        navigate(`/${slug}/${newId}`, { replace: true });
      } else {
        navigate(`/s/${newId}`, { replace: true });
      }
      return;
    }

    const checkExisting = async () => {
      const { data } = await supabase
        .from('education_certificates')
        .select('*')
        .eq('id', formId)
        .maybeSingle();
      if (data) {
        setExistingCert(data);
      }
      setCheckingForm(false);
    };
    checkExisting();
  }, [formId]);

  useEffect(() => {
    if (!identifier) return;
    const load = async () => {
      const isInn = /^\d{10}$/.test(identifier);
      const { data } = isInn
        ? await supabase
            .from('organizations')
            .select('id, inn, kpp, name, full_name')
            .eq('inn', identifier)
            .maybeSingle()
        : await supabase
            .from('organizations')
            .select('id, inn, kpp, name, full_name')
            .eq('slug', identifier)
            .maybeSingle();

      if (data) {
        setOrgData(data);
      } else {
        setNotFound(true);
      }
      setLoadingOrg(false);
    };
    load();
  }, [identifier]);

  if (!formId) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-sm text-gray-500">Загрузка...</p>
      </div>
    );
  }

  if (loadingOrg || checkingForm) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-sm text-gray-500">Загрузка...</p>
      </div>
    );
  }

  if (existingCert) {
    return <FormStatusView cert={existingCert} />;
  }

  if (notFound && identifier) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 mb-2">Организация не найдена</p>
          <p className="text-sm text-gray-500 mb-6">Проверьте правильность ссылки или перейдите к форме вручную.</p>
          <Link to="/" className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors">
            Открыть пустую форму
          </Link>
        </div>
      </div>
    );
  }

  const handleNewForm = () => {
    const newId = generateId();
    if (orgInn) {
      navigate(`/form/${orgInn}/${newId}`);
    } else if (slug) {
      navigate(`/${slug}/${newId}`);
    } else {
      navigate(`/s/${newId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-[900px] mx-auto py-8 px-4">
        {orgData ? (
          <PdfForm
            formId={formId}
            orgId={orgData.id}
            orgInn={orgData.inn}
            orgKpp={orgData.kpp}
            orgName={orgData.full_name || orgData.name}
            orgLocked
            onNewForm={handleNewForm}
          />
        ) : (
          <PdfForm formId={formId} onNewForm={handleNewForm} />
        )}

        <footer className="mt-8 pb-8 text-center">
          <Link
            to="/org/login"
            className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
          >
            Вход для образовательной организации
          </Link>
        </footer>
      </div>
    </div>
  );
}
