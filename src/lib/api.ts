/**
 * API client -- replaces Supabase client.
 *
 * All data operations go through our Express + PostgreSQL backend.
 * This module provides typed functions matching every query pattern
 * the frontend previously performed via the Supabase JS client.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

import type { Certificate, Organization } from '../types/certificate';

// --- JWT token management ---
const TOKEN_KEY = 'knd_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// --- Low-level fetch helper ---
async function request<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: ApiError | null }> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    // Attach JWT if available
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      // Handle 401 globally — clear token and redirect to login
      if (res.status === 401 && !path.startsWith('/auth/')) {
        clearToken();
        // Only redirect if we're in the browser (not SSR/tests)
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/org/')) {
          window.location.href = '/org/login';
        }
      }
      const body = await res.json().catch(() => ({}));
      return { data: null, error: { message: body.error || 'Request failed', code: body.code } };
    }

    const data = await res.json().catch(() => null);
    return { data, error: null };
  } catch {
    return { data: null, error: { message: 'Network error' } };
  }
}

export interface ApiError {
  message: string;
  code?: string;
}

/** Row returned by GET /certificates/stats (pg COUNT comes back as string). */
export interface CertificateStatsRow {
  org_id: string;
  total: string;
  pending: string;
}

/** Response of GET /admin/overview (sysadmin home screen). */
export interface AdminOverview {
  logins24h: number;
  failed24h: number;
  failed7d: number;
  recentEvents: {
    created_at: string;
    role: string;
    inn: string | null;
    success: boolean;
    ip: string | null;
    org_name: string | null;
  }[];
  activeOrgs: {
    id: string;
    name: string;
    inn: string;
    last_login_at: string;
  }[];
  system: {
    apiUptimeSec: number;
    hostUptimeSec: number;
    loadavg: number[];
    cpus: number;
    memTotalMb: number;
    memFreeMb: number;
    node: string;
  };
}

// ============================================================
// Organizations
// ============================================================

export const api = {
  // --- List all organizations (admin) ---
  organizations: {
    async list() {
      return request<Organization[]>('/organizations');
    },

    // --- Lookup org by INN or slug (minimal fields for public form) ---
    async lookup(inn?: string, slug?: string) {
      const params = new URLSearchParams();
      if (inn) params.set('inn', inn);
      if (slug) params.set('slug', slug);
      return request<Organization>(`/organizations/lookup?${params}`);
    },

    // --- Login: verify INN + PIN via auth endpoint ---
    async login(inn: string, pin: string) {
      return request<{ token: string; org: Organization }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ inn, pin }),
      });
    },

    // --- Verify session: get current org data from token ---
    async me() {
      return request<{ role: string; org: Organization }>('/auth/me');
    },

    // --- Admin login ---
    async adminLogin(password: string) {
      return request<{ token: string }>('/auth/admin', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
    },

    // --- Resolve INN from slug (for login page prefill) ---
    async resolveInn(slug: string) {
      return request<{ inn: string } | null>(`/organizations/resolve-inn?slug=${encodeURIComponent(slug)}`);
    },

    // --- Register new org ---
    async create(data: {
      inn: string;
      kpp: string;
      name: string;
      full_name?: string;
      slug?: string;
      contact_email?: string;
      pin_code: string;
    }) {
      return request<Organization>('/organizations', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    // --- Find or create org by INN (PdfForm auto-registration) ---
    async findOrCreate(inn: string, kpp?: string, name?: string, fullName?: string) {
      return request<{ id: string }>('/organizations/find-or-create', {
        method: 'POST',
        body: JSON.stringify({ inn, kpp, name, full_name: fullName }),
      });
    },

    // --- Get by ID ---
    async get(id: string) {
      return request<Organization>(`/organizations/${id}`);
    },

    // --- Update by ID ---
    async update(id: string, data: object) {
      return request<Organization>(`/organizations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    // --- Record branded-link (premium) interest ---
    async requestPremium(id: string) {
      return request<Organization>(`/organizations/${id}/premium-interest`, {
        method: 'POST',
      });
    },

    // --- Change PIN (server-side verification) ---
    async changePin(id: string, currentPin: string, newPin: string) {
      return request<Organization>(`/organizations/${id}/change-pin`, {
        method: 'POST',
        body: JSON.stringify({ current_pin: currentPin, new_pin: newPin }),
      });
    },
  },

  // ============================================================
  // Certificates
  // ============================================================

  certificates: {
    // --- List with optional filters ---
    async list(filters?: { orgId?: string; status?: string }) {
      const params = new URLSearchParams();
      if (filters?.orgId) params.set('org_id', filters.orgId);
      if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
      return request<Certificate[]>(`/certificates?${params}`);
    },

    // --- Aggregate stats by org (admin) ---
    async stats() {
      return request<CertificateStatsRow[]>('/certificates/stats');
    },

    // --- Get by ID ---
    async get(id: string) {
      return request<Certificate>(`/certificates/${id}`);
    },

    // --- Create ---
    async create(data: object) {
      return request<Certificate>('/certificates', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    // --- Create a draft from the org dashboard (org auth) ---
    async createDraft(data: {
      taxpayer_last_name: string;
      taxpayer_first_name: string;
      taxpayer_patronymic?: string;
      expense_amount?: number;
    }) {
      return request<Certificate>('/certificates/draft', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    // --- Complete a draft via shared link (public, capability URL) ---
    async complete(id: string, data: object) {
      return request<Certificate>(`/certificates/${id}/complete`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    // --- Update by ID ---
    async update(id: string, data: object) {
      return request<Certificate>(`/certificates/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    // --- Delete by ID ---
    async delete(id: string) {
      return request<{ id: string }>(`/certificates/${id}`, {
        method: 'DELETE',
      });
    },

    // --- Download PDF (rendered server-side from the print layout) ---
    async downloadPdf(id: string): Promise<{ error: { message: string } | null }> {
      const token = getToken();
      try {
        const res = await fetch(`${API_BASE}/certificates/${id}/pdf`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          return { error: { message: body.error || 'Не удалось сформировать PDF' } };
        }
        const blob = await res.blob();
        const disposition = res.headers.get('Content-Disposition') || '';
        const match = disposition.match(/filename\*=UTF-8''([^;]+)/);
        const filename = match ? decodeURIComponent(match[1]) : 'certificate.pdf';
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        return { error: null };
      } catch {
        return { error: { message: 'Сетевая ошибка' } };
      }
    },
  },

  // ============================================================
  // --- Sysadmin overview (admin home screen) ---
  admin: {
    async overview() {
      return request<AdminOverview>('/admin/overview');
    },
  },

  // INN Lookup (proxies DaData API server-side)
  // ============================================================

  async innLookup(inn: string) {
    return request<{
      found: boolean;
      name?: string;
      full_name?: string;
      kpp?: string;
      inn?: string;
    }>('/inn-lookup', {
      method: 'POST',
      body: JSON.stringify({ inn }),
    });
  },

  // ============================================================
  // File uploads (QR code, stamp, facsimile)
  // ============================================================

  async uploadAsset(orgId: string, field: 'qr' | 'stamp' | 'facsimile', file: File) {
    const formData = new FormData();
    formData.append(field, file);

    const headers: Record<string, string> = {};
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE}/assets/${orgId}/${field}`, {
        method: 'POST',
        body: formData,
        headers,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { url: null, error: { message: body.error || 'Upload failed' } };
      }
      const data = await res.json();
      return { url: data.url as string, error: null };
    } catch {
      return { url: null, error: { message: 'Network error' } };
    }
  },
};
