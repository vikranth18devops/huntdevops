import React, { useState, useEffect } from 'react';
import { getItemExperienceLevel, type Topic, type CommandItem } from '../data/sheetData';
import { GamifiedProfileWidget } from './GamifiedProfileWidget';
import { ToolLogo } from './TechLogos';
import { 
  Copy, 
  Check, 
  Info, 
  Sparkles,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Award,
  HelpCircle,
  XCircle,
  Zap,
  AlertTriangle,
  RefreshCw,
  Brain
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CertificateModal, type CertificateData } from './CertificateModal';
import { issueCertificateApi } from '../services/api';

interface LearningSheetProps {
  topics: Topic[];
  activeTopicId: string;
  setActiveTopicId: (topicId: string) => void;
  completedIds: Set<string>;
  toggleCompleted: (itemId: string) => void;
  searchQuery: string;
  user: { username: string; displayName?: string; experienceLevel?: 'Beginner' | 'Intermediate' | 'Advanced' } | null;
  streakCount?: number;
}

export const LearningSheet: React.FC<LearningSheetProps> = ({
  topics,
  activeTopicId,
  setActiveTopicId,
  completedIds,
  toggleCompleted,
  searchQuery,
  user,
  streakCount
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Selected Experience Level Filter
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<'All' | 'Beginner' | 'Intermediate' | 'Advanced'>(() => {
    return user?.experienceLevel || (user ? 'Beginner' : 'All');
  });

  useEffect(() => {
    if (user?.experienceLevel) {
      setSelectedLevelFilter(user.experienceLevel);
    } else if (user && selectedLevelFilter === 'All') {
      setSelectedLevelFilter('Beginner');
    }
  }, [user, user?.experienceLevel]);
  
  // Sub-Module Step Index
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(0);

  // Question Pagination Page Index (3 Questions per Page)
  const [questionPageIndex, setQuestionPageIndex] = useState<number>(0);
  
  // User Selected Option State per item ID
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  // End of Module Quiz Result Screen state
  const [showModuleResult, setShowModuleResult] = useState<boolean>(false);

  // Verified Certificate Modal state
  const [selectedCertModal, setSelectedCertModal] = useState<CertificateData | null>(null);

  // Reset section, page, and result view when active module changes
  useEffect(() => {
    setCurrentSectionIndex(0);
    setQuestionPageIndex(0);
    setShowModuleResult(false);
    setSelectedAnswers({});
  }, [activeTopicId]);

  // Reset question page index when sub-module changes
  useEffect(() => {
    setQuestionPageIndex(0);
  }, [currentSectionIndex]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Quiet Selection: Record answer without immediate animation or revealing syntax
  const handleOptionSelect = (itemId: string, choiceId: string) => {
    setSelectedAnswers(prev => ({ ...prev, [itemId]: choiceId }));
  };

  const enabledTopics = topics.filter(t => !t.disabled);
  const currentTopic = enabledTopics.find(t => t.id === activeTopicId) || enabledTopics[0] || topics[0];
  const sections = (currentTopic.sections || []).filter(s => !s.disabled);
  const activeSection = sections[currentSectionIndex] || sections[0];

  const query = searchQuery.trim().toLowerCase();
  const activeLevel = user?.experienceLevel || selectedLevelFilter;

  // Level filter helper
  const matchesActiveLevel = (item: CommandItem, idx: number) => {
    if (activeLevel === 'All') return true;
    return getItemExperienceLevel(item, idx) === activeLevel;
  };

  // Module completion totals across enabled sections for the active experience level
  const rawAllModuleItems = sections.flatMap(s => s.commands.flatMap(c => c.items));
  let allModuleItems = rawAllModuleItems.filter((item, idx) => matchesActiveLevel(item, idx));
  if (allModuleItems.length === 0 && rawAllModuleItems.length > 0) {
    allModuleItems = rawAllModuleItems;
  }
  const completedModuleItems = allModuleItems.filter(item => completedIds.has(item.id)).length;
  const topicProgress = Math.round((completedModuleItems / (allModuleItems.length || 1)) * 100);

  // Active sub-module items & pagination calculations
  const rawActiveSectionItems = activeSection 
    ? activeSection.commands.flatMap(c => c.items)
    : [];

  let activeSectionItems = rawActiveSectionItems.filter((i, idx) => {
    const matchesLevel = matchesActiveLevel(i, idx);
    const matchesQuery = !query || 
      i.label.toLowerCase().includes(query) || 
      (i.command && i.command.toLowerCase().includes(query)) ||
      (i.why && i.why.toLowerCase().includes(query));
    return matchesLevel && matchesQuery;
  });

  if (activeSectionItems.length === 0 && !query && rawActiveSectionItems.length > 0) {
    activeSectionItems = rawActiveSectionItems;
  }

  const activeSectionCompleted = activeSectionItems.filter(item => completedIds.has(item.id)).length;
  const activeSectionProgress = Math.round((activeSectionCompleted / (activeSectionItems.length || 1)) * 100);

  // EXACTLY 3 QUESTIONS PER PAGE
  const QUESTIONS_PER_PAGE = 3;
  const totalQuestionPages = Math.max(1, Math.ceil(activeSectionItems.length / QUESTIONS_PER_PAGE));
  const currentPageQuestions = activeSectionItems.slice(
    questionPageIndex * QUESTIONS_PER_PAGE,
    (questionPageIndex + 1) * QUESTIONS_PER_PAGE
  );

  // Helper to generate 4 choices (a, b, c, d) for any command item
  const generateChoicesForItem = (item: CommandItem, groupItems: CommandItem[]) => {
    // If Admin configured custom options for this item, use them directly!
    if (item.options && item.options.length > 0) {
      return item.options.map((opt, idx) => ({
        id: opt.id,
        label: `${String.fromCharCode(97 + idx)}.`,
        text: opt.text,
        isCorrect: opt.id === (item.correctOptionId || item.options![0]?.id)
      }));
    }

    const itemCorrectText = (item.command || item.label).trim();
    const distractors: string[] = [];

    const isDistinct = (text: string) => {
      const clean = text.trim();
      return (
        clean.length > 0 &&
        clean !== itemCorrectText &&
        clean !== item.label.trim() &&
        (item.command ? clean !== item.command.trim() : true) &&
        !distractors.includes(clean)
      );
    };

    // 1. From group items
    for (const gi of groupItems) {
      const text = (gi.command || gi.label).trim();
      if (isDistinct(text)) {
        distractors.push(text);
      }
    }

    // 2. From all module items if needed
    if (distractors.length < 3) {
      for (const gi of allModuleItems) {
        const text = (gi.command || gi.label).trim();
        if (isDistinct(text)) {
          distractors.push(text);
        }
      }
    }

    // 3. Fallback pool
    const fallbacks = [
      'ls -la /var/log',
      'mkdir -p /opt/app',
      'curl -I https://localhost:8080',
      'docker ps -a',
      'kubectl get pods -n kube-system',
      'terraform plan -out=main.tfplan',
      'git status -s',
      'systemctl restart nginx'
    ];
    for (const fb of fallbacks) {
      if (distractors.length < 3 && isDistinct(fb)) {
        distractors.push(fb);
      }
    }

    const uniqueDistractors = distractors.slice(0, 3);
    
    const choices = [
      { id: 'choice-a', label: 'a.', text: itemCorrectText, isCorrect: true },
      ...uniqueDistractors.map((dist, idx) => ({
        id: `choice-${String.fromCharCode(98 + idx)}`,
        label: `${String.fromCharCode(98 + idx)}.`,
        text: dist,
        isCorrect: false
      }))
    ];

    return choices;
  };

  // Next module finder for navigation
  const currentTopicIndex = enabledTopics.findIndex(t => t.id === currentTopic.id);
  const nextTopic = enabledTopics[currentTopicIndex + 1];

  const handleNextQuestionPage = () => {
    if (questionPageIndex < totalQuestionPages - 1) {
      setQuestionPageIndex(prev => prev + 1);
      window.scrollTo({ top: 450, behavior: 'smooth' });
    } else if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(prev => prev + 1);
      setQuestionPageIndex(0);
      window.scrollTo({ top: 450, behavior: 'smooth' });
    }
  };

  const handlePrevQuestionPage = () => {
    if (questionPageIndex > 0) {
      setQuestionPageIndex(prev => prev - 1);
      window.scrollTo({ top: 450, behavior: 'smooth' });
    } else if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
      setQuestionPageIndex(0);
      window.scrollTo({ top: 450, behavior: 'smooth' });
    }
  };

  // Submit quiz and calculate module score
  const handleSubmitModuleQuiz = () => {
    let correctCount = 0;
    
    allModuleItems.forEach(item => {
      const choices = generateChoicesForItem(item, allModuleItems);
      const correctChoice = choices.find(c => c.isCorrect);
      const userChoiceId = selectedAnswers[item.id];
      if (userChoiceId && correctChoice && userChoiceId === correctChoice.id) {
        correctCount++;
        if (!completedIds.has(item.id)) {
          toggleCompleted(item.id);
        }
      }
    });

    const scorePercent = Math.round((correctCount / (allModuleItems.length || 1)) * 100);
    setShowModuleResult(true);

    if (scorePercent >= 75) {
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#10b981', '#6366f1', '#f59e0b']
      });

      if (user?.username) {
        issueCertificateApi({
          username: user.username,
          topicId: currentTopic.id,
          topicTitle: currentTopic.title,
          scorePercent
        }).catch(err => console.warn('Certificate issuance sync:', err));
      }
    }
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-5 space-y-4">
      
      {/* Hero Section with Ambient Lights & Live Sandbox */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
          
          <div className="lg:col-span-7 space-y-3.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold uppercase tracking-wider shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600 animate-pulse" />
              <span>Interactive DevOps Learning Engine</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 leading-tight">
              HuntDevOps <span className="text-indigo-600">Learning Sheet</span>
            </h1>

            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-xl">
              Hands-on DevOps curriculum covering Linux, Docker, Kubernetes, Terraform, ArgoCD, AWS, Azure, GCP & CI/CD.
            </p>
          </div>

          <div className="lg:col-span-5">
            <GamifiedProfileWidget
              completedCount={completedIds.size}
              solvedCount={0}
              user={user}
              streakCount={streakCount}
            />
          </div>

        </div>
      </div>

      {/* Main Module Paginated Container */}
      <div className="space-y-4">
        
        {/* Module Header & Overall Progress Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 shadow-sm shrink-0">
              <ToolLogo id={currentTopic.id} className="h-9 w-9" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-slate-900">{currentTopic.title} Module</h2>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {completedModuleItems}/{allModuleItems.length} Solved
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">{currentTopic.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 shrink-0">
            <div className="text-[11px] font-bold text-slate-600">Module Completion:</div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 rounded-full bg-slate-200 overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-500"
                  style={{ width: `${topicProgress}%` }}
                />
              </div>
              <span className="text-xs font-extrabold text-indigo-700 font-mono">{topicProgress}%</span>
            </div>
          </div>
        </div>

        {/* DevOps Experience Level Indicator & Filter Bar */}
        {(() => {
          const activeLvl = user?.experienceLevel || selectedLevelFilter;
          const containerColorClass = 
            activeLvl === 'Beginner'
              ? 'border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-slate-50'
              : activeLvl === 'Intermediate'
              ? 'border-indigo-200 bg-gradient-to-r from-indigo-50 via-blue-50/50 to-slate-50'
              : 'border-purple-200 bg-gradient-to-r from-purple-50 via-amber-50/50 to-slate-50';

          const iconColorClass = 
            activeLvl === 'Beginner'
              ? 'text-emerald-600'
              : activeLvl === 'Intermediate'
              ? 'text-indigo-600'
              : 'text-purple-600';

          return (
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border ${containerColorClass} shadow-sm transition-all`}>
              <div className="flex items-center gap-2">
                <Zap className={`h-4.5 w-4.5 ${iconColorClass} shrink-0`} />
                <span className="text-xs font-bold text-slate-800">DevOps Experience Level:</span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {user ? (
                  (() => {
                    const userLvl = user.experienceLevel || 'Beginner';
                    return (
                      <span className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md border ${
                        userLvl === 'Beginner'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20'
                          : userLvl === 'Intermediate'
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/20'
                          : 'bg-gradient-to-r from-purple-600 to-amber-600 text-white border-purple-500 shadow-purple-500/20'
                      }`}>
                        {userLvl === 'Beginner' && '🌱'}
                        {userLvl === 'Intermediate' && '⚡'}
                        {userLvl === 'Advanced' && '🔥'}
                        <span>{userLvl} Level Questions Only</span>
                      </span>
                    );
                  })()
                ) : (
                  (['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => {
                        setSelectedLevelFilter(lvl);
                        setQuestionPageIndex(0);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 ${
                        selectedLevelFilter === lvl
                          ? lvl === 'Beginner'
                            ? 'bg-emerald-600 text-white shadow'
                            : lvl === 'Intermediate'
                            ? 'bg-indigo-600 text-white shadow'
                            : lvl === 'Advanced'
                            ? 'bg-purple-600 text-white shadow'
                            : 'bg-slate-800 text-white shadow'
                          : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                      }`}
                    >
                      {lvl === 'Beginner' && '🌱'}
                      {lvl === 'Intermediate' && '⚡'}
                      {lvl === 'Advanced' && '🔥'}
                      <span>{lvl === 'All' ? 'All Levels' : lvl}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })()}

        {/* ========================================================== */}
        {/* VIEW 1: END OF MODULE QUIZ RESULTS & SYNTAX BREAKDOWN PAGE */}
        {/* ========================================================== */}
        {showModuleResult ? (
          (() => {
            let correctCount = 0;
            const resultsBreakdown = allModuleItems.map((item, idx) => {
              const choices = generateChoicesForItem(item, allModuleItems);
              const correctChoice = choices.find(c => c.isCorrect);
              const userChoiceId = selectedAnswers[item.id];
              const userChoice = choices.find(c => c.id === userChoiceId);
              const isCorrect = userChoiceId && correctChoice && userChoiceId === correctChoice.id;
              if (isCorrect) correctCount++;

              return {
                num: idx + 1,
                item,
                choices,
                correctChoice,
                userChoice,
                isCorrect: !!isCorrect
              };
            });

            const totalQ = allModuleItems.length;
            const scorePercent = Math.round((correctCount / (totalQ || 1)) * 100);
            const isPassed = scorePercent >= 75;

            const cleanTopic = (currentTopic.id || 'MOD').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
            const hash = Math.abs(((user?.username || 'Learner') + currentTopic.id).split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)).toString(16).toUpperCase().slice(0, 6);
            const certificateCode = `HD-${cleanTopic}-${hash}`;
            const currentCertData: CertificateData = {
              certificateCode,
              recipientName: user?.displayName || user?.username || 'DevOps Engineer',
              username: user?.username || 'learner',
              topicId: currentTopic.id,
              topicTitle: currentTopic.title,
              scorePercent: scorePercent,
              issuedAt: new Date().toISOString()
            };

            return (
              <div className="space-y-6 animate-in fade-in">
                
                {/* RESULT SUMMARY BANNER */}
                <div className={`rounded-3xl border p-6 sm:p-8 space-y-4 text-center shadow-md ${
                  isPassed 
                    ? 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 border-emerald-300' 
                    : 'bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 border-amber-300'
                }`}>
                  <div className={`inline-flex p-3.5 rounded-2xl text-white shadow-md ${isPassed ? 'bg-emerald-600' : 'bg-amber-600'}`}>
                    {isPassed ? <Award className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
                  </div>

                  <div className="space-y-1">
                    <div className={`text-xs font-black uppercase tracking-wider ${isPassed ? 'text-emerald-700' : 'text-amber-800'}`}>
                      {isPassed ? '🎉 Quiz Performance Summary' : '⚠️ Quiz Assessment Retention Required'}
                    </div>
                    <h2 className={`text-2xl sm:text-4xl font-black tracking-tight ${isPassed ? 'text-emerald-950' : 'text-amber-950'}`}>
                      {isPassed ? `PASSED! Score: ${scorePercent}%` : `NEEDS RETAKE — Score: ${scorePercent}%`}
                    </h2>
                    <p className={`text-xs sm:text-sm max-w-xl mx-auto font-medium ${isPassed ? 'text-emerald-900' : 'text-amber-900'}`}>
                      {isPassed 
                        ? `Awesome achievement! You answered ${correctCount} out of ${totalQ} questions correctly (at least 75% required). You have cleared this module!`
                        : `You answered ${correctCount} out of ${totalQ} questions correctly (${scorePercent}%). At least 75% score is required to clear this module and proceed to the next track.`
                      }
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 flex-wrap">
                    {isPassed ? (
                      <>
                        <button
                          onClick={() => setSelectedCertModal(currentCertData)}
                          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
                          title="View, Print or Download Official Certificate"
                        >
                          <Award className="h-4 w-4 text-slate-950" />
                          <span>View / Download Certificate</span>
                        </button>

                        <button
                          onClick={() => setShowModuleResult(false)}
                          className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs shadow-lg flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
                          title="Review questions and explanations"
                        >
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          <span>{nextTopic ? 'Review Questions' : 'Curriculum Mastered! Review Questions'}</span>
                        </button>

                        {nextTopic && (
                          <button
                            onClick={() => {
                              setActiveTopicId(nextTopic.id);
                              setShowModuleResult(false);
                            }}
                            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
                          >
                            <span>Proceed to Next Module ({nextTopic.title})</span>
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedAnswers({});
                          setShowModuleResult(false);
                          setQuestionPageIndex(0);
                          setCurrentSectionIndex(0);
                          window.scrollTo({ top: 400, behavior: 'smooth' });
                        }}
                        className="px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs shadow-lg flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <RefreshCw className="h-4 w-4" />
                        <span>Retake Module Exam (Clear & Retry)</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* COMMAND REFERENCE & SYNTAX BREAKDOWN FOR ALL MODULE QUESTIONS */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-indigo-600 fill-indigo-600" /> Command Reference & Syntax Breakdown
                    </h3>
                    <span className="text-xs text-slate-500 font-mono">
                      {correctCount}/{totalQ} Correct Answers
                    </span>
                  </div>

                  <div className="space-y-4">
                    {resultsBreakdown.map((res) => (
                      <div
                        key={res.item.id}
                        className={`rounded-2xl border p-4 sm:p-5 space-y-3 transition-all ${
                          res.isCorrect 
                            ? 'bg-emerald-50/40 border-emerald-300' 
                            : 'bg-rose-50/40 border-rose-300'
                        }`}
                      >
                        {/* Question Title & Result Badge */}
                        <div className="flex items-start justify-between gap-3 pb-2 border-b border-slate-200/80">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                                Question {res.num}
                              </span>
                              {res.isCorrect ? (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                                  <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Correct (+25 XP)
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-300">
                                  <XCircle className="h-3 w-3 text-rose-600" /> Incorrect
                                </span>
                              )}
                            </div>

                            <h4 className="text-base font-black text-slate-900 leading-snug">
                              {res.item.label || res.item.why || 'Question Requirement'}
                            </h4>
                          </div>
                        </div>

                        {/* Selected vs Correct Option */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl border border-slate-200 bg-white space-y-1">
                            <div className="text-[10px] font-bold uppercase text-slate-400">Your Answer:</div>
                            <div className={`font-mono text-xs font-bold ${res.isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {res.userChoice ? res.userChoice.text : 'Not Answered'}
                            </div>
                          </div>

                          <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-1">
                            <div className="text-[10px] font-bold uppercase text-emerald-800">Correct Answer:</div>
                            <div className="font-mono text-xs font-bold text-emerald-950">
                              {res.correctChoice ? res.correctChoice.text : res.item.command || res.item.label}
                            </div>
                          </div>
                        </div>

                        {/* COMMAND REFERENCE & SYNTAX BOX */}
                        <div className="pt-2 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                              <Zap className="h-3.5 w-3.5 text-indigo-600 fill-indigo-600" /> Command Reference & Syntax:
                            </span>

                            {res.item.command && (
                              <button
                                onClick={() => handleCopy(res.item.id, res.item.command!)}
                                className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 transition-colors shadow-sm"
                              >
                                {copiedId === res.item.id ? (
                                  <>
                                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                                    <span className="text-emerald-700">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3.5 w-3.5" />
                                    <span>Copy Command</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>

                          {res.item.command && (
                            <div className="rounded-xl bg-slate-900 p-3 font-mono text-xs text-emerald-400 border border-slate-800 flex items-center justify-between shadow-inner">
                              <span className="select-all font-semibold">{res.item.command}</span>
                            </div>
                          )}

                          {res.item.why && (
                            <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                              <Info className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                              <span>{res.item.why}</span>
                            </div>
                          )}
                        </div>

                      </div>
                    ))}
                  </div>
                </div>

              </div>
            );
          })()
        ) : (
          /* ========================================================== */
          /* VIEW 2: ACTIVE QUIZ VIEW (QUIET SELECTION DURING TEST)     */
          /* ========================================================== */
          <div className="space-y-4">
            
            {/* Sub-Modules Step Navigation Bar */}
            <div className="rounded-2xl border border-indigo-200 bg-white p-3 space-y-2 shadow-sm">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" /> Sub-Module Step {currentSectionIndex + 1} of {sections.length}
                </span>
                <span className="text-[11px] font-bold text-indigo-700">
                  Page {questionPageIndex + 1} of {totalQuestionPages}
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {sections.map((sec, idx) => {
                  const secItems = sec.commands.flatMap(c => c.items).filter((i, iIdx) => matchesActiveLevel(i, iIdx));
                  const secComp = secItems.filter(i => completedIds.has(i.id)).length;
                  const isSecDone = secItems.length > 0 && secComp === secItems.length;
                  const isSelected = idx === currentSectionIndex;

                  return (
                    <button
                      key={sec.id}
                      onClick={() => {
                        setCurrentSectionIndex(idx);
                        setQuestionPageIndex(0);
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border ${
                        isSecDone
                          ? isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm opacity-90'
                            : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200 opacity-75 grayscale-[20%]'
                          : isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <span className={`flex h-4.5 w-4.5 items-center justify-center rounded-full text-[9px] font-black ${
                        isSecDone 
                          ? 'bg-emerald-500 text-white shadow-sm' 
                          : isSelected 
                          ? 'bg-white text-indigo-600' 
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {isSecDone ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : idx + 1}
                      </span>

                      <span className={`truncate max-w-[140px] ${isSecDone && !isSelected ? 'line-through decoration-slate-300 font-medium' : ''}`}>
                        {sec.title}
                      </span>

                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono ${
                        isSecDone
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold'
                          : isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {secComp}/{secItems.length} {isSecDone ? '✓' : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ACTIVE SUB-MODULE 3 QUESTIONS PER PAGE VIEW */}
            {activeSection && (
              <div className="space-y-4">
                
                {/* Active Sub-module & Page Counter Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/60">
                  <div className="space-y-0.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-2">
                      <span>Sub-Module {currentSectionIndex + 1}: {activeSection.title}</span>
                    </div>
                    <h3 className="text-base font-black text-slate-900">
                      Questions Page {questionPageIndex + 1} of {totalQuestionPages}
                    </h3>
                    <div className="text-[11px] text-slate-600">
                      Showing questions {questionPageIndex * QUESTIONS_PER_PAGE + 1} - {Math.min((questionPageIndex + 1) * QUESTIONS_PER_PAGE, activeSectionItems.length)} of {activeSectionItems.length}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-indigo-200 shrink-0 shadow-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-[11px] font-bold text-slate-800">
                      {activeSectionCompleted} / {activeSectionItems.length} Solved ({activeSectionProgress}%)
                    </span>
                  </div>
                </div>

                {/* RENDER EXACTLY 3 QUESTIONS PER PAGE */}
                <div className="space-y-4">
                  {currentPageQuestions.map((item, qOffset) => {
                    const globalQNum = questionPageIndex * QUESTIONS_PER_PAGE + qOffset + 1;
                    const isCompleted = completedIds.has(item.id);
                    const selectedChoiceId = selectedAnswers[item.id] || null;
                    const choices = generateChoicesForItem(item, activeSectionItems);
                    const isModuleOrSecDone = (allModuleItems.length > 0 && completedModuleItems === allModuleItems.length) || (activeSectionItems.length > 0 && activeSectionCompleted === activeSectionItems.length);

                    return (
                      <div
                        key={item.id}
                        className={`rounded-2xl border bg-white p-4 sm:p-5 space-y-4 shadow-sm transition-all ${
                          isModuleOrSecDone ? 'border-slate-200 bg-slate-50/50' : 'border-slate-200'
                        }`}
                      >
                        {/* QUESTION STATEMENT HEADER */}
                        <div className="flex items-start justify-between gap-3 pb-2 border-b border-slate-100">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200">
                                Question {globalQNum}
                              </span>
                              {(() => {
                                const itemLvl = getItemExperienceLevel(item, qOffset);
                                return (
                                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    itemLvl === 'Beginner'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : itemLvl === 'Intermediate'
                                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                      : 'bg-purple-50 text-purple-700 border-purple-200'
                                  }`}>
                                    {itemLvl === 'Beginner' ? '🌱 Beginner' : itemLvl === 'Intermediate' ? '⚡ Intermediate' : '🔥 Advanced'}
                                  </span>
                                );
                              })()}
                              {isCompleted && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Solved
                                </span>
                              )}
                              {isModuleOrSecDone && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200 font-mono">
                                  <Brain className="h-3 w-3 text-purple-600" /> Track Locked
                                </span>
                              )}
                            </div>

                            <h4 className="text-base font-black text-slate-900 leading-snug">
                              {item.label || item.why || 'Question Requirement'}
                            </h4>
                          </div>

                          <span className="text-[10px] font-extrabold font-mono px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                            {currentTopic.title}
                          </span>
                        </div>

                        {/* OPTIONS DISPLAYED IN NEAT LIST (a. b. c. d.) DIRECTLY BELOW QUESTION */}
                        <div className="space-y-2.5">
                          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <HelpCircle className="h-3.5 w-3.5 text-indigo-600" /> Select your answer choice (a, b, c, d):
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {choices.map((choice) => {
                              const isSelected = selectedChoiceId === choice.id;

                              let optionStyle = 'border-slate-200 bg-slate-50/70 text-slate-800 hover:border-indigo-400 hover:bg-indigo-50/50';
                              let badgeStyle = 'bg-white text-slate-700 border-slate-300';

                              if (isModuleOrSecDone) {
                                optionStyle = 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-65';
                                badgeStyle = 'bg-slate-200 text-slate-400 border-slate-300';
                              } else if (isSelected) {
                                optionStyle = 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold shadow-sm ring-2 ring-indigo-500/20';
                                badgeStyle = 'bg-indigo-600 text-white border-indigo-600 font-black shadow-sm';
                              }

                              return (
                                <button
                                  key={choice.id}
                                  disabled={isModuleOrSecDone}
                                  onClick={() => {
                                    if (!isModuleOrSecDone) {
                                      handleOptionSelect(item.id, choice.id);
                                    }
                                  }}
                                  className={`group flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-300 ${optionStyle}`}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <span className={`h-7 w-7 rounded-lg border flex items-center justify-center font-mono text-[11px] font-black shrink-0 transition-transform ${isModuleOrSecDone ? '' : 'group-hover:scale-105'} ${badgeStyle}`}>
                                      {choice.label}
                                    </span>
                                    <span className="font-mono text-xs font-semibold truncate">{choice.text}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* BRAIN SYMBOL NEXT MODULE PROMPT WHEN MODULE IS COMPLETED */}
                        {isModuleOrSecDone && (
                          <div className="mt-3 p-4 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-in fade-in">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shrink-0">
                                <Brain className="h-6 w-6 text-amber-300" />
                              </div>
                              <div>
                                <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                                  <span>Module Completed! Test Your Knowledge</span>
                                  <Brain className="h-3.5 w-3.5 text-indigo-600 inline-block" />
                                </div>
                                <p className="text-[11px] text-slate-600 mt-0.5">
                                  Questions in this completed module are locked. Proceed to the next module to test your knowledge!
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                onClick={() => {
                                  const cleanTopic = (currentTopic.id || 'MOD').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
                                  const hash = Math.abs(((user?.username || 'Learner') + currentTopic.id).split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)).toString(16).toUpperCase().slice(0, 6);
                                  const certificateCode = `HD-${cleanTopic}-${hash}`;
                                  setSelectedCertModal({
                                    certificateCode,
                                    recipientName: user?.displayName || user?.username || 'DevOps Engineer',
                                    username: user?.username || 'learner',
                                    topicId: currentTopic.id,
                                    topicTitle: currentTopic.title,
                                    scorePercent: 100,
                                    issuedAt: new Date().toISOString()
                                  });
                                }}
                                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
                                title="View, Print or Download Official Certificate"
                              >
                                <Award className="h-4 w-4 text-slate-950" />
                                <span>View / Download Certificate</span>
                              </button>

                              {nextTopic ? (
                                <button
                                  onClick={() => {
                                    setActiveTopicId(nextTopic.id);
                                    setCurrentSectionIndex(0);
                                    setQuestionPageIndex(0);
                                    window.scrollTo({ top: 350, behavior: 'smooth' });
                                  }}
                                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 shrink-0 transition-all hover:scale-[1.02] cursor-pointer"
                                >
                                  <Brain className="h-4 w-4 text-amber-300" />
                                  <span>Go to Next Module ({nextTopic.title}) &rarr;</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => setShowModuleResult(true)}
                                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md flex items-center gap-2 shrink-0 transition-all cursor-pointer"
                                >
                                  <Award className="h-4 w-4" />
                                  <span>Curriculum Mastered! Review Questions</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>

                {/* PAGE PAGINATION & MODULE SUBMIT FOOTER */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-200 bg-white shadow-sm">
                  
                  <button
                    onClick={handlePrevQuestionPage}
                    disabled={questionPageIndex === 0 && currentSectionIndex === 0}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Previous Page</span>
                  </button>

                  {/* Question Page Numbers (1, 2, 3, 4...) */}
                  <div className="flex items-center gap-1.5 flex-wrap justify-center">
                    {Array.from({ length: totalQuestionPages }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setQuestionPageIndex(idx);
                          window.scrollTo({ top: 450, behavior: 'smooth' });
                        }}
                        className={`h-7 w-7 rounded-lg font-bold font-mono text-xs transition-all cursor-pointer ${
                          idx === questionPageIndex
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>

                  {questionPageIndex < totalQuestionPages - 1 || currentSectionIndex < sections.length - 1 ? (
                    <button
                      onClick={handleNextQuestionPage}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-500/20 hover:opacity-95 transition-all cursor-pointer"
                    >
                      <span>Next Page &rarr;</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitModuleQuiz}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs shadow-md shadow-emerald-500/20 hover:opacity-95 transition-all cursor-pointer"
                    >
                      <Award className="h-4 w-4" />
                      <span>Submit Module Quiz & View Results 🎉</span>
                    </button>
                  )}

                </div>

              </div>
            )}

          </div>
        )}

        {/* OFFICIAL VERIFIED CERTIFICATE MODAL */}
        <CertificateModal
          isOpen={!!selectedCertModal}
          onClose={() => setSelectedCertModal(null)}
          certificate={selectedCertModal}
        />

      </div>
    </div>
  );
};
