import { getAuthHeaders, supabase } from "./supabaseClient";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const STORAGE_KEY = "quadcoach-user";
const STORAGE_TTL = 24 * 60 * 60 * 1000;

export function readStoredUser() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved);
    if (parsed.expiresAt && parsed.expiresAt <= Date.now()) {
      clearStoredUser();
      return null;
    }

    return parsed.user || parsed;
  } catch {
    clearStoredUser();
    return null;
  }
}

export function storeUser(user) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ user, expiresAt: Date.now() + STORAGE_TTL }),
  );
}

export function clearStoredUser() {
  localStorage.removeItem(STORAGE_KEY);
}

async function request(path, options) {
  const response = await fetch(`${API_URL}${path}`, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

export function login(email, password) {
  return request("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export function signUp(email, password) {
  return request("/api/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export function fetchCurrentUser(accessToken) {
  return request("/api/me", { headers: getAuthHeaders(accessToken) });
}

export function updateProfile(accessToken, form) {
  return request("/api/profile", {
    method: "PUT",
    headers: getAuthHeaders(accessToken),
    body: form,
  });
}

export function logoutFromApi(accessToken) {
  return request("/api/logout", {
    method: "POST",
    headers: getAuthHeaders(accessToken),
  });
}

export async function loginWithGoogle() {
  if (!supabase) throw new Error("Google login is not configured.");
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  });
  if (error) throw new Error(error.message);
}

export function subscribeToAuthChanges(callback) {
  return supabase?.auth.onAuthStateChange(callback);
}

export function signOutFromSupabase() {
  return supabase?.auth.signOut();
}