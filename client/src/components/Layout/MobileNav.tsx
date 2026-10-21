import React from 'react';
import { Home, BookOpen, Mic, PenTool, BarChart3, Settings } from 'lucide-react';
import { TabType } from './Sidebar';

interface MobileNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentTab, onSelectTab }) => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-around">
      <button
        type="button"
        onClick={() => onSelectTab('home')}
        className={`flex flex-col items-center gap-1 py-1 px-2 text-xs font-medium transition-colors ${
          currentTab === 'home' ? 'text-indigo-600 font-semibold' : 'text-slate-500'
        }`}
      >
        <Home className="w-5 h-5" />
        <span>Home</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab('learn')}
        className={`flex flex-col items-center gap-1 py-1 px-2 text-xs font-medium transition-colors ${
          currentTab === 'learn' ? 'text-indigo-600 font-semibold' : 'text-slate-500'
        }`}
      >
        <BookOpen className="w-5 h-5" />
        <span>Learn</span>
      </button>

      {/* Center Prominent Tutor Mic Button */}
      <button
        type="button"
        onClick={() => onSelectTab('tutor')}
        aria-label="Voice Tutor"
        className="flex flex-col items-center -mt-6"
      >
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
            currentTab === 'tutor'
              ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white ring-4 ring-indigo-100 shadow-indigo-500/30'
              : 'bg-indigo-600 text-white shadow-md'
          }`}
        >
          <Mic className="w-6 h-6" />
        </div>
        <span className="text-[11px] font-semibold text-indigo-700 mt-1">Tutor</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab('practise')}
        className={`flex flex-col items-center gap-1 py-1 px-2 text-xs font-medium transition-colors ${
          currentTab === 'practise' ? 'text-indigo-600 font-semibold' : 'text-slate-500'
        }`}
      >
        <PenTool className="w-5 h-5" />
        <span>Practise</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab('progress')}
        className={`flex flex-col items-center gap-1 py-1 px-2 text-xs font-medium transition-colors ${
          currentTab === 'progress' ? 'text-indigo-600 font-semibold' : 'text-slate-500'
        }`}
      >
        <BarChart3 className="w-5 h-5" />
        <span>Progress</span>
      </button>
    </div>
  );
};
