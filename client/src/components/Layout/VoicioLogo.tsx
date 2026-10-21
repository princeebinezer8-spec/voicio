import React from 'react';

interface VoicioLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const VoicioLogo: React.FC<VoicioLogoProps> = ({ size = 'md', showTagline = false }) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className="flex items-center gap-3 select-none">
      <div
        className={`${iconSizes[size]} rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white flex-shrink-0`}
      >
        {/* Modern Voice Wave Symbol */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          className="w-5 h-5 text-white"
        >
          <path d="M4 12h1" />
          <path d="M8 8v8" />
          <path d="M12 4v16" />
          <path d="M16 7v10" />
          <path d="M20 10v4" />
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-baseline gap-1.5">
          <span className={`font-extrabold tracking-tight text-slate-900 ${textSizes[size]}`}>
            Voicio
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
        </div>
        {showTagline && (
          <span className="text-xs font-medium text-slate-500 tracking-tight -mt-0.5">
            Learn words. Speak confidently.
          </span>
        )}
      </div>
    </div>
  );
};
