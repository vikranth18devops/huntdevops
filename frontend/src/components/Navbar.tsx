import React from 'react';
import { 
  CheckSquare, 
  ShieldAlert, 
  BarChart3, 
  Search,
  Award,
  Flame,
  Menu,
  X,
  Sparkles
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
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-2 sm:gap-4">

          {/* Left Brand & Mobile Sidebar Toggle */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-1.5 sm:p-2 rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shrink-0"
              title="Toggle DevOps Stack Sidebar"
            >
              {isSidebarOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
            </button>

            <a
              href="#"
              onClick={(e) => { e.preventDefault(); if (isLearningPathEnabled) setActiveTab('sheet'); else if (isTroubleshootingLabsEnabled) setActiveTab('practice'); }}
              className="flex items-center gap-2.5 font-bold text-xl sm:text-2xl tracking-tight text-slate-900 transition-all hover:scale-[1.01] shrink-0"
            >
              <div className="relative p-1 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 shadow-md shadow-indigo-500/25 shrink-0 border border-indigo-400/30">
                <img 
                  src="/favicon.svg" 
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/fevicon.png'; }}
                  alt="HuntDevOps.online Logo" 
                  className="h-8 w-8 sm:h-9 sm:w-9 object-contain rounded-lg bg-slate-950 p-0.5 shrink-0" 
                />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-black tracking-tight text-slate-900">
                  hunt<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">devops</span>
                </span>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black tracking-wide uppercase bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-xs">
                  .online
                </span>
              </div>
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
          <div className="flex-1 max-w-md hidden md:block">
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
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">

            {/* Badges & Streaks Button */}
            <button
              onClick={onOpenAchievements}
              title="View Badges & Streaks Gallery"
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 text-xs font-bold hover:bg-amber-100 transition-all shadow-sm shrink-0"
            >
              <Flame className="h-4 w-4 sm:h-5 sm:w-5 fill-amber-500 text-amber-500 shrink-0" />
              <span className="hidden sm:inline">{streakCount} {streakCount === 1 ? 'Day' : 'Days'}</span>
              <Award className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 ml-0.5 shrink-0" />
            </button>

            {/* Dashboard Modal Button */}
            <button
              onClick={onOpenDashboard}
              title="Launch Dashboard & Adoption Analytics"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
            >
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 shrink-0" />
              <span className="hidden sm:inline">Stats</span>
            </button>

            {/* User Account / Login Button */}
            {user ? (
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2 pl-1.5 pr-2.5 sm:pr-3 py-1.5 rounded-2xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 transition-all shrink-0"
              >
                <img
                  src={`https://api.dicebear.com/10.x/adventurer/svg?seed=${user.username}`}
                  alt={user.username}
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white border border-indigo-300 shrink-0"
                />
                <span className="text-xs font-bold max-w-[80px] sm:max-w-[90px] truncate">
                  {user.displayName || user.username}
                </span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:scale-105 transition-all cursor-pointer shrink-0 animate-pulse"
                style={{ animationDuration: '4s' }}
              >
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-pink-300" />
                <span className="hidden xs:inline">Register / Sign In</span>
                <span className="xs:hidden">Join Free</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
