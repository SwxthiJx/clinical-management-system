const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
export const authenticationRequiredEvent = 'clinic:authentication-required';

function getCookie(name) {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')
    .slice(1)
    .join('=');
}

async function parseResponse(response) {
  if (response.status === 204) return null;
  return response.json().catch(() => ({}));
}

async function request(path, options = {}) {
  const csrfToken = getCookie('clinic_csrf');
  return fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken ? { 'X-CSRF-Token': decodeURIComponent(csrfToken) } : {}),
      ...options.headers
    }
  });
}

export async function api(path, options = {}, allowRefresh = true) {
  let response = await request(path, options);

  if (
    response.status === 401 &&
    allowRefresh &&
    !['/api/auth/login', '/api/auth/register', '/api/auth/refresh'].includes(path)
  ) {
    const refreshResponse = await request('/api/auth/refresh', { method: 'POST' });
    if (refreshResponse.ok) {
      response = await request(path, options);
    }
  }

  const data = await parseResponse(response);
  if (!response.ok) {
    if (response.status === 401 && allowRefresh) {
      window.dispatchEvent(new Event(authenticationRequiredEvent));
    }
    const error = new Error(data?.error?.message || 'Request failed');
    error.code = data?.error?.code;
    error.details = data?.error?.details;
    throw error;
  }

  return data;
}
