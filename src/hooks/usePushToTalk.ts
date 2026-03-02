/**
 * usePushToTalk — Push-to-talk voice input with ElevenLabs Scribe
 * 
 * KEY FIX: getUserMedia is called SYNCHRONOUSLY in the pointerdown handler
 * to preserve the user-gesture context. The ElevenLabs token is fetched
 * in parallel, and audio streaming begins once both are ready.
 * 
 * Flow:
 * 1. pointerdown → getUserMedia() IMMEDIATELY (preserves gesture)
 * 2. In parallel: fetch ElevenLabs Scribe token
 * 3. Connect WebSocket with token + existing stream
 * 4. pointerup → disconnect, return final transcript
 * 
 * Falls back to Browser SpeechRecognition if ElevenLabs fails.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PushToTalkState {
  isRecording: boolean;
  isConnecting: boolean;
  transcript: string;
  partialTranscript: string;
  error: string | null;
  provider: 'elevenlabs' | 'browser' | null;
}

interface UsePushToTalkOptions {
  onTranscript?: (text: string) => void;
  onPartial?: (text: string) => void;
  language?: string;
}

interface UsePushToTalkReturn extends PushToTalkState {
  startRecording: () => void;
  stopRecording: () => string;
  cancelRecording: () => void;
}

// Browser Speech API type
interface SpeechRecognitionInstance extends EventTarget {
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

export function usePushToTalk(options: UsePushToTalkOptions = {}): UsePushToTalkReturn {
  const { onTranscript, onPartial, language = 'de' } = options;

  const [state, setState] = useState<PushToTalkState>({
    isRecording: false,
    isConnecting: false,
    transcript: '',
    partialTranscript: '',
    error: null,
    provider: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const browserRecRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef('');
  const isActiveRef = useRef(false);

  const cleanup = useCallback(() => {
    sourceRef.current?.disconnect();
    processorRef.current?.disconnect();
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.close();
    wsRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    streamRef.current = null;
    sourceRef.current = null;
    processorRef.current = null;

    try { browserRecRef.current?.abort(); } catch { /* ignore */ }
    browserRecRef.current = null;
  }, []);

  const startAudioCapture = useCallback((audioCtx: AudioContext, source: MediaStreamAudioSourceNode, ws: WebSocket) => {
    const processor = audioCtx.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess = (e) => {
      if (ws.readyState !== WebSocket.OPEN) return;
      const float32 = e.inputBuffer.getChannelData(0);
      const int16 = new Int16Array(float32.length);
      for (let i = 0; i < float32.length; i++) {
        const s = Math.max(-1, Math.min(1, float32[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      const bytes = new Uint8Array(int16.buffer);
      let binary = '';
      const chunk = 0x8000;
      for (let j = 0; j < bytes.length; j += chunk) {
        binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(j, Math.min(j + chunk, bytes.length))));
      }
      ws.send(JSON.stringify({ type: 'audio', data: btoa(binary) }));
    };
    source.connect(processor);
    processor.connect(audioCtx.destination);
    processorRef.current = processor;
  }, []);

  const startBrowserFallback = useCallback((stream: MediaStream) => {
    const SpeechAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechAPI) {
      setState(prev => ({ ...prev, error: 'Spracherkennung nicht unterstützt', isConnecting: false }));
      stream.getTracks().forEach(t => t.stop());
      return;
    }

    const rec = new SpeechAPI() as SpeechRecognitionInstance;
    rec.lang = language === 'de' ? 'de-DE' : language;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setState(prev => ({ ...prev, isRecording: true, isConnecting: false, provider: 'browser', error: null }));
    };

    rec.onresult = (event: SpeechRecognitionEvent) => {
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
        transcriptRef.current += (transcriptRef.current ? ' ' : '') + final;
        setState(prev => ({ ...prev, transcript: transcriptRef.current, partialTranscript: '' }));
        onTranscript?.(final);
      }
      if (interim) {
        setState(prev => ({ ...prev, partialTranscript: interim }));
        onPartial?.(interim);
      }
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'aborted') return;
      console.error('[PushToTalk] Browser STT error:', event.error);
      const messages: Record<string, string> = {
        'not-allowed': 'Mikrofonzugriff verweigert',
        'no-speech': 'Keine Sprache erkannt',
        'audio-capture': 'Mikrofon nicht verfügbar',
        'network': 'Netzwerkfehler',
      };
      setState(prev => ({
        ...prev,
        error: messages[event.error] || `Fehler: ${event.error}`,
        isRecording: false,
        isConnecting: false,
      }));
    };

    rec.onend = () => {
      // Don't auto-restart — this is push-to-talk
      if (isActiveRef.current) {
        setState(prev => ({ ...prev, isRecording: false }));
        isActiveRef.current = false;
      }
    };

    browserRecRef.current = rec;
    try {
      rec.start();
    } catch (e) {
      console.error('[PushToTalk] Browser start error:', e);
      setState(prev => ({ ...prev, error: 'Konnte Spracherkennung nicht starten', isConnecting: false }));
    }
  }, [language, onTranscript, onPartial]);

  /**
   * startRecording — MUST be called from a direct user gesture (pointerdown/click).
   * getUserMedia is called SYNCHRONOUSLY (first thing) to preserve gesture context.
   */
  const startRecording = useCallback(() => {
    if (isActiveRef.current) return;
    isActiveRef.current = true;
    transcriptRef.current = '';
    
    setState({
      isRecording: false,
      isConnecting: true,
      transcript: '',
      partialTranscript: '',
      error: null,
      provider: null,
    });

    // Check if mediaDevices is available
    if (!navigator.mediaDevices?.getUserMedia) {
      setState(prev => ({
        ...prev,
        error: 'Mikrofon nicht verfügbar (HTTPS erforderlich)',
        isConnecting: false,
      }));
      isActiveRef.current = false;
      return;
    }

    // CRITICAL: getUserMedia FIRST — synchronous in gesture context
    navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    }).then(async (stream) => {
      if (!isActiveRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      streamRef.current = stream;

      // Now try ElevenLabs (token fetch is async but stream is already authorized)
      try {
        const { data, error } = await supabase.functions.invoke('elevenlabs-scribe-token');
        if (error || !data?.token) throw new Error('Token-Abruf fehlgeschlagen');
        if (!isActiveRef.current) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        const audioCtx = new AudioContext({ sampleRate: 16000 });
        audioCtxRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        sourceRef.current = source;

        const ws = new WebSocket(
          `wss://api.elevenlabs.io/v1/speech-to-text/stream?model_id=scribe_v2_realtime&token=${encodeURIComponent(data.token)}`
        );
        wsRef.current = ws;

        ws.onopen = () => {
          ws.send(JSON.stringify({ type: 'configure', language_code: language, commit_strategy: 'vad' }));
          setState(prev => ({ ...prev, isRecording: true, isConnecting: false, provider: 'elevenlabs' }));
          startAudioCapture(audioCtx, source, ws);
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'partial_transcript' && msg.text) {
              setState(prev => ({ ...prev, partialTranscript: msg.text }));
              onPartial?.(msg.text);
            }
            if ((msg.type === 'committed_transcript' || msg.type === 'committed_transcript_with_timestamps') && msg.text) {
              transcriptRef.current += (transcriptRef.current ? ' ' : '') + msg.text;
              setState(prev => ({ ...prev, transcript: transcriptRef.current, partialTranscript: '' }));
              onTranscript?.(msg.text);
            }
          } catch { /* ignore parse errors */ }
        };

        ws.onerror = () => {
          console.warn('[PushToTalk] ElevenLabs WS error, falling back to browser');
          cleanup();
          startBrowserFallback(stream);
        };

        ws.onclose = () => {
          if (isActiveRef.current) {
            setState(prev => ({ ...prev, isRecording: false }));
            isActiveRef.current = false;
          }
        };
      } catch (e) {
        console.warn('[PushToTalk] ElevenLabs failed, falling back to browser:', e);
        // Stream is still alive — use browser fallback
        startBrowserFallback(stream);
      }
    }).catch((e) => {
      const err = e instanceof Error ? e : new Error(String(e));
      console.error('[PushToTalk] getUserMedia error:', err.name, err.message);
      
      const errorMessages: Record<string, string> = {
        NotAllowedError: 'Mikrofonzugriff verweigert — bitte in den Browser-Einstellungen erlauben',
        NotFoundError: 'Kein Mikrofon gefunden',
        NotReadableError: 'Mikrofon wird bereits verwendet',
        TypeError: 'Mikrofon nicht verfügbar (HTTPS erforderlich)',
      };

      setState(prev => ({
        ...prev,
        error: errorMessages[err.name] || `Mikrofonfehler: ${err.message}`,
        isConnecting: false,
      }));
      isActiveRef.current = false;
    });
  }, [language, onTranscript, onPartial, cleanup, startAudioCapture, startBrowserFallback]);

  const stopRecording = useCallback((): string => {
    isActiveRef.current = false;
    const finalTranscript = transcriptRef.current;
    cleanup();
    setState(prev => ({ ...prev, isRecording: false, isConnecting: false, partialTranscript: '' }));
    return finalTranscript;
  }, [cleanup]);

  const cancelRecording = useCallback(() => {
    isActiveRef.current = false;
    transcriptRef.current = '';
    cleanup();
    setState({
      isRecording: false,
      isConnecting: false,
      transcript: '',
      partialTranscript: '',
      error: null,
      provider: null,
    });
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  return {
    ...state,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
