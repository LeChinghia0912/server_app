import { api } from "./client";

export async function getCurrentUser() {
  try {
    const res = await api.get('/v1/users/me');
    return res?.data || res || null;
  } catch (e) {
    if (e?.status === 401) throw e;
  }
  return null;
}

export async function getUserById(userId) {
    // get user by id v1/user/:id
  return api.get(`/v1/users/${userId}`);
}
