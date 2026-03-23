import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Organization } from '../types/certificate';

interface OrgContextValue {
  org: Organization | null;
  loading: boolean;
  login: (org: Organization) => void;
  logout: () => void;
  refreshOrg: (updated: Organization) => void;
}

const OrgContext = createContext<OrgContextValue>({
  org: null,
  loading: true,
  login: () => {},
  logout: () => {},
  refreshOrg: () => {},
});

const STORAGE_KEY = 'org_session';

export function OrgProvider({ children }: { children: ReactNode }) {
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setOrg(JSON.parse(raw));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setLoading(false);
  }, []);

  const login = (o: Organization) => {
    setOrg(o);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(o));
  };

  const logout = () => {
    setOrg(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const refreshOrg = (updated: Organization) => {
    setOrg(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <OrgContext.Provider value={{ org, loading, login, logout, refreshOrg }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  return useContext(OrgContext);
}
