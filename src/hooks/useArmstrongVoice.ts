/**
 * useArmstrongVoice — Browser SpeechRecognition STT + ElevenLabs TTS
 * 
 * STT: Browser SpeechRecognition API (de-DE) — stable, no external dependencies
 * TTS: ElevenLabs via edge function
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const VOICE_PROVIDER: 'elevenlabs' | 'browser' = 'browser';

interface VoiceState {
  isConnected: boolean;
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  error: string | null;
  transcript: string;
  assistantTranscript: string;
  useBrowserFallback: boolean;
}

interface UseArmstrongVoiceReturn extends VoiceState {
  startListening: () => Promise<void>;
  stopListening: () => void;
  toggleVoice: () => void;
  disconnect: () => void;
  speakResponse: (text: string) => Promise<void>;
  stopSpeaking: () => void;
}

// ─── Browser Speech API types ───
interface SpeechRecognitionType extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((ev: Event) => void) | null;
  onend: ((ev: Event) => void) | null;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null;
}

declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognitionType;
    SpeechRecognition: new () => SpeechRecognitionType;
  }
}

// ─── ElevenLabs WebSocket STT ───
class ElevenLabsScribeConnection {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  
  onPartial?: (text: string) => void;
  onCommit?: (text: string) => void;
  onError?: (error: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;

  async connect(token: string, existingStream?: MediaStream) {
    try {
      this.stream = existingStream || await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });

      this.audioContext = new AudioContext({ sampleRate: 16000 });
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      
      this.ws = new WebSocket(
        `wss://api.elevenlabs.io/v1/speech-to-text/stream?model_id=scribe_v2_realtime&token=${encodeURIComponent(token)}`
      );

      this.ws.onopen = () => {
        console.log('[ElevenLabs STT] Connected');
        this.ws?.send(JSON.stringify({
          type: 'configure',
          language_code: 'de',
          commit_strategy: 'vad',
        }));
        this.onConnect?.();
        this.startAudioCapture();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          switch (data.type) {
            case 'partial_transcript':
              if (data.text) this.onPartial?.(data.text);
              break;
            case 'committed_transcript':
            case 'committed_transcript_with_timestamps':
              if (data.text) this.onCommit?.(data.text);
              break;
            case 'error':
              console.error('[ElevenLabs STT] Error:', data);
              this.onError?.(data.message || 'STT error');
              break;
          }
        } catch (e) {
          console.error('[ElevenLabs STT] Parse error:', e);
        }
      };

      this.ws.onerror = () => {
        this.onError?.('WebSocket connection failed');
      };

      this.ws.onclose = () => {
        console.log('[ElevenLabs STT] Disconnected');
        this.onDisconnect?.();
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Connection failed';
      this.onError?.(msg);
      throw e;
    }
  }

  private startAudioCapture() {
    if (!this.audioContext || !this.source) return;
    
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    this.processor.onaudioprocess = (e) => {
      if (this.ws?.readyState !== WebSocket.OPEN) return;
      const float32 = e.inputBuffer.getChannelData(0);
      const int16 = new Int16Array(float32.length);
      for (let i = 0; i < float32.length; i++) {
        const s = Math.max(-1, Math.min(1, float32[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      const bytes = new Uint8Array(int16.buffer);
      let binary = '';
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, Math.min(i + chunk, bytes.length))));
      }
      this.ws.send(JSON.stringify({ type: 'audio', data: btoa(binary) }));
    };
    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }

  disconnect() {
    this.source?.disconnect();
    this.processor?.disconnect();
    this.stream?.getTracks().forEach(t => t.stop());
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
    this.ws = null;
    this.audioContext?.close();
    this.audioContext = null;
    this.stream = null;
    this.source = null;
    this.processor = null;
  }
}

export function useArmstrongVoice(): UseArmstrongVoiceReturn {
  const [state, setState] = useState<VoiceState>({
    isConnected: false,
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    error: null,
    transcript: '',
    assistantTranscript: '',
    useBrowserFallback: false,
  });

  const scribeRef = useRef<ElevenLabsScribeConnection | null>(null);
  const browserRecRef = useRef<SpeechRecognitionType | null>(null);
  const isStoppingRef = useRef(false);
  const providerRef = useRef<'elevenlabs' | 'browser'>('elevenlabs');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  // ── Browser Speech API start (defined FIRST so startElevenLabs can reference it) ──
  const startBrowser = useCallback(() => {
    const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechAPI) {
      setState(prev => ({
        ...prev,
        error: 'Spracherkennung wird von diesem Browser nicht unterstützt',
        isProcessing: false,
      }));
      return;
    }

    providerRef.current = 'browser';
    const recognition = new SpeechAPI();
    recognition.lang = 'de-DE';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isStoppingRef.current = false;
      setState(prev => ({
        ...prev,
        isConnected: true,
        isListening: true,
        isProcessing: false,
        useBrowserFallback: true,
        error: null,
        transcript: '',
      }));
    };

    recognition.onend = () => {
      if (!isStoppingRef.current && browserRecRef.current) {
        try { browserRecRef.current.start(); } catch { /* already started */ }
        return;
      }
      setState(prev => ({ ...prev, isListening: false, isConnected: false }));
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      if (final) {
        setState(prev => ({
          ...prev,
          transcript: prev.transcript + (prev.transcript ? ' ' : '') + final,
          assistantTranscript: '',
        }));
      }
      if (interim) {
        setState(prev => ({ ...prev, assistantTranscript: interim }));
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'aborted') return;
      const messages: Record<string, string> = {
        'no-speech': 'Keine Sprache erkannt',
        'audio-capture': 'Mikrofon nicht verfügbar',
        'not-allowed': 'Mikrofonzugriff verweigert',
        'network': 'Netzwerkfehler',
      };
      setState(prev => ({
        ...prev,
        error: messages[event.error] || 'Spracherkennungsfehler',
        isListening: false,
      }));
    };

    browserRecRef.current = recognition;
    isStoppingRef.current = false;
    try {
      recognition.start();
    } catch {
      setState(prev => ({ ...prev, error: 'Konnte Spracherkennung nicht starten' }));
    }
  }, []);

  // ── ElevenLabs start (references startBrowser for fallback) ──
  const startElevenLabs = useCallback(async (stream: MediaStream) => {
    try {
      setState(prev => ({ ...prev, error: null, isProcessing: true }));
      
      const { data, error } = await supabase.functions.invoke('elevenlabs-scribe-token');
      if (error || !data?.token) {
        throw new Error('Token-Abruf fehlgeschlagen — Fallback auf Browser');
      }

      const scribe = new ElevenLabsScribeConnection();
      scribeRef.current = scribe;
      providerRef.current = 'elevenlabs';

      scribe.onConnect = () => {
        setState(prev => ({
          ...prev,
          isConnected: true,
          isListening: true,
          isProcessing: false,
          useBrowserFallback: false,
          transcript: '',
        }));
      };

      scribe.onPartial = (text) => {
        setState(prev => ({ ...prev, assistantTranscript: text }));
      };

      scribe.onCommit = (text) => {
        setState(prev => ({
          ...prev,
          transcript: prev.transcript + (prev.transcript ? ' ' : '') + text,
          assistantTranscript: '',
        }));
      };

      scribe.onError = (err) => {
        console.error('[Voice] ElevenLabs error:', err);
        setState(prev => ({ ...prev, error: err }));
      };

      scribe.onDisconnect = () => {
        setState(prev => ({ ...prev, isConnected: false, isListening: false }));
      };

      await scribe.connect(data.token, stream);
    } catch (e) {
      console.warn('[Voice] ElevenLabs failed, falling back to browser:', e);
      // Stream is already authorized, browser fallback will work
      startBrowser();
    }
  }, [startBrowser]);

  // ── Public API ──
  const startListening = useCallback(async () => {
    setState(prev => ({ ...prev, error: null }));

    // Check mediaDevices availability (fails in non-secure contexts / restrictive iframes)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('[Voice] navigator.mediaDevices not available');
      setState(prev => ({
        ...prev,
        error: 'Mikrofon in diesem Kontext nicht verfügbar (HTTPS erforderlich)',
        isProcessing: false,
      }));
      return;
    }

    // Pre-check permission state if Permissions API is available
    try {
      const permResult = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      if (permResult.state === 'denied') {
        setState(prev => ({
          ...prev,
          error: 'Mikrofon ist dauerhaft blockiert. Bitte in den Browser-Einstellungen für diese Seite erlauben und Seite neu laden.',
          isProcessing: false,
        }));
        return;
      }
    } catch {
      // permissions.query not supported — continue with getUserMedia
    }

    // Request microphone IMMEDIATELY in user gesture context
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      console.error('[Voice] getUserMedia error:', {
        name: err.name,
        message: err.message,
        error: e,
      });

      const errorMessages: Record<string, string> = {
        NotAllowedError: 'Mikrofonzugriff verweigert — bitte in den Browser-Einstellungen erlauben',
        NotFoundError: 'Kein Mikrofon gefunden — bitte ein Mikrofon anschließen',
        NotReadableError: 'Mikrofon wird bereits verwendet — bitte andere Tabs schließen',
        OverconstrainedError: 'Mikrofon-Einstellungen nicht unterstützt',
        TypeError: 'Mikrofon in diesem Kontext nicht verfügbar (HTTPS erforderlich)',
      };

      setState(prev => ({
        ...prev,
        error: errorMessages[err.name] || `Mikrofonfehler: ${err.message}`,
        isProcessing: false,
      }));
      return;
    }

    // With mic authorized, proceed to provider
    if (VOICE_PROVIDER === 'elevenlabs') {
      await startElevenLabs(stream);
    } else {
      // Release the stream — browser SpeechRecognition manages its own audio
      stream.getTracks().forEach(t => t.stop());
      startBrowser();
    }
  }, [startElevenLabs, startBrowser]);

  const stopListening = useCallback(() => {
    isStoppingRef.current = true;
    if (providerRef.current === 'elevenlabs' && scribeRef.current) {
      scribeRef.current.disconnect();
      scribeRef.current = null;
    }
    if (browserRecRef.current) {
      try { browserRecRef.current.stop(); } catch { /* ignore */ }
      browserRecRef.current = null;
    }
    setState(prev => ({ ...prev, isListening: false, isConnected: false, assistantTranscript: '' }));
  }, []);

  const disconnect = useCallback(() => {
    stopListening();
  }, [stopListening]);

  const toggleVoice = useCallback(() => {
    if (state.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [state.isListening, startListening, stopListening]);

  // ── TTS: speakResponse ──
  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setState(prev => ({ ...prev, isSpeaking: false }));
  }, []);

  const speakResponse = useCallback(async (text: string) => {
    if (!text.trim()) return;
    
    const cleanText = text
      .replace(/#{1,6}\s?/g, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[-*+]\s/g, '')
      .replace(/>\s/g, '')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .trim();
    
    if (!cleanText) return;

    stopSpeaking();
    
    setState(prev => ({ ...prev, isSpeaking: true }));
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: cleanText }),
        }
      );

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setState(prev => ({ ...prev, isSpeaking: false }));
        URL.revokeObjectURL(audioUrl);
        audioUrlRef.current = null;
        audioRef.current = null;
      };
      
      audio.onerror = () => {
        console.error('[Voice] TTS playback error');
        setState(prev => ({ ...prev, isSpeaking: false }));
        URL.revokeObjectURL(audioUrl);
        audioUrlRef.current = null;
        audioRef.current = null;
      };
      
      await audio.play();
    } catch (e) {
      console.error('[Voice] TTS error:', e);
      setState(prev => ({ ...prev, isSpeaking: false }));
    }
  }, [stopSpeaking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      scribeRef.current?.disconnect();
      isStoppingRef.current = true;
      try { browserRecRef.current?.stop(); } catch { /* ignore */ }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    toggleVoice,
    disconnect,
    speakResponse,
    stopSpeaking,
  };
}
