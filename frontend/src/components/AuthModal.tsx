import React, { useState } from 'react';
import { 
  X, 
  User, 
  Lock, 
  Mail, 
  Phone, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ShieldAlert 
} from 'lucide-react';
import { syncUserToAdminStore, logUserActivity } from '../utils/activityStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: { username: string; displayName?: string; email?: string; phone?: string }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (mode === 'register') {
      if (!email.trim() || !email.includes('@') || !email.includes('.')) {
        setError('A valid email address is required.');
        return;
      }

      const digitsOnly = phone.replace(/[^0-9]/g, '');
      if (!phone.trim() || digitsOnly.length < 10) {
        setError('A valid phone number (at least 10 digits) is required.');
        return;
      }

      if (!acceptPrivacy) {
        setError('Please accept privacy requirements.');
        return;
      }
    }

    setIsSubmitting(true);

    setTimeout(() => {
      let userExp = mode === 'register' ? experienceLevel : undefined;
      if (mode === 'login') {
        try {
          const savedStore = localStorage.getItem('huntdevops_user_store');
          if (savedStore) {
            const users = JSON.parse(savedStore);
            const match = users.find((u: any) => u.username?.toLowerCase() === username.trim().toLowerCase());
            if (match?.experienceLevel) {
              userExp = match.experienceLevel;
            }
          }
        } catch {}
      }

      const userObj = { 
        username: username.trim(), 
        displayName: username.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        experienceLevel: userExp || 'Beginner'
      };

      // SYNC USER TO ADMIN BACKEND USER MANAGEMENT STORE & LOG ACTIVITY
      syncUserToAdminStore(userObj);
      logUserActivity(
        userObj.username,
        mode === 'register' ? 'ACCOUNT_CREATED' : 'USER_LOGIN',
        mode === 'register' ? `Registered New Account: @${userObj.username}` : `User Signed In: @${userObj.username}`,
        `Email: ${userObj.email || 'N/A'}${userObj.phone ? ` | Phone: ${userObj.phone}` : ''} | Level: ${userObj.experienceLevel}`
      );

      localStorage.setItem('huntdevops_user', JSON.stringify(userObj));
      setIsSubmitting(false);
      onSuccess(userObj);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/95 p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto scrollbar-none animate-in zoom-in-95">
        
        {/* Ambient Top Glow Border Line */}
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-20"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Animated Brand Header & Register Now Badge */}
        <div className="flex flex-col gap-3 pt-1">
          {/* Animated Dynamic Badge */}
          <div className="flex items-center justify-between gap-2">
            <div 
              onClick={() => { setMode('register'); setError(''); }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-mono font-bold shadow-lg shadow-indigo-500/10 cursor-pointer hover:border-indigo-400 transition-all group"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
              </span>
              <Sparkles className="h-3.5 w-3.5 text-pink-400 group-hover:rotate-12 transition-transform" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-200 to-pink-300 font-extrabold tracking-wide">
                REGISTER NOW • FREE ACCESS
              </span>
            </div>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" /> Live
            </span>
          </div>

          {/* Animated Logo Container */}
          <div className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/90 shadow-inner">
            <div className="relative group p-1.5 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/30 border border-indigo-400/30 shrink-0">
              <div className="bg-slate-950 p-1.5 rounded-xl">
                <img 
                  src="/favicon.svg" 
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/fevicon.png'; }}
                  alt="HuntDevOps.online Logo" 
                  className="h-8 w-8 object-contain shrink-0" 
                />
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="font-black text-xl tracking-tight text-white leading-none">
                  hunt<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">devops</span>
                </span>
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black tracking-wide uppercase bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-xs">
                  .online
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 font-semibold tracking-wider uppercase mt-1">
                Production Curriculum & Incident Labs
              </span>
            </div>
          </div>
        </div>

        {/* Mode Switcher Pill */}
        <div className="flex items-center justify-between">
          <div className="flex p-1 rounded-2xl bg-slate-950 border border-slate-800 w-full shadow-inner">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            {mode === 'login' ? 'Sign in to platform' : 'Create learner account'}
            <Sparkles className="h-4 w-4 text-indigo-400" />
          </h2>
          <p className="text-xs text-slate-400">
            {mode === 'login' 
              ? 'Enter your username and password to log in.' 
              : 'Fill in your username, email & phone to register.'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-xs font-semibold text-rose-300 flex items-center gap-2 animate-in fade-in">
            <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Username <span className="text-indigo-400">*</span>
            </label>
            <div className="relative group">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all shadow-inner"
                required
              />
            </div>
          </div>

          {mode === 'register' && (
            <>
              <div className="animate-in fade-in">
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Email Address <span className="text-indigo-400">*</span>
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="learner@example.com"
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all shadow-inner"
                    required
                  />
                </div>
              </div>

              <div className="animate-in fade-in">
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Phone Number <span className="text-indigo-400">*</span>
                </label>
                <div className="relative group">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all shadow-inner"
                    required
                  />
                </div>
              </div>

              {/* Experience Level Selector */}
              <div className="animate-in fade-in space-y-1.5">
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>DevOps Experience Level <span className="text-indigo-400">*</span></span>
                  <span className="text-[10px] text-indigo-400 font-semibold">{experienceLevel}</span>
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {(['Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setExperienceLevel(lvl)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                        experienceLevel === lvl
                          ? lvl === 'Beginner'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                            : lvl === 'Intermediate'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/10'
                            : 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-md shadow-purple-500/10'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-[11px] font-extrabold">{lvl}</span>
                      <span className="text-[9px] font-normal text-slate-500 font-mono">
                        {lvl === 'Beginner' ? '0-1 Yrs' : lvl === 'Intermediate' ? '1-3 Yrs' : '3+ Yrs'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Password <span className="text-indigo-400">*</span>
            </label>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-11 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all shadow-inner"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div className="flex items-start gap-2 pt-1 animate-in fade-in">
              <input
                type="checkbox"
                id="privacy-modal"
                checked={acceptPrivacy}
                onChange={(e) => setAcceptPrivacy(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500/30 h-4 w-4"
                required
              />
              <label htmlFor="privacy-modal" className="text-xs text-slate-400 cursor-pointer select-none">
                I accept privacy & progress syncing requirements.
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 hover:bg-[position:right_center] transition-all duration-500 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In to Dashboard' : 'Create Account'}</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-800">
          {mode === 'login' ? (
            <p className="text-xs text-slate-400">
              Need an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); }}
                className="font-bold text-indigo-400 hover:text-indigo-300 underline underline-offset-4"
              >
                Register here
              </button>
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              Already registered?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className="font-bold text-indigo-400 hover:text-indigo-300 underline underline-offset-4"
              >
                Sign in here
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
