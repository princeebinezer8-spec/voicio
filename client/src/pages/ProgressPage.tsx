import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  Flame,
  RotateCcw,
  AlertCircle,
  Clock,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { LearningProgress, VocabularyWord } from '../types';
import { Badge } from '../components/Common/Badge';

interface ProgressPageProps {
  progress: LearningProgress;
  allWords: VocabularyWord[];
  onResetProgress: () => void;
  onPracticeWord: (word: VocabularyWord) => void;
}

export const ProgressPage: React.FC<ProgressPageProps> = ({
  progress,
  allWords,
  onResetProgress,
  onPracticeWord,
}) => {
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const accuracy =
    progress.quizAttempts > 0
      ? Math.round((progress.quizCorrect / progress.quizAttempts) * 100)
      : 0;

  // Compute words requiring revision from IDs
  const revisionWords = allWords.filter((w) => progress.revisionWordIds.includes(w.id));

  // Compute breakdown by level
  const levels = ['Beginner', 'Intermediate', 'Advanced'] as const;
  const levelStats = levels.map((lvl) => {
    const totalInLevel = allWords.filter((w) => w.level === lvl).length;
    const learnedInLevel = allWords.filter(
      (w) => w.level === lvl && progress.wordsLearnedIds.includes(w.id)
    ).length;
    const percent = totalInLevel > 0 ? Math.round((learnedInLevel / totalInLevel) * 100) : 0;
    return { level: lvl, total: totalInLevel, learned: learnedInLevel, percent };
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-100 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <Award className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Words Mastered
          </p>
          <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
            {progress.wordsLearnedIds.length} <span className="text-xs font-normal text-slate-500">/ {allWords.length}</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-100 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Quiz Accuracy
          </p>
          <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
            {accuracy}%
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {progress.quizCorrect} correct of {progress.quizAttempts} tries
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-100 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <Flame className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Active Streak
          </p>
          <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
            {progress.streakDays} <span className="text-xs font-normal text-slate-500">{progress.streakDays === 1 ? 'day' : 'days'}</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-100 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
            <BookOpen className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Words Explored
          </p>
          <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
            {progress.wordsEncounteredIds.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            In learning sessions
          </p>
        </div>
      </div>

      {/* Level Mastery Breakdown Progress Bars */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900">
          Mastery by Proficiency Level
        </h3>
        <div className="space-y-4">
          {levelStats.map((item) => (
            <div key={item.level} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700">{item.level}</span>
                <span className="text-indigo-600">{item.learned} of {item.total} words ({item.percent}%)</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all duration-500"
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Words Requiring Revision Queue */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900">
              Revision Queue
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {revisionWords.length} words needing review
          </span>
        </div>

        {revisionWords.length === 0 ? (
          <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-emerald-950">
              Your revision queue is clear!
            </p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Words you struggle with during quizzes or sentence practice will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {revisionWords.map((word) => (
              <div
                key={word.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{word.word}</span>
                    <Badge level={word.level} />
                  </div>
                  <p className="text-xs text-slate-500 truncate max-w-[200px] mt-0.5">
                    {word.definition}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onPracticeWord(word)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm flex-shrink-0"
                >
                  <span>Review</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity Log */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base font-bold text-slate-900">
            Recent Activity
          </h3>
        </div>

        <div className="divide-y divide-slate-100">
          {progress.activityHistory.slice(0, 8).map((act, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between text-xs md:text-sm">
              <div>
                <span className="font-semibold text-slate-800 block">{act.action}</span>
                <span className="text-slate-500 text-xs">{act.details}</span>
              </div>
              <span className="text-[11px] text-slate-400">
                {new Date(act.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Reset Progress Section */}
      <div className="pt-4 flex justify-end">
        {!showConfirmReset ? (
          <button
            type="button"
            onClick={() => setShowConfirmReset(true)}
            className="inline-flex items-center gap-2 text-xs font-medium text-rose-600 hover:text-rose-800 p-2 rounded-xl hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Reset learning progress</span>
          </button>
        ) : (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
            <span className="text-xs font-semibold">
              Are you sure you want to reset all learning progress, words mastered, and quiz scores?
            </span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowConfirmReset(false)}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetProgress();
                  setShowConfirmReset(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
