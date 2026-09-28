import React from 'react';
import type { Topic } from '../data/sheetData';
import { ToolLogo } from './TechLogos';
import { 
  CheckCircle2, 
  Layers, 
  Award,
  Flame
} from 'lucide-react';

interface SidebarProps {
  topics: Topic[];
  activeTopicId: string;
  setActiveTopicId: (id: string) => void;
  completedIds: Set<string>;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  streakCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  topics,
  activeTopicId,
  setActiveTopicId,
  completedIds,
  isOpen,
  streakCount = 1
}) => {
  const enabledTopics = topics.filter(t => !t.disabled);

  return (
    <aside
      className={`fixed lg:sticky top-16 z-30 h-[calc(100vh-4rem)] w-72 shrink-0 border-r border-slate-200 bg-white/95 backdrop-blur-md transition-all duration-300 overflow-y-auto scrollbar-none ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      <div className="p-4 space-y-6">
        
        {/* Sidebar Header Title */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight text-slate-900">DevOps Stack</h3>
              <p className="text-[11px] text-slate-500">Select module to learn</p>
            </div>
          </div>

          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            {enabledTopics.length} Modules
          </span>
        </div>

        {/* Modules List */}
        <nav className="space-y-1.5">
          {enabledTopics.map((t) => {
            const items = t.sections.flatMap(s => s.commands.flatMap(c => c.items));
            const comp = items.filter(i => completedIds.has(i.id)).length;
            const isCompleted = comp > 0 && comp === items.length;
            const percent = Math.round((comp / (items.length || 1)) * 100);
            const isActive = t.id === activeTopicId;

            return (
              <button
                key={t.id}
                onClick={() => setActiveTopicId(t.id)}
                className={`group relative w-full flex items-center justify-between p-3 rounded-2xl transition-all duration-300 border ${
                  isCompleted
                    ? isActive
                      ? 'bg-emerald-50/90 border-emerald-300 text-slate-900 shadow-sm font-bold opacity-90'
                      : 'bg-slate-100/80 border-slate-200 text-slate-400 hover:bg-slate-200/80 opacity-70 grayscale-[25%]'
                    : isActive
                    ? 'bg-indigo-50 border-indigo-200 text-slate-900 shadow-sm font-bold'
                    : 'bg-slate-50/60 border-slate-200/80 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full shadow-sm ${
                    isCompleted ? 'bg-emerald-600' : 'bg-indigo-600'
                  }`} />
                )}

                <div className="flex items-center gap-3 min-w-0 pl-1">
                  {/* Tool Logo Icon Box */}
                  <div className={`p-2.5 rounded-xl border transition-transform duration-300 group-hover:scale-105 ${
                    isCompleted
                      ? 'bg-slate-200/60 border-slate-300 opacity-75'
                      : isActive
                      ? 'bg-white border-indigo-200 shadow-sm'
                      : 'bg-white border-slate-200'
                  }`}>
                    <ToolLogo id={t.id} className="h-7 w-7" />
                  </div>

                  <div className="text-left truncate">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm truncate ${
                        isCompleted && !isActive
                          ? 'text-slate-400 line-through decoration-slate-300 font-medium'
                          : isActive
                          ? 'text-slate-900 font-extrabold'
                          : 'text-slate-800 font-bold'
                      }`}>
                        {t.title}
                      </span>
                      {isCompleted && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      )}
                    </div>
                    <span className={`text-[11px] block truncate ${isCompleted ? 'text-slate-400 font-normal' : 'text-slate-500'}`}>
                      {isCompleted ? 'Module Completed ✓' : t.subtitle}
                    </span>
                  </div>
                </div>

                {/* Right Progress Badge */}
                <div className="flex flex-col items-end gap-1 ml-2 shrink-0">
                  <span className={`text-[10px] font-extrabold font-mono px-2 py-0.5 rounded-full ${
                    isCompleted
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : isActive
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {isCompleted ? 'Done ✓' : `${comp}/${items.length}`}
                  </span>

                  {/* Tiny progress line */}
                  <div className="w-10 h-1 rounded-full bg-slate-200 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Gamification Footer Card */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
              <Award className="h-3.5 w-3.5 text-indigo-600" /> Streaks & Badges
            </span>
            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> {streakCount} {streakCount === 1 ? 'Day' : 'Days'}
            </span>
          </div>

          <div className="text-[11px] text-slate-600 leading-relaxed">
            Complete all checklist items in a module to earn custom tool mastery badges and bonus XP!
          </div>
        </div>

      </div>
    </aside>
  );
};
