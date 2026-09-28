import { useState, useEffect } from 'react';
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
import { TOPICS, type Topic } from './data/sheetData';
import { CHALLENGES, type Challenge } from './data/practiceData';
import { logUserActivity, detectDeviceOS, updateUserStreakOnLogin } from './utils/activityStore';
import { Sparkles, Award, Flame, X } from 'lucide-react';

const DEFAULT_USERS: UserRecord[] = [
  {
    id: 'usr_001',
    username: 'admin',
    displayName: 'Super Admin',
    email: 'admin@huntdevops.io',
    password: 'admin123',
    role: 'Admin',
    experienceLevel: 'Advanced',
    status: 'Active',
    createdAt: '2026-01-15'
  },
  {
    id: 'usr_002',
    username: 'alex_sre',
    displayName: 'Alex Morgan',
    email: 'alex.m@cloudcorp.com',
    password: 'devops2026',
    role: 'DevOps Lead',
    experienceLevel: 'Advanced',
    status: 'Active',
    createdAt: '2026-02-10'
  },
  {
    id: 'usr_003',
    username: 'priya_k8s',
    displayName: 'Priya Sharma',
    email: 'priya@techscale.io',
    password: 'cloud2026',
    role: 'SRE Pro',
    experienceLevel: 'Intermediate',
    status: 'Active',
    createdAt: '2026-02-28'
  },
  {
    id: 'usr_004',
    username: 'david_kim',
    displayName: 'David Kim',
    email: 'dkim@startuplab.dev',
    password: 'learner123',
    role: 'Learner',
    experienceLevel: 'Beginner',
    status: 'Active',
    createdAt: '2026-03-04'
  }
];

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

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Dynamic Curriculum Topics state (persisted in localStorage)
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
    localStorage.setItem('huntdevops_topics', JSON.stringify(newTopics));
  };

  // Dynamic User Management Store (persisted in localStorage) 
  const [userStore, setUserStore] = useState<UserRecord[]>(() => {
    try {
      const saved = localStorage.getItem('huntdevops_user_store');
      return saved ? JSON.parse(saved) : DEFAULT_USERS;
    } catch {
      return DEFAULT_USERS;
    }
  });

  const handleUpdateUserStore = (newUsers: UserRecord[]) => {
    setUserStore(newUsers);
    localStorage.setItem('huntdevops_user_store', JSON.stringify(newUsers));

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
        localStorage.setItem('huntdevops_user', JSON.stringify(updatedUser));
      }
    }
  };

  // App UI Tab state ('sheet' | 'practice')
  const [activeTab, setActiveTab] = useState<'sheet' | 'practice'>('sheet');
  const [activeTopicId, setActiveTopicId] = useState<string>(topics[0]?.id || 'argocd');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  // Dynamic Incident Labs Challenges state (persisted in localStorage)
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
    localStorage.setItem('huntdevops_challenges', JSON.stringify(newChallenges));
  };

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

  // Dynamic user progress loader on login / user switch
  useEffect(() => {
    if (user?.username) {
      const updatedStreak = updateUserStreakOnLogin(user.username);
      setStreakCount(updatedStreak);

      try {
        const savedComp = localStorage.getItem(`huntdevops_completed_${user.username}`);
        setCompletedIds(savedComp ? new Set(JSON.parse(savedComp)) : new Set());
      } catch {
        setCompletedIds(new Set());
      }

      try {
        const savedSolved = localStorage.getItem(`huntdevops_solved_${user.username}`);
        setSolvedIds(savedSolved ? new Set(JSON.parse(savedSolved)) : new Set());
      } catch {
        setSolvedIds(new Set());
      }
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

  // Persist completed items per user
  const toggleCompleted = (itemId: string) => {
    setCompletedIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      const arr = Array.from(next);
      if (user?.username) {
        localStorage.setItem(`huntdevops_completed_${user.username}`, JSON.stringify(arr));
        logUserActivity(
          user.username,
          'ITEM_CHECKED',
          `Checked Practice Item (+25 XP)`,
          `Total completed items: ${arr.length}`
        );
      }
      localStorage.setItem('huntdevops_completed', JSON.stringify(arr));
      return next;
    });
  };

  // Persist solved challenges per user
  const handleSolveChallenge = (challengeId: string) => {
    setSolvedIds(prev => {
      const next = new Set(prev);
      next.add(challengeId);
      const arr = Array.from(next);
      if (user?.username) {
        localStorage.setItem(`huntdevops_solved_${user.username}`, JSON.stringify(arr));
        logUserActivity(
          user.username,
          'LAB_SOLVED',
          `Mastered Incident Lab Challenge (+150 XP)`,
          `Total solved labs: ${arr.length}`
        );
      }
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
      />
    );
  }

  // ROUTE 2: Unauthenticated Guard for Learner Platform
  if (!user) {
    return <LoginPage onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />;
  }

  // ROUTE 3: Authenticated View for Learner Platform (/)
  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased selection:bg-indigo-500/20">

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
        onOpenAdmin={() => navigateTo('/admin')}
        completedCount={completedIds.size}
        totalCount={totalChecklistItems}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        streakCount={streakCount}
      />

      {/* Main Layout Container with Sidebar */}
      <div className="flex">

        {/* DevOps Stack Sidebar */}
        {activeTab === 'sheet' && (
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
            <TroubleshootingPractice
              challenges={challengesList}
              solvedIds={solvedIds}
              onSolveChallenge={handleSolveChallenge}
              user={user}
            />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 bg-white">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-slate-500 space-y-2">
          <p>© 2026 HuntDevOps — Practical DevOps learning sheet with hands-on troubleshooting challenges.</p>
          <div className="flex items-center justify-center gap-4 pt-1">
            <button onClick={() => setActiveTab('sheet')} className="hover:underline">Learning Path</button>
            <span>•</span>
            <button onClick={() => setActiveTab('practice')} className="hover:underline font-bold text-emerald-700">Practice Incidents</button>
            <span>•</span>
            <button onClick={() => setIsDashboardOpen(true)} className="hover:underline">Launch Stats</button>
            <span>•</span>
            <button onClick={() => navigateTo('/admin')} className="hover:underline font-bold text-purple-700">Admin Portal (/admin)</button>
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
