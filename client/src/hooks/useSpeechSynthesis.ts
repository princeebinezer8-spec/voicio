import { useState, useEffect, useCallback, useRef } from 'react';
import { UserVoiceSettings } from '../types';

export interface UseSpeechSynthesisReturn {
  isSpeaking: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  speak: (text: string, onEnd?: () => void) => void;
  stop: () => void;
}

export function useSpeechSynthesis(settings: UserVoiceSettings): UseSpeechSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      // Filter for English voices or all if none
      const englishVoices = allVoices.filter(v => v.lang.startsWith('en'));
      setVoices(englishVoices.length > 0 ? englishVoices : allVoices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
    setIsSpeaking(false);
  }, [isSupported]);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!isSupported || !text) {
      if (onEnd) onEnd();
      return;
    }

    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      // Clean markdown asterisks and backticks from text for cleaner pronunciation
      const cleaned = text
        .replace(/[*_#`~]/g, '')
        .replace(/\n+/g, ' ')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleaned);
      currentUtteranceRef.current = utterance;

      utterance.rate = settings.rate || 1.0;
      utterance.pitch = settings.pitch || 1.0;

      // Select voice if preferred URI provided or pick a great English voice
      if (settings.preferredVoiceURI) {
        const found = voices.find(v => v.voiceURI === settings.preferredVoiceURI);
        if (found) utterance.voice = found;
      } else {
        // Look for pleasant standard natural voices
        const preferred = voices.find(
          v => v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')
        );
        if (preferred) utterance.voice = preferred;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        setIsSpeaking(false);
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech error:', err);
      setIsSpeaking(false);
      if (onEnd) onEnd();
    }
  }, [isSupported, settings, voices]);

  return {
    isSpeaking,
    isSupported,
    voices,
    speak,
    stop,
  };
}
