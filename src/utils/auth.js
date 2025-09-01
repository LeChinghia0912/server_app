const TOKEN_KEY = 'auth_token'
const ROLE_KEY = 'auth_role'

function setStorage(persistent) {
  return persistent ? window.localStorage : window.sessionStorage
}

export function setToken(token, persistent = true) {
  const store = setStorage(persistent)
  try { store.setItem(TOKEN_KEY, token) } catch (_) {}
  window.dispatchEvent(new Event('auth:change'))
}

export function getToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY) || window.sessionStorage.getItem(TOKEN_KEY) || null
  } catch (_) {
    return null
  }
}

export function setRole(role, persistent = true) {
  const store = setStorage(persistent)
  try { store.setItem(ROLE_KEY, role) } catch (_) {}
  window.dispatchEvent(new Event('auth:change'))
}

export function getRole() {
  try {
    return window.localStorage.getItem(ROLE_KEY) || window.sessionStorage.getItem(ROLE_KEY) || null
  } catch (_) {
    return null
  }
}

export function clearAuth() {
  try {
    window.localStorage.removeItem(TOKEN_KEY)
    window.localStorage.removeItem(ROLE_KEY)
    window.sessionStorage.removeItem(TOKEN_KEY)
    window.sessionStorage.removeItem(ROLE_KEY)
  } catch (_) {}
  window.dispatchEvent(new Event('auth:change'))
}

export function isAuthenticated() {
  return !!getToken()
}

export function decodeToken(token) {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const base64url = parts[1]
    let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
    const paddingNeeded = (4 - (base64.length % 4)) % 4
    base64 += '='.repeat(paddingNeeded)
    const json = atob(base64)
    return JSON.parse(json)
  } catch (_) {
    return null
  }
}


