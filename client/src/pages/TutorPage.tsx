import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
  BookOpen,
  Info,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import {
  VocabularyWord,
  DifficultyLevel,
  ChatMessage,
  MicState,
} from '../types';
import { MicButton } from '../components/Voice/MicButton';
import { ChatBubble } from '../components/Tutor/ChatBubble';
import { SuggestedPrompts } from '../components/Tutor/SuggestedPrompts';
import { AudioWaveform } from '../components/Voice/AudioWaveform';
import { Badge } from '../components/Common/Badge';

interface TutorPageProps {
  currentWord: VocabularyWord;
  level: DifficultyLevel;
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  micState: MicState;
  onMicClick: () => void;
  onStopSpeaking: () => void;
  interimTranscript: string;
  speechError: string | null;
  isSpeechSupported: boolean;
  onSpeak: (text: string) => void;
  currentlySpeakingText: string | null;
  activeModel: string;
  isGeminiConfigured: boolean;
  suggestedPrompts: string[];
  onChangeWord?: (word: VocabularyWord) => void;
  allWords: VocabularyWord[];
}

export const TutorPage: React.FC<TutorPageProps> = ({
  currentWord,
  level,
  messages,
  onSendMessage,
  micState,
  onMicClick,
  onStopSpeaking,
  interimTranscript,
  speechError,
  isSpeechSupported,
  onSpeak,
  currentlySpeakingText,
  activeModel,
  isGeminiConfigured,
  suggestedPrompts,
  onChangeWord,
  allWords,
}) => {
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimTranscript]);

  const handleSubmitText = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isSubmitting) return;

    setInputText('');
    setIsSubmitting(true);
    try {
      await onSendMessage(trimmed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectPrompt = async (prompt: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSendMessage(prompt);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-120px)] lg:h-[calc(100vh-100px)] pb-24 lg:pb-6">
      {/* Current Learning Objective Banner */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mb-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                  Target Word
                </span>
                <Badge level={currentWord.level} />
                <span className="text-xs text-slate-400 italic">
                  ({currentWord.partOfSpeech})
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <h2 className="text-xl font-extrabold text-slate-900">
                  {currentWord.word}
                </h2>
                <span className="text-xs font-mono text-slate-500">
                  {currentWord.phonetic}
                </span>
                <span className="text-xs text-slate-400 hidden md:inline">
                  — "{currentWord.definition}"
                </span>
              </div>
            </div>
          </div>

          {/* Quick Word Switcher Dropdown */}
          {onChangeWord && allWords.length > 0 && (
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <label htmlFor="word-select" className="text-xs text-slate-400 font-medium hidden sm:inline">
                Switch:
              </label>
              <select
                id="word-select"
                value={currentWord.id}
                onChange={(e) => {
                  const target = allWords.find((w) => w.id === e.target.value);
                  if (target) onChangeWord(target);
                }}
                className="text-xs font-semibold py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {allWords.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.word} ({w.level})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Conversation Transcript Box */}
      <div className="flex-1 bg-white rounded-3xl p-4 md:p-6 border border-slate-100 shadow-sm overflow-y-auto space-y-4">
        {/* Welcome Intro / Tutor Identity */}
        <div className="text-center py-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center mx-auto shadow-md shadow-indigo-500/20 mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Voicio AI Voice Tutor
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-0.5">
            Practicing English at <strong className="text-indigo-600">{level}</strong> level.
            Speak your answers, ask questions, or request sentence checks.
          </p>

          {!isGeminiConfigured && (
            <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-center gap-2 max-w-lg mx-auto">
              <Info className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <span>Offline demonstration mode active. Add GEMINI_API_KEY to server .env for live Gemini intelligence.</span>
            </div>
          )}
        </div>

        {/* Message history */}
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            message={msg}
            onSpeak={onSpeak}
            isSpeakingThis={currentlySpeakingText === msg.text}
          />
        ))}

        {/* Live thinking bubble when awaiting tutor response */}
        {(micState === 'processing' || isSubmitting) && (
          <div className="flex gap-3 w-full my-3 justify-start animate-in fade-in duration-200">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm mt-1">
              <Sparkles className="w-4 h-4 text-white animate-spin" />
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm text-slate-600 text-sm flex items-center gap-2.5">
              <span className="text-xs font-semibold text-indigo-700">Voicio Tutor is thinking</span>
              <span className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}

        {/* Interim Voice Transcript live indicator */}
        {micState === 'listening' && (
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-indigo-900 animate-pulse">
            <AudioWaveform isActive={true} color="bg-indigo-600" />
            <div className="text-sm">
              <span className="font-semibold block text-xs uppercase tracking-wider text-indigo-700">
                Listening to your voice...
              </span>
              <p className="italic text-slate-700">
                {interimTranscript || 'Speak now into your microphone...'}
              </p>
            </div>
          </div>
        )}

        {/* Processing State indicator */}
        {micState === 'processing' && (
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600">
            <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
            <span className="text-xs font-semibold text-slate-700">
              Voicio is evaluating your answer and preparing spoken feedback...
            </span>
          </div>
        )}

        {/* Speech Error Banner */}
        {speechError && (
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block">Microphone Notice:</span>
              <span>{speechError}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Chips */}
      <div className="px-2 pt-2 flex-shrink-0">
        <SuggestedPrompts
          prompts={suggestedPrompts}
          onSelectPrompt={handleSelectPrompt}
          disabled={micState === 'processing' || isSubmitting}
        />
      </div>

      {/* Bottom Controls: Mic centerpiece + Text input fallback */}
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm mt-2 flex-shrink-0 space-y-4">
        {/* The Flagship Mic Button */}
        <div className="flex justify-center py-1">
          <MicButton
            state={micState}
            onClick={onMicClick}
            onStopSpeaking={onStopSpeaking}
            disabled={isSubmitting}
            errorMessage={speechError}
            size="lg"
          />
        </div>

        {/* Text Input Fallback */}
        <form onSubmit={handleSubmitText} className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Or type a message to ask about "${currentWord.word}"...`}
            disabled={micState === 'processing' || isSubmitting}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSubmitting || micState === 'processing'}
            aria-label="Send message"
            className="p-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {!isSpeechSupported && (
          <p className="text-[11px] text-center text-slate-400">
            Note: Speech recognition is not available in your browser. You can type freely above!
          </p>
        )}
      </div>
    </div>
  );
};
