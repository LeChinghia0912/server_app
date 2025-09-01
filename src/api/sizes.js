import { api } from './client'

// GET /api/v1/sizes
export async function getSizes() {
  const res = await api.get('/v1/sizes')
  return res?.data ?? res
}


