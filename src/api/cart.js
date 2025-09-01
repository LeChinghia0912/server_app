import { api } from './client'

// Add an item to cart
// POST /api/v1/cart { variant_id, quantity }
export async function addToCart({ variantId, quantity = 1 }) {
  if (!variantId) throw new Error('Thiếu variantId')
  const safeQty = Number.isFinite(Number(quantity)) ? Math.max(1, Number(quantity)) : 1
  const payload = { variant_id: variantId, quantity: safeQty }
  const res = await api.post('/v1/cart', payload)
  return res?.data ?? res
}

// Fetch current user's cart items
export async function getCart(params = {}) {
  const query = new URLSearchParams(params).toString()
  const res = await api.get(`/v1/cart${query ? `?${query}` : ''}`)
  return res?.data ?? res
}

// Update quantity of a cart item
export async function updateCartItem(id, quantity) {
  const res = await api.put(`/v1/cart/${encodeURIComponent(id)}`, { quantity })
  return res?.data ?? res
}

// Remove a cart item
export async function removeCartItem(id) {
  const res = await api.delete(`/v1/cart/${encodeURIComponent(id)}`)
  return res?.data ?? res
}

export async function clearCart() {
  const res = await api.delete('/v1/cart')
  return res?.data ?? res
}


