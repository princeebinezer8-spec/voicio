import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Mic,
  BookOpen,
  Volume2,
  Flame,
  Award,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { VocabularyWord, DifficultyLevel, LearningProgress } from '../types';
import { Badge } from '../components/Common/Badge';
import { TabType } from '../components/Layout/Sidebar';

interface HomePageProps {
  todayWord: VocabularyWord | null;
  selectedLevel: DifficultyLevel;
  progress: LearningProgress;
  onNavigate: (tab: TabType) => void;
  onSelectWordForTutor: (word: VocabularyWord) => void;
  onSpeak: (text: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  todayWord,
  selectedLevel,
  progress,
  onNavigate,
  onSelectWordForTutor,
  onSpeak,
}) => {
  // Determine greeting based on current local hour
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const accuracy =
    progress.quizAttempts > 0
      ? Math.round((progress.quizCorrect / progress.quizAttempts) * 100)
      : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Hero Welcome Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-indigo-950 to-slate-900 text-white p-6 md:p-10 shadow-xl shadow-indigo-950/20">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-20 -mb-16 w-56 h-56 rounded-full bg-violet-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-4 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Voice Vocabulary Coach</span>
          </div>

          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white mb-3">
            {greeting}, English Learner.
          </h2>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6 font-normal">
            Ready to expand your active vocabulary? Speak naturally with your Gemini-powered tutor, receive immediate pronunciation feedback, and master high-impact words.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (todayWord) onSelectWordForTutor(todayWord);
                onNavigate('tutor');
              }}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all transform active:scale-95"
            >
              <Mic className="w-4 h-4" />
              <span>Start Speaking Now</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('learn')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm border border-white/10 backdrop-blur-sm transition-all"
            >
              <BookOpen className="w-4 h-4 text-indigo-300" />
              <span>Explore Vocabulary</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real Statistics Row (Calculated strictly from application state) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Day Streak</p>
            <p className="text-xl md:text-2xl font-bold text-slate-900">
              {progress.streakDays} <span className="text-xs font-normal text-slate-500">{progress.streakDays === 1 ? 'day' : 'days'}</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Words Mastered</p>
            <p className="text-xl md:text-2xl font-bold text-slate-900">
              {progress.wordsLearnedIds.length} <span className="text-xs font-normal text-slate-500">words</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Quiz Accuracy</p>
            <p className="text-xl md:text-2xl font-bold text-slate-900">
              {accuracy}% <span className="text-xs font-normal text-slate-500">({progress.quizCorrect}/{progress.quizAttempts})</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Target Level</p>
            <p className="text-lg md:text-xl font-bold text-slate-900 truncate">
              {selectedLevel}
            </p>
          </div>
        </div>
      </div>

      {/* Today's Word Highlight Card */}
      {todayWord && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm transition-all hover:shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-5 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                  Today's Word
                </span>
                <Badge level={todayWord.level} />
                <span className="text-xs font-medium text-slate-500">
                  {todayWord.category}
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900">
                  {todayWord.word}
                </h3>
                <span className="text-sm font-mono text-slate-500">
                  {todayWord.phonetic}
                </span>
                <span className="text-xs italic text-slate-400">
                  ({todayWord.partOfSpeech})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSpeak(`${todayWord.word}. ${todayWord.definition}`)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 text-xs font-semibold transition-all"
              >
                <Volume2 className="w-4 h-4 text-indigo-600" />
                <span>Listen Audio</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Simple Meaning
                </h4>
                <p className="text-slate-800 text-base leading-relaxed">
                  {todayWord.definition}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Everyday Example
                </h4>
                <p className="text-slate-600 italic text-sm bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  "{todayWord.exampleSentence}"
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Synonyms
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {todayWord.synonyms.map((syn, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-medium px-2.5 py-1 rounded-lg bg-indigo-50/70 text-indigo-800 border border-indigo-100"
                    >
                      {syn}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Pronunciation Guide
                </h4>
                <p className="text-sm font-medium text-slate-700 bg-amber-50/50 border border-amber-100/60 p-2.5 rounded-xl">
                  Say it like: <span className="font-bold text-amber-900">{todayWord.pronunciationGuide}</span>
                </p>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onSelectWordForTutor(todayWord);
                    onNavigate('tutor');
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm font-semibold transition-all shadow-sm active:scale-95"
                >
                  <Mic className="w-4 h-4" />
                  <span>Practice with Voice Tutor</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('practise')}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs md:text-sm font-semibold transition-all"
                >
                  Quick Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
