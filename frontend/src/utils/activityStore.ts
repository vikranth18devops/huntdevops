import type { UserRecord } from '../components/AdminPortal';

export interface UserActivity {
  id: string;
  username: string;
  type: 'ACCOUNT_CREATED' | 'USER_LOGIN' | 'USER_LOGOUT' | 'QUIZ_COMPLETED' | 'LAB_SOLVED' | 'ITEM_CHECKED' | 'PROFILE_UPDATED' | 'PROGRESS_RESET';
  title: string;
  details: string;
  deviceOS: string;
  timestamp: string;
}

export function detectDeviceOS(): string {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'Desktop Web Browser';
  }
  const ua = navigator.userAgent || '';
  const platform = (navigator as any).userAgentData?.platform || navigator.platform || '';

  if (/iPhone/i.test(ua)) return 'iPhone (iOS)';
  if (/iPad/i.test(ua)) return 'iPad (iOS)';
  if (/Android/i.test(ua)) {
    return /Mobile/i.test(ua) ? 'Android Mobile' : 'Android Tablet';
  }
  if (/Mac/i.test(platform) || /Macintosh/i.test(ua)) return 'MacBook / macOS';
  if (/Win/i.test(platform) || /Windows/i.test(ua)) return 'Windows PC';
  if (/Linux/i.test(platform) || /Linux/i.test(ua)) return 'Linux Workstation';
  
  return 'Desktop Web Browser';
}

const DEFAULT_ACTIVITIES: UserActivity[] = [
  {
    id: 'act_101',
    username: 'admin',
    type: 'ACCOUNT_CREATED',
    title: 'Super Admin Account Initialized',
    details: 'System administrator registered with full management rights.',
    deviceOS: 'MacBook / macOS',
    timestamp: '2026-01-15 09:00:00'
  },
  {
    id: 'act_102',
    username: 'alex_sre',
    type: 'ACCOUNT_CREATED',
    title: 'New Learner Account Created',
    details: 'Alex Morgan registered with email alex.m@cloudcorp.com',
    deviceOS: 'MacBook / macOS',
    timestamp: '2026-02-10 14:32:10'
  },
  {
    id: 'act_103',
    username: 'priya_k8s',
    type: 'QUIZ_COMPLETED',
    title: 'Passed Kubernetes Fundamentals Quiz',
    details: 'Scored 88% accuracy (Passed 75% benchmark threshold).',
    deviceOS: 'Windows PC',
    timestamp: '2026-09-26 11:15:40'
  },
  {
    id: 'act_104',
    username: 'david_kim',
    type: 'LAB_SOLVED',
    title: 'Solved Pod CrashLoopBackOff Lab',
    details: 'Diagnosed OOMKilled container memory limit in 4 mins.',
    deviceOS: 'Android Mobile',
    timestamp: '2026-09-27 15:20:00'
  }
];

export function getActivityLogs(): UserActivity[] {
  try {
    const saved = localStorage.getItem('huntdevops_activity_logs');
    if (!saved) {
      localStorage.setItem('huntdevops_activity_logs', JSON.stringify(DEFAULT_ACTIVITIES));
      return DEFAULT_ACTIVITIES;
    }
    return JSON.parse(saved);
  } catch {
    return DEFAULT_ACTIVITIES;
  }
}

export function logUserActivity(
  username: string,
  type: UserActivity['type'],
  title: string,
  details: string,
  deviceOS?: string
): UserActivity {
  const currentDevice = deviceOS || detectDeviceOS();
  const newLog: UserActivity = {
    id: `act_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    username,
    type,
    title,
    details,
    deviceOS: currentDevice,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
  };

  const logs = getActivityLogs();
  const updated = [newLog, ...logs];
  localStorage.setItem('huntdevops_activity_logs', JSON.stringify(updated.slice(0, 150))); // Keep latest 150 logs
  return newLog;
}

export function syncUserToAdminStore(userObj: {
  username: string;
  displayName?: string;
  email?: string;
  phone?: string;
  experienceLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
}): UserRecord[] {
  try {
    const currentDevice = detectDeviceOS();
    const currentTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const savedStore = localStorage.getItem('huntdevops_user_store');
    let users: UserRecord[] = savedStore ? JSON.parse(savedStore) : [];

    const existingIndex = users.findIndex(
      u => u.username.toLowerCase() === userObj.username.toLowerCase()
    );

    if (existingIndex >= 0) {
      users[existingIndex] = {
        ...users[existingIndex],
        displayName: userObj.displayName || users[existingIndex].displayName,
        email: userObj.email || users[existingIndex].email,
        phone: userObj.phone || users[existingIndex].phone,
        experienceLevel: userObj.experienceLevel || users[existingIndex].experienceLevel || 'Beginner',
        lastDeviceOS: currentDevice,
        lastLoginAt: currentTimestamp
      };
    } else {
      const newUser: UserRecord = {
        id: `usr_${Date.now()}`,
        username: userObj.username.trim(),
        displayName: userObj.displayName || userObj.username.trim(),
        email: userObj.email || `${userObj.username.trim()}@huntdevops.io`,
        phone: userObj.phone,
        role: 'Learner',
        experienceLevel: userObj.experienceLevel || 'Beginner',
        status: 'Active',
        createdAt: new Date().toISOString().split('T')[0],
        lastDeviceOS: currentDevice,
        lastLoginAt: currentTimestamp
      };
      users = [newUser, ...users];

      logUserActivity(
        newUser.username,
        'ACCOUNT_CREATED',
        `New Account Registered: @${newUser.username}`,
        `Email: ${newUser.email}${newUser.phone ? ` | Phone: ${newUser.phone}` : ''} | Experience: ${newUser.experienceLevel}`,
        currentDevice
      );
    }

    updateUserStreakOnLogin(userObj.username);

    localStorage.setItem('huntdevops_user_store', JSON.stringify(users));
    return users;
  } catch (err) {
    console.error('Failed to sync user to admin store:', err);
    return [];
  }
}

export interface UserStreakRecord {
  username: string;
  streakCount: number;
  lastLoginDate: string;
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getUserStreak(username: string): number {
  if (!username) return 0;
  try {
    const raw = localStorage.getItem(`huntdevops_streak_${username.toLowerCase()}`);
    if (!raw) return 1;
    const record: UserStreakRecord = JSON.parse(raw);
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();

    if (record.lastLoginDate === today || record.lastLoginDate === yesterday) {
      return record.streakCount || 1;
    }
    return 0;
  } catch {
    return 1;
  }
}

export function updateUserStreakOnLogin(username: string): number {
  if (!username) return 0;
  try {
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();
    const key = `huntdevops_streak_${username.toLowerCase()}`;
    const raw = localStorage.getItem(key);

    if (!raw) {
      const initialRecord: UserStreakRecord = {
        username: username.toLowerCase(),
        streakCount: 1,
        lastLoginDate: today
      };
      localStorage.setItem(key, JSON.stringify(initialRecord));
      return 1;
    }

    const record: UserStreakRecord = JSON.parse(raw);
    let newStreak = record.streakCount || 1;

    if (record.lastLoginDate === today) {
      return newStreak;
    } else if (record.lastLoginDate === yesterday) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }

    const updatedRecord: UserStreakRecord = {
      username: username.toLowerCase(),
      streakCount: newStreak,
      lastLoginDate: today
    };
    localStorage.setItem(key, JSON.stringify(updatedRecord));
    return newStreak;
  } catch {
    return 1;
  }
}

