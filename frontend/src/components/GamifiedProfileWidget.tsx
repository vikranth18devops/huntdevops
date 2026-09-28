import React from 'react';
import { Award, Zap, Flame, Shield, ChevronRight } from 'lucide-react';

interface GamifiedProfileWidgetProps {
  completedCount: number;
  solvedCount: number;
  user: { username: string; displayName?: string } | null;
  streakCount?: number;
}

export const GamifiedProfileWidget: React.FC<GamifiedProfileWidgetProps> = ({
  completedCount,
  solvedCount,
  user,
  streakCount = 1
}) => {
  const xp = completedCount * 25 + solvedCount * 150;
  const level = Math.floor(xp / 500) + 1;
  const nextLevelXp = level * 500;
  const currentLevelXp = xp % 500;
  const percent = Math.min(100, Math.round((currentLevelXp / 500) * 100));

  const getTitleRank = (lvl: number) => {
    if (lvl >= 5) return 'Cloud Native Architect';
    if (lvl >= 4) return 'Senior SRE Practitioner';
    if (lvl >= 3) return 'DevOps Specialist';
    if (lvl >= 2) return 'Infrastructure Engineer';
    return 'DevOps Apprentice';
  };

  return (
    <div className="rounded-2xl border border-indigo-200 bg-white p-5 shadow-sm flex flex-col justify-between space-y-4">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={`https://api.dicebear.com/10.x/adventurer/svg?seed=${user?.username || 'devops_hero'}`}
              alt="Avatar"
              className="h-12 w-12 rounded-xl bg-indigo-50 border-2 border-indigo-300 p-0.5 shadow-sm"
            />
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-black text-white shadow">
              L{level}
            </span>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              {getTitleRank(level)}
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm">
              @{user?.displayName || user?.username || 'GuestLearner'}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold shadow-sm">
          <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
          <span>{streakCount} {streakCount === 1 ? 'Day' : 'Days'} Streak</span>
        </div>
      </div>

      {/* XP Level Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-muted-foreground">Level {level} Progress</span>
          <span className="font-bold text-foreground font-mono">{xp} / {nextLevelXp} XP</span>
        </div>

        <div className="h-2 w-full rounded-full bg-secondary/80 overflow-hidden p-0.5 border border-border/40">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-emerald-400 transition-all duration-500 shadow-sm"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Badges Earned */}
      <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center -space-x-1.5">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 shadow" title="Docker Master">
              <Shield className="h-3.5 w-3.5" />
            </span>
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 shadow" title="Kubernetes Commander">
              <Award className="h-3.5 w-3.5" />
            </span>
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/20 border border-indigo-400/50 text-indigo-300 shadow" title="IaC Champion">
              <Zap className="h-3.5 w-3.5" />
            </span>
          </div>
          <span className="font-semibold text-muted-foreground text-[11px]">3 Badges Unlocked</span>
        </div>

        <span className="text-cyan-400 font-bold text-[11px] flex items-center">
          Rank #14 <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
        </span>
      </div>

    </div>
  );
};
