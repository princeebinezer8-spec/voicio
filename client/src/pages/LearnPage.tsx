import React, { useState, useEffect } from 'react';
import {
  Volume2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Sparkles,
  Mic,
  Lightbulb,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import { VocabularyWord, DifficultyLevel } from '../types';
import { Badge } from '../components/Common/Badge';

interface LearnPageProps {
  words: VocabularyWord[];
  currentWordIndex: number;
  onSelectWordIndex: (index: number) => void;
  learnedWordIds: string[];
  onToggleLearned: (wordId: string, wordName: string, learned: boolean) => void;
  onAskTutor: (word: VocabularyWord) => void;
  onSpeak: (text: string) => void;
}

export const LearnPage: React.FC<LearnPageProps> = ({
  words,
  currentWordIndex,
  onSelectWordIndex,
  learnedWordIds,
  onToggleLearned,
  onAskTutor,
  onSpeak,
}) => {
  const currentWord = words[currentWordIndex] || words[0];
  const isLearned = currentWord ? learnedWordIds.includes(currentWord.id) : false;

  const handlePrev = () => {
    if (currentWordIndex > 0) {
      onSelectWordIndex(currentWordIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentWordIndex < words.length - 1) {
      onSelectWordIndex(currentWordIndex + 1);
    }
  };

  if (!currentWord) {
    return (
      <div className="text-center py-20">
        <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">Loading vocabulary words...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Top Navigation & Counter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentWordIndex === 0}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all"
            aria-label="Previous word"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-semibold text-slate-500">
            Word {currentWordIndex + 1} of {words.length}
          </span>
          <button
            type="button"
            onClick={handleNext}
            disabled={currentWordIndex === words.length - 1}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all"
            aria-label="Next word"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Mark as Learned Toggle */}
        <button
          type="button"
          onClick={() => onToggleLearned(currentWord.id, currentWord.word, !isLearned)}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
            isLearned
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <CheckCircle className={`w-4 h-4 ${isLearned ? 'text-emerald-600 fill-emerald-100' : 'text-slate-400'}`} />
          <span>{isLearned ? 'Learned & Mastered' : 'Mark as Learned'}</span>
        </button>
      </div>

      {/* Main Flashcard Card */}
      <div className="bg-white rounded-3xl p-6 md:p-10 border border-slate-100 shadow-sm space-y-8">
        {/* Header: Word & Pronunciation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge level={currentWord.level} />
              <Badge variant="partOfSpeech">{currentWord.partOfSpeech}</Badge>
              <span className="text-xs font-medium text-slate-400">
                {currentWord.category}
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                {currentWord.word}
              </h2>
              <span className="text-base font-mono text-indigo-600 font-medium">
                {currentWord.phonetic}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onSpeak(`${currentWord.word}. ${currentWord.definition}`)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-all shadow-sm active:scale-95"
            >
              <Volume2 className="w-4 h-4 text-indigo-600" />
              <span>Listen Pronunciation</span>
            </button>

            <button
              type="button"
              onClick={() => onAskTutor(currentWord)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 hover:opacity-95 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all active:scale-95"
            >
              <Mic className="w-4 h-4" />
              <span>Ask Voicio Tutor</span>
            </button>
          </div>
        </div>

        {/* Pronunciation breakdown guide */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100 flex items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block mb-0.5">
              Spoken Guide
            </span>
            <p className="text-sm font-semibold text-amber-950">
              Pronounced: <span className="font-extrabold text-amber-800 text-base">{currentWord.pronunciationGuide}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSpeak(currentWord.word)}
            className="p-2 rounded-xl bg-white border border-amber-200 text-amber-800 hover:bg-amber-100 transition-colors"
            title="Repeat word"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        {/* Definition & Simple Explanation */}
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Official Definition
            </h3>
            <p className="text-lg md:text-xl font-medium text-slate-800 leading-relaxed">
              {currentWord.definition}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              In Simple English
            </h3>
            <p className="text-sm md:text-base text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {currentWord.simpleExplanation}
            </p>
          </div>
        </div>

        {/* Contextual Everyday Example Sentence */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Contextual Example
            </h3>
            <button
              type="button"
              onClick={() => onSpeak(currentWord.exampleSentence)}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Read aloud</span>
            </button>
          </div>
          <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100 text-slate-800 italic text-base">
            "{currentWord.exampleSentence}"
          </div>
        </div>

        {/* Synonyms & Antonyms */}
        <div className="grid md:grid-cols-2 gap-6 pt-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Synonyms (Similar Meaning)
            </h3>
            <div className="flex flex-wrap gap-2">
              {currentWord.synonyms.map((syn, idx) => (
                <span
                  key={idx}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-50 text-slate-700 border border-slate-200"
                >
                  {syn}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Antonyms (Opposites)
            </h3>
            <div className="flex flex-wrap gap-2">
              {currentWord.antonyms.length > 0 ? (
                currentWord.antonyms.map((ant, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-rose-50/70 text-rose-700 border border-rose-100"
                  >
                    {ant}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">None common</span>
              )}
            </div>
          </div>
        </div>

        {/* Tips & Common Pitfalls */}
        {(currentWord.quickTip || currentWord.commonMistake) && (
          <div className="pt-2 border-t border-slate-100 space-y-3">
            {currentWord.quickTip && (
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs md:text-sm text-indigo-950">
                <Lightbulb className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-indigo-900 mb-0.5">Quick Usage Tip:</span>
                  <span>{currentWord.quickTip}</span>
                </div>
              </div>
            )}

            {currentWord.commonMistake && (
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs md:text-sm text-amber-950">
                <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-amber-900 mb-0.5">Common Mistake to Avoid:</span>
                  <span>{currentWord.commonMistake}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentWordIndex === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Word</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={currentWordIndex === words.length - 1}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-sm disabled:opacity-40 disabled:pointer-events-none"
          >
            <span>Next Word</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
