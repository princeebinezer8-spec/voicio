import React from 'react';
import { Volume2, VolumeX, Sparkles, Settings as SettingsIcon } from 'lucide-react';
import { VoicioLogo } from './VoicioLogo';
import { DifficultyLevel } from '../../types';
import { TabType } from './Sidebar';

interface HeaderProps {
  currentTab: TabType;
  selectedLevel: DifficultyLevel;
  autoSpeak: boolean;
  onToggleAutoSpeak: () => void;
  isGeminiConnected: boolean;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  selectedLevel,
  autoSpeak,
  onToggleAutoSpeak,
  isGeminiConnected,
  onOpenSettings,
}) => {
  const titles: Record<TabType, { title: string; subtitle: string }> = {
    home: { title: 'Welcome back', subtitle: 'Start your daily vocabulary workout' },
    learn: { title: 'Vocabulary Explorer', subtitle: 'Explore definitions, phonetics, and contextual usage' },
    tutor: { title: 'Voicio Voice Tutor', subtitle: 'Speak naturally, practice words, and receive intelligent feedback' },
    practise: { title: 'Practice & Quizzes', subtitle: 'Challenge yourself and reinforce retention' },
    progress: { title: 'Learning Progress', subtitle: 'Real mastery statistics, streak, and review queue' },
    settings: { title: 'Settings & Voice', subtitle: 'Preferences, audio voices, and system diagnostics' },
  };

  const currentInfo = titles[currentTab] || titles.home;

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 md:px-8 py-3.5 flex items-center justify-between">
      {/* Left: Mobile Logo & Desktop Page Title */}
      <div className="flex items-center gap-4">
        <div className="lg:hidden">
          <VoicioLogo size="sm" />
        </div>
        <div className="hidden lg:block">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {currentInfo.title}
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            {currentInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Gemini status pill */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            isGeminiConnected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
          title={isGeminiConnected ? 'Gemini AI Connected' : 'Running in offline demonstration mode'}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isGeminiConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <Sparkles className="w-3 h-3 text-indigo-600 hidden sm:inline" />
          <span className="hidden sm:inline font-semibold">
            {isGeminiConnected ? 'Gemini AI' : 'Preview'}
          </span>
          <span className="text-[11px] opacity-80">({selectedLevel})</span>
        </div>

        {/* Audio Mute/Unmute quick toggle */}
        <button
          type="button"
          onClick={onToggleAutoSpeak}
          aria-label={autoSpeak ? 'Mute spoken audio' : 'Unmute spoken audio'}
          title={autoSpeak ? 'Voice response enabled' : 'Voice response muted'}
          className={`p-2 rounded-xl border text-sm font-medium transition-all ${
            autoSpeak
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
              : 'bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-600'
          }`}
        >
          {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Mobile Settings Icon */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
          aria-label="Settings"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
