import React, { useState, useEffect } from 'react';
import { getChallengeExperienceLevel, type Challenge } from '../data/practiceData';
import { 
  ShieldAlert, 
  FileCode, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  ArrowLeft,
  HelpCircle,
  Sparkles,
  Zap,
  AlertTriangle,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Terminal
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TroubleshootingPracticeProps {
  challenges: Challenge[];
  solvedIds: Set<string>;
  onSolveChallenge: (challengeId: string) => void;
  user?: { username: string; displayName?: string; experienceLevel?: 'Beginner' | 'Intermediate' | 'Advanced' } | null;
}

export const TroubleshootingPractice: React.FC<TroubleshootingPracticeProps> = ({
  challenges,
  solvedIds,
  onSolveChallenge,
  user
}) => {
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [activeEvidenceTab, setActiveEvidenceTab] = useState<number>(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [filterTopic, setFilterTopic] = useState<string>('all');

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

  const enabledChallenges = challenges.filter(c => !c.disabled);

  const selectedIndex = enabledChallenges.findIndex(c => c.id === selectedChallengeId);
  const selectedChallenge = enabledChallenges[selectedIndex];

  const handleSelectChallenge = (id: string) => {
    setSelectedChallengeId(id);
    setActiveEvidenceTab(0);
    setSelectedChoiceId(null);
    setHasSubmitted(false);
  };

  const handlePrevIncident = () => {
    if (selectedIndex > 0) {
      handleSelectChallenge(enabledChallenges[selectedIndex - 1].id);
    }
  };

  const handleNextIncident = () => {
    if (selectedIndex < enabledChallenges.length - 1) {
      handleSelectChallenge(enabledChallenges[selectedIndex + 1].id);
    }
  };

  const handleSubmitDiagnosis = () => {
    if (!selectedChallenge || !selectedChoiceId) return;

    setHasSubmitted(true);
    const isCorrect = selectedChoiceId === selectedChallenge.correctChoiceId;

    if (isCorrect) {
      onSolveChallenge(selectedChallenge.id);
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#06b6d4', '#6366f1', '#f59e0b']
      });
    }
  };

  const filteredChallenges = enabledChallenges.filter(c => {
    if (filterTopic !== 'all' && c.topic !== filterTopic) return false;
    const lvl = getChallengeExperienceLevel(c);
    if (selectedLevelFilter !== 'All' && lvl !== selectedLevelFilter) return false;
    return true;
  });

  const getOptionLetter = (idx: number) => String.fromCharCode(65 + idx);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-emerald-50/70 p-6 sm:p-10 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
              <ShieldAlert className="h-4 w-4 text-emerald-600" />
              <span>Evidence-Based Troubleshooting Labs</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
              Follow the evidence<span className="text-emerald-600">.</span>
            </h1>
            <p className="text-slate-600 text-sm sm:text-base max-w-2xl leading-relaxed">
              Real-world production incidents across Docker, Linux, Git, Kubernetes, and GitHub Actions. Inspect multi-file configs and server logs to diagnose outages.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-3xl border border-slate-200 shadow-sm shrink-0">
            <div className="text-4xl font-black text-emerald-600">{solvedIds.size} / {enabledChallenges.length}</div>
            <div className="text-xs text-slate-600">
              <div className="font-extrabold text-slate-900 text-sm">Incidents Solved</div>
              <div className="text-emerald-700 font-semibold">Keep production green!</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      {!selectedChallenge ? (
        /* Scenario List View */
        <div className="space-y-6">

          {/* DevOps Experience Level Filter Bar */}
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
                          <span>{userLvl} Level Labs Only</span>
                        </span>
                      );
                    })()
                  ) : (
                    (['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map(lvl => (
                      <button
                        key={lvl}
                        onClick={() => setSelectedLevelFilter(lvl)}
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

          {/* Topic Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200">
            {['all', 'docker', 'linux', 'git', 'kubernetes', 'github-actions'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterTopic(t)}
                className={`px-4 py-2 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all border ${
                  filterTopic === t
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {t === 'github-actions' ? 'GitHub Actions' : t}
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChallenges.map((c) => {
              const isSolved = solvedIds.has(c.id);
              const expLvl = getChallengeExperienceLevel(c);

              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectChallenge(c.id)}
                  className={`group relative rounded-3xl border p-6 cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                    isSolved
                      ? 'bg-emerald-50/60 border-emerald-300 hover:border-emerald-500 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-md'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {c.topic}
                      </span>

                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        expLvl === 'Beginner'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : expLvl === 'Intermediate'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>
                        {expLvl === 'Beginner' ? '🌱 Beginner' : expLvl === 'Intermediate' ? '⚡ Intermediate' : '🔥 Advanced'}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-foreground group-hover:text-cyan-300 transition-colors">
                      {c.title}
                    </h3>

                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {c.scenario}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between text-xs font-bold text-indigo-400 group-hover:text-cyan-300">
                    <span>Inspect Evidence ({c.evidence.length} files)</span>
                    <span>Diagnose &rarr;</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* CLEAN NEAT VERTICAL LAYOUT: QUESTION -> CODE EVIDENCE -> OPTIONS BELOW QUESTION */
        <div className="space-y-8">
          
          {/* Top Bar Stepper Navigation */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-border/80 bg-secondary/30">
            <button
              onClick={() => setSelectedChallengeId(null)}
              className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Incident List
            </button>

            {/* Incident Stepper */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevIncident}
                disabled={selectedIndex === 0}
                className="p-2 rounded-xl border border-border bg-secondary/60 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                title="Previous Incident"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="text-xs font-bold px-3 py-1 rounded-full bg-background border border-border text-foreground font-mono">
                Incident {selectedIndex + 1} of {challenges.length}
              </span>

              <button
                onClick={handleNextIncident}
                disabled={selectedIndex === challenges.length - 1}
                className="p-2 rounded-xl border border-border bg-secondary/60 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                title="Next Incident"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* 1. QUESTION STATEMENT CARD */}
          <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/20 via-background to-background p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-xs font-extrabold uppercase tracking-wider">
                <HelpCircle className="h-4 w-4 text-cyan-400" />
                Incident Question #{selectedIndex + 1}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {selectedChallenge.topic}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  {selectedChallenge.difficulty}
                </span>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-foreground">{selectedChallenge.title}</h2>
            
            <div className="p-4 rounded-2xl bg-secondary/40 border border-border/60 text-sm text-foreground/90 leading-relaxed">
              <span className="font-bold text-cyan-400 mr-2">Scenario Statement:</span>
              {selectedChallenge.scenario}
            </div>
          </div>

          {/* 2. CODE & LOG EVIDENCE INSPECTOR */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <FileCode className="h-4 w-4 text-cyan-400" /> System Evidence Logs & Configuration Files:
              </span>
              <span className="text-xs text-muted-foreground">{selectedChallenge.evidence.length} Artifacts</span>
            </div>

            <div className="rounded-3xl border border-border/80 bg-slate-950/90 overflow-hidden shadow-2xl">
              <div className="flex items-center gap-2 border-b border-border/60 bg-secondary/50 px-4 py-3 overflow-x-auto">
                {selectedChallenge.evidence.map((ev, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveEvidenceTab(idx)}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap border ${
                      activeEvidenceTab === idx
                        ? 'bg-background text-cyan-300 border-cyan-500/50 shadow-md'
                        : 'text-muted-foreground border-transparent hover:text-foreground'
                    }`}
                  >
                    {ev.label}
                  </button>
                ))}
              </div>

              {/* Code / Log Display */}
              <div className="p-5 overflow-x-auto max-h-[400px] overflow-y-auto">
                <pre className="font-mono text-xs text-emerald-400 leading-relaxed select-all">
                  <code>{selectedChallenge.evidence[activeEvidenceTab]?.code}</code>
                </pre>
              </div>
            </div>
          </div>

          {/* 3. DIAGNOSTIC OPTIONS DISPLAYED DIRECTLY BELOW QUESTION & EVIDENCE */}
          <div className="rounded-3xl border border-indigo-500/30 bg-secondary/20 p-6 sm:p-8 space-y-6 shadow-2xl">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div>
                <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-400" />
                  Select Root Cause Answer
                </h3>
                <p className="text-xs text-muted-foreground">Based on the evidence above, select the correct explanation below.</p>
              </div>

              <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shrink-0">
                Single Choice • 4 Options
              </span>
            </div>

            {/* NEAT & CLEAR OPTIONS LIST BELOW QUESTION */}
            <div className="space-y-4">
              {selectedChallenge.choices.map((choice, idx) => {
                const letter = getOptionLetter(idx);
                const isSelected = selectedChoiceId === choice.id;
                const isCorrect = choice.id === selectedChallenge.correctChoiceId;

                let cardStyle = 'border-border/80 bg-background/90 hover:border-cyan-500/50 hover:bg-secondary/30';
                let badgeStyle = 'bg-secondary text-muted-foreground border-border';
                let iconElement = null;

                if (hasSubmitted) {
                  if (isCorrect) {
                    cardStyle = 'border-emerald-500 bg-emerald-950/30 text-emerald-100 font-semibold shadow-[0_0_25px_rgba(16,185,129,0.2)]';
                    badgeStyle = 'bg-emerald-500 text-black border-emerald-400 font-black shadow-md';
                    iconElement = <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0 animate-in zoom-in" />;
                  } else if (isSelected && !isCorrect) {
                    cardStyle = 'border-rose-500 bg-rose-950/30 text-rose-100 shadow-[0_0_25px_rgba(244,63,94,0.2)]';
                    badgeStyle = 'bg-rose-500 text-white border-rose-400 font-black';
                    iconElement = <XCircle className="h-6 w-6 text-rose-400 shrink-0 animate-in zoom-in" />;
                  }
                } else if (isSelected) {
                  cardStyle = 'border-cyan-400 bg-gradient-to-r from-cyan-950/30 via-indigo-950/30 to-background text-foreground shadow-[0_0_30px_rgba(6,182,212,0.2)]';
                  badgeStyle = 'bg-cyan-400 text-black border-cyan-300 font-black shadow-md';
                }

                return (
                  <div
                    key={choice.id}
                    onClick={() => !hasSubmitted && setSelectedChoiceId(choice.id)}
                    className={`group relative rounded-2xl border p-5 transition-all duration-300 cursor-pointer flex items-center justify-between gap-4 ${cardStyle}`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Option Letter Badge (A, B, C, D) */}
                      <div className={`h-10 w-10 rounded-2xl border flex items-center justify-center font-black font-mono text-sm shrink-0 transition-transform duration-300 group-hover:scale-105 ${badgeStyle}`}>
                        {letter}
                      </div>

                      {/* Clear Neat Option Text */}
                      <span className="text-sm font-medium leading-relaxed">{choice.text}</span>
                    </div>

                    {/* Radio Check Indicator / Status Icon */}
                    <div className="flex items-center gap-3">
                      {!hasSubmitted && (
                        <div className={`h-5 w-5 rounded-full border flex items-center justify-center transition-all ${
                          isSelected ? 'border-cyan-400 bg-cyan-500' : 'border-muted-foreground/40 bg-secondary/40'
                        }`}>
                          {isSelected && <div className="h-2 w-2 rounded-full bg-slate-950" />}
                        </div>
                      )}
                      {iconElement}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ACTION BUTTON & DETAILED EXPLANATION BELOW OPTIONS */}
            {!hasSubmitted ? (
              <div className="pt-2">
                <button
                  onClick={handleSubmitDiagnosis}
                  disabled={!selectedChoiceId}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white font-extrabold text-sm shadow-xl shadow-emerald-500/25 hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="h-5 w-5 fill-white" />
                  <span>Submit Diagnosis (+150 XP)</span>
                </button>
              </div>
            ) : (
              <div className="space-y-5 pt-4 border-t border-border/60">
                {selectedChoiceId === selectedChallenge.correctChoiceId ? (
                  /* VICTORY RESOLUTION EXPLANATION BANNER BELOW OPTIONS */
                  <div className="rounded-2xl border border-emerald-500/50 bg-gradient-to-br from-emerald-950/40 via-background to-background p-6 space-y-4 shadow-[0_0_30px_rgba(16,185,129,0.18)] animate-in fade-in">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        <Sparkles className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-emerald-400">Correct Diagnosis! +150 XP Awarded</h4>
                        <p className="text-xs text-muted-foreground">Incident resolved successfully. System status green.</p>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-background/90 border border-emerald-500/30 space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <Lightbulb className="h-4 w-4" /> Architectural Explanation & Resolution Guide:
                      </div>
                      <p className="text-xs text-foreground/90 leading-relaxed font-mono">
                        {selectedChallenge.explanation}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* INCORRECT RETRY BANNER BELOW OPTIONS */
                  <div className="rounded-2xl border border-rose-500/50 bg-gradient-to-br from-rose-950/40 via-background to-background p-6 space-y-4 shadow-[0_0_30px_rgba(244,63,94,0.18)] animate-in fade-in">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
                        <AlertTriangle className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-rose-400">Diagnosis Incorrect</h4>
                        <p className="text-xs text-muted-foreground">The selected option does not match the evidence logs.</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-background/90 border border-rose-500/30 space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                        <Terminal className="h-4 w-4" /> Debugging Hint:
                      </div>
                      <p className="text-xs text-rose-200/90 leading-relaxed">
                        Re-examine the evidence tabs at the top. Look closely at container ports, permission bits (`chmod`), readiness probe endpoints, or token permission scopes.
                      </p>
                    </div>

                    <button
                      onClick={() => setHasSubmitted(false)}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-rose-500/40 bg-rose-950/40 text-rose-300 font-bold text-xs hover:bg-rose-950/60 transition-all"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>Try Diagnosis Again</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
