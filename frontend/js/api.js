const API_BASE = window.SANA_API_BASE ?? "http://localhost:3001";
const TOKEN_KEY = "sana_token";
const USERNAME_KEY = "sana_username";

export function getToken() { return localStorage.getItem(TOKEN_KEY); }
export function getUsername() { return localStorage.getItem(USERNAME_KEY); }
export function setSession(token, username) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USERNAME_KEY, username);
}
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
}

async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    clearSession();
    window.dispatchEvent(new CustomEvent("sana:unauthorized"));
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Errore ${res.status}`);
  return data;
}

export const api = {
  register: (username, password) => request("/api/auth/register", { method: "POST", body: { username, password } }),
  login: (username, password) => request("/api/auth/login", { method: "POST", body: { username, password } }),

  getPlan: () => request("/api/plan"),
  savePlanDay: (day, label, meals) => request(`/api/plan/${day}`, { method: "PUT", body: { label, meals } }),
  copyPlanDay: (day, targetDay) => request(`/api/plan/${day}/copy`, { method: "POST", body: { targetDay } }),

  getLogs: (from, to) => request(`/api/logs?from=${from}&to=${to}`),
  saveLog: (date, day, meals) => request(`/api/logs/${date}`, { method: "PUT", body: { day, meals } }),

  getVersions: () => request("/api/versions"),
  saveVersion: (label, days) => request("/api/versions", { method: "POST", body: { label, days } }),
};
