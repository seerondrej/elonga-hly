export const DEFAULT_USER_ID = 67885;

// API base URL - use env variable in production, empty string for local dev (proxy)
const API_BASE = import.meta.env.VITE_API_URL || '';

export const USERS = [
  { id: 67885, name: 'Ondra' },
  { id: 51498, name: 'Radim' },
  { id: 20742, name: 'Lukas' },
  { id: 46344, name: 'Vojta' },
];

export async function fetchToday(userId = DEFAULT_USER_ID) {
  const res = await fetch(`${API_BASE}/api/user/${userId}/today`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchHistory(days = 90, userId = DEFAULT_USER_ID) {
  const res = await fetch(`${API_BASE}/api/user/${userId}/history?days=${days}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchDebug(date, userId = DEFAULT_USER_ID) {
  const dateParam = date || new Date().toISOString().slice(0, 10);
  const res = await fetch(`${API_BASE}/api/user/${userId}/debug?date=${dateParam}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
