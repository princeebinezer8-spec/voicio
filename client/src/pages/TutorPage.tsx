import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Volume2,
  BookOpen,
  AlertTriangle,
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
  onRetryLastMessage?: () => void;
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
  onRetryLastMessage,
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
    } catch {
      // Preserve student input if sending fails
      setInputText(trimmed);
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
    <div className="w-full max-w-4xl mx-auto flex flex-col space-y-4 pb-24 lg:pb-8">
      {/* 1. COMPACT TARGET WORD HEADER */}
      <div className="bg-white rounded-2xl p-3.5 px-4 md:px-5 border border-slate-100 shadow-sm flex-shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left side: Icon, Badges, Word, Phonetic, Definition */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-full">
                  Target Word
                </span>
                <Badge level={currentWord.level} />
                <span className="text-xs text-slate-400 italic">
                  ({currentWord.partOfSpeech})
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-0.5 flex-wrap min-w-0">
                <h2 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight">
                  {currentWord.word}
                </h2>
                <span className="text-xs font-mono text-indigo-600 font-medium">
                  {currentWord.phonetic}
                </span>
                <span className="text-xs text-slate-500 truncate max-w-md hidden md:inline">
                  — "{currentWord.definition}"
                </span>
              </div>
            </div>
          </div>

          {/* Right side: Word Switcher */}
          {onChangeWord && allWords.length > 0 && (
            <div className="flex items-center gap-2 flex-shrink-0">
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
                className="text-xs font-semibold py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {!allWords.some((w) => w.id === currentWord.id) && (
                  <option value={currentWord.id}>
                    {currentWord.word} ({currentWord.level})
                  </option>
                )}
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

      {/* 2. MAIN VOICE TUTOR CONVERSATION CARD (BIG, SPACIOUS, PROMINENT) */}
      <div className="bg-white rounded-3xl p-4 md:p-6 border border-slate-100 shadow-sm flex flex-col min-h-[400px] md:min-h-[480px]">
        {/* Card Header: Tutor info */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">Voicio AI Voice Tutor</h3>
              <p className="text-[11px] text-slate-400">Practicing {level} English with dynamic feedback</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
              {messages.length} {messages.length === 1 ? 'message' : 'messages'}
            </span>
          </div>
        </div>

        {/* Scrollable Conversation Transcript with generous height & padding */}
        <div className="flex-1 min-h-[280px] overflow-y-auto pr-1 space-y-3">
          {messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              message={msg}
              onSpeak={onSpeak}
              isSpeakingThis={currentlySpeakingText === msg.text}
              onRetry={onRetryLastMessage}
            />
          ))}

          {/* Live Voice Transcript Banner when listening */}
          {micState === 'listening' && (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-indigo-900 animate-pulse my-2">
              <AudioWaveform isActive={true} color="bg-indigo-600" />
              <div className="text-xs md:text-sm">
                <span className="font-bold block uppercase tracking-wider text-red-600">
                  Listening to your voice...
                </span>
                <p className="italic text-slate-700 mt-0.5">
                  {interimTranscript || 'Speak naturally into your microphone...'}
                </p>
              </div>
            </div>
          )}

          {/* Live thinking bubble when awaiting tutor response */}
          {(micState === 'processing' || isSubmitting) && (
            <div className="flex gap-2.5 w-full my-2 justify-start animate-in fade-in duration-200">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-white animate-spin" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-600 text-xs md:text-sm flex items-center gap-2">
                <span className="font-semibold text-indigo-700">Voicio Tutor is thinking</span>
                <span className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          )}

          {/* Speech Error Banner */}
          {speechError && (
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs my-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block">Microphone Notice:</span>
                <span>{speechError}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions Section inside tutor card */}
        <div className="pt-3 border-t border-slate-100 flex-shrink-0">
          <SuggestedPrompts
            prompts={suggestedPrompts}
            onSelectPrompt={handleSelectPrompt}
            disabled={micState === 'processing' || isSubmitting}
          />
        </div>
      </div>

      {/* 3. COMPACT SPEAKING & TEXT INPUT CONTROLS */}
      <div className="bg-white rounded-3xl p-4 md:p-5 border border-slate-100 shadow-sm flex-shrink-0 space-y-3.5">
        {/* Mic Control Bar */}
        <div className="flex flex-col items-center justify-center">
          <MicButton
            state={micState}
            onClick={onMicClick}
            onStopSpeaking={onStopSpeaking}
            disabled={isSubmitting}
            errorMessage={speechError}
            size="md"
          />
        </div>

        {/* Text Input Fallback */}
        <div className="pt-2 border-t border-slate-100">
          <form onSubmit={handleSubmitText} className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Or type a message to ask about "${currentWord.word}"...`}
              disabled={micState === 'processing' || isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs md:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isSubmitting || micState === 'processing'}
              aria-label="Send message"
              className="p-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {!isSpeechSupported && (
            <p className="text-[11px] text-center text-slate-400 mt-1.5">
              Note: Speech recognition is not supported in this browser. You can type freely above!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
