import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { PdfForm } from '../components/form/PdfForm';
import { FormStatusView } from '../components/form/FormStatusView';
import { ZoomToolbar, DEFAULT_ZOOM } from '../components/form/ZoomToolbar';
import { PrintPage } from '../components/print/PrintPage';
import { PrintPage2 } from '../components/print/PrintPage2';
import { api } from '../lib/api';
import type { Certificate, CertificateFormData, Organization } from '../types/certificate';

function generateId(): string {
  // crypto.randomUUID() requires a secure context (HTTPS or localhost).
  // Fall back to a manual RFC 4122 v4 UUID for plain HTTP deployments.
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function FormPage() {
  usePageTitle('Заполнение справки');
  const { orgInn, slug, formId } = useParams<{ orgInn?: string; slug?: string; formId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const identifier = orgInn || slug;

  const [orgData, setOrgData] = useState<Organization | null>(null);
  const [prefillInn, setPrefillInn] = useState<string | null>(null);
  const [loadingOrg, setLoadingOrg] = useState(!!identifier);
  const [notFound, setNotFound] = useState(false);

  const [existingCert, setExistingCert] = useState<Certificate | null>(null);
  const [checkingForm, setCheckingForm] = useState(!!formId);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [contentHeight, setContentHeight] = useState(0);
  const [printData, setPrintData] = useState<Certificate | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContentHeight(entry.contentRect.height);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!printData) return;
    const handleAfterPrint = () => setPrintData(null);
    window.addEventListener('afterprint', handleAfterPrint);
    window.print();
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, [printData]);

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
      const { data } = await api.certificates.get(formId);
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
        ? await api.organizations.lookup(identifier)
        : await api.organizations.lookup(undefined, identifier);

      if (data) {
        setOrgData(data);
      } else if (/^\d{10}$/.test(identifier)) {
        setPrefillInn(identifier);
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

  const scaledHeight = contentHeight * zoom;
  const padding = 64;

  const buildPrintCertificate = (formData: CertificateFormData): Certificate => ({
    id: formId,
    org_id: orgData?.id || null,
    certificate_number: '',
    correction_number: '0',
    report_year: formData.report_year,
    org_inn: formData.org_inn,
    org_kpp: formData.org_kpp,
    org_name: formData.org_name,
    is_full_time: formData.is_full_time,
    taxpayer_last_name: formData.taxpayer_last_name,
    taxpayer_first_name: formData.taxpayer_first_name,
    taxpayer_patronymic: formData.taxpayer_patronymic,
    taxpayer_inn: formData.taxpayer_inn,
    taxpayer_birth_date: formData.taxpayer_birth_date,
    doc_type_code: formData.doc_type_code,
    doc_series_number: formData.doc_series_number,
    doc_issue_date: formData.doc_issue_date,
    is_same_person: formData.is_same_person,
    expense_amount: formData.expense_amount,
    student_last_name: formData.student_last_name,
    student_first_name: formData.student_first_name,
    student_patronymic: formData.student_patronymic,
    student_inn: formData.student_inn,
    student_birth_date: formData.student_birth_date || null,
    student_doc_type_code: formData.student_doc_type_code,
    student_doc_series_number: formData.student_doc_series_number,
    student_doc_issue_date: formData.student_doc_issue_date || null,
    signer_full_name: '',
    sign_date: null,
    status: 'draft',
    admin_notes: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <div
        className="relative mx-auto px-4 print:hidden"
        style={{
          height: scaledHeight > 0 ? `${scaledHeight + padding}px` : undefined,
          paddingTop: `${padding / 2}px`,
        }}
      >
        <div
          ref={contentRef}
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            width: '900px',
            position: 'absolute',
            left: '50%',
            top: `${padding / 2}px`,
            marginLeft: '-450px',
          }}
        >
          {orgData ? (
            <PdfForm
              formId={formId}
              orgId={orgData.id}
              orgInn={orgData.inn}
              orgKpp={orgData.kpp}
              orgName={orgData.full_name || orgData.name}
              orgLocked
              orgIdentifier={identifier}
              orgQrUrl={orgData.qr_code_url || undefined}
              onNewForm={handleNewForm}
              onPrint={(formData) => setPrintData(buildPrintCertificate(formData))}
            />
          ) : (
            <PdfForm
              formId={formId}
              orgInn={prefillInn || undefined}
              orgIdentifier={identifier}
              onNewForm={handleNewForm}
              onPrint={(formData) => setPrintData(buildPrintCertificate(formData))}
            />
          )}

          <footer
            className="print:hidden mx-auto"
            style={{ width: '210mm' }}
          >
            <div
              className="mt-6 border-t border-gray-200 relative overflow-hidden"
              style={{
                height: '200px',
                backgroundColor: '#f3f4f6',
                backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-gray-100/0 via-gray-100/40 to-gray-100/90" />
              <div className="relative h-full flex flex-col items-center justify-center px-4 text-center">
                <p className="text-sm text-gray-500 font-medium">КНД 1151158</p>
                <p className="text-xs text-gray-400 mt-1">Справка об оплате образовательных услуг</p>
                <p className="text-[11px] text-gray-400 mt-4">{new Date().getFullYear()}</p>
              </div>
            </div>
          </footer>
        </div>
      </div>
      <ZoomToolbar zoom={zoom} onZoomChange={setZoom} />
      {printData && (
        <div className="hidden print:block fixed inset-0 bg-white z-50 overflow-auto">
          <div className="max-w-[900px] mx-auto p-4 space-y-8 print:space-y-0">
            <PrintPage cert={printData} qrUrl={orgData?.qr_code_url || undefined} />
            {printData.is_same_person === 0 && (
              <>
                <div className="print:break-before-page" />
                <PrintPage2 cert={printData} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
