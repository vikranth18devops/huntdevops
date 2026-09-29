import React from 'react';
import { 
  CheckSquare, 
  ShieldAlert, 
  BarChart3, 
  User as UserIcon, 
  Search,
  Award,
  Flame,
  Menu,
  X
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'sheet' | 'practice';
  setActiveTab: (tab: 'sheet' | 'practice') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  user: { username: string; displayName?: string; role?: string } | null;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenDashboard: () => void;
  onOpenAchievements: () => void;
  onOpenAdmin?: () => void;
  completedCount: number;
  totalCount: number;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  streakCount?: number;
  isLearningPathEnabled?: boolean;
  isTroubleshootingLabsEnabled?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  user,
  onOpenAuth,
  onOpenProfile,
  onOpenDashboard,
  onOpenAchievements,
  isSidebarOpen,
  setIsSidebarOpen,
  streakCount = 1,
  isLearningPathEnabled = true,
  isTroubleshootingLabsEnabled = true
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">

          {/* Left Brand & Mobile Sidebar Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900"
              title="Toggle DevOps Stack Sidebar"
            >
              {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            <a
              href="#"
              onClick={(e) => { e.preventDefault(); if (isLearningPathEnabled) setActiveTab('sheet'); else if (isTroubleshootingLabsEnabled) setActiveTab('practice'); }}
              className="flex items-center gap-2.5 font-bold text-2xl tracking-tight text-slate-900 transition-opacity hover:opacity-90"
            >
              <img src="/fevicon.png" alt="HuntDevOps Logo" className="h-9 w-9 object-contain rounded-xl shrink-0 shadow-sm" />
              <span className="font-black tracking-tight text-slate-900">
                hunt<span className="text-indigo-600">devops</span>
              </span>
            </a>

            {/* Navigation Tabs */}
            {(isLearningPathEnabled || isTroubleshootingLabsEnabled) && (
              <nav className="hidden md:flex items-center gap-1 rounded-2xl bg-slate-100 p-1 border border-slate-200">
                {isLearningPathEnabled && (
                  <button
                    onClick={() => setActiveTab('sheet')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'sheet'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    <CheckSquare className="h-5 w-5 text-indigo-600 shrink-0" />
                    <span>Learning Path</span>
                  </button>
                )}

                {isTroubleshootingLabsEnabled && (
                  <button
                    onClick={() => setActiveTab('practice')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'practice'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    <ShieldAlert className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span>Troubleshooting Labs</span>
                  </button>
                )}
              </nav>
            )}
          </div>

          {/* Search Input */}
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find command, tool (e.g. k8s, docker, nginx)..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2.5">

            {/* Badges & Streaks Button */}
            <button
              onClick={onOpenAchievements}
              title="View Badges & Streaks Gallery"
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 text-xs font-bold hover:bg-amber-100 transition-all shadow-sm"
            >
              <Flame className="h-5 w-5 fill-amber-500 text-amber-500 shrink-0" />
              <span className="hidden sm:inline">{streakCount} {streakCount === 1 ? 'Day' : 'Days'}</span>
              <Award className="h-5 w-5 text-amber-600 ml-0.5 shrink-0" />
            </button>

            {/* Dashboard Modal Button */}
            <button
              onClick={onOpenDashboard}
              title="Launch Dashboard & Adoption Analytics"
              className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <BarChart3 className="h-5 w-5 text-indigo-600 shrink-0" />
              <span className="hidden sm:inline">Stats</span>
            </button>

            {/* User Account / Login Button */}
            {user ? (
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-2xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 transition-all"
              >
                <img
                  src={`https://api.dicebear.com/10.x/adventurer/svg?seed=${user.username}`}
                  alt={user.username}
                  className="h-8 w-8 rounded-full bg-white border border-indigo-300 shrink-0"
                />
                <span className="text-xs font-bold max-w-[90px] truncate">
                  {user.displayName || user.username}
                </span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-600 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-all"
              >
                <UserIcon className="h-5 w-5 shrink-0" />
                <span>Sign In</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
