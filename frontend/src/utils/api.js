/**
 * API helper — centralizes base URL and token attachment for all frontend API calls.
 */
const API_BASE = 'http://localhost:8000/api/v1';

/**
 * Returns default headers including Authorization if a token exists.
 */
const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
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
