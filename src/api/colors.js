import { api } from './client'

// GET /api/v1/colors
export async function getColors() {
  const res = await api.get('/v1/colors')
  return res?.data ?? res
}


