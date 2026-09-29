import React from 'react';
import { Clock, ShieldCheck, LogIn, CheckCircle2 } from 'lucide-react';

interface SessionTimeoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginAgain: () => void;
  savedItemsCount?: number;
}

export const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({
  isOpen,
  onClose,
  onLoginAgain,
  savedItemsCount
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-500/30 bg-slate-900 p-6 sm:p-8 text-center shadow-2xl shadow-amber-500/10 space-y-6">
        
        {/* Animated Timeout Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
          <Clock className="h-8 w-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Session Expired Due to Inactivity
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            You were inactive for more than 15 minutes. For your account security, you have been automatically logged out.
          </p>
        </div>

        {/* Auto-Save Notice Banner */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-left flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Progress Auto-Saved to Cloud
            </h4>
            <p className="text-[11px] text-emerald-400/90 leading-normal">
              {savedItemsCount !== undefined && savedItemsCount > 0 ? (
                <span>All your {savedItemsCount} completed checklist topics, XP, and lab solutions were safely synced to the PostgreSQL database.</span>
              ) : (
                <span>All your completed learning checklists, XP, and solved incident lab solutions were safely synced to the PostgreSQL database.</span>
              )}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="space-y-2 pt-2">
          <button
            onClick={() => {
              onClose();
              onLoginAgain();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98]"
          >
            <LogIn className="h-4 w-4" />
            <span>Sign In Again & Resume</span>
          </button>
        </div>

      </div>
    </div>
  );
};
