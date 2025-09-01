import { api } from './client'

// Try common endpoints to get variants by product id
export async function getVariantsByProductId(productId) {
  if (!productId) throw new Error('Missing productId')
  // 1) Prefer nested resource: /v1/products/:id/variants
  try {
    const res = await api.get(`/v1/products/${encodeURIComponent(productId)}/variants`)
    const data = res?.data ?? res
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.items)) return data.items
  } catch (_) {}

  // 2) Fallback: query collection by product_id
  try {
    const res = await api.get(`/v1/product-variants?product_id=${encodeURIComponent(productId)}`)
    const data = res?.data ?? res
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.items)) return data.items
    if (Array.isArray(data?.data)) return data.data
  } catch (e) {
    throw e
  }
  return []
}


