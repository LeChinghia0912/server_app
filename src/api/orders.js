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

// Try common backend endpoints in order of likelihood
export async function createOrder(payload = {}) {
  const endpoints = ['/v1/orders', '/v1/orders/checkout', '/v1/order']
  for (const ep of endpoints) {
    try {
      const res = await api.post(ep, payload)
      return res?.data ?? res
    } catch (_) {}
  }
  throw new Error('Không thể tạo đơn hàng')
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
  for (const base of candidates) {
    try {
      const url = appendQuery(base, query)
      const res = await api.get(url)
      const data = res?.data ?? res
      return normalizeOrderList(data)
    } catch (_) {}
  }
  return []
}

export async function getOrderById(id) {
  if (!id) throw new Error('Missing order id')
  const endpoints = [`/v1/orders/${encodeURIComponent(id)}`, `/v1/order/${encodeURIComponent(id)}`]
  for (const ep of endpoints) {
    try {
      const res = await api.get(ep)
      return res?.data ?? res
    } catch (_) {}
  }
  throw new Error('Không tìm thấy đơn hàng')
}


