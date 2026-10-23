import React from 'react';
import { Volume2, AlertTriangle, Sparkles, User, RotateCcw } from 'lucide-react';
import { ChatMessage } from '../../types';

interface ChatBubbleProps {
  message: ChatMessage;
  onSpeak?: (text: string) => void;
  isSpeakingThis?: boolean;
  onRetry?: () => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  onSpeak,
  isSpeakingThis = false,
  onRetry,
}) => {
  const isModel = message.role === 'model';

  return (
    <div
      className={`flex gap-3 w-full my-3 transition-all duration-300 ${
        isModel ? 'justify-start' : 'justify-end'
      }`}
    >
      {/* Tutor Avatar */}
      {isModel && (
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm mt-1 ${
            message.error
              ? 'bg-gradient-to-tr from-rose-500 to-amber-500'
              : 'bg-gradient-to-tr from-indigo-600 to-violet-600'
          }`}
        >
          {message.error ? (
            <AlertTriangle className="w-4 h-4 text-white" />
          ) : (
            <Sparkles className="w-4 h-4 text-white" />
          )}
        </div>
      )}

      <div
        className={`relative max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-sm transition-all ${
          isModel
            ? message.error
              ? 'bg-rose-50 border border-rose-200 text-rose-950'
              : 'bg-white border border-slate-100 text-slate-800'
            : 'bg-indigo-600 text-white rounded-tr-none'
        }`}
      >
        {/* Header line for Tutor */}
        {isModel && (
          <div
            className={`flex items-center justify-between gap-3 mb-1.5 pb-1 border-b ${
              message.error ? 'border-rose-200/60' : 'border-slate-100'
            }`}
          >
            <span
              className={`text-xs font-semibold tracking-wide uppercase ${
                message.error ? 'text-rose-700' : 'text-indigo-700'
              }`}
            >
              Voicio Tutor
            </span>
            {onSpeak && !message.error && (
              <button
                type="button"
                onClick={() => onSpeak(message.text)}
                aria-label="Listen to response"
                className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md transition-colors ${
                  isSpeakingThis
                    ? 'bg-violet-100 text-violet-700 font-semibold'
                    : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-50'
                }`}
                title="Play aloud"
              >
                {isSpeakingThis ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-violet-600 animate-pulse" />
                    <span>Playing</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Listen</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Message body */}
        <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap font-normal">
          {message.text}
        </p>

        {/* Optional Retry Button for Retryable Errors */}
        {message.error && message.retryable !== false && onRetry && (
          <div className="mt-2.5 pt-2 border-t border-rose-200/60 flex items-center justify-between gap-2">
            <span className="text-[11px] text-rose-700 font-medium">Temporary issue</span>
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-900 text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3 h-3 text-rose-700" />
              <span>Try again</span>
            </button>
          </div>
        )}

        {/* Footer timestamp */}
        <div
          className={`flex items-center justify-end gap-1 mt-1.5 text-[11px] ${
            isModel ? (message.error ? 'text-rose-400' : 'text-slate-400') : 'text-indigo-200'
          }`}
        >
          {message.error && <AlertTriangle className="w-3 h-3 text-rose-500" />}
          <span>{message.timestamp}</span>
        </div>
      </div>

      {/* User Avatar */}
      {!isModel && (
        <div className="w-9 h-9 rounded-xl bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600 flex-shrink-0 shadow-sm mt-1">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};
