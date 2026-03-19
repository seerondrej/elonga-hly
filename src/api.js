const USER_ID = 67885;

export async function fetchToday() {
  const res = await fetch(`/api/user/${USER_ID}/today`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchHistory(days = 90) {
  const res = await fetch(`/api/user/${USER_ID}/history?days=${days}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
