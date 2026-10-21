export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface VocabularyWord {
  id: string;
  word: string;
  level: DifficultyLevel;
  partOfSpeech: string;
  phonetic: string;
  pronunciationGuide: string;
  definition: string;
  simpleExplanation: string;
  exampleSentence: string;
  synonyms: string[];
  antonyms: string[];
  category: string;
  commonMistake?: string;
  quickTip?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  suggestedPrompts?: string[];
  error?: boolean;
}

export interface SentenceEvaluation {
  verdict: 'correct' | 'partially_correct' | 'incorrect' | 'ambiguous' | 'empty';
  score: number;
  feedback: string;
  wordUsedCorrectly: boolean;
  grammarFeedback?: string;
  betterExpression?: string;
}

export interface DynamicQuiz {
  question: string;
  type: 'multiple-choice' | 'fill-in-the-blank' | 'synonym-match';
  options: string[];
  correctAnswer: string;
  explanation: string;
  targetWord: string;
}

export interface LearningProgress {
  selectedLevel: DifficultyLevel;
  streakDays: number;
  lastActiveDate: string;
  wordsEncounteredIds: string[];
  wordsLearnedIds: string[];
  quizAttempts: number;
  quizCorrect: number;
  revisionWordIds: string[];
  activityHistory: {
    date: string;
    action: string;
    details: string;
  }[];
}

export interface UserVoiceSettings {
  autoSpeak: boolean;
  rate: number; // 0.8 - 1.2
  pitch: number; // 0.8 - 1.2
  preferredVoiceURI: string;
}

export type MicState = 'idle' | 'requesting' | 'listening' | 'processing' | 'speaking' | 'error';
