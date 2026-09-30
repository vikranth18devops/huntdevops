import { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LearningSheet } from './components/LearningSheet';
import { TroubleshootingPractice } from './components/TroubleshootingPractice';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { LaunchDashboardModal } from './components/LaunchDashboardModal';
import { AchievementsModal } from './components/AchievementsModal';
import { AdminPortal, type UserRecord } from './components/AdminPortal';
import { LoginPage } from './components/LoginPage';
import { SessionTimeoutModal } from './components/SessionTimeoutModal';
import { TOPICS, type Topic } from './data/sheetData';
import { CHALLENGES, type Challenge } from './data/practiceData';
import { logUserActivity, detectDeviceOS, updateUserStreakOnLogin } from './utils/activityStore';
import {
  fetchAllUsersApi,
  fetchTopicsApi,
  saveTopicsApi,
  fetchLabsApi,
  saveLabsApi,
  fetchUserProgressApi,
  recordQuestionCompletionApi,
  recordQuestionUncompletionApi,
  recordLabSolutionApi,
  resetUserProgressApi,
  fetchPlatformSettingsApi,
  savePlatformSettingsApi,
  sendUserHeartbeatApi,
  type PlatformSettings
} from './services/api';
import { trackEvent, trackClick, trackChecklistClick, trackLabClick } from './utils/analyticsTracker';
import { Sparkles, Award, Flame, X, ShieldAlert, BookOpen } from 'lucide-react';

// Helper to safely write to localStorage without crashing on QuotaExceededError
export function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.warn(`[HuntDevOps Storage] Browser localStorage quota exceeded or unavailable for key '${key}'. PostgreSQL Cloud SQL remains the single source of truth.`, err);
    return false;
  }
}

export function App() {
  // Routing state for /admin vs /
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname === '/admin' || window.location.hash === '#admin' ? '/admin' : '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname === '/admin' || window.location.hash === '#admin' ? '/admin' : '/';
      setCurrentPath(path);
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Protect Learner UI Content: Disable Right-Click, Copy, Cut, and Clipboard shortcuts on User UI only
  useEffect(() => {
    // Keep Admin Portal completely unrestricted for system administrators
    if (currentPath === '/admin') return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleCopyCut = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInputOrTextArea = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (!isInputOrTextArea) {
        e.preventDefault();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement | null;
      const isInputOrTextArea = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if (isCtrlOrCmd && !isInputOrTextArea) {
        // Block Ctrl+C (Copy), Ctrl+X (Cut), Ctrl+U (View Source), Ctrl+S (Save Page), Ctrl+P (Print)
        if (['c', 'C', 'x', 'X', 'u', 'U', 's', 'S', 'p', 'P'].includes(e.key)) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyCut);
    document.addEventListener('cut', handleCopyCut);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyCut);
      document.removeEventListener('cut', handleCopyCut);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentPath]);


  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Dynamic Platform Tab Visibility Settings (backed by Cloud SQL PostgreSQL)
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(() => {
    try {
      const saved = localStorage.getItem('huntdevops_platform_settings');
      return saved ? JSON.parse(saved) : { isLearningPathEnabled: true, isTroubleshootingLabsEnabled: true };
    } catch {
      return { isLearningPathEnabled: true, isTroubleshootingLabsEnabled: true };
    }
  });

  const handleUpdatePlatformSettings = (newSettings: PlatformSettings) => {
    setPlatformSettings(newSettings);
    safeLocalStorageSet('huntdevops_platform_settings', JSON.stringify(newSettings));
    savePlatformSettingsApi(newSettings);

    if (!newSettings.isLearningPathEnabled && activeTab === 'sheet') {
      setActiveTab('practice');
    } else if (!newSettings.isTroubleshootingLabsEnabled && activeTab === 'practice') {
      setActiveTab('sheet');
    }
  };

  // Dynamic Curriculum Topics state (backed by Cloud SQL PostgreSQL)
  const [topics, setTopics] = useState<Topic[]>(() => {
    try {
      const saved = localStorage.getItem('huntdevops_topics');
      return saved ? JSON.parse(saved) : TOPICS;
    } catch {
      return TOPICS;
    }
  });

  const handleUpdateTopics = (newTopics: Topic[]) => {
    setTopics(newTopics);
    safeLocalStorageSet('huntdevops_topics', JSON.stringify(newTopics));
    saveTopicsApi(newTopics);
  };

  // Dynamic User Management Store (backed by Cloud SQL PostgreSQL)
  const [userStore, setUserStore] = useState<UserRecord[]>(() => {
    try {
      const saved = localStorage.getItem('huntdevops_user_store');
      if (!saved) return [];
      const parsed: UserRecord[] = JSON.parse(saved);
      // Remove any legacy mock users
      return parsed.filter(u => !['alex_sre', 'priya_k8s', 'david_kim'].includes(u.username.toLowerCase()));
    } catch {
      return [];
    }
  });

  const handleUpdateUserStore = (newUsers: UserRecord[]) => {
    setUserStore(newUsers);
    safeLocalStorageSet('huntdevops_user_store', JSON.stringify(newUsers));

    if (user?.username) {
      const match = newUsers.find(u => u.username.toLowerCase() === user.username.toLowerCase());
      if (match) {
        const updatedUser = {
          ...user,
          experienceLevel: match.experienceLevel || 'Beginner',
          displayName: match.displayName || user.displayName,
          email: match.email || user.email,
          role: match.role || user.role
        };
        setUser(updatedUser);
        safeLocalStorageSet('huntdevops_user', JSON.stringify(updatedUser));
      }
    }
  };

  // Dynamic Incident Labs Challenges state (backed by Cloud SQL PostgreSQL)
  const [challengesList, setChallengesList] = useState<Challenge[]>(() => {
    try {
      const saved = localStorage.getItem('huntdevops_challenges');
      return saved ? JSON.parse(saved) : CHALLENGES;
    } catch {
      return CHALLENGES;
    }
  });

  const handleUpdateChallenges = (newChallenges: Challenge[]) => {
    setChallengesList(newChallenges);
    safeLocalStorageSet('huntdevops_challenges', JSON.stringify(newChallenges));
    saveLabsApi(newChallenges);
  };

  // Sync real-time data from Cloud SQL PostgreSQL on mount
  useEffect(() => {
    fetchPlatformSettingsApi().then(settings => {
      if (settings) {
        setPlatformSettings(settings);
        safeLocalStorageSet('huntdevops_platform_settings', JSON.stringify(settings));
        if (!settings.isLearningPathEnabled && activeTab === 'sheet') {
          setActiveTab('practice');
        } else if (!settings.isTroubleshootingLabsEnabled && activeTab === 'practice') {
          setActiveTab('sheet');
        }
      }
    });

    fetchAllUsersApi().then(dbUsers => {
      if (Array.isArray(dbUsers) && dbUsers.length > 0) {
        setUserStore(dbUsers);
        safeLocalStorageSet('huntdevops_user_store', JSON.stringify(dbUsers));
      }
    });

    fetchTopicsApi().then(dbTopics => {
      if (Array.isArray(dbTopics) && dbTopics.length > 0) {
        setTopics(dbTopics);
        safeLocalStorageSet('huntdevops_topics', JSON.stringify(dbTopics));
      }
    });

    fetchLabsApi().then(dbLabs => {
      if (Array.isArray(dbLabs) && dbLabs.length > 0) {
        setChallengesList(dbLabs);
        safeLocalStorageSet('huntdevops_challenges', JSON.stringify(dbLabs));
      }
    });
  }, [currentPath]);

  // App UI Tab state ('sheet' | 'practice')
  const [activeTab, setActiveTab] = useState<'sheet' | 'practice'>('sheet');
  const [activeTopicId, setActiveTopicId] = useState<string>(topics[0]?.id || 'argocd');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Authenticated user state
  const [user, setUser] = useState<{ username: string; displayName?: string; email?: string; phone?: string; role?: string; experienceLevel?: 'Beginner' | 'Intermediate' | 'Advanced' } | null>(() => {
    try {
      const saved = localStorage.getItem('huntdevops_user') || localStorage.getItem('onlydevops_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (!parsed.experienceLevel && parsed.username) {
        const savedStore = localStorage.getItem('huntdevops_user_store');
        if (savedStore) {
          const users: UserRecord[] = JSON.parse(savedStore);
          const match = users.find(u => u.username.toLowerCase() === parsed.username.toLowerCase());
          if (match?.experienceLevel) {
            parsed.experienceLevel = match.experienceLevel;
          }
        }
      }
      return parsed;
    } catch {
      return null;
    }
  });

  // Real-time Live Visitor & Page View Analytics Tracker
  useEffect(() => {
    // 1. Track initial visit & page views
    trackEvent({
      eventType: 'PAGE_VIEW',
      targetName: currentPath === '/admin' ? 'Admin Portal View' : 'Learner Platform View',
      targetPath: currentPath,
      username: user?.username || null
    });

    // 2. Send live active heartbeat every 30 seconds to maintain real-time online status in Admin Panel
    const liveHeartbeatInterval = setInterval(() => {
      trackEvent({
        eventType: 'HEARTBEAT',
        targetName: 'Live Session Heartbeat',
        targetPath: currentPath,
        username: user?.username || null
      });
    }, 30 * 1000);

    // 3. Track interactive clicks across the platform
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const clickable = target.closest('button, a, input[type="checkbox"], [role="button"]') as HTMLElement | null;
      if (clickable) {
        const label = clickable.getAttribute('aria-label') ||
                      clickable.getAttribute('title') ||
                      clickable.innerText?.trim().slice(0, 60) ||
                      clickable.tagName;
        if (label && label.length > 0) {
          trackClick(label, { path: currentPath }, user?.username || null);
        }
      }
    };

    document.addEventListener('click', handleGlobalClick, { passive: true });

    return () => {
      clearInterval(liveHeartbeatInterval);
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [currentPath, user?.username]);

  // Completed checklist item IDs (User-Scoped)
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => {
    try {
      const activeUser = localStorage.getItem('huntdevops_user');
      const uObj = activeUser ? JSON.parse(activeUser) : null;
      if (uObj?.username) {
        const saved = localStorage.getItem(`huntdevops_completed_${uObj.username}`);
        if (saved) return new Set(JSON.parse(saved));
      }
      return new Set();
    } catch {
      return new Set();
    }
  });

  // Solved practice challenge IDs (User-Scoped)
  const [solvedIds, setSolvedIds] = useState<Set<string>>(() => {
    try {
      const activeUser = localStorage.getItem('huntdevops_user');
      const uObj = activeUser ? JSON.parse(activeUser) : null;
      if (uObj?.username) {
        const saved = localStorage.getItem(`huntdevops_solved_${uObj.username}`);
        if (saved) return new Set(JSON.parse(saved));
      }
      return new Set();
    } catch {
      return new Set();
    }
  });

  // User Streak state
  const [streakCount, setStreakCount] = useState<number>(1);

  // Dynamic user progress loader on login / user switch (from Cloud SQL PostgreSQL)
  useEffect(() => {
    if (user?.username) {
      const updatedStreak = updateUserStreakOnLogin(user.username);
      setStreakCount(updatedStreak);

      fetchUserProgressApi(user.username).then(progress => {
        if (progress) {
          const compArr = progress.completedQuestionIds || [];
          const solArr = progress.solvedLabIds || [];
          setCompletedIds(new Set(compArr));
          setSolvedIds(new Set(solArr));
          localStorage.setItem(`huntdevops_completed_${user.username}`, JSON.stringify(compArr));
          localStorage.setItem(`huntdevops_solved_${user.username}`, JSON.stringify(solArr));
        }
      });
    } else {
      setCompletedIds(new Set());
      setSolvedIds(new Set());
      setStreakCount(0);
    }
  }, [user?.username]);

  // Modal visibility states
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isSessionTimeoutOpen, setIsSessionTimeoutOpen] = useState(false);

  // -------------------------------------------------------------
  // INACTIVITY SESSION TIMEOUT & AUTO-SAVE (15 Minutes)
  // -------------------------------------------------------------
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!user?.username) return;

    lastActivityRef.current = Date.now();
    const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 mins timeout

    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    activityEvents.forEach(evt => window.addEventListener(evt, handleUserActivity, { passive: true }));

    // Periodic Heartbeat every 2 minutes
    const heartbeatTimer = setInterval(() => {
      if (user?.username) {
        sendUserHeartbeatApi(user.username);
      }
    }, 2 * 60 * 1000);

    // Inactivity Checker every 15 seconds
    const checkTimeoutTimer = setInterval(() => {
      if (Date.now() - lastActivityRef.current > INACTIVITY_TIMEOUT_MS) {
        if (user?.username) {
          logUserActivity(
            user.username,
            'USER_LOGOUT',
            `Session Expired (Timeout): @${user.username}`,
            `Auto-logged out after 15 mins of inactivity. All assignments & progress safely saved to Cloud SQL.`,
            detectDeviceOS()
          );
        }
        localStorage.removeItem('huntdevops_user');
        localStorage.removeItem('onlydevops_user');
        setUser(null);
        setIsSessionTimeoutOpen(true);
      }
    }, 15000);

    return () => {
      activityEvents.forEach(evt => window.removeEventListener(evt, handleUserActivity));
      clearInterval(heartbeatTimer);
      clearInterval(checkTimeoutTimer);
    };
  }, [user?.username]);

  // Persist completed items per user in Cloud SQL PostgreSQL
  const toggleCompleted = (itemId: string) => {
    setCompletedIds(prev => {
      const next = new Set(prev);
      const isChecking = !next.has(itemId);
      if (isChecking) {
        next.add(itemId);
        if (user?.username) {
          recordQuestionCompletionApi(user.username, itemId);
          logUserActivity(
            user.username,
            'ITEM_CHECKED',
            `Checked Practice Item (+25 XP)`,
            `Completed checklist item ID: ${itemId}`
          );
        }
        trackChecklistClick(itemId, itemId, true, user?.username || null);
      } else {
        next.delete(itemId);
        if (user?.username) {
          recordQuestionUncompletionApi(user.username, itemId);
        }
        trackChecklistClick(itemId, itemId, false, user?.username || null);
      }
      const arr = Array.from(next);
      if (user?.username) {
        localStorage.setItem(`huntdevops_completed_${user.username}`, JSON.stringify(arr));
      }
      localStorage.setItem('huntdevops_completed', JSON.stringify(arr));
      return next;
    });
  };

  // Persist solved challenges per user in Cloud SQL PostgreSQL
  const handleSolveChallenge = (challengeId: string) => {
    setSolvedIds(prev => {
      const next = new Set(prev);
      next.add(challengeId);
      const arr = Array.from(next);
      if (user?.username) {
        recordLabSolutionApi(user.username, challengeId);
        localStorage.setItem(`huntdevops_solved_${user.username}`, JSON.stringify(arr));
        logUserActivity(
          user.username,
          'LAB_SOLVED',
          `Mastered Incident Lab Challenge (+150 XP)`,
          `Solved incident lab challenge ID: ${challengeId}`
        );
      }
      trackLabClick(challengeId, challengeId, 'SOLVE', user?.username || null);
      localStorage.setItem('huntdevops_solved', JSON.stringify(arr));
      return next;
    });
  };

  const [logoutModalData, setLogoutModalData] = useState<{ name: string; streak: number } | null>(null);

  const handleLogout = () => {
    const currentName = user?.displayName || user?.username || 'Learner';
    if (user?.username) {
      logUserActivity(
        user.username,
        'USER_LOGOUT',
        `User Signed Out: @${user.username}`,
        `Ended active session from ${detectDeviceOS()}`,
        detectDeviceOS()
      );
    }
    localStorage.removeItem('huntdevops_user');
    localStorage.removeItem('onlydevops_user');
    setUser(null);
    setLogoutModalData({ name: currentName, streak: streakCount });
  };

  const handleUpdateDisplayName = (newDisplayName: string) => {
    if (!user) return;
    const updated = { ...user, displayName: newDisplayName };
    setUser(updated);
    localStorage.setItem('huntdevops_user', JSON.stringify(updated));
  };

  const handleResetUserProgress = (targetUsername: string) => {
    const uKey = targetUsername.toLowerCase();
    resetUserProgressApi(uKey);
    localStorage.removeItem(`huntdevops_completed_${uKey}`);
    localStorage.removeItem(`huntdevops_solved_${uKey}`);
    localStorage.removeItem(`huntdevops_completed_${targetUsername}`);
    localStorage.removeItem(`huntdevops_solved_${targetUsername}`);
    localStorage.setItem(`huntdevops_completed_${uKey}`, JSON.stringify([]));
    localStorage.setItem(`huntdevops_solved_${uKey}`, JSON.stringify([]));

    if (user?.username.toLowerCase() === uKey) {
      setCompletedIds(new Set());
      setSolvedIds(new Set());
    }

    logUserActivity(
      targetUsername,
      'PROGRESS_RESET',
      `Progress Reset: @${targetUsername}`,
      `Admin reset learning progress and incident labs for @${targetUsername}`,
      detectDeviceOS()
    );
  };

  const totalChecklistItems = topics.flatMap(t => t.sections.flatMap(s => s.commands.flatMap(c => c.items))).length;

  // ROUTE 1: Dedicated Admin Portal Route (/admin)
  if (currentPath === '/admin') {
    return (
      <AdminPortal
        topics={topics}
        onUpdateTopics={handleUpdateTopics}
        users={userStore}
        onUpdateUsers={handleUpdateUserStore}
        onNavigateHome={() => navigateTo('/')}
        challenges={challengesList}
        onUpdateChallenges={handleUpdateChallenges}
        onResetUserProgress={handleResetUserProgress}
        platformSettings={platformSettings}
        onUpdatePlatformSettings={handleUpdatePlatformSettings}
      />
    );
  }

  // ROUTE 2: Unauthenticated Guard for Learner Platform
  if (!user) {
    return <LoginPage onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} topics={topics} />;
  }

  // ROUTE 3: Authenticated View for Learner Platform (/)
  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased selection:bg-indigo-500/20 select-none">

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenDashboard={() => setIsDashboardOpen(true)}
        onOpenAchievements={() => setIsAchievementsOpen(true)}
        completedCount={completedIds.size}
        totalCount={totalChecklistItems}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        streakCount={streakCount}
        isLearningPathEnabled={platformSettings.isLearningPathEnabled}
        isTroubleshootingLabsEnabled={platformSettings.isTroubleshootingLabsEnabled}
      />

      {/* Main Layout Container with Sidebar */}
      <div className="flex">

        {/* DevOps Stack Sidebar */}
        {activeTab === 'sheet' && platformSettings.isLearningPathEnabled && (
          <Sidebar
            topics={topics}
            activeTopicId={activeTopicId}
            setActiveTopicId={setActiveTopicId}
            completedIds={completedIds}
            isOpen={isSidebarOpen}
            setIsOpen={setIsSidebarOpen}
            streakCount={streakCount}
          />
        )}

        {/* Main Content View */}
        <main className="flex-1 min-w-0 pb-16">
          {activeTab === 'sheet' ? (
            platformSettings.isLearningPathEnabled ? (
              <LearningSheet
                topics={topics}
                activeTopicId={activeTopicId}
                setActiveTopicId={setActiveTopicId}
                completedIds={completedIds}
                toggleCompleted={toggleCompleted}
                searchQuery={searchQuery}
                user={user}
                streakCount={streakCount}
              />
            ) : (
              <div className="mx-auto max-w-2xl px-4 py-20 text-center space-y-4">
                <div className="inline-flex p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500">
                  <BookOpen className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Learning Path Temporarily Unavailable</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The administrator has temporarily disabled the Learning Path curriculum module for maintenance. Please practice incident troubleshooting challenges in the meantime.
                </p>
                {platformSettings.isTroubleshootingLabsEnabled && (
                  <button
                    onClick={() => setActiveTab('practice')}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm"
                  >
                    Go to Troubleshooting Labs
                  </button>
                )}
              </div>
            )
          ) : (
            platformSettings.isTroubleshootingLabsEnabled ? (
              <TroubleshootingPractice
                challenges={challengesList}
                solvedIds={solvedIds}
                onSolveChallenge={handleSolveChallenge}
                user={user}
              />
            ) : (
              <div className="mx-auto max-w-2xl px-4 py-20 text-center space-y-4">
                <div className="inline-flex p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500">
                  <ShieldAlert className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Troubleshooting Labs Temporarily Unavailable</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The administrator has temporarily disabled the Troubleshooting Labs module for scenario maintenance. Please explore the Learning Path checklist.
                </p>
                {platformSettings.isLearningPathEnabled && (
                  <button
                    onClick={() => setActiveTab('sheet')}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm"
                  >
                    Go to Learning Path
                  </button>
                )}
              </div>
            )
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 bg-white">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-slate-500 space-y-2">
          <p>© 2026 HuntDevOps.online — Practical DevOps learning sheet with hands-on troubleshooting challenges.</p>
          <div className="flex items-center justify-center gap-4 pt-1 flex-wrap">
            {platformSettings.isLearningPathEnabled && (
              <button onClick={() => setActiveTab('sheet')} className="hover:underline">Learning Path</button>
            )}
            {platformSettings.isLearningPathEnabled && platformSettings.isTroubleshootingLabsEnabled && (
              <span>•</span>
            )}
            {platformSettings.isTroubleshootingLabsEnabled && (
              <button onClick={() => setActiveTab('practice')} className="hover:underline font-bold text-emerald-700">Practice Incidents</button>
            )}
            <span>•</span>
            <button onClick={() => setIsDashboardOpen(true)} className="hover:underline">Launch Stats</button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(u) => setUser(u)}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        completedCount={completedIds.size}
        solvedCount={solvedIds.size}
        totalChecklistItems={totalChecklistItems}
        topics={topics}
        completedIds={completedIds}
        onLogout={handleLogout}
        onUpdateUser={(updated) => {
          if (!user) return;
          const next = { ...user, ...updated };
          setUser(next);
          localStorage.setItem('huntdevops_user', JSON.stringify(next));
          const savedStore = localStorage.getItem('huntdevops_user_store');
          let users: UserRecord[] = savedStore ? JSON.parse(savedStore) : userStore;
          const idx = users.findIndex(u => u.username.toLowerCase() === next.username.toLowerCase());
          if (idx >= 0) {
            users[idx] = { ...users[idx], displayName: next.displayName || users[idx].displayName, email: next.email || users[idx].email, phone: next.phone || users[idx].phone, experienceLevel: next.experienceLevel || users[idx].experienceLevel };
            setUserStore(users);
            localStorage.setItem('huntdevops_user_store', JSON.stringify(users));
          }
        }}
        onUpdateDisplayName={handleUpdateDisplayName}
        streakCount={streakCount}
      />

      <LaunchDashboardModal
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        registeredCount={userStore.length}
        completedCount={completedIds.size}
        totalChecklistItems={totalChecklistItems}
      />

      <AchievementsModal
        isOpen={isAchievementsOpen}
        onClose={() => setIsAchievementsOpen(false)}
        topics={topics}
        completedIds={completedIds}
        solvedIds={solvedIds}
        user={user}
        streakCount={streakCount}
      />

      {/* SESSION TIMEOUT MODAL WITH AUTO-SAVE CONFIRMATION */}
      <SessionTimeoutModal
        isOpen={isSessionTimeoutOpen}
        onClose={() => setIsSessionTimeoutOpen(false)}
        onLoginAgain={() => {
          setIsSessionTimeoutOpen(false);
          setIsAuthOpen(true);
        }}
        savedItemsCount={completedIds.size}
      />

      {/* ATTRACTIVE USER LOGOUT FAREWELL MODAL */}
      {logoutModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-3xl border border-indigo-500/30 bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 p-6 shadow-2xl text-white space-y-5 animate-in zoom-in-95 duration-300">

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
                <span>Session Wrapped Up</span>
              </div>
              <button
                onClick={() => setLogoutModalData(null)}
                className="p-1 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Close Notification"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 text-center py-2">
              <div className="h-16 w-16 mx-auto rounded-3xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white">
                <Award className="h-9 w-9 text-white" />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">
                Great Work Today, <span className="text-indigo-400">@{logoutModalData.name}</span>!
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed px-2">
                Every command checklist item completed & incident lab diagnosed brings you one step closer to becoming a senior Cloud & SRE Architect.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Flame className="h-4.5 w-4.5 text-amber-500 fill-amber-500" />
                <span>DevOps Learning Streak</span>
              </div>
              <span className="font-black text-white bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/40 text-amber-300 font-mono">
                {logoutModalData.streak} Days Active 🔥
              </span>
            </div>

            <button
              onClick={() => setLogoutModalData(null)}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
            >
              Continue / Return to Sign In
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
