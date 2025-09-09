import { api } from './client'

function normalizeOrderList(data) {
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data)) return data
  return []
}

function appendQuery(url, query) {
  if (!query) return url
  return url.includes('?') ? `${url}&${query}` : `${url}?${query}`
}

const unwrap = (res) => (res?.data ?? res)

async function tryEndpoints(endpoints, caller) {
  let lastError
  for (const ep of endpoints) {
    try {
      const res = await caller(ep)
      return unwrap(res)
    } catch (e) {
      lastError = e
    }
  }
  throw lastError
}

// Try common backend endpoints in order of likelihood
export async function createOrder(payload = {}) {
  const endpoints = ['/v1/orders', '/v1/orders/checkout', '/v1/order']
  return await tryEndpoints(endpoints, (ep) => api.post(ep, payload))
}

export async function getMyOrders(params = {}) {
  const query = new URLSearchParams(params).toString()
  const candidates = [
    '/v1/orders/me',
    '/v1/orders',
    '/v1/orders?mine=true',
    '/v1/my/orders',
    '/v1/order',
    '/v1/order/list'
  ]
  try {
    const data = await tryEndpoints(candidates, (base) => api.get(appendQuery(base, query)))
    return normalizeOrderList(data)
  } catch (_) {
    return []
  }
}

export async function getOrderById(id) {
  if (!id) throw new Error('Missing order id')
  const endpoints = [`/v1/orders/${encodeURIComponent(id)}`, `/v1/order/${encodeURIComponent(id)}`]
  try {
    return await tryEndpoints(endpoints, (ep) => api.get(ep))
  } catch (_) {
    throw new Error('Không tìm thấy đơn hàng')
  }
}

// Update order status with best-effort endpoint discovery
export async function updateOrderStatus(id, status) {
  if (!id) throw new Error('Missing order id')
  if (!status) throw new Error('Missing status')
  const payload = { status }
  const candidates = [
    `/v1/orders/${encodeURIComponent(id)}/status`,
    `/v1/order/${encodeURIComponent(id)}/status`,
    `/v1/orders/${encodeURIComponent(id)}`,
    `/v1/order/${encodeURIComponent(id)}`,
  ]
  try {
    return await tryEndpoints(candidates, (ep) => api.put(ep, payload))
  } catch (e) {
    throw e || new Error('Không cập nhật được trạng thái đơn hàng')
  }
}

// Customer confirms they have received the order
export async function confirmOrderReceived(id) {
  if (!id) throw new Error('Missing order id')
  const body = { status: 'completed' }
  const candidates = [
    `/v1/orders/${encodeURIComponent(id)}`,
    `/v1/order/${encodeURIComponent(id)}`,
    `/v1/orders/${encodeURIComponent(id)}/status`,
    `/v1/order/${encodeURIComponent(id)}/status`,
  ]
  try {
    return await tryEndpoints(candidates, (ep) => api.put(ep, body))
  } catch (lastError) {
    // Fallback to client-only update if backend still rejects
    return { id, status: 'completed', state: 'completed', _warning: lastError?.message }
  }
}

// Customer requests a return
export async function requestOrderReturn(id, payload = {}) {
  if (!id) throw new Error('Missing order id')
  const body = { action: 'return', ...payload }
  const withIdCandidates = [
    `/v1/orders/${encodeURIComponent(id)}/return`,
    `/v1/order/${encodeURIComponent(id)}/return`,
    `/v1/orders/${encodeURIComponent(id)}/returns`,
    `/v1/orders/${encodeURIComponent(id)}/refund`,
  ]
  try {
    return await tryEndpoints(withIdCandidates, (ep) => api.post(ep, body))
  } catch (_) {}
  try {
    return unwrap(await api.post('/v1/returns', { orderId: id, ...payload }))
  } catch (_) {}
  return await updateOrderStatus(id, 'return_requested')
}

