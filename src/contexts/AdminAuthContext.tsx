import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { getToken, setToken, clearToken, api } from '../lib/api';

interface AdminAuthValue {
  isAdmin: boolean;
  loading: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthValue>({
  isAdmin: false,
  loading: true,
  login: async () => false,
  logout: () => {},
});

// Admin uses a separate token storage key from org auth
const ADMIN_FLAG_KEY = 'knd_admin_session';

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const verifySession = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    // Check if this is an admin session (flag stored at login)
    const isAdminSession = localStorage.getItem(ADMIN_FLAG_KEY) === 'true';
    if (!isAdminSession) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await api.organizations.me();
      if (error || !data || data.role !== 'admin') {
        clearToken();
        localStorage.removeItem(ADMIN_FLAG_KEY);
        setIsAdmin(false);
      } else {
        setIsAdmin(true);
      }
    } catch {
      clearToken();
      localStorage.removeItem(ADMIN_FLAG_KEY);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Instant check from localStorage
    if (localStorage.getItem(ADMIN_FLAG_KEY) === 'true' && getToken()) {
      setIsAdmin(true);
    }
    verifySession();
  }, [verifySession]);

  const login = useCallback(async (password: string): Promise<boolean> => {
    const { data, error } = await api.organizations.adminLogin(password);
    if (error || !data) return false;

    setToken(data.token);
    localStorage.setItem(ADMIN_FLAG_KEY, 'true');
    setIsAdmin(true);
    return true;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    localStorage.removeItem(ADMIN_FLAG_KEY);
    setIsAdmin(false);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ isAdmin, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
