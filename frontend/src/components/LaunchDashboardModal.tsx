import React from 'react';
import { X, Users, CheckSquare, ShieldCheck, Activity, TrendingUp } from 'lucide-react';

interface LaunchDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  registeredCount: number;
  completedCount: number;
  totalChecklistItems: number;
}

export const LaunchDashboardModal: React.FC<LaunchDashboardModalProps> = ({
  isOpen,
  onClose,
  registeredCount,
  completedCount,
  totalChecklistItems,
}) => {
  if (!isOpen) return null;

  const targetUsers = 200;
  const targetProgress = Math.min(100, Math.round((registeredCount / targetUsers) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6">
        
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Dashboard Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold uppercase tracking-wider">
            <Activity className="h-3.5 w-3.5 text-indigo-600" /> Community Adoption Metrics
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Launch & Practitioner Signal</h2>
          <p className="text-xs text-slate-500">Live learner adoption metrics and platform utilization overview.</p>
        </div>

        {/* Target Progress Bar */}
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-800">Target Registered Practitioners</span>
            <span className="text-sm font-bold text-slate-900">{registeredCount} / {targetUsers} ({targetProgress}%)</span>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">
            <div 
              className="h-full bg-indigo-600 transition-all duration-500"
              style={{ width: `${targetProgress}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-600">
            Goal: Reach 200 registered DevOps practitioners for Q4 community scale.
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-1">
            <Users className="h-4 w-4 text-indigo-600" />
            <div className="text-2xl font-black text-slate-900">{registeredCount}</div>
            <div className="text-[11px] text-slate-500 font-medium">Active Learners</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-1">
            <CheckSquare className="h-4 w-4 text-emerald-600" />
            <div className="text-2xl font-black text-slate-900">{completedCount}</div>
            <div className="text-[11px] text-slate-500 font-medium">Checks Solved</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-1">
            <ShieldCheck className="h-4 w-4 text-cyan-600" />
            <div className="text-2xl font-black text-slate-900">5</div>
            <div className="text-[11px] text-slate-500 font-medium">Incident Labs</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-1">
            <TrendingUp className="h-4 w-4 text-violet-600" />
            <div className="text-2xl font-black text-slate-900">{totalChecklistItems}</div>
            <div className="text-[11px] text-slate-500 font-medium">Total Questions</div>
          </div>
        </div>

        {/* Registrations Daily Trend Visualization */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
            <span>Weekly Learner Registrations</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">+18% this week</span>
          </div>

          <div className="flex items-end justify-between gap-2 h-24 pt-4 px-2 border-b border-slate-200">
            {[12, 18, 25, 31, 28, 42, 54].map((count, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <div 
                  className="w-full rounded-t bg-indigo-600 group-hover:bg-indigo-700 transition-all"
                  style={{ height: `${(count / 60) * 100}%` }}
                />
                <span className="text-[10px] text-slate-500 font-mono">D{i+1}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
