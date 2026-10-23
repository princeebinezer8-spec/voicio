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
  const hasDispatchedRef = useRef<boolean>(false);
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
        if (cleaned && onFinalResult && !hasDispatchedRef.current) {
          hasDispatchedRef.current = true;
          onFinalResult(cleaned);
        }
      }
    };

    recognition.onerror = (event: any) => {
      let errorMsg = 'Something went wrong. Please try again.';
      switch (event.error) {
        case 'not-allowed':
        case 'service-not-allowed':
          errorMsg = "We couldn't access your microphone. Please check your browser permissions and try again.";
          break;
        case 'no-speech':
          errorMsg = 'No speech was detected. Please check your microphone and speak clearly.';
          break;
        case 'network':
          errorMsg = "We're having trouble connecting. Check your internet connection and try again.";
          break;
        case 'audio-capture':
          errorMsg = 'No microphone device was detected on your computer.';
          break;
        case 'aborted':
          // User clicked stop or cancelled - not a real error
          return;
        default:
          errorMsg = 'Something went wrong. Please try again.';
      }
      setError(errorMsg);
      setIsListening(false);
      hasDispatchedRef.current = false;
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch {
        // ignore
      }
    };
  }, [isSupported, onFinalResult]);

  const startListening = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser. You can type freely instead!');
      return false;
    }

    hasDispatchedRef.current = false;

    // Check mediaDevices permission proactively if supported
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch (permErr: any) {
      if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
        setError("We couldn't access your microphone. Please check your browser permissions and try again.");
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
      try {
        recognitionRef.current?.stop();
        setTimeout(() => recognitionRef.current?.start(), 150);
        return true;
      } catch {
        setError('Something went wrong. Please try again.');
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

    if (interimTranscript && interimTranscript.trim() && onFinalResult && !hasDispatchedRef.current) {
      const textToSend = interimTranscript.trim();
      hasDispatchedRef.current = true;
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
    hasDispatchedRef.current = false;
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
