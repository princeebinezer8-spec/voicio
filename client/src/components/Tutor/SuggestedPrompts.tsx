import React from 'react';
import { Lightbulb } from 'lucide-react';

interface SuggestedPromptsProps {
  prompts: string[];
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
}

export const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({
  prompts,
  onSelectPrompt,
  disabled = false,
}) => {
  if (!prompts || prompts.length === 0) return null;

  return (
    <div className="w-full">
      <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
        <Lightbulb className="w-3 h-3 text-amber-500" />
        <span>Suggested questions:</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {prompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSelectPrompt(prompt)}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/60 hover:text-indigo-700 transition-all text-left shadow-2xs disabled:opacity-50 disabled:pointer-events-none active:scale-95"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
};
