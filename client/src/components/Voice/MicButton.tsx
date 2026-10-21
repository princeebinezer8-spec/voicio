import React from 'react';
import { Mic, MicOff, Volume2, Loader2, AlertCircle, Square } from 'lucide-react';
import { MicState } from '../../types';

interface MicButtonProps {
  state: MicState;
  onClick: () => void;
  onStopSpeaking?: () => void;
  disabled?: boolean;
  errorMessage?: string | null;
  size?: 'md' | 'lg';
}

export const MicButton: React.FC<MicButtonProps> = ({
  state,
  onClick,
  onStopSpeaking,
  disabled = false,
  errorMessage,
  size = 'lg',
}) => {
  const isLarge = size === 'lg';
  const buttonDimensions = isLarge ? 'w-20 h-20' : 'w-16 h-16';
  const iconDimensions = isLarge ? 'w-8 h-8' : 'w-6 h-6';

  const handleClick = () => {
    if (disabled) return;
    if (state === 'speaking' && onStopSpeaking) {
      onStopSpeaking();
      return;
    }
    onClick();
  };

  // State-specific styles and labels
  let buttonBg = 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105';
  let stateLabel = 'Tap to speak';
  let stateHint = 'Ask a question or practice your sentence';
  let ringAnimation = '';

  if (state === 'requesting') {
    buttonBg = 'bg-amber-500 text-white shadow-lg shadow-amber-500/25';
    stateLabel = 'Allowing microphone...';
    stateHint = 'Please grant microphone access in your browser';
  } else if (state === 'listening') {
    buttonBg = 'bg-red-500 text-white shadow-xl shadow-red-500/35 hover:scale-105';
    stateLabel = 'Listening...';
    stateHint = 'Speak naturally, then tap to finish';
    ringAnimation = 'animate-ping';
  } else if (state === 'processing') {
    buttonBg = 'bg-indigo-700 text-white shadow-lg shadow-indigo-600/30';
    stateLabel = 'Thinking...';
    stateHint = 'Voicio AI is generating your response';
  } else if (state === 'speaking') {
    buttonBg = 'bg-violet-600 text-white shadow-xl shadow-violet-500/35 hover:scale-105';
    stateLabel = 'Tutor speaking...';
    stateHint = 'Tap to pause or interrupt';
  } else if (state === 'error') {
    buttonBg = 'bg-rose-600 text-white shadow-lg shadow-rose-500/25';
    stateLabel = 'Microphone issue';
    stateHint = errorMessage || 'Tap to retry or use text input';
  }

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div className="relative flex items-center justify-center">
        {/* Outer pulse ring for active listening */}
        {state === 'listening' && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ripple" />
        )}

        {/* Pulse ring for tutor speaking */}
        {state === 'speaking' && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-60 animate-ripple" />
        )}

        <button
          type="button"
          onClick={handleClick}
          disabled={disabled || state === 'processing'}
          aria-label={stateLabel}
          className={`relative z-10 ${buttonDimensions} rounded-full flex items-center justify-center transition-all duration-300 transform active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${buttonBg}`}
        >
          {state === 'idle' && <Mic className={iconDimensions} />}
          {state === 'requesting' && <Loader2 className={`${iconDimensions} animate-spin`} />}
          {state === 'listening' && <Square className="w-7 h-7 fill-white" />}
          {state === 'processing' && <Loader2 className={`${iconDimensions} animate-spin`} />}
          {state === 'speaking' && <Volume2 className={`${iconDimensions} animate-pulse`} />}
          {state === 'error' && <AlertCircle className={iconDimensions} />}
        </button>
      </div>

      {/* State label & subtext */}
      <div className="mt-3 text-center">
        <p className="text-sm font-semibold text-slate-800 flex items-center justify-center gap-1.5">
          {state === 'listening' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
          {state === 'speaking' && <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />}
          {stateLabel}
        </p>
        <p className="text-xs text-slate-500 max-w-xs truncate mt-0.5">
          {stateHint}
        </p>
      </div>
    </div>
  );
};
