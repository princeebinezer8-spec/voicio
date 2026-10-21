import React, { useState } from 'react';
import {
  Volume2,
  Sliders,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { DifficultyLevel, UserVoiceSettings } from '../types';
import { HealthResponse } from '../services/api';

interface SettingsPageProps {
  selectedLevel: DifficultyLevel;
  onSelectLevel: (level: DifficultyLevel) => void;
  voiceSettings: UserVoiceSettings;
  onUpdateVoiceSettings: (settings: Partial<UserVoiceSettings>) => void;
  voices: SpeechSynthesisVoice[];
  onTestVoice: () => void;
  healthData: HealthResponse | null;
  onRefreshHealth: () => void;
  onResetProgress: () => void;
  isSpeechRecognitionSupported: boolean;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  selectedLevel,
  onSelectLevel,
  voiceSettings,
  onUpdateVoiceSettings,
  voices,
  onTestVoice,
  healthData,
  onRefreshHealth,
  onResetProgress,
  isSpeechRecognitionSupported,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefreshHealth();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const levels: DifficultyLevel[] = ['Beginner', 'Intermediate', 'Advanced'];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* 1. Learning Level Setting */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Proficiency Level
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Select your target difficulty. Voicio adapts vocabulary complexity and tutor explanations to match.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {levels.map((lvl) => {
            const isSelected = selectedLevel === lvl;
            const desc = {
              Beginner: 'Everyday foundational words, simple explanations, practical examples.',
              Intermediate: 'Nuanced vocabulary, idioms, grammar refinement, and precision.',
              Advanced: 'Sophisticated rhetoric, high-impact oratory, and academic nuance.',
            }[lvl];

            return (
              <button
                key={lvl}
                type="button"
                onClick={() => onSelectLevel(lvl)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-200'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-900 text-sm">{lvl}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Voice & Speech Synthesis Preferences */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Voice & Audio Preferences
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure how the Voicio tutor speaks responses aloud using your device's browser SpeechSynthesis engine.
          </p>
        </div>

        {/* Auto-speak toggle */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div>
            <span className="font-semibold text-slate-800 text-sm block">
              Auto-read Spoken Responses
            </span>
            <span className="text-xs text-slate-500">
              When enabled, Voicio automatically reads AI answers aloud as soon as they arrive.
            </span>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={voiceSettings.autoSpeak}
              onChange={(e) => onUpdateVoiceSettings({ autoSpeak: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {/* Voice Selection */}
        <div className="space-y-2">
          <label htmlFor="voice-select" className="text-xs font-semibold text-slate-700 block">
            Preferred Speech Voice ({voices.length} voices detected)
          </label>
          <div className="flex gap-2">
            <select
              id="voice-select"
              value={voiceSettings.preferredVoiceURI}
              onChange={(e) => onUpdateVoiceSettings({ preferredVoiceURI: e.target.value })}
              className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Default Recommended Voice</option>
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={onTestVoice}
              className="px-4 py-2.5 rounded-2xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold text-xs transition-all flex items-center gap-1.5 flex-shrink-0"
            >
              <Volume2 className="w-4 h-4" />
              <span>Test Audio</span>
            </button>
          </div>
        </div>

        {/* Speed Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>Speech Speed Rate</span>
            <span className="text-indigo-600">{voiceSettings.rate}x</span>
          </div>
          <input
            type="range"
            min="0.75"
            max="1.25"
            step="0.05"
            value={voiceSettings.rate}
            onChange={(e) => onUpdateVoiceSettings({ rate: parseFloat(e.target.value) })}
            className="w-full accent-indigo-600 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Slower (0.75x)</span>
            <span>Standard (1.0x)</span>
            <span>Faster (1.25x)</span>
          </div>
        </div>
      </div>

      {/* 3. System Diagnostics & AI Status */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              System Diagnostics & AI Engine
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status of server health and Google Gemini connectivity.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
            title="Refresh status"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>

        {healthData ? (
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs md:text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Backend Server:</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Configured Gemini Model:</span>
                <span className="font-mono text-indigo-600 font-semibold">{healthData.gemini.model}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Gemini API Status:</span>
                <span
                  className={`font-semibold flex items-center gap-1 ${
                    healthData.gemini.connected ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {healthData.gemini.connected ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5" /> {healthData.gemini.configured ? 'Key check required' : 'Key not set'}
                    </>
                  )}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                <span>Diagnostic Message: </span>
                <span className="italic text-slate-700">{healthData.gemini.message}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400">Loading diagnostic status...</p>
        )}
      </div>

      {/* 4. Browser Voice Compatibility Guide */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900">
          Browser Voice Compatibility Guide
        </h3>

        <div className="space-y-3 text-xs md:text-sm text-slate-600 leading-relaxed">
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100">
            <Info className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block text-indigo-900 mb-0.5">Microphone Compatibility:</strong>
              <span>
                Speech recognition works best in modern Chromium browsers (Google Chrome, Microsoft Edge, Brave) and Safari. If your browser does not support Web Speech Recognition, Voicio automatically provides text input as a seamless fallback.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-800 mb-0.5">Microphone Permissions:</strong>
              <span>
                Browsers require HTTPS for microphone features on public URLs. When prompted, click "Allow" on the microphone dialog in your address bar.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Danger Zone: Reset Data */}
      <div className="p-6 rounded-3xl border border-rose-200 bg-rose-50/40 space-y-3">
        <div>
          <h4 className="text-sm font-bold text-rose-900">Reset Local Learning Data</h4>
          <p className="text-xs text-rose-700">
            Clears your words learned, day streak, and quiz logs stored in your browser's LocalStorage.
          </p>
        </div>

        {!confirmReset ? (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="px-4 py-2 rounded-xl bg-white border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-50 transition-colors"
          >
            Reset Progress
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onResetProgress();
                setConfirmReset(false);
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 shadow-sm"
            >
              Yes, Reset Everything
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-medium"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
