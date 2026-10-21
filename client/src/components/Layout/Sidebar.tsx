import React from 'react';
import {
  Home,
  BookOpen,
  Mic2,
  PenTool,
  BarChart3,
  Settings,
  Flame,
  Award,
  Sparkles,
} from 'lucide-react';
import { VoicioLogo } from './VoicioLogo';
import { DifficultyLevel } from '../../types';

export type TabType = 'home' | 'learn' | 'tutor' | 'practise' | 'progress' | 'settings';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  selectedLevel: DifficultyLevel;
  onSelectLevel: (level: DifficultyLevel) => void;
  streakDays: number;
  wordsLearnedCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  selectedLevel,
  onSelectLevel,
  streakDays,
  wordsLearnedCount,
}) => {
  const navItems: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'learn', label: 'Learn', icon: BookOpen },
    { id: 'tutor', label: 'Voice Tutor', icon: Mic2 },
    { id: 'practise', label: 'Practise', icon: PenTool },
    { id: 'progress', label: 'Progress', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const levels: DifficultyLevel[] = ['Beginner', 'Intermediate', 'Advanced'];

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen bg-white border-r border-slate-100 p-5 flex-shrink-0 select-none">
      {/* Brand Header */}
      <div className="pb-6 border-b border-slate-100">
        <VoicioLogo size="md" showTagline={true} />
      </div>

      {/* Level Switcher Quick Pill */}
      <div className="mt-5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
          <span>Target Level</span>
          <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
            {selectedLevel}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-xl border border-slate-200">
          {levels.map((lvl) => {
            const isSelected = selectedLevel === lvl;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => onSelectLevel(lvl)}
                className={`text-xs py-1.5 font-medium rounded-lg transition-all text-center ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {lvl.slice(0, 3)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="mt-6 flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm shadow-indigo-100/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-colors ${
                  isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              />
              <span>{item.label}</span>
              {item.id === 'tutor' && (
                <span className="ml-auto flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white uppercase tracking-wider">
                  <Sparkles className="w-2.5 h-2.5" />
                  AI
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Progress Metric Badges */}
      <div className="pt-4 border-t border-slate-100 space-y-2">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/60 border border-amber-100 text-amber-900 text-xs">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-600" />
            <span className="font-medium">Daily Streak</span>
          </div>
          <span className="font-bold text-amber-700">{streakDays} {streakDays === 1 ? 'day' : 'days'}</span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/50 border border-indigo-100 text-indigo-900 text-xs">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-600" />
            <span className="font-medium">Words Mastered</span>
          </div>
          <span className="font-bold text-indigo-700">{wordsLearnedCount} words</span>
        </div>
      </div>
    </aside>
  );
};
