import { api } from "./client";
import { setToken, setRole, clearAuth } from "../utils/auth";

export async function login({ email, password, remember = false }) {
  const body = { email: email.trim().toLowerCase(), password };
  const res = await api.post("/v1/auth/login", body);

  const token = res?.token || res?.accessToken || res?.data?.token;
  const role = (
    res?.role ||
    res?.user?.role ||
    res?.data?.role ||
    res?.data?.user?.role ||
    ""
  )
    .toString()
    .toLowerCase();
  if (token) setToken(token, remember);
  if (role) setRole(role, remember);
  return res;
}

export async function register(payload) {
  return api.post("/v1/auth/register", payload);
}

export async function logout() {
  try {
    await api.post("/v1/auth/logout", {});
  } catch (error) {
    if (error?.status === 401) throw error;
  }
  try {
    clearAuth();
  } catch (error) {
    if (error?.status === 401) throw error;
  }
}