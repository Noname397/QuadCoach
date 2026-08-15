const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const apiBaseUrl = API_URL;

export function getAuthHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
