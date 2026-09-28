// Frontend API Client Layer for PostgreSQL Backend API & Local Sync
const API_BASE_URL = typeof window !== 'undefined' && window.location.origin
  ? `${window.location.origin}/api`
  : 'http://localhost:4000/api';

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (res.ok) return await res.json();
  } catch {
    return { status: 'offline', database: 'localStorage (Fallback)' };
  }
}

export async function registerUserApi(userData: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (res.ok) return await res.json();
    const data = await res.json();
    throw new Error(data.error || 'Registration failed');
  } catch (err: any) {
    console.warn('Backend API unreachable, using local storage fallback:', err.message);
    return null;
  }
}

export async function loginUserApi(credentials: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Backend API unreachable, using local storage fallback');
  }
  return null;
}

export async function fetchAllUsersApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/users`);
    if (res.ok) return await res.json();
  } catch {
    console.warn('Backend API unreachable for users list');
  }
  return null;
}

export async function updateUserExperienceLevelApi(userId: string, experienceLevel: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/experience-level`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ experienceLevel })
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Backend API unreachable for experience level update');
  }
  return null;
}

export async function saveTopicsApi(topics: any[]) {
  try {
    const res = await fetch(`${API_BASE_URL}/topics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topics })
    });
    if (res.ok) return await res.json();
  } catch {
    console.warn('Backend API unreachable for topics save');
  }
  return null;
}

export async function recordQuestionCompletionApi(username: string, questionId: string) {
  try {
    await fetch(`${API_BASE_URL}/progress/complete-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, questionId })
    });
  } catch {
    // Fail silently to local storage
  }
}
