import { useState, useEffect, useRef, useCallback } from 'react';

// Declare Web Speech API interfaces for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
  startListening: () => Promise<boolean>;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useSpeechRecognition(onFinalResult?: (result: string) => void): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isSupported = typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    if (!isSupported) {
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false; // Capture discrete sentence turns
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let finalStr = '';
      let interimStr = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalStr += item[0].transcript;
        } else {
          interimStr += item[0].transcript;
        }
      }

      if (interimStr) {
        setInterimTranscript(interimStr);
      }

      if (finalStr) {
        const cleaned = finalStr.trim();
        setTranscript(cleaned);
        setInterimTranscript('');
        if (onFinalResult) {
          onFinalResult(cleaned);
        }
      }
    };

    recognition.onerror = (event: any) => {
      let errorMsg = 'Speech recognition error.';
      switch (event.error) {
        case 'not-allowed':
          errorMsg = 'Microphone permission denied. Please allow microphone access in your browser settings to speak.';
          break;
        case 'no-speech':
          errorMsg = 'No speech detected. Please check your microphone and speak clearly.';
          break;
        case 'network':
          errorMsg = 'Network error during speech recognition. Please check your internet connection.';
          break;
        case 'audio-capture':
          errorMsg = 'No microphone device was detected on your computer.';
          break;
        case 'aborted':
          // User clicked stop or cancelled - not a real error
          return;
        default:
          errorMsg = `Voice error: ${event.error || 'Unable to recognize speech'}`;
      }
      setError(errorMsg);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore cleanup abort
        }
      }
    };
  }, [isSupported, onFinalResult]);

  const startListening = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Your browser does not support Web Speech Recognition. Please use Chrome, Edge, or Safari, or use text input.');
      return false;
    }

    // Check microphone permission explicitly via mediaDevices if available
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Close test stream immediately
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (permErr: any) {
      if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
        setError('Microphone permission was denied. Please grant microphone access in your browser address bar.');
        return false;
      }
    }

    try {
      setError(null);
      setTranscript('');
      setInterimTranscript('');
      recognitionRef.current?.start();
      return true;
    } catch (e: any) {
      // If recognition was already running, restart it
      try {
        recognitionRef.current?.stop();
        setTimeout(() => recognitionRef.current?.start(), 150);
        return true;
      } catch {
        setError('Could not start microphone. Please try again.');
        return false;
      }
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
    // If user manually stopped and there was interim speech captured, send it immediately
    if (interimTranscript && interimTranscript.trim() && onFinalResult) {
      const textToSend = interimTranscript.trim();
      setTranscript(textToSend);
      setInterimTranscript('');
      onFinalResult(textToSend);
    }
    setIsListening(false);
  }, [interimTranscript, onFinalResult]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
}
