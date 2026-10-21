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
    <div className="w-full my-2">
      <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
        <span>Suggested questions:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {prompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSelectPrompt(prompt)}
            className="text-xs md:text-sm px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700 transition-all text-left shadow-sm disabled:opacity-50 disabled:pointer-events-none active:scale-95"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
};
