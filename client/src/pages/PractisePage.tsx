import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Mic,
  RotateCcw,
  Volume2,
  Send,
  Loader2,
  Award,
  AlertTriangle,
} from 'lucide-react';
import {
  VocabularyWord,
  DifficultyLevel,
  DynamicQuiz,
  SentenceEvaluation,
} from '../types';
import { fetchQuiz, evaluateAnswer, mapErrorToUserMessage } from '../services/api';
import { Badge } from '../components/Common/Badge';

interface PractisePageProps {
  currentWord: VocabularyWord;
  level: DifficultyLevel;
  onRecordResult: (wordId: string, wordName: string, isCorrect: boolean, score: number) => void;
  onSpeak: (text: string) => void;
  allWords: VocabularyWord[];
}

type ExerciseMode = 'quiz' | 'sentence';

export const PractisePage: React.FC<PractisePageProps> = ({
  currentWord,
  level,
  onRecordResult,
  onSpeak,
  allWords,
}) => {
  const [mode, setMode] = useState<ExerciseMode>('quiz');
  const [quizType, setQuizType] = useState<'multiple-choice' | 'fill-in-the-blank' | 'synonym-match'>('multiple-choice');
  const [selectedWord, setSelectedWord] = useState<VocabularyWord>(currentWord);

  // Quiz State
  const [quiz, setQuiz] = useState<DynamicQuiz | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  // Sentence Construction State
  const [sentenceInput, setSentenceInput] = useState<string>('');
  const [isEvaluatingSentence, setIsEvaluatingSentence] = useState<boolean>(false);
  const [sentenceEvaluation, setSentenceEvaluation] = useState<SentenceEvaluation | null>(null);

  // Load a new quiz whenever target word or quiz type changes
  const loadQuiz = async (word: VocabularyWord, type: 'multiple-choice' | 'fill-in-the-blank' | 'synonym-match') => {
    setLoadingQuiz(true);
    setSelectedOption(null);
    setQuizSubmitted(false);
    try {
      const q = await fetchQuiz({
        wordId: word.id,
        wordName: word.word,
        level,
        type,
      });
      setQuiz(q);
    } catch (err) {
      console.error('Quiz fetch failed:', err);
    } finally {
      setLoadingQuiz(false);
    }
  };

  useEffect(() => {
    setSelectedWord(currentWord);
    loadQuiz(currentWord, quizType);
  }, [currentWord]);

  const handleSelectOption = (option: string) => {
    if (quizSubmitted) return;
    setSelectedOption(option);
  };

  const handleSubmitQuiz = () => {
    if (!quiz || !selectedOption || quizSubmitted) return;
    setQuizSubmitted(true);

    const isCorrect = selectedOption.trim().toLowerCase() === quiz.correctAnswer.trim().toLowerCase();
    const score = isCorrect ? 100 : 0;

    if (isCorrect) {
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      } catch {
        // ignore
      }
    }

    onRecordResult(selectedWord.id, selectedWord.word, isCorrect, score);
  };

  const handleNextQuiz = () => {
    // Pick another word from allWords
    const otherWords = allWords.filter((w) => w.id !== selectedWord.id);
    const nextWord = otherWords.length > 0 ? otherWords[Math.floor(Math.random() * otherWords.length)] : selectedWord;
    setSelectedWord(nextWord);
    loadQuiz(nextWord, quizType);
  };

  const handleEvaluateSentence = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sentenceInput.trim() || isEvaluatingSentence) return;

    setIsEvaluatingSentence(true);
    setSentenceEvaluation(null);

    try {
      const evalResult = await evaluateAnswer({
        word: selectedWord.word,
        userAnswer: sentenceInput.trim(),
        level,
        taskDescription: `Use "${selectedWord.word}" in a natural, grammatically correct sentence.`,
      });

      setSentenceEvaluation(evalResult);

      const isSuccessful = evalResult.verdict === 'correct' || evalResult.score >= 70;
      if (isSuccessful) {
        try {
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        } catch {
          // ignore
        }
      }

      onRecordResult(selectedWord.id, selectedWord.word, isSuccessful, evalResult.score);
    } catch (err: any) {
      console.error('Evaluation failed:', err);
    } finally {
      setIsEvaluatingSentence(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Exercise Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3 md:p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode('quiz')}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all ${
              mode === 'quiz'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Quizzes & Multiple Choice
          </button>

          <button
            type="button"
            onClick={() => setMode('sentence')}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all ${
              mode === 'sentence'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Sentence Construction & AI Eval
          </button>
        </div>

        {/* Word context badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Word:</span>
          <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
            {selectedWord.word}
          </span>
          <Badge level={selectedWord.level} />
        </div>
      </div>

      {/* MODE 1: VOCABULARY QUIZZES */}
      {mode === 'quiz' && (
        <div className="space-y-4">
          {/* Quiz Type Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            {[
              { id: 'multiple-choice', label: 'Definition Quiz' },
              { id: 'fill-in-the-blank', label: 'Fill in the Blank' },
              { id: 'synonym-match', label: 'Synonym Match' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  const newType = tab.id as any;
                  setQuizType(newType);
                  loadQuiz(selectedWord, newType);
                }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  quizType === tab.id
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quiz Card */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
            {loadingQuiz ? (
              <div className="text-center py-16">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700">Generating question with Gemini AI...</p>
                <p className="text-xs text-slate-400 mt-1">Adapting to {level} difficulty</p>
              </div>
            ) : quiz ? (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full mb-2 inline-block">
                      {quizType.replace('-', ' ')}
                    </span>
                    <h3 className="text-lg md:text-xl font-bold text-slate-900 leading-snug">
                      {quiz.question}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSpeak(quiz.question)}
                    className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"
                    title="Read question aloud"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Options List */}
                <div className="space-y-3">
                  {quiz.options.map((opt, idx) => {
                    const isSelected = selectedOption === opt;
                    const isCorrect = opt.trim().toLowerCase() === quiz.correctAnswer.trim().toLowerCase();

                    let optionStyle = 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300';

                    if (isSelected && !quizSubmitted) {
                      optionStyle = 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-200 font-medium';
                    }

                    if (quizSubmitted) {
                      if (isCorrect) {
                        optionStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold ring-2 ring-emerald-200';
                      } else if (isSelected && !isCorrect) {
                        optionStyle = 'bg-rose-50 border-rose-400 text-rose-950';
                      } else {
                        optionStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectOption(opt)}
                        disabled={quizSubmitted}
                        className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between text-sm md:text-base ${optionStyle}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-white border border-slate-300 text-xs font-bold flex items-center justify-center flex-shrink-0 text-slate-600">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span>{opt}</span>
                        </div>

                        {quizSubmitted && isCorrect && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 ml-2" />
                        )}
                        {quizSubmitted && isSelected && !isCorrect && (
                          <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Result Explanation box */}
                {quizSubmitted && (
                  <div
                    className={`p-4 rounded-2xl border ${
                      selectedOption?.trim().toLowerCase() === quiz.correctAnswer.trim().toLowerCase()
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                        : 'bg-rose-50/70 border-rose-200 text-rose-950'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold mb-1">
                      {selectedOption?.trim().toLowerCase() === quiz.correctAnswer.trim().toLowerCase() ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          <span>Correct! Well done.</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-rose-600" />
                          <span>Not quite. Keep learning!</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed mt-1">{quiz.explanation}</p>
                  </div>
                )}

                {/* Bottom Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  {!quizSubmitted ? (
                    <button
                      type="button"
                      onClick={handleSubmitQuiz}
                      disabled={!selectedOption}
                      className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs md:text-sm shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Check Answer
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNextQuiz}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs md:text-sm shadow-sm transition-all"
                    >
                      <span>Next Exercise</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </>
            ) : (
              <p className="text-center text-slate-500 py-8">No quiz available.</p>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: SENTENCE CONSTRUCTION & GEMINI EVALUATION */}
      {mode === 'sentence' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                Sentence Construction Practice
              </span>
              <Badge level={selectedWord.level} />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-slate-900">
              Create a sentence using "{selectedWord.word}"
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Definition reminder: <strong className="text-slate-800">{selectedWord.definition}</strong>
            </p>
          </div>

          {/* Input Area */}
          <form onSubmit={handleEvaluateSentence} className="space-y-4">
            <div className="relative">
              <textarea
                rows={3}
                value={sentenceInput}
                onChange={(e) => setSentenceInput(e.target.value)}
                placeholder={`Example: When the project was delayed, our team stayed ${selectedWord.word.toLowerCase()}...`}
                disabled={isEvaluatingSentence}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-sm md:text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Tip: Voicio will evaluate grammar, vocabulary accuracy, and natural expression.
              </span>

              <button
                type="submit"
                disabled={!sentenceInput.trim() || isEvaluatingSentence}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs md:text-sm shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {isEvaluatingSentence ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Evaluating with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Evaluate Sentence</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* AI Semantic Evaluation Results Card */}
          {sentenceEvaluation && (
            <div
              className={`p-6 rounded-2xl border space-y-4 animate-in fade-in duration-300 ${
                sentenceEvaluation.score >= 80
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                  : sentenceEvaluation.score >= 60
                  ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                  : 'bg-rose-50/60 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-black/5">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" />
                  <span className="font-bold text-base capitalize">
                    Verdict: {sentenceEvaluation.verdict.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-500">Score:</span>
                  <span className="text-xl font-extrabold text-indigo-700">
                    {sentenceEvaluation.score}/100
                  </span>
                </div>
              </div>

              {/* Feedback */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Tutor Feedback
                </h4>
                <p className="text-sm md:text-base font-normal leading-relaxed">
                  {sentenceEvaluation.feedback}
                </p>
              </div>

              {/* Grammar note if any */}
              {sentenceEvaluation.grammarFeedback && (
                <div className="p-3 rounded-xl bg-white/70 border border-black/5 text-xs md:text-sm">
                  <strong className="block text-slate-800 mb-0.5">Grammar Note:</strong>
                  <span className="text-slate-600">{sentenceEvaluation.grammarFeedback}</span>
                </div>
              )}

              {/* Natural native expression suggestion */}
              {sentenceEvaluation.betterExpression && (
                <div className="p-3 rounded-xl bg-white/80 border border-black/5 text-xs md:text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <strong className="text-indigo-900">More Natural Phrasing:</strong>
                    <button
                      type="button"
                      onClick={() => onSpeak(sentenceEvaluation.betterExpression!)}
                      className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-xs"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Listen</span>
                    </button>
                  </div>
                  <p className="italic text-slate-700">
                    "{sentenceEvaluation.betterExpression}"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
