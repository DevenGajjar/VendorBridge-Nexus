export const API_BASE_URL = "http://localhost:8000/api/v1";

export interface FetchOptions extends RequestInit {
  json?: any;
}

export async function apiFetch(path: string, options: FetchOptions = {}) {
  const token = localStorage.getItem("token");
  
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  if (options.json && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
    options.body = JSON.stringify(options.json);
  }
  
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  
  if (response.status === 401) {
    // Session expired or invalid
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    // Only refresh if not already at login
    window.location.reload();
    throw new Error("Session expired. Please log in again.");
  }
  
  const data = await response.json();
  
  if (!response.ok) {
    const errorMsg = data.errors && Array.isArray(data.errors) && data.errors.length > 0
      ? `${data.message} (${data.errors.join("; ")})`
      : (data.message || data.detail || "An error occurred during API request");
    throw new Error(errorMsg);
  }
  
  return data;
}
