import { trackAnalyticsEventApi } from '../services/api';
import { detectDeviceOS } from './activityStore';

// Get or initialize persistent visitor ID across sessions
export function getVisitorId(): string {
  if (typeof window === 'undefined') return 'server_visitor';
  let vid = localStorage.getItem('huntdevops_visitor_id');
  if (!vid) {
    vid = `vis_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    try {
      localStorage.setItem('huntdevops_visitor_id', vid);
    } catch {}
  }
  return vid;
}

// Get or initialize current browser session ID
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server_session';
  let sid = sessionStorage.getItem('huntdevops_session_id');
  if (!sid) {
    sid = `ses_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    try {
      sessionStorage.setItem('huntdevops_session_id', sid);
    } catch {}
  }
  return sid;
}

export interface AnalyticsEventPayload {
  eventType: 'PAGE_VIEW' | 'CLICK' | 'HEARTBEAT' | 'CHECKLIST_TOGGLE' | 'COMMAND_RUN' | 'LAB_SOLVE' | 'TAB_SWITCH' | 'SEARCH' | 'CERT_DOWNLOAD';
  targetName: string;
  targetPath?: string;
  details?: Record<string, any>;
  username?: string | null;
}

// Main tracking function
export function trackEvent({
  eventType,
  targetName,
  targetPath,
  details = {},
  username
}: AnalyticsEventPayload) {
  if (typeof window === 'undefined') return;

  const currentPath = targetPath || window.location.pathname + window.location.hash;
  const currentUsername = username !== undefined 
    ? username 
    : (() => {
        try {
          const userStr = localStorage.getItem('huntdevops_user');
          if (userStr) {
            const parsed = JSON.parse(userStr);
            return parsed?.username || null;
          }
        } catch {}
        return null;
      })();

  trackAnalyticsEventApi({
    sessionId: getSessionId(),
    visitorId: getVisitorId(),
    username: currentUsername,
    eventType,
    targetName,
    targetPath: currentPath,
    details,
    deviceOS: detectDeviceOS(),
    referrer: typeof document !== 'undefined' ? document.referrer : ''
  });
}

// Helper to track interactive button / element clicks
export function trackClick(targetName: string, details?: Record<string, any>, username?: string | null) {
  trackEvent({
    eventType: 'CLICK',
    targetName,
    details,
    username
  });
}

// Helper to track checklist item toggle clicks
export function trackChecklistClick(itemId: string, itemTitle: string, checked: boolean, username?: string | null) {
  trackEvent({
    eventType: 'CHECKLIST_TOGGLE',
    targetName: `Checklist: ${itemTitle || itemId}`,
    details: { itemId, checked },
    username
  });
}

// Helper to track incident lab attempt / solve clicks
export function trackLabClick(labId: string, labTitle: string, action: 'ATTEMPT' | 'SOLVE' | 'RESET', username?: string | null) {
  trackEvent({
    eventType: 'LAB_SOLVE',
    targetName: `Incident Lab ${action}: ${labTitle || labId}`,
    details: { labId, action },
    username
  });
}

// Helper to track command execution in terminal
export function trackCommandRun(command: string, username?: string | null) {
  trackEvent({
    eventType: 'COMMAND_RUN',
    targetName: `Terminal Exec: ${command}`,
    details: { command },
    username
  });
}
