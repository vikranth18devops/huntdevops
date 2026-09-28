import React from 'react';
import { X, Award, Flame, Zap, CheckCircle2, Lock, Shield } from 'lucide-react';
import type { Topic } from '../data/sheetData';
import { ToolLogo } from './TechLogos';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: Topic[];
  completedIds: Set<string>;
  solvedIds: Set<string>;
  user: { username: string; displayName?: string } | null;
  streakCount?: number;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  isOpen,
  onClose,
  topics,
  completedIds,
  solvedIds,
  user,
  streakCount = 1
}) => {
  if (!isOpen) return null;

  const xp = completedIds.size * 25 + solvedIds.size * 150;
  const level = Math.floor(xp / 500) + 1;

  const BADGES = topics.map(t => {
    const items = t.sections.flatMap(s => s.commands.flatMap(c => c.items));
    const comp = items.filter(i => completedIds.has(i.id)).length;
    const isUnlocked = comp > 0 && comp === items.length;

    let badgeTitle = `${t.title} Master`;
    if (t.id === 'linux') badgeTitle = 'Linux System Commander';
    if (t.id === 'docker') badgeTitle = 'Docker Container Architect';
    if (t.id === 'kubernetes') badgeTitle = 'Kubernetes Cluster Specialist';
    if (t.id === 'terraform') badgeTitle = 'Terraform IaC Ninja';
    if (t.id === 'argocd') badgeTitle = 'Argo CD GitOps Titan';
    if (t.id === 'github-actions') badgeTitle = 'GitHub Actions Workflow Pro';

    return {
      topicId: t.id,
      title: t.title,
      badgeTitle,
      total: items.length,
      completed: comp,
      isUnlocked,
      percent: Math.round((comp / (items.length || 1)) * 100)
    };
  });

  const getBadgeStyles = (topicId: string, isUnlocked: boolean) => {
    if (!isUnlocked) {
      return {
        cardBg: 'bg-slate-50 border-slate-200 hover:border-slate-300',
        iconBg: 'bg-white border-slate-200 text-slate-400',
        tagBg: 'bg-slate-100 text-slate-500 border-slate-200 font-semibold',
        progressBg: 'bg-indigo-600',
        glow: '',
        titleColor: 'text-slate-800 font-bold'
      };
    }

    switch (topicId) {
      case 'aws':
        return {
          cardBg: 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300 shadow-amber-100/50 shadow-sm',
          iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-amber-300 shadow-sm',
          tagBg: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black shadow-sm',
          progressBg: 'bg-gradient-to-r from-amber-500 to-orange-500',
          glow: 'ring-2 ring-amber-400/30',
          titleColor: 'text-amber-950 font-extrabold'
        };
      case 'azure':
        return {
          cardBg: 'bg-gradient-to-br from-sky-50 to-blue-50 border-sky-300 shadow-sky-100/50 shadow-sm',
          iconBg: 'bg-gradient-to-br from-sky-500 to-blue-600 text-white border-sky-300 shadow-sm',
          tagBg: 'bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black shadow-sm',
          progressBg: 'bg-gradient-to-r from-sky-500 to-blue-500',
          glow: 'ring-2 ring-sky-400/30',
          titleColor: 'text-sky-950 font-extrabold'
        };
      case 'gcp':
        return {
          cardBg: 'bg-gradient-to-br from-blue-50 via-emerald-50 to-amber-50 border-emerald-300 shadow-emerald-100/50 shadow-sm',
          iconBg: 'bg-gradient-to-br from-blue-500 via-emerald-500 to-amber-500 text-white border-emerald-300 shadow-sm',
          tagBg: 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-black shadow-sm',
          progressBg: 'bg-gradient-to-r from-blue-500 to-emerald-500',
          glow: 'ring-2 ring-emerald-400/30',
          titleColor: 'text-slate-900 font-extrabold'
        };
      case 'kubernetes':
        return {
          cardBg: 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300 shadow-blue-100/50 shadow-sm',
          iconBg: 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-blue-300 shadow-sm',
          tagBg: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black shadow-sm',
          progressBg: 'bg-gradient-to-r from-blue-600 to-indigo-600',
          glow: 'ring-2 ring-blue-400/30',
          titleColor: 'text-blue-950 font-extrabold'
        };
      case 'docker':
        return {
          cardBg: 'bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-300 shadow-cyan-100/50 shadow-sm',
          iconBg: 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-cyan-300 shadow-sm',
          tagBg: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black shadow-sm',
          progressBg: 'bg-gradient-to-r from-cyan-500 to-blue-500',
          glow: 'ring-2 ring-cyan-400/30',
          titleColor: 'text-cyan-950 font-extrabold'
        };
      case 'terraform':
        return {
          cardBg: 'bg-gradient-to-br from-purple-50 to-violet-50 border-purple-300 shadow-purple-100/50 shadow-sm',
          iconBg: 'bg-gradient-to-br from-purple-600 to-violet-700 text-white border-purple-300 shadow-sm',
          tagBg: 'bg-gradient-to-r from-purple-600 to-violet-600 text-white font-black shadow-sm',
          progressBg: 'bg-gradient-to-r from-purple-600 to-violet-600',
          glow: 'ring-2 ring-purple-400/30',
          titleColor: 'text-purple-950 font-extrabold'
        };
      case 'argocd':
        return {
          cardBg: 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-300 shadow-orange-100/50 shadow-sm',
          iconBg: 'bg-gradient-to-br from-orange-500 to-amber-600 text-white border-orange-300 shadow-sm',
          tagBg: 'bg-gradient-to-r from-orange-500 to-amber-600 text-white font-black shadow-sm',
          progressBg: 'bg-gradient-to-r from-orange-500 to-amber-500',
          glow: 'ring-2 ring-orange-400/30',
          titleColor: 'text-orange-950 font-extrabold'
        };
      case 'linux':
        return {
          cardBg: 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300 shadow-emerald-100/50 shadow-sm',
          iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-300 shadow-sm',
          tagBg: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black shadow-sm',
          progressBg: 'bg-gradient-to-r from-emerald-500 to-teal-500',
          glow: 'ring-2 ring-emerald-400/30',
          titleColor: 'text-emerald-950 font-extrabold'
        };
      case 'git':
        return {
          cardBg: 'bg-gradient-to-br from-rose-50 to-red-50 border-rose-300 shadow-rose-100/50 shadow-sm',
          iconBg: 'bg-gradient-to-br from-rose-500 to-red-600 text-white border-rose-300 shadow-sm',
          tagBg: 'bg-gradient-to-r from-rose-500 to-red-600 text-white font-black shadow-sm',
          progressBg: 'bg-gradient-to-r from-rose-500 to-red-500',
          glow: 'ring-2 ring-rose-400/30',
          titleColor: 'text-rose-950 font-extrabold'
        };
      case 'github-actions':
        return {
          cardBg: 'bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-300 shadow-indigo-100/50 shadow-sm',
          iconBg: 'bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-indigo-300 shadow-sm',
          tagBg: 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black shadow-sm',
          progressBg: 'bg-gradient-to-r from-indigo-600 to-violet-600',
          glow: 'ring-2 ring-indigo-400/30',
          titleColor: 'text-indigo-950 font-extrabold'
        };
      case 'jenkins':
        return {
          cardBg: 'bg-gradient-to-br from-red-50 to-amber-50 border-red-300 shadow-red-100/50 shadow-sm',
          iconBg: 'bg-gradient-to-br from-red-600 to-amber-600 text-white border-red-300 shadow-sm',
          tagBg: 'bg-gradient-to-r from-red-600 to-amber-600 text-white font-black shadow-sm',
          progressBg: 'bg-gradient-to-r from-red-600 to-amber-500',
          glow: 'ring-2 ring-red-400/30',
          titleColor: 'text-red-950 font-extrabold'
        };
      case 'shell':
        return {
          cardBg: 'bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-300 shadow-teal-100/50 shadow-sm',
          iconBg: 'bg-gradient-to-br from-teal-600 to-emerald-600 text-white border-teal-300 shadow-sm',
          tagBg: 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-black shadow-sm',
          progressBg: 'bg-gradient-to-r from-teal-600 to-emerald-500',
          glow: 'ring-2 ring-teal-400/30',
          titleColor: 'text-teal-950 font-extrabold'
        };
      case 'cicd':
      default:
        return {
          cardBg: 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-300 shadow-indigo-100/50 shadow-sm',
          iconBg: 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white border-indigo-300 shadow-sm',
          tagBg: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black shadow-sm',
          progressBg: 'bg-gradient-to-r from-indigo-600 to-purple-600',
          glow: 'ring-2 ring-indigo-400/30',
          titleColor: 'text-indigo-950 font-extrabold'
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto scrollbar-none">
        
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold uppercase tracking-wider">
            <Award className="h-3.5 w-3.5 text-amber-600" /> Streaks, XP & Badges Gallery
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">DevOps Ranks & Accomplishments</h2>
          <p className="text-xs text-slate-500">Complete full stack modules and solve incident challenges to unlock tool mastery badges.</p>
        </div>

        {/* Rank Overview Box */}
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={`https://api.dicebear.com/10.x/adventurer/svg?seed=${user?.username || 'devops_hero'}`}
              alt="Avatar"
              className="h-16 w-16 rounded-2xl bg-white border-2 border-indigo-300 p-0.5 shadow-sm"
            />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                <Zap className="h-4 w-4 text-amber-500 fill-amber-500" /> Level {level} Practitioner
              </div>
              <h3 className="text-xl font-black text-slate-900">@{user?.displayName || user?.username || 'GuestLearner'}</h3>
              <div className="text-xs text-slate-600 font-mono mt-0.5">{xp} Total XP Earned</div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-indigo-200 shadow-sm">
            <Flame className="h-6 w-6 text-amber-500 fill-amber-500 animate-bounce" />
            <div>
              <div className="text-sm font-extrabold text-slate-900">{streakCount} {streakCount === 1 ? 'Day' : 'Days'} Streak</div>
              <div className="text-[11px] text-emerald-700 font-bold">2x XP Multiplier Active</div>
            </div>
          </div>
        </div>

        {/* Badges Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-indigo-600" /> Module Mastery Badges ({BADGES.filter(b => b.isUnlocked).length}/{BADGES.length} Unlocked)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BADGES.map((b) => {
              const styles = getBadgeStyles(b.topicId, b.isUnlocked);
              return (
                <div
                  key={b.topicId}
                  className={`rounded-2xl border p-4 transition-all duration-300 flex items-center gap-3.5 relative overflow-hidden ${styles.cardBg} ${styles.glow}`}
                >
                  <div className={`p-3.5 rounded-2xl border shrink-0 ${styles.iconBg}`}>
                    <ToolLogo id={b.topicId} className="h-9 w-9" />
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs truncate ${styles.titleColor}`}>{b.badgeTitle}</span>
                      {b.isUnlocked ? (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider ${styles.tagBg} shrink-0 flex items-center gap-1`}>
                          <CheckCircle2 className="h-3 w-3 text-white" /> Unlocked
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider bg-slate-200 text-slate-600 shrink-0 flex items-center gap-1">
                          <Lock className="h-2.5 w-2.5 text-slate-500" /> Locked
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
                      <span>{b.isUnlocked ? '🎉 Unlocked' : `${b.completed} / ${b.total} Solved`}</span>
                      <span className="font-mono font-bold text-slate-800">{b.percent}%</span>
                    </div>

                    <div className="h-1.5 w-full rounded-full bg-slate-200/80 overflow-hidden mt-1">
                      <div 
                        className={`h-full transition-all duration-500 ${styles.progressBg}`}
                        style={{ width: `${b.percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
