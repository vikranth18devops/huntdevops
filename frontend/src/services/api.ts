// Frontend API Client Layer for Cloud SQL PostgreSQL Backend API
const API_BASE_URL = typeof window !== 'undefined' && window.location.origin
  ? `${window.location.origin}/api`
  : 'http://localhost:4000/api';

// ----------------------------------------------------------------------
// Health
// ----------------------------------------------------------------------
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (res.ok) return await res.json();
  } catch {
    return { status: 'offline', database: 'Disconnected' };
  }
}

// ----------------------------------------------------------------------
// Auth & Users
// ----------------------------------------------------------------------
export async function registerUserApi(userData: any) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
}

export async function loginUserApi(credentials: any) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  if (res.ok) return await res.json();
  const data = await res.json().catch(() => ({}));
  throw new Error(data.error || 'Invalid credentials');
}

export async function fetchAllUsersApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/users`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('API error fetching users:', err);
  }
  return [];
}

export async function createUserApi(userData: any) {
  const res = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  if (res.ok) return await res.json();
  const data = await res.json().catch(() => ({}));
  throw new Error(data.error || 'Failed to create user');
}

export async function deleteUserApi(userId: string) {
  const res = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE'
  });
  return res.ok;
}

export async function updateUserRoleApi(userId: string, role: string) {
  const res = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(userId)}/role`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role })
  });
  return res.ok;
}

export async function updateUserStatusApi(userId: string, status: string) {
  const res = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(userId)}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  return res.ok;
}

export async function updateUserExperienceLevelApi(userId: string, experienceLevel: string) {
  const res = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(userId)}/experience-level`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ experienceLevel })
  });
  if (res.ok) return await res.json();
  return null;
}

export async function resetUserPasswordApi(userId: string, newPassword: string) {
  const res = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(userId)}/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newPassword })
  });
  return res.ok;
}

// ----------------------------------------------------------------------
// Curriculum Topics (PostgreSQL topics table)
// ----------------------------------------------------------------------
export async function fetchTopicsApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/topics`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {
    console.warn('API error fetching topics from Cloud SQL:', err);
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
    return res.ok;
  } catch (err) {
    console.warn('API error saving topics to Cloud SQL:', err);
    return false;
  }
}

export async function deleteTopicApi(topicId: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/topics/${encodeURIComponent(topicId)}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (err) {
    console.warn('API error deleting topic from Cloud SQL:', err);
    return false;
  }
}

// ----------------------------------------------------------------------
// Incident Labs (PostgreSQL incident_labs table)
// ----------------------------------------------------------------------
export async function fetchLabsApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/labs`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {
    console.warn('API error fetching labs from Cloud SQL:', err);
  }
  return null;
}

export async function saveLabsApi(labs: any[]) {
  try {
    const res = await fetch(`${API_BASE_URL}/labs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ labs })
    });
    return res.ok;
  } catch (err) {
    console.warn('API error saving labs to Cloud SQL:', err);
    return false;
  }
}

export async function deleteLabApi(labId: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/labs/${encodeURIComponent(labId)}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (err) {
    console.warn('API error deleting lab from Cloud SQL:', err);
    return false;
  }
}

// ----------------------------------------------------------------------
// User Progress & Leaderboard
// ----------------------------------------------------------------------
export async function fetchUserProgressApi(username: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/progress/${encodeURIComponent(username)}`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('API error fetching user progress from Cloud SQL:', err);
  }
  return { completedQuestionIds: [], solvedLabIds: [] };
}

export async function recordQuestionCompletionApi(username: string, questionId: string) {
  try {
    await fetch(`${API_BASE_URL}/progress/complete-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, questionId })
    });
  } catch (err) {
    console.warn('API error saving question completion:', err);
  }
}

export async function recordQuestionUncompletionApi(username: string, questionId: string) {
  try {
    await fetch(`${API_BASE_URL}/progress/uncomplete-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, questionId })
    });
  } catch (err) {
    console.warn('API error removing question completion:', err);
  }
}

export async function recordLabSolutionApi(username: string, labId: string) {
  try {
    await fetch(`${API_BASE_URL}/progress/solve-lab`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, labId })
    });
  } catch (err) {
    console.warn('API error saving lab solution:', err);
  }
}

export async function recordLabUnsolveApi(username: string, labId: string) {
  try {
    await fetch(`${API_BASE_URL}/progress/unsolve-lab`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, labId })
    });
  } catch (err) {
    console.warn('API error removing lab solution:', err);
  }
}

export async function resetUserProgressApi(username: string) {
  try {
    await fetch(`${API_BASE_URL}/progress/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
  } catch (err) {
    console.warn('API error resetting user progress:', err);
  }
}

// ----------------------------------------------------------------------
// Audit & Activity Logs
// ----------------------------------------------------------------------
export async function fetchActivityLogsApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/logs`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('API error fetching activity logs from Cloud SQL:', err);
  }
  return [];
}

export async function recordActivityLogApi(logData: {
  username: string;
  type: string;
  title: string;
  details: string;
  deviceOS?: string;
}) {
  try {
    await fetch(`${API_BASE_URL}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData)
    });
  } catch (err) {
    console.warn('API error recording activity log:', err);
  }
}

export async function purgeActivityLogsApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/logs`, { method: 'DELETE' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteActivityLogApi(logId: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/logs/${encodeURIComponent(logId)}`, { method: 'DELETE' });
    return res.ok;
  } catch (err) {
    console.warn('API error deleting activity log:', err);
    return false;
  }
}

// ----------------------------------------------------------------------
// Platform Settings (Learning Path & Troubleshooting Labs visibility)
// ----------------------------------------------------------------------
export interface PlatformSettings {
  isLearningPathEnabled: boolean;
  isTroubleshootingLabsEnabled: boolean;
}

export async function fetchPlatformSettingsApi(): Promise<PlatformSettings> {
  try {
    const res = await fetch(`${API_BASE_URL}/settings`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('API error fetching platform settings:', err);
  }
  return {
    isLearningPathEnabled: true,
    isTroubleshootingLabsEnabled: true
  };
}

export async function savePlatformSettingsApi(settings: PlatformSettings): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return res.ok;
  } catch (err) {
    console.warn('API error saving platform settings:', err);
    return false;
  }
}

export async function sendUserHeartbeatApi(username: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/users/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
  } catch {
    // Fail silently
  }
}

// ----------------------------------------------------------------------
// User Certificates (PostgreSQL user_certificates table)
// ----------------------------------------------------------------------
export interface UserCertificate {
  id: string;
  username: string;
  displayName?: string;
  topicId: string;
  topicTitle: string;
  scorePercent: number;
  certificateCode: string;
  issuedAt: string;
}

export async function fetchUserCertificatesApi(username: string): Promise<UserCertificate[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/certificates/${encodeURIComponent(username)}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.warn('API error fetching user certificates:', err);
  }
  return [];
}

export async function fetchAllCertificatesApi(): Promise<UserCertificate[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/certificates`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.warn('API error fetching all certificates:', err);
  }
  return [];
}

export async function issueCertificateApi(params: {
  username: string;
  topicId: string;
  topicTitle: string;
  scorePercent?: number;
}): Promise<UserCertificate | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/certificates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('API error issuing certificate:', err);
  }
  return null;
}


