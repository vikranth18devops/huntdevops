import React, { useState, useEffect } from 'react';
import { 
  X, 
  LogOut, 
  CheckCircle2, 
  Zap, 
  Award, 
  Flame, 
  Shield, 
  TrendingUp, 
  Edit3, 
  Mail, 
  Phone, 
  User as UserIcon,
  Check,
  Lock,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import type { Topic } from '../data/sheetData';
import { ToolLogo } from './TechLogos';
import { CertificateModal, type CertificateData } from './CertificateModal';
import { issueCertificateApi } from '../services/api';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { username: string; displayName?: string; email?: string; phone?: string; experienceLevel?: 'Beginner' | 'Intermediate' | 'Advanced' } | null;
  completedCount: number;
  solvedCount: number;
  totalChecklistItems: number;
  topics?: Topic[];
  completedIds?: Set<string>;
  onLogout: () => void;
  onUpdateUser?: (updated: { displayName?: string; email?: string; phone?: string; experienceLevel?: 'Beginner' | 'Intermediate' | 'Advanced' }) => void;
  onUpdateDisplayName?: (newDisplayName: string) => void;
  streakCount?: number;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  completedCount,
  solvedCount,
  totalChecklistItems,
  topics = [],
  completedIds = new Set(),
  onLogout,
  onUpdateUser,
  onUpdateDisplayName,
  streakCount = 1
}) => {
  if (!isOpen || !user) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName || user.username);
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [experienceLevel, setExperienceLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>(user.experienceLevel || 'Beginner');
  const [savedMessage, setSavedMessage] = useState(false);
  const [selectedCert, setSelectedCert] = useState<CertificateData | null>(null);

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

  const enabledTopics = topics.filter(t => !t.disabled);

  const BADGES = enabledTopics.map(t => {
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
    if (t.id === 'aws') badgeTitle = 'AWS Cloud Architect';
    if (t.id === 'azure') badgeTitle = 'Azure Solutions Specialist';
    if (t.id === 'gcp') badgeTitle = 'GCP Infrastructure Expert';

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

  // Automatically compute certificates for all 100% completed modules
  const earnedCertificates: CertificateData[] = BADGES.filter(b => b.isUnlocked).map(b => {
    const cleanTopic = (b.topicId || 'MOD').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    const hash = Math.abs((user.username + b.topicId).split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)).toString(16).toUpperCase().slice(0, 6);
    const certificateCode = `HD-${cleanTopic}-${hash}`;
    return {
      certificateCode,
      recipientName: user.displayName || user.username,
      username: user.username,
      topicId: b.topicId,
      topicTitle: b.title,
      scorePercent: 100,
      issuedAt: new Date().toISOString()
    };
  });

  // Sync earned certificates to PostgreSQL Cloud SQL Database
  useEffect(() => {
    if (earnedCertificates.length > 0 && user?.username) {
      earnedCertificates.forEach(cert => {
        issueCertificateApi({
          username: user.username,
          topicId: cert.topicId,
          topicTitle: cert.topicTitle,
          scorePercent: 100
        });
      });
    }
  }, [earnedCertificates.length, user?.username]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateUser) {
      onUpdateUser({ displayName: displayName.trim(), email: email.trim(), phone: phone.trim(), experienceLevel });
    } else if (onUpdateDisplayName) {
      onUpdateDisplayName(displayName.trim());
    }
    setSavedMessage(true);
    setIsEditing(false);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const getBadgeStyles = (topicId: string, isUnlocked: boolean) => {
    if (!isUnlocked) {
      return {
        cardBg: 'bg-slate-50/80 border-slate-200 hover:border-slate-300',
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
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto scrollbar-none">
        
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Profile Avatar & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <img
                src={`https://api.dicebear.com/10.x/adventurer/svg?seed=${user.username}`}
                alt={user.username}
                className="h-16 w-16 rounded-2xl bg-indigo-50 border-2 border-indigo-200 p-1 shadow-sm"
              />
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white font-mono text-[11px] font-black shadow">
                L{level}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold">
                  <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  <span>{getTitleRank(level)}</span>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  (experienceLevel || 'Beginner') === 'Beginner'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : (experienceLevel || 'Beginner') === 'Intermediate'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-purple-50 text-purple-700 border-purple-200'
                }`}>
                  {(experienceLevel || 'Beginner') === 'Beginner' ? '🌱 Beginner Level' : (experienceLevel || 'Beginner') === 'Intermediate' ? '⚡ Intermediate Level' : '🔥 Advanced Level'}
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900">@{user.displayName || user.username}</h2>
              <div className="text-xs text-slate-500 font-mono">User: {user.username}</div>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`self-start sm:self-center flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
              isEditing 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Edit3 className="h-4 w-4" />
            <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
          </button>
        </div>

        {savedMessage && (
          <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-700 flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600" />
            <span>Profile details updated and saved successfully!</span>
          </div>
        )}

        {/* EDIT PROFILE FORM (EXPANDABLE) */}
        {isEditing ? (
          <form onSubmit={handleSave} className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5 space-y-4 animate-in fade-in">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1.5">
              <Edit3 className="h-4 w-4 text-indigo-600" /> Edit Profile Credentials & Display Info
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Display Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="Display name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="learner@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  DevOps Experience Level
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="Beginner">🌱 Beginner Level</option>
                  <option value="Intermediate">⚡ Intermediate Level</option>
                  <option value="Advanced">🔥 Advanced / Expert Level</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow hover:bg-indigo-700 transition-all"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}

        {/* Level & XP Progress Card */}
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-800 uppercase tracking-wider">
              <Award className="h-4 w-4 text-indigo-600" /> Level {level} Rank ({getTitleRank(level)})
            </div>
            <span className="text-xs font-bold font-mono text-slate-900">{xp} / {nextLevelXp} XP</span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
            <div 
              className="h-full bg-indigo-600 transition-all duration-500 rounded-full"
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-600">
            <span>Current Rank: <strong className="text-slate-900">{getTitleRank(level)}</strong></span>
            <span>Next Level: <strong className="text-indigo-700">+{500 - currentLevelXp} XP needed</strong></span>
          </div>
        </div>

        {/* Learner Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Checklist</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="text-xl font-black text-slate-900">{completedCount} <span className="text-[10px] text-slate-500 font-normal">/ {totalChecklistItems}</span></div>
            <div className="text-[10px] text-emerald-700 font-semibold">+25 XP/item</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Labs</span>
              <Shield className="h-3.5 w-3.5 text-cyan-600" />
            </div>
            <div className="text-xl font-black text-slate-900">{solvedCount} <span className="text-[10px] text-slate-500 font-normal">/ 5</span></div>
            <div className="text-[10px] text-cyan-700 font-semibold">+150 XP/lab</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Streak</span>
              <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
            </div>
            <div className="text-xl font-black text-slate-900">{streakCount} <span className="text-[10px] text-slate-500 font-normal">{streakCount === 1 ? 'Day' : 'Days'}</span></div>
            <div className="text-[10px] text-amber-700 font-semibold">2x Bonus</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Rank</span>
              <TrendingUp className="h-3.5 w-3.5 text-indigo-600" />
            </div>
            <div className="text-xl font-black text-slate-900">#14 <span className="text-[10px] text-slate-500 font-normal">Global</span></div>
            <div className="text-[10px] text-indigo-700 font-semibold">Top 5%</div>
          </div>
        </div>

        {/* EARNED CERTIFICATES SECTION */}
        {earnedCertificates.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500" /> Earned Certificates ({earnedCertificates.length} Issued)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
              {earnedCertificates.map((cert) => (
                <div 
                  key={cert.certificateCode}
                  className="rounded-2xl border border-amber-300/80 bg-gradient-to-br from-amber-50/70 via-yellow-50/40 to-slate-50 p-3 flex items-center justify-between gap-3 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 shrink-0">
                      <Award className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-900 truncate">{cert.topicTitle} Mastery</div>
                      <div className="text-[10px] font-mono text-amber-800/90 font-bold">{cert.certificateCode}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedCert(cert)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-[10px] font-black shadow-sm shrink-0 transition-all cursor-pointer"
                  >
                    <span>View Cert</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MASTERY BADGES SECTION */}
        {topics.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Award className="h-4 w-4 text-amber-500" /> Tool Mastery Badges ({BADGES.filter(b => b.isUnlocked).length}/{BADGES.length} Unlocked)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
              {BADGES.map((b) => {
                const styles = getBadgeStyles(b.topicId, b.isUnlocked);
                const matchingCert = earnedCertificates.find(c => c.topicId === b.topicId);

                return (
                  <div
                    key={b.topicId}
                    className={`rounded-2xl border p-3 transition-all duration-300 flex items-center gap-3.5 relative overflow-hidden ${styles.cardBg} ${styles.glow}`}
                  >
                    <div className={`p-2.5 rounded-2xl border shrink-0 ${styles.iconBg}`}>
                      <ToolLogo id={b.topicId} className="h-6 w-6" />
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs truncate ${styles.titleColor}`}>{b.badgeTitle}</span>
                        {b.isUnlocked ? (
                          <div className="flex items-center gap-1 shrink-0">
                            {matchingCert && (
                              <button
                                onClick={() => setSelectedCert(matchingCert)}
                                className="px-1.5 py-0.5 rounded-md text-[8px] font-black bg-amber-500 text-white hover:bg-amber-600 transition-colors flex items-center gap-0.5 cursor-pointer shadow-xs"
                                title="View Official Certificate"
                              >
                                <span>🎓 Cert</span>
                              </button>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider ${styles.tagBg} shrink-0 flex items-center gap-1`}>
                              <CheckCircle2 className="h-3 w-3 text-white" /> Unlocked
                            </span>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider bg-slate-200 text-slate-600 shrink-0 flex items-center gap-1">
                            <Lock className="h-2.5 w-2.5 text-slate-500" /> Locked
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-600 font-medium">
                        <span>{b.isUnlocked ? '🎉 100% Mastery Achieved' : `${b.completed} / ${b.total} Completed`}</span>
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
        )}

        {/* SIGN OUT */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full py-2.5 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 font-bold text-xs hover:bg-rose-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="h-4 w-4 text-rose-600" />
            <span>Sign Out</span>
          </button>
        </div>

      </div>

      {/* Render Certificate Modal */}
      <CertificateModal
        isOpen={!!selectedCert}
        onClose={() => setSelectedCert(null)}
        certificate={selectedCert}
      />
    </div>
  );
};
