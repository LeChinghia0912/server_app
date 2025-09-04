import { getToken, clearAuth } from '../utils/auth'

export async function apiRequest(path, options = {}) {
  const url = `/api${path.startsWith("/") ? "" : "/"}${path}`;

  const method = (options.method || 'GET').toUpperCase()
  const defaultHeaders = {}

  // Attach token if available
  try {
    const token = getToken();
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
  } catch (_) {}

  // Only set JSON content-type when sending a body (non-GET/HEAD)
  if (method !== 'GET' && method !== 'HEAD') {
    defaultHeaders['Content-Type'] = 'application/json'
  }

  // Timeout + Abort support
  const timeoutMs = options.timeoutMs ?? 12000
  const externalSignal = options.signal
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    try { controller.abort('timeout') } catch (_) {}
  }, timeoutMs)

  // Bridge external signal if provided
  if (externalSignal) {
    if (externalSignal.aborted) {
      try { controller.abort(externalSignal.reason) } catch (_) {}
    } else {
      externalSignal.addEventListener('abort', () => {
        try { controller.abort(externalSignal.reason) } catch (_) {}
      }, { once: true })
    }
  }

  let response
  try {
    response = await fetch(url, {
      credentials: "include",
      headers: { ...defaultHeaders, ...(options.headers || {}) },
      signal: controller.signal,
      ...options,
    });
  } finally {
    clearTimeout(timeoutId)
  }

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  // 204 No Content safety
  const data = response.status === 204 ? null : (isJson ? await response.json() : await response.text());

  if (!response.ok) {
    const message = isJson ? data?.message || JSON.stringify(data) : (data || '')
    const error = new Error(message || `Request failed with ${response.status}`);
    error.status = response.status;
    error.data = data;
    if (response.status === 401) {
      // Token expired/invalid → clear stored auth
      try { clearAuth() } catch (_) {}
    }
    throw error;
  }

  return data;
}

export const api = {
  get: (path, options = {}) => apiRequest(path, { method: "GET", ...options }),
  post: (path, body, options = {}) =>
    apiRequest(path, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
      ...options,
    }),
  put: (path, body, options = {}) =>
    apiRequest(path, {
      method: "PUT",
      body: JSON.stringify(body ?? {}),
      ...options,
    }),
  delete: (path, options = {}) =>
    apiRequest(path, { method: "DELETE", ...options }),
};
