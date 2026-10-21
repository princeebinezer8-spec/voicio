import React from 'react';
import { DifficultyLevel } from '../../types';

interface BadgeProps {
  level?: DifficultyLevel | string;
  variant?: 'level' | 'partOfSpeech' | 'category' | 'status';
  children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ level, variant = 'level', children }) => {
  if (variant === 'level' && level) {
    const styles = {
      Beginner: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      Intermediate: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      Advanced: 'bg-purple-50 text-purple-700 border-purple-200',
    };
    const style = styles[level as DifficultyLevel] || 'bg-slate-100 text-slate-700 border-slate-200';

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}>
        {level}
      </span>
    );
  }

  if (variant === 'partOfSpeech') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
        {children}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600">
      {children}
    </span>
  );
};
