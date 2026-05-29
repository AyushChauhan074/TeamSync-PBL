/**
 * API helper — centralizes base URL and token attachment for all frontend API calls.
 */
const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : 'http://localhost:8000/api/v1';

/**
 * Returns default headers including Authorization if a token exists.
 */
const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  
  // Pick the correct token based on the logged-in user's role.
  // Admin sessions store their token separately so faculty/student logins never overwrite it.
  const userData = localStorage.getItem('user');
  let token = null;
  if (userData) {
    try {
      const parsed = JSON.parse(userData);
      if (parsed.role === 'admin' || parsed.userType === 'admin') {
        token = localStorage.getItem('admin_token');
      }
    } catch(e) { /* ignore parse errors */ }
  }
  // Fallback to the generic token for student/faculty
  if (!token) {
    token = localStorage.getItem('token');
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Generic fetch wrapper with error handling.
 * @param {string} endpoint - e.g. '/teams' or '/users/5'
 * @param {object} options - fetch options (method, body, etc.)
 * @returns {Promise<object>} parsed JSON response
 */
const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: getHeaders(),
    ...options,
  };

  // Stringify body if it's an object
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
};

export { API_BASE, getHeaders, apiFetch };
export default apiFetch;
