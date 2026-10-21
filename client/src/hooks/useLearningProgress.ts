import { useState, useEffect, useCallback } from 'react';
import { DifficultyLevel, LearningProgress, UserVoiceSettings } from '../types';

const STORAGE_KEY_PROGRESS = 'voicio_learning_progress_v1';
const STORAGE_KEY_SETTINGS = 'voicio_voice_settings_v1';

const DEFAULT_PROGRESS: LearningProgress = {
  selectedLevel: 'Beginner',
  streakDays: 1,
  lastActiveDate: new Date().toISOString().split('T')[0],
  wordsEncounteredIds: [],
  wordsLearnedIds: [],
  quizAttempts: 0,
  quizCorrect: 0,
  revisionWordIds: [],
  activityHistory: [
    {
      date: new Date().toISOString(),
      action: 'Started Journey',
      details: 'Welcome to Voicio! Selected Beginner level.',
    },
  ],
};

const DEFAULT_SETTINGS: UserVoiceSettings = {
  autoSpeak: true,
  rate: 1.0,
  pitch: 1.0,
  preferredVoiceURI: '',
};

export function useLearningProgress() {
  const [progress, setProgress] = useState<LearningProgress>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PROGRESS);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Calculate streak based on current date
        const today = new Date().toISOString().split('T')[0];
        const lastDate = parsed.lastActiveDate;
        
        if (lastDate) {
          const diffDays = Math.round(
            (new Date(today).getTime() - new Date(lastDate).getTime()) / (1000 * 3600 * 24)
          );
          if (diffDays === 1) {
            parsed.streakDays = (parsed.streakDays || 0) + 1;
            parsed.lastActiveDate = today;
          } else if (diffDays > 1) {
            parsed.streakDays = 1;
            parsed.lastActiveDate = today;
          }
        } else {
          parsed.lastActiveDate = today;
          parsed.streakDays = 1;
        }

        return { ...DEFAULT_PROGRESS, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to parse stored progress:', e);
    }
    return DEFAULT_PROGRESS;
  });

  const [voiceSettings, setVoiceSettings] = useState<UserVoiceSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  // Save progress changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progress));
    } catch (e) {
      console.warn('Failed to save progress to localStorage:', e);
    }
  }, [progress]);

  // Save settings changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(voiceSettings));
    } catch (e) {
      console.warn('Failed to save settings to localStorage:', e);
    }
  }, [voiceSettings]);

  const setLevel = useCallback((level: DifficultyLevel) => {
    setProgress((prev) => ({
      ...prev,
      selectedLevel: level,
      activityHistory: [
        {
          date: new Date().toISOString(),
          action: 'Level Changed',
          details: `Changed target proficiency level to ${level}`,
        },
        ...prev.activityHistory.slice(0, 49),
      ],
    }));
  }, []);

  const recordWordEncountered = useCallback((wordId: string, wordName: string) => {
    setProgress((prev) => {
      if (prev.wordsEncounteredIds.includes(wordId)) return prev;
      return {
        ...prev,
        wordsEncounteredIds: [...prev.wordsEncounteredIds, wordId],
        activityHistory: [
          {
            date: new Date().toISOString(),
            action: 'Explored Word',
            details: `Learned new vocabulary word "${wordName}"`,
          },
          ...prev.activityHistory.slice(0, 49),
        ],
      };
    });
  }, []);

  const markWordLearned = useCallback((wordId: string, wordName: string, learned: boolean = true) => {
    setProgress((prev) => {
      const alreadyLearned = prev.wordsLearnedIds.includes(wordId);
      if (learned && alreadyLearned) return prev;
      if (!learned && !alreadyLearned) return prev;

      const updatedLearned = learned
        ? [...prev.wordsLearnedIds, wordId]
        : prev.wordsLearnedIds.filter((id) => id !== wordId);

      // Remove from revision list if mastered
      const updatedRevision = learned
        ? prev.revisionWordIds.filter((id) => id !== wordId)
        : prev.revisionWordIds;

      return {
        ...prev,
        wordsLearnedIds: updatedLearned,
        revisionWordIds: updatedRevision,
        activityHistory: [
          {
            date: new Date().toISOString(),
            action: learned ? 'Word Mastered' : 'Unmarked Word',
            details: learned ? `Marked "${wordName}" as mastered!` : `Unmarked "${wordName}"`,
          },
          ...prev.activityHistory.slice(0, 49),
        ],
      };
    });
  }, []);

  const recordQuizResult = useCallback((wordId: string, wordName: string, isCorrect: boolean, score: number) => {
    setProgress((prev) => {
      const attempts = prev.quizAttempts + 1;
      const correct = prev.quizCorrect + (isCorrect ? 1 : 0);

      // If score is low or answer incorrect, add to revision list
      let revision = [...prev.revisionWordIds];
      if (!isCorrect || score < 70) {
        if (!revision.includes(wordId)) {
          revision.push(wordId);
        }
      } else {
        revision = revision.filter((id) => id !== wordId);
      }

      return {
        ...prev,
        quizAttempts: attempts,
        quizCorrect: correct,
        revisionWordIds: revision,
        activityHistory: [
          {
            date: new Date().toISOString(),
            action: isCorrect ? 'Quiz Passed' : 'Quiz Practice',
            details: `Completed exercise on "${wordName}": ${score}% score`,
          },
          ...prev.activityHistory.slice(0, 49),
        ],
      };
    });
  }, []);

  const resetProgress = useCallback(() => {
    const fresh: LearningProgress = {
      ...DEFAULT_PROGRESS,
      activityHistory: [
        {
          date: new Date().toISOString(),
          action: 'Reset Progress',
          details: 'Learning progress was reset to fresh baseline.',
        },
      ],
    };
    setProgress(fresh);
    localStorage.removeItem(STORAGE_KEY_PROGRESS);
  }, []);

  const updateVoiceSettings = useCallback((newSettings: Partial<UserVoiceSettings>) => {
    setVoiceSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  return {
    progress,
    voiceSettings,
    setLevel,
    recordWordEncountered,
    markWordLearned,
    recordQuizResult,
    resetProgress,
    updateVoiceSettings,
  };
}
