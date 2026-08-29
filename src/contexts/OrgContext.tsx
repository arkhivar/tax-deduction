import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Organization } from '../types/certificate';
import { api, getToken, setToken, clearToken } from '../lib/api';

interface OrgContextValue {
  org: Organization | null;
  loading: boolean;
  login: (org: Organization, token: string) => void;
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

  // Restore session: if we have a token, verify it via /auth/me
  // This replaces the old "store full org in localStorage" approach
  const restoreSession = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await api.organizations.me();
      if (error || !data || data.role !== 'org') {
        clearToken();
        localStorage.removeItem(STORAGE_KEY);
        setOrg(null);
      } else {
        setOrg(data.org as Organization);
        // Cache org data in localStorage for instant page loads
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.org));
      }
    } catch {
      clearToken();
      setOrg(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Instant restore from cache (for fast UI), then verify with server
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setOrg(JSON.parse(raw));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    restoreSession();
  }, [restoreSession]);

  const login = (o: Organization, token: string) => {
    setOrg(o);
    setToken(token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(o));
  };

  const logout = () => {
    setOrg(null);
    clearToken();
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
