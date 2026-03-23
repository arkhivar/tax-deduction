import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { OrgProvider } from './contexts/OrgContext';
import { FormPage } from './pages/FormPage';
import { PrintPage } from './pages/PrintPage';
import { OrgLoginPage } from './pages/OrgLoginPage';
import { OrgRegisterPage } from './pages/OrgRegisterPage';
import { OrgDashboardPage } from './pages/OrgDashboardPage';
import { OrgCertificateEditPage } from './pages/OrgCertificateEditPage';
import { OrgPrintPage } from './pages/OrgPrintPage';
import { OrgSettingsPage } from './pages/OrgSettingsPage';
import { OrgGuard } from './components/org/OrgGuard';

function App() {
  return (
    <BrowserRouter>
      <OrgProvider>
        <Routes>
          <Route path="/" element={<FormPage />} />
          <Route path="/form" element={<FormPage />} />
          <Route path="/form/:orgInn" element={<FormPage />} />
          <Route path="/print/:id" element={<PrintPage />} />

          <Route path="/org/login" element={<OrgLoginPage />} />
          <Route path="/org/register" element={<OrgRegisterPage />} />
          <Route path="/org/dashboard" element={<OrgGuard><OrgDashboardPage /></OrgGuard>} />
          <Route path="/org/certificates/:id" element={<OrgGuard><OrgCertificateEditPage /></OrgGuard>} />
          <Route path="/org/print/:id" element={<OrgGuard><OrgPrintPage /></OrgGuard>} />
          <Route path="/org/settings" element={<OrgGuard><OrgSettingsPage /></OrgGuard>} />

          <Route path="/:slug" element={<FormPage />} />
        </Routes>
      </OrgProvider>
    </BrowserRouter>
  );
}

export default App;
