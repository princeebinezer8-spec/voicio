import React from 'react';

interface AudioWaveformProps {
  isActive: boolean;
  color?: string;
  bars?: number;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isActive,
  color = 'bg-indigo-600',
  bars = 5,
}) => {
  return (
    <div className="flex items-center justify-center gap-1 h-6 px-1">
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={`w-1 rounded-full ${color} transition-all duration-300 ${
            isActive ? 'animate-wave-bar' : 'h-1.5 opacity-40'
          }`}
          style={{
            height: isActive ? `${Math.max(8, (i % 3 + 1) * 7)}px` : '6px',
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
};
