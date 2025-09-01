import { getToken, clearAuth } from '../utils/auth'

export async function apiRequest(path, options = {}) {
  const url = `/api${path.startsWith("/") ? "" : "/"}${path}`;
  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  // Attach token if available
  try {
    const token = getToken();
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
  } catch (_) {}

  const response = await fetch(url, {
    credentials: "include",
    headers: { ...defaultHeaders, ...(options.headers || {}) },
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = isJson ? data?.message || JSON.stringify(data) : data;
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
