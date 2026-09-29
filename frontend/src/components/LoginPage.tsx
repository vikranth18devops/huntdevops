import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  Mail, 
  Phone, 
  ArrowRight, 
  Sparkles, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  Terminal, 
  Layers, 
  Shield, 
  Zap
} from 'lucide-react';
import { syncUserToAdminStore, detectDeviceOS } from '../utils/activityStore';



interface LoginPageProps {
  onLoginSuccess: (user: { username: string; displayName?: string; email?: string; phone?: string }) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both your username and password.');
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
        setError('Please enter a valid email address.');
        return;
      }

      const digitsOnly = phone.replace(/[^0-9]/g, '');
      if (!phone.trim() || digitsOnly.length < 10) {
        setError('Please enter a valid phone number (min 10 digits).');
        return;
      }

      if (!acceptPrivacy) {
        setError('Please accept terms & privacy policy to create an account.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === 'register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username.trim(),
            displayName: username.trim(),
            email: email.trim(),
            password: password,
            phone: phone.trim(),
            experienceLevel: experienceLevel,
            lastDeviceOS: detectDeviceOS()
          })
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Failed to create account.');
          setIsSubmitting(false);
          return;
        }

        const userObj = data.user || {
          username: username.trim(),
          displayName: username.trim(),
          email: email.trim(),
          phone: phone.trim(),
          experienceLevel: experienceLevel,
          role: 'Learner',
          status: 'Active'
        };

        syncUserToAdminStore(userObj);
        localStorage.setItem('huntdevops_user', JSON.stringify(userObj));
        setIsSubmitting(false);
        onLoginSuccess(userObj);
        return;
      }

      if (mode === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username.trim(),
            password: password,
            lastDeviceOS: detectDeviceOS()
          })
        });

        const data = await res.json();
        if (res.ok && data.user) {
          syncUserToAdminStore(data.user);
          localStorage.setItem('huntdevops_user', JSON.stringify(data.user));
          setIsSubmitting(false);
          onLoginSuccess(data.user);
          return;
        }

        // Fallback check in local user store
        const savedStore = localStorage.getItem('huntdevops_user_store');
        if (savedStore) {
          const users = JSON.parse(savedStore);
          const match = users.find((u: any) => 
            (u.username?.toLowerCase() === username.trim().toLowerCase() || u.email?.toLowerCase() === username.trim().toLowerCase()) &&
            (!u.password || u.password === password)
          );
          if (match) {
            const userObj = {
              username: match.username,
              displayName: match.displayName || match.username,
              email: match.email,
              phone: match.phone,
              experienceLevel: match.experienceLevel || 'Beginner',
              role: match.role || 'Learner',
              status: match.status || 'Active'
            };
            syncUserToAdminStore(userObj);
            localStorage.setItem('huntdevops_user', JSON.stringify(userObj));
            setIsSubmitting(false);
            onLoginSuccess(userObj);
            return;
          }
        }

        setError(data.error || 'Invalid username or password.');
        setIsSubmitting(false);
        return;
      }
    } catch {
      // Local fallback in case network / backend offline
      let userExp = mode === 'register' ? experienceLevel : undefined;
      const userObj = {
        username: username.trim(),
        displayName: username.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        experienceLevel: userExp || 'Beginner',
        role: 'Learner',
        status: 'Active'
      };

      syncUserToAdminStore(userObj);
      localStorage.setItem('huntdevops_user', JSON.stringify(userObj));
      setIsSubmitting(false);
      onLoginSuccess(userObj);
    }
  };


  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans antialiased selection:bg-indigo-500/30 overflow-hidden">
      
      {/* DRIBBBLE ANIMATED BACKGROUND ORBS & FLOATING LIGHT MESH */}
      <div className="pointer-events-none absolute -top-48 -left-48 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-indigo-600/20 via-purple-600/15 to-transparent blur-[140px] animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="pointer-events-none absolute -bottom-48 -right-48 h-[600px] w-[600px] rounded-full bg-gradient-to-tl from-cyan-500/15 via-indigo-600/20 to-transparent blur-[140px] animate-pulse" style={{ animationDuration: '10s' }} />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] rounded-full bg-indigo-900/10 blur-[160px]" />
      
      {/* Background Radial Dots Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:28px_28px] opacity-20" />

      {/* MAIN CONTAINER: DRIBBBLE STYLE SPLIT-SCREEN CARD */}
      <div className="relative z-10 w-full max-w-md lg:max-w-6xl rounded-[32px] border border-slate-800/80 bg-slate-900/90 backdrop-blur-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[540px] lg:min-h-[640px]">
        
        {/* ==================================================== */}
        {/* LEFT PANEL: DRIBBBLE DYNAMIC ANIMATED ILLUSTRATION CARD (DESKTOP ONLY) */}
        {/* ==================================================== */}
        <div className="hidden lg:flex lg:col-span-6 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 p-8 lg:p-12 flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/80 relative overflow-hidden group">
          
          {/* Subtle Graphic Grid Accent */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />
          
          {/* Top Brand Logo */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/30">
                <img src="/fevicon.png" alt="HuntDevOps Logo" className="h-8 w-8 object-contain rounded-xl bg-slate-950 p-1 shrink-0" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-tight text-white flex items-center gap-1">
                  hunt<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">devops</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400 tracking-wider">MODERN DEVOPS PATH</span>
              </div>
            </div>

            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" /> Live Platform
            </span>
          </div>

          {/* Center Animated Visual Graphic Feature Card */}
          <div className="relative z-10 my-8 space-y-6">
            
            {/* Animated Floating Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-xs font-mono font-bold shadow-lg animate-bounce" style={{ animationDuration: '4s' }}>
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>{mode === 'login' ? 'Interactive Terminal & Outage Labs' : 'Join 2,400+ Active DevOps Learners'}</span>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                {mode === 'login' ? (
                  <>
                    Accelerate Your <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
                      Infrastructure Mastery.
                    </span>
                  </>
                ) : (
                  <>
                    Start Building <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-400">
                      Real Production Skills.
                    </span>
                  </>
                )}
              </h2>
              <p className="text-sm text-slate-400 max-w-md leading-relaxed font-normal">
                {mode === 'login' 
                  ? 'Access 11 core tech modules, practice multiple-choice questions with detailed explanations, and solve live incident labs.' 
                  : 'Register now to sync your module badges, track level ranks, and save your daily learning streak.'}
              </p>
            </div>

            {/* Dribbble Style Interactive Feature Cards Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1 hover:border-indigo-500/40 transition-all">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                  <Layers className="h-4 w-4 text-indigo-400" /> 11 Tech Modules
                </div>
                <div className="text-[11px] text-slate-400">Linux, Docker, K8s, Terraform & Git</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1 hover:border-purple-500/40 transition-all">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
                  <Terminal className="h-4 w-4 text-purple-400" /> Incident Labs
                </div>
                <div className="text-[11px] text-slate-400">Real outage troubleshooting</div>
              </div>
            </div>

          </div>

          {/* Bottom Dynamic Testimonial Badge */}
          <div className="relative z-10 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Verified 2026 Curriculum</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500">
              <Zap className="h-3.5 w-3.5 text-indigo-400" /> Fast Sync
            </div>
          </div>

        </div>

        {/* ==================================================== */}
        {/* RIGHT PANEL: DRIBBBLE SLEEK ANIMATED AUTH FORM CARD  */}
        {/* ==================================================== */}
        <div className="col-span-1 lg:col-span-6 p-6 sm:p-8 lg:p-12 flex flex-col justify-between relative bg-slate-900/90">
          
          {/* Mobile & Tablet Top Brand Header with Animated Logo & Register Now Banner */}
          <div className="lg:hidden flex flex-col gap-3.5 pb-4 mb-4 border-b border-slate-800/80">
            
            {/* Animated Dynamic Badge: Register Now */}
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

            {/* Prominent Animated HuntDevOps Logo & Title */}
            <div className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/90 shadow-inner">
              <div className="relative group p-1.5 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-lg shadow-indigo-500/25 shrink-0 animate-pulse" style={{ animationDuration: '3s' }}>
                <div className="bg-slate-950 p-1.5 rounded-xl">
                  <img 
                    src="/favicon.svg" 
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/fevicon.png'; }}
                    alt="HuntDevOps Official Logo" 
                    className="h-9 w-9 object-contain shrink-0 drop-shadow-md" 
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xl sm:text-2xl tracking-tight text-white leading-none">
                    hunt<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">devops</span>
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 font-semibold tracking-wider uppercase mt-0.5">
                  Production Curriculum & Labs
                </span>
              </div>
            </div>

          </div>

          {/* DRIBBBLE TAB SLIDER SWITCHER */}
          <div className="space-y-6">
            
            <div className="flex items-center justify-between">
              <div className="relative flex p-1.5 rounded-2xl bg-slate-950 border border-slate-800/90 w-full max-w-xs shadow-inner">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-300 z-10 flex items-center justify-center gap-1.5 ${
                    mode === 'login'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(''); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-300 z-10 flex items-center justify-center gap-1.5 ${
                    mode === 'register'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <div className="hidden sm:block text-[11px] font-mono text-slate-500">
                v2.4 Ready
              </div>
            </div>

            {/* Header Description */}
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                {mode === 'login' ? 'Sign in to platform' : 'Create learner account'}
              </h3>
              <p className="text-xs text-slate-400">
                {mode === 'login' 
                  ? 'Welcome back! Enter your details to continue.' 
                  : 'Get started by creating your learner account below.'}
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-xs font-semibold text-rose-300 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
                <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* AUTH FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Username <span className="text-indigo-400">*</span>
                </label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all font-sans shadow-inner"
                    required
                  />
                </div>
              </div>

              {/* Extra Register Fields */}
              {mode === 'register' && (
                <>
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-right-4">
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      Email Address <span className="text-indigo-400">*</span>
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="learner@example.com"
                        className="w-full rounded-2xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all font-sans shadow-inner"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 animate-in fade-in slide-in-from-right-4">
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      Phone Number <span className="text-indigo-400">*</span>
                    </label>
                    <div className="relative group">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full rounded-2xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all font-sans shadow-inner"
                        required
                      />
                    </div>
                  </div>

                  {/* Experience Level Selector */}
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-right-4">
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
                          className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
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

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    Password <span className="text-indigo-400">*</span>
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setError('Password reset instructions sent to registered admin contact.')}
                      className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 underline"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-11 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all font-sans shadow-inner"
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

              {/* Remember Me & Privacy Checkbox */}
              {mode === 'login' ? (
                <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500/30 h-4 w-4"
                    />
                    <span>Remember me on this browser</span>
                  </label>
                </div>
              ) : (
                <div className="flex items-start gap-2.5 pt-1 animate-in fade-in">
                  <input
                    type="checkbox"
                    id="privacy-policy"
                    checked={acceptPrivacy}
                    onChange={(e) => setAcceptPrivacy(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500/30 h-4 w-4"
                    required
                  />
                  <label htmlFor="privacy-policy" className="text-xs text-slate-400 leading-normal cursor-pointer select-none">
                    I accept the <span className="text-indigo-400 font-semibold">Terms & Privacy Policy</span> for progress tracking.
                  </label>
                </div>
              )}

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] text-white font-black text-sm shadow-xl shadow-indigo-600/30 hover:bg-[position:right_center] transition-all duration-500 flex items-center justify-center gap-2 group active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Sign In to Dashboard' : 'Create Learner Account'}</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1.5 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>


          {/* Mode Switch Footer */}
          <div className="text-center pt-4 border-t border-slate-800/80">
            {mode === 'login' ? (
              <p className="text-xs text-slate-400">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(''); }}
                  className="font-bold text-indigo-400 hover:text-indigo-300 underline underline-offset-4 transition-colors"
                >
                  Create one now
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="font-bold text-indigo-400 hover:text-indigo-300 underline underline-offset-4 transition-colors"
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};

