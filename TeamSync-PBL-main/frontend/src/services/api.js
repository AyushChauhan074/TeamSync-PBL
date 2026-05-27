const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// ─── Simple Cache ─────────────────────────────────────────────────────────────
const cache = new Map();
const CACHE_DURATION = 30000; // 30 seconds

const getCached = (key) => {
  const item = cache.get(key);
  if (item && Date.now() - item.timestamp < CACHE_DURATION) {
    return item.data;
  }
  cache.delete(key);
  return null;
};

const setCache = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

const clearCache = () => cache.clear();

// ─── Token Management ─────────────────────────────────────────────────────────
const getAccessToken = () => localStorage.getItem('accessToken');
const getRefreshToken = () => localStorage.getItem('refreshToken');
const setTokens = (access, refresh) => {
  localStorage.setItem('accessToken', access);
  if (refresh) localStorage.setItem('refreshToken', refresh);
};
const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

// ─── Core Fetch Wrapper ───────────────────────────────────────────────────────
let isRefreshing = false;
let refreshQueue = [];

async function apiFetch(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const token = getAccessToken();
  const cacheKey = `${options.method || 'GET'}_${endpoint}`;

  // Return cached data for GET requests
  if (!options.method || options.method === 'GET') {
    const cached = getCached(cacheKey);
    if (cached) return cached;
  }

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  let response = await fetch(url, config);

  // Auto-refresh on 401 TOKEN_EXPIRED
  if (response.status === 401) {
    const body = await response.clone().json().catch(() => ({}));

    if (body.code === 'TOKEN_EXPIRED' && getRefreshToken()) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then(() => apiFetch(endpoint, options));
      }

      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: getRefreshToken() }),
        });

        if (!refreshRes.ok) throw new Error('Refresh failed');

        const { accessToken, refreshToken: newRefreshToken } = await refreshRes.json();
        // FIX 3: Store BOTH new tokens — rotation returns a new refresh token
        setTokens(accessToken, newRefreshToken || null);
        refreshQueue.forEach(p => p.resolve());
        refreshQueue = [];

        // Retry original request with new token
        config.headers.Authorization = `Bearer ${accessToken}`;
        response = await fetch(url, config);
      } catch {
        clearTokens();
        refreshQueue.forEach(p => p.reject());
        refreshQueue = [];
        window.location.href = '/login';
        throw new Error('Session expired');
      } finally {
        isRefreshing = false;
      }
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    const err = new Error(error.error || 'Request failed');
    err.status = response.status;
    err.details = error.details;
    throw err;
  }

  const data = await response.json();
  
  // Cache GET requests
  if (!options.method || options.method === 'GET') {
    setCache(cacheKey, data);
  } else {
    // Clear cache on mutations
    clearCache();
  }
  
  return data;
}

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (rollNumber, password) =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ rollNumber, password }) }),
  logout: () => {
    const refresh_token = getRefreshToken();
    clearTokens();
    return apiFetch('/auth/logout', { method: 'POST', body: JSON.stringify({ refresh_token }) });
  },
  me: () => apiFetch('/auth/me'),
};

// ─── Users API ────────────────────────────────────────────────────────────────
export const usersAPI = {
  getProfile: (userId) => apiFetch(userId ? `/users/${userId}` : '/users/me'),
  updateProfile: (data) => apiFetch('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
  getStats: (userId) => apiFetch(userId ? `/users/${userId}/stats` : '/users/me/stats'),
  getContributions: (userId, limit) => {
    const q = limit ? `?limit=${limit}` : '';
    return apiFetch(userId ? `/users/${userId}/contributions${q}` : `/users/me/contributions${q}`);
  },
  getAll: (role, search) => {
    const params = new URLSearchParams();
    if (role) params.set('role', role);
    if (search) params.set('search', search);
    return apiFetch(`/users?${params}`);
  },
};

// ─── Teams API ────────────────────────────────────────────────────────────────
export const teamsAPI = {
  getAll: (search) => apiFetch(`/teams${search ? `?search=${search}` : ''}`),
  getMy: () => apiFetch('/teams/my'),
  getById: (id) => apiFetch(`/teams/${id}`),
  create: (data) => apiFetch('/teams', { method: 'POST', body: JSON.stringify(data) }),
  join: (team_code) => apiFetch('/teams/join', { method: 'POST', body: JSON.stringify({ team_code }) }),
  leave: (id) => apiFetch(`/teams/${id}/leave`, { method: 'DELETE' }),
};

// ─── Projects API ─────────────────────────────────────────────────────────────
export const projectsAPI = {
  getAll: () => apiFetch('/projects'),
  getMy: () => apiFetch('/projects/my'),
  getById: (id) => apiFetch(`/projects/${id}`),
  create: (data) => apiFetch('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProgress: (id, data) =>
    apiFetch(`/projects/${id}/progress`, { method: 'PATCH', body: JSON.stringify(data) }),
  linkRepo: (id, github_repo_url) =>
    apiFetch(`/projects/${id}/repo`, { method: 'PATCH', body: JSON.stringify({ github_repo_url }) }),
};

// ─── GitHub API ───────────────────────────────────────────────────────────────
export const githubAPI = {
  getOAuthUrl: () => apiFetch('/github/oauth/url'),
  connect: (code) => apiFetch('/github/oauth/connect', { method: 'POST', body: JSON.stringify({ code }) }),
  sync: (projectId) => apiFetch(`/github/sync/${projectId}`, { method: 'POST' }),
  getContributions: (projectId) => apiFetch(`/github/contributions/${projectId}`),
};

export { setTokens, clearTokens, getAccessToken, clearCache };
