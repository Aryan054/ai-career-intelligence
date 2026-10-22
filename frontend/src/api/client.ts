import axios from 'axios';

export const normalizeApiUrl = (url: string): string => {
  if (!url) return '';
  const trimmed = url.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`;
};

export const getApiBaseUrl = (): string => {
  // 1. Check runtime localStorage override (useful for quick fixes or testing)
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('CUSTOM_API_BASE_URL');
    if (customUrl && customUrl.trim()) {
      return normalizeApiUrl(customUrl);
    }
  }

  // 2. Check Vite build-time environment variable
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    return normalizeApiUrl(envUrl);
  }

  // 3. Fallback: if running on localhost, use localhost:8001
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:8001/api/v1';
  }

  // 4. Default for production when env is not yet set
  return normalizeApiUrl(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api/v1');
};

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60s to accommodate Render free-tier cold starts
});

// Update baseURL dynamically before every request in case it was updated
apiClient.interceptors.request.use(
  (config) => {
    config.baseURL = getApiBaseUrl();
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Pings backend health endpoint to wake up Render instances from cold sleep.
 * Checks both root /health and /api/v1/health with a quick timeout.
 */
export const pingBackendHealth = async (timeoutMs = 15000): Promise<{ ok: boolean; status?: number; error?: string }> => {
  const currentBase = getApiBaseUrl();
  const rootUrl = currentBase.replace(/\/api\/v1\/?$/, '');
  const candidateUrls = [
    `${currentBase}/health`,
    `${rootUrl}/health`,
    `${rootUrl}/`
  ];

  for (const url of candidateUrls) {
    try {
      const res = await axios.get(url, {
        timeout: timeoutMs,
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (res.status >= 200 && res.status < 400) {
        return { ok: true, status: res.status };
      }
    } catch {
      // Continue to next candidate URL
    }
  }

  return { ok: false, error: 'Could not reach backend health endpoint' };
};

export const setCustomApiBaseUrl = (url: string) => {
  if (url && url.trim()) {
    localStorage.setItem('CUSTOM_API_BASE_URL', url.trim());
  } else {
    localStorage.removeItem('CUSTOM_API_BASE_URL');
  }
};

export default apiClient;
