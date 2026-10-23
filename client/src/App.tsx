import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar, TabType } from './components/Layout/Sidebar';
import { MobileNav } from './components/Layout/MobileNav';
import { Header } from './components/Layout/Header';
import { HomePage } from './pages/HomePage';
import { LearnPage } from './pages/LearnPage';
import { TutorPage } from './pages/TutorPage';
import { PractisePage } from './pages/PractisePage';
import { ProgressPage } from './pages/ProgressPage';
import { SettingsPage } from './pages/SettingsPage';
import { useLearningProgress } from './hooks/useLearningProgress';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { fetchWords, fetchHealth, fetchConfig, sendChatMessage, mapErrorToUserMessage, HealthResponse } from './services/api';
import { VocabularyWord, ChatMessage, MicState } from './types';

export const App: React.FC = () => {
  const {
    progress,
    voiceSettings,
    setLevel,
    recordWordEncountered,
    markWordLearned,
    recordQuizResult,
    resetProgress,
    updateVoiceSettings,
  } = useLearningProgress();

  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [allWords, setAllWords] = useState<VocabularyWord[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [activeTutorWord, setActiveTutorWord] = useState<VocabularyWord | null>(null);

  // Health and backend status
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);

  // Chat conversation messages
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([
    'Explain this word simply.',
    'Give me an everyday example.',
    'Can I use this word in a sentence?',
    'Quiz me on this word.',
  ]);

  // Voice Synthesis Hook
  const { isSpeaking, voices, speak, stop: stopSpeaking, isSupported: isTtsSupported } = useSpeechSynthesis(voiceSettings);
  const [currentlySpeakingText, setCurrentlySpeakingText] = useState<string | null>(null);

  // Load words when target proficiency level changes
  useEffect(() => {
    let isMounted = true;
    fetchWords(progress.selectedLevel)
      .then((words) => {
        if (!isMounted) return;
        setAllWords(words);
        if (words.length > 0) {
          recordWordEncountered(words[0].id, words[0].word);
          setActiveTutorWord((prev) => prev || words[0]);
        }
      })
      .catch((e) => console.error('Error fetching words:', e));

    return () => {
      isMounted = false;
    };
  }, [progress.selectedLevel, recordWordEncountered]);

  // Check health once on startup, or when requested in Settings
  const checkHealth = useCallback(async () => {
    try {
      const health = await fetchHealth();
      setHealthData(health);
    } catch (e) {
      console.warn('Backend health check error:', e);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  // Speak helper
  const handleSpeakText = useCallback(
    (text: string) => {
      setCurrentlySpeakingText(text);
      speak(text, () => {
        setCurrentlySpeakingText(null);
      });
    },
    [speak]
  );

  // Send message to Tutor API
  const handleSendMessage = useCallback(
    async (userText: string) => {
      if (!userText.trim()) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: userText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatMessages((prev) => [...prev, userMsg]);

      const currentWordToUse = activeTutorWord || allWords[currentWordIndex] || undefined;

      try {
        const historyForApi = chatMessages.slice(-8).map((m) => ({
          role: m.role,
          text: m.text,
        }));

        const response = await sendChatMessage({
          message: userText,
          level: progress.selectedLevel,
          currentWord: currentWordToUse,
          history: historyForApi,
        });

        const tutorMsg: ChatMessage = {
          id: `tutor-${Date.now()}`,
          role: 'model',
          text: response.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setChatMessages((prev) => [...prev, tutorMsg]);

        if (response.suggestedPrompts && response.suggestedPrompts.length > 0) {
          setSuggestedPrompts(response.suggestedPrompts);
        }

        if (response.activeWord) {
          setActiveTutorWord(response.activeWord);
          recordWordEncountered(response.activeWord.id, response.activeWord.word);
          const matchingIndex = allWords.findIndex((w) => w.word.toLowerCase() === response.activeWord.word.toLowerCase());
          if (matchingIndex !== -1) { setCurrentWordIndex(matchingIndex); } else { setAllWords((prev) => [...prev, response.activeWord]); }
        }

        // Auto read aloud if enabled
        if (voiceSettings.autoSpeak) {
          handleSpeakText(response.reply);
        }
      } catch (err: any) {
        console.error('Chat error:', err);
        const mapped = mapErrorToUserMessage(err);
        const errorMsg: ChatMessage = {
          id: `tutor-err-${Date.now()}`,
          role: 'model',
          text: mapped.message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          error: true,
          retryable: mapped.retryable,
          errorCode: mapped.code,
        };
        setChatMessages((prev) => [...prev, errorMsg]);
      }
    },
    [
      chatMessages,
      activeTutorWord,
      allWords,
      currentWordIndex,
      progress.selectedLevel,
      recordWordEncountered,
      voiceSettings.autoSpeak,
      handleSpeakText,
    ]
  );

  // Retry last attempted user message
  const handleRetryLastMessage = useCallback(() => {
    for (let i = chatMessages.length - 1; i >= 0; i--) {
      if (chatMessages[i].role === 'user') {
        const textToRetry = chatMessages[i].text;
        setChatMessages((prev) => prev.filter((m) => !m.error));
        handleSendMessage(textToRetry);
        break;
      }
    }
  }, [chatMessages, handleSendMessage]);
  // Web Speech Recognition Hook
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  const handleVoiceFinalResult = useCallback(
    async (finalTranscript: string) => {
      if (!finalTranscript.trim()) return;
      setIsProcessingVoice(true);
      try {
        await handleSendMessage(finalTranscript);
      } finally {
        setIsProcessingVoice(false);
      }
    },
    [handleSendMessage]
  );

  const {
    isListening,
    transcript,
    interimTranscript,
    error: speechError,
    isSupported: isSpeechSupported,
    startListening,
    stopListening,
  } = useSpeechRecognition(handleVoiceFinalResult);

  // Compute 6-state Mic Button State
  let micState: MicState = 'idle';
  if (isListening) {
    micState = 'listening';
  } else if (isProcessingVoice) {
    micState = 'processing';
  } else if (isSpeaking) {
    micState = 'speaking';
  } else if (speechError) {
    micState = 'error';
  }

  const handleMicClick = async () => {
    if (isListening) {
      stopListening();
    } else {
      stopSpeaking();
      await startListening();
    }
  };

  // Initial welcome greeting from tutor when app boots
  const initialGreetingDone = useRef(false);
  useEffect(() => {
    if (allWords.length > 0 && !initialGreetingDone.current) {
      initialGreetingDone.current = true;
      const initialWord = allWords[0];
      const welcomeText = `Hello! I'm Voicio, your personal AI voice vocabulary tutor. Today we are practicing at the ${progress.selectedLevel} level. Our featured word is "${initialWord.word}" — which means ${initialWord.definition}. Would you like to practice using "${initialWord.word}" in a sentence, or should I give you another example?`;

      setChatMessages([
        {
          id: 'welcome-tutor-1',
          role: 'model',
          text: welcomeText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [allWords, progress.selectedLevel]);

  // Action handlers
  const handleSelectWordForTutor = (word: VocabularyWord) => {
    setActiveTutorWord(word);
    recordWordEncountered(word.id, word.word);
    // Find index in current words list
    const idx = allWords.findIndex((w) => w.id === word.id);
    if (idx !== -1) setCurrentWordIndex(idx);
    setCurrentTab('tutor');

    // Add a contextual starter message from tutor
    const introMsg = `Let's practice the word "${word.word}" (${word.partOfSpeech})! It means: "${word.definition}". Say it out loud: "${word.pronunciationGuide}". Try making a sentence with it!`;
    setChatMessages((prev) => [
      ...prev,
      {
        id: `tutor-switch-${Date.now()}`,
        role: 'model',
        text: introMsg,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    if (voiceSettings.autoSpeak) {
      handleSpeakText(introMsg);
    }
  };

  const handleSelectWordIndex = (index: number) => {
    setCurrentWordIndex(index);
    const word = allWords[index];
    if (word) {
      setActiveTutorWord(word);
      recordWordEncountered(word.id, word.word);
    }
  };

  const currentWord = activeTutorWord || allWords[currentWordIndex] || allWords[0] || null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      {/* Desktop Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        selectedLevel={progress.selectedLevel}
        onSelectLevel={setLevel}
        streakDays={progress.streakDays}
        wordsLearnedCount={progress.wordsLearnedIds.length}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header
          currentTab={currentTab}
          selectedLevel={progress.selectedLevel}
          autoSpeak={voiceSettings.autoSpeak}
          onToggleAutoSpeak={() => updateVoiceSettings({ autoSpeak: !voiceSettings.autoSpeak })}
          isGeminiConnected={Boolean(healthData?.gemini.connected)}
          onOpenSettings={() => setCurrentTab('settings')}
        />

        <main
          className={`flex-1 min-h-0 flex flex-col overflow-y-auto ${
            currentTab === 'tutor'
              ? 'p-2.5 sm:p-3 md:p-4 lg:p-6'
              : 'p-4 md:p-8'
          }`}
        >
          {currentTab === 'home' && (
            <HomePage
              todayWord={currentWord}
              selectedLevel={progress.selectedLevel}
              progress={progress}
              onNavigate={setCurrentTab}
              onSelectWordForTutor={handleSelectWordForTutor}
              onSpeak={handleSpeakText}
            />
          )}

          {currentTab === 'learn' && (
            <LearnPage
              words={allWords}
              currentWordIndex={currentWordIndex}
              onSelectWordIndex={handleSelectWordIndex}
              learnedWordIds={progress.wordsLearnedIds}
              onToggleLearned={markWordLearned}
              onAskTutor={handleSelectWordForTutor}
              onSpeak={handleSpeakText}
            />
          )}

          {currentTab === 'tutor' && currentWord && (
            <TutorPage
              currentWord={currentWord}
              level={progress.selectedLevel}
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              micState={micState}
              onMicClick={handleMicClick}
              onStopSpeaking={stopSpeaking}
              interimTranscript={interimTranscript}
              speechError={speechError}
              isSpeechSupported={isSpeechSupported}
              onSpeak={handleSpeakText}
              currentlySpeakingText={currentlySpeakingText}
              activeModel={healthData?.gemini.model || 'gemini-2.5-flash'}
              isGeminiConfigured={Boolean(healthData?.gemini.configured)}
              suggestedPrompts={suggestedPrompts}
              onChangeWord={handleSelectWordForTutor}
              allWords={allWords}
              onRetryLastMessage={handleRetryLastMessage}
            />
          )}

          {currentTab === 'practise' && currentWord && (
            <PractisePage
              currentWord={currentWord}
              level={progress.selectedLevel}
              onRecordResult={recordQuizResult}
              onSpeak={handleSpeakText}
              allWords={allWords}
            />
          )}

          {currentTab === 'progress' && (
            <ProgressPage
              progress={progress}
              allWords={allWords}
              onResetProgress={resetProgress}
              onPracticeWord={handleSelectWordForTutor}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsPage
              selectedLevel={progress.selectedLevel}
              onSelectLevel={setLevel}
              voiceSettings={voiceSettings}
              onUpdateVoiceSettings={updateVoiceSettings}
              voices={voices}
              onTestVoice={() =>
                handleSpeakText(
                  'Voicio speech check: Learn words, speak confidently with your AI vocabulary tutor.'
                )
              }
              healthData={healthData}
              onRefreshHealth={checkHealth}
              onResetProgress={resetProgress}
              isSpeechRecognitionSupported={isSpeechSupported}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav currentTab={currentTab} onSelectTab={setCurrentTab} />
    </div>
  );
};

export default App;
