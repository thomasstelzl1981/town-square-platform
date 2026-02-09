/**
 * useArmstrongVoiceBrowser — Browser-native Speech Recognition Fallback
 * 
 * Uses Web Speech API (webkitSpeechRecognition) as fallback when OpenAI
 * Realtime WebSocket is unavailable.
 * 
 * Features:
 * - German language support (de-DE)
 * - Continuous listening mode
 * - Interim results for live transcription
 * - Automatic error recovery
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// Type declarations for Web Speech API
interface SpeechRecognitionType extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognitionType, ev: Event) => any) | null;
  onend: ((this: SpeechRecognitionType, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognitionType, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognitionType, ev: SpeechRecognitionErrorEvent) => any) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionType;
}

// Extend Window interface for webkit prefix
declare global {
  interface Window {
    webkitSpeechRecognition: SpeechRecognitionConstructor;
    SpeechRecognition: SpeechRecognitionConstructor;
  }
}

interface BrowserVoiceState {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isBrowserFallback: true;
}

interface UseBrowserVoiceReturn extends BrowserVoiceState {
  startListening: () => void;
  stopListening: () => void;
  toggleVoice: () => void;
  resetTranscript: () => void;
}

export function useArmstrongVoiceBrowser(
  onFinalTranscript?: (text: string) => void
): UseBrowserVoiceReturn {
  const [state, setState] = useState<BrowserVoiceState>({
    isListening: false,
    isSupported: false,
    transcript: '',
    interimTranscript: '',
    error: null,
    isBrowserFallback: true,
  });

  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const isStoppingRef = useRef(false);

  // Check for browser support
  useEffect(() => {
    const SpeechRecognitionAPI = 
      window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognitionAPI) {
      setState(prev => ({ ...prev, isSupported: true }));
    } else {
      setState(prev => ({ 
        ...prev, 
        isSupported: false,
        error: 'Spracherkennung wird von diesem Browser nicht unterstützt'
      }));
    }
  }, []);

  // Initialize recognition instance
  const initRecognition = useCallback(() => {
    const SpeechRecognitionAPI = 
      window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) return null;

    const recognition = new SpeechRecognitionAPI();
    
    // Configure for German
    recognition.lang = 'de-DE';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('[BrowserVoice] Recognition started');
      isStoppingRef.current = false;
      setState(prev => ({ 
        ...prev, 
        isListening: true, 
        error: null,
        interimTranscript: ''
      }));
    };

    recognition.onend = () => {
      console.log('[BrowserVoice] Recognition ended');
      setState(prev => ({ ...prev, isListening: false }));
      
      // Auto-restart if not intentionally stopped
      if (!isStoppingRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // Already started, ignore
        }
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        setState(prev => {
          const newTranscript = prev.transcript + (prev.transcript ? ' ' : '') + final;
          return { 
            ...prev, 
            transcript: newTranscript,
            interimTranscript: ''
          };
        });
        
        // Callback with final transcript
        if (onFinalTranscript) {
          onFinalTranscript(final.trim());
        }
      }

      if (interim) {
        setState(prev => ({ ...prev, interimTranscript: interim }));
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('[BrowserVoice] Error:', event.error);
      
      let errorMessage = 'Spracherkennungsfehler';
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'Keine Sprache erkannt';
          break;
        case 'audio-capture':
          errorMessage = 'Mikrofon nicht verfügbar';
          break;
        case 'not-allowed':
          errorMessage = 'Mikrofonzugriff verweigert';
          break;
        case 'network':
          errorMessage = 'Netzwerkfehler';
          break;
        case 'aborted':
          // User stopped, not an error
          return;
      }

      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isListening: false
      }));
    };

    return recognition;
  }, [onFinalTranscript]);

  // Start listening
  const startListening = useCallback(() => {
    if (!state.isSupported) {
      setState(prev => ({ 
        ...prev, 
        error: 'Spracherkennung nicht unterstützt' 
      }));
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
    }

    // Create new instance
    const recognition = initRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;
    isStoppingRef.current = false;

    try {
      recognition.start();
    } catch (e) {
      console.error('[BrowserVoice] Start error:', e);
      setState(prev => ({ 
        ...prev, 
        error: 'Konnte Spracherkennung nicht starten' 
      }));
    }
  }, [state.isSupported, initRecognition]);

  // Stop listening
  const stopListening = useCallback(() => {
    isStoppingRef.current = true;
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Already stopped
      }
      recognitionRef.current = null;
    }

    setState(prev => ({ ...prev, isListening: false }));
  }, []);

  // Toggle
  const toggleVoice = useCallback(() => {
    if (state.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [state.isListening, startListening, stopListening]);

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      transcript: '', 
      interimTranscript: '' 
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        isStoppingRef.current = true;
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    toggleVoice,
    resetTranscript,
  };
}
