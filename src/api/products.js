import { api } from './client'

// Fetch list of products from backend with pagination
// Default: latest 5 items by createdAt desc
// Backend URL (proxied by Vite): /api/v1/products
export async function getProducts(params = {}) {
  const defaultParams = { limit: 5, sort: '-createdAt' }
  const merged = { ...defaultParams, ...params }
  const query = new URLSearchParams(merged).toString()
  const path = `/v1/products${query ? `?${query}` : ''}`
  return api.get(path)
}

// Fetch a single product by id
// Backend URL: /api/v1/products/:id
export async function getProductById(id) {
  if (!id) throw new Error('Missing product id')
  const path = `/v1/products/${encodeURIComponent(id)}`
  return api.get(path)
}


