/**
 * useMeetingRecorder — Session lifecycle for Meeting Recorder Widget (WF-MEET-01)
 * 
 * States: idle → consent → recording → countdown → processing → ready
 * STT: ElevenLabs primary, Browser fallback (via useArmstrongVoice pattern)
 * 90-minute max + 3-minute countdown buffer
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type MeetingState = 'idle' | 'consent' | 'recording' | 'countdown' | 'processing' | 'ready';

interface MeetingSession {
  id: string;
  title: string;
  status: MeetingState;
  startedAt: string | null;
  durationSec: number;
  sttEngine: 'elevenlabs' | 'browser' | 'hybrid' | null;
  countdownSec: number;
  resultSessionId: string | null;
}

const MAX_DURATION_SEC = 90 * 60; // 90 minutes
const COUNTDOWN_SEC = 180; // 3 minutes

// Browser Speech API types
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

// ElevenLabs Scribe WebSocket connection (same pattern as useArmstrongVoice)
class MeetingScribeConnection {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  
  onCommit?: (text: string) => void;
  onError?: (error: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;

  async connect(token: string) {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    this.audioContext = new AudioContext({ sampleRate: 16000 });
    this.source = this.audioContext.createMediaStreamSource(this.stream);

    this.ws = new WebSocket(
      `wss://api.elevenlabs.io/v1/speech-to-text/stream?model_id=scribe_v2_realtime&token=${encodeURIComponent(token)}`
    );

    this.ws.onopen = () => {
      this.ws?.send(JSON.stringify({ type: 'configure', language_code: 'de', commit_strategy: 'vad' }));
      this.onConnect?.();
      this.startAudioCapture();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if ((data.type === 'committed_transcript' || data.type === 'committed_transcript_with_timestamps') && data.text) {
          this.onCommit?.(data.text);
        } else if (data.type === 'error') {
          this.onError?.(data.message || 'STT error');
        }
      } catch { /* ignore parse errors */ }
    };

    this.ws.onerror = () => this.onError?.('WebSocket connection failed');
    this.ws.onclose = () => this.onDisconnect?.();
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
      this.ws!.send(JSON.stringify({ type: 'audio', data: btoa(binary) }));
    };
    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }

  disconnect() {
    this.source?.disconnect();
    this.processor?.disconnect();
    this.stream?.getTracks().forEach(t => t.stop());
    if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.close();
    this.ws = null;
    this.audioContext?.close();
    this.audioContext = null;
    this.stream = null;
    this.source = null;
    this.processor = null;
  }
}

export function useMeetingRecorder() {
  const { user, activeTenantId: tenantId } = useAuth();
  const [session, setSession] = useState<MeetingSession>({
    id: '',
    title: 'Meeting',
    status: 'idle',
    startedAt: null,
    durationSec: 0,
    sttEngine: null,
    countdownSec: COUNTDOWN_SEC,
    resultSessionId: null,
  });

  const scribeRef = useRef<MeetingScribeConnection | null>(null);
  const browserRecRef = useRef<SpeechRecognitionType | null>(null);
  const chunkSeqRef = useRef(0);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const engineUsedRef = useRef<Set<string>>(new Set());

  // Duration timer
  useEffect(() => {
    if (session.status === 'recording') {
      durationTimerRef.current = setInterval(() => {
        setSession(prev => {
          const newDuration = prev.durationSec + 1;
          if (newDuration >= MAX_DURATION_SEC) {
            // Trigger countdown
            return { ...prev, durationSec: newDuration, status: 'countdown', countdownSec: COUNTDOWN_SEC };
          }
          return { ...prev, durationSec: newDuration };
        });
      }, 1000);
    } else {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    }
    return () => { if (durationTimerRef.current) clearInterval(durationTimerRef.current); };
  }, [session.status]);

  // Countdown timer
  useEffect(() => {
    if (session.status === 'countdown') {
      countdownTimerRef.current = setInterval(() => {
        setSession(prev => {
          const newCount = prev.countdownSec - 1;
          if (newCount <= 0) {
            return { ...prev, countdownSec: 0 };
          }
          return { ...prev, countdownSec: newCount };
        });
      }, 1000);
    } else {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    }
    return () => { if (countdownTimerRef.current) clearInterval(countdownTimerRef.current); };
  }, [session.status]);

  // Auto-stop when countdown reaches 0
  useEffect(() => {
    if (session.status === 'countdown' && session.countdownSec <= 0) {
      stopAndProcess();
    }
  }, [session.status, session.countdownSec]);

  // Save transcript chunk to DB
  const saveChunk = useCallback(async (sessionId: string, text: string, engine: string) => {
    if (!text.trim()) return;
    const seq = chunkSeqRef.current++;
    await supabase.from('meeting_transcript_chunks').insert({
      session_id: sessionId,
      seq,
      text: text.trim(),
      engine_source: engine,
    } as any);
  }, []);

  // Start browser STT fallback
  const startBrowserSTT = useCallback((sessionId: string) => {
    const SpeechAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechAPI) {
      toast.error('Spracherkennung wird von diesem Browser nicht unterstützt');
      return;
    }

    engineUsedRef.current.add('browser');
    const recognition = new SpeechAPI() as SpeechRecognitionType;
    recognition.lang = 'de-DE';
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          saveChunk(sessionId, event.results[i][0].transcript, 'browser');
        }
      }
    };

    recognition.onend = () => {
      // Auto-restart if still recording
      if (browserRecRef.current) {
        try { browserRecRef.current.start(); } catch { /* already started */ }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'aborted') {
        console.warn('[MeetingRecorder] Browser STT error:', event.error);
      }
    };

    browserRecRef.current = recognition;
    try { recognition.start(); } catch { /* ignore */ }

    setSession(prev => ({ ...prev, sttEngine: getEngineLabel() }));
  }, [saveChunk]);

  // Start ElevenLabs STT
  const startElevenLabsSTT = useCallback(async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('elevenlabs-scribe-token');
      if (error || !data?.token) throw new Error('Token failed');

      const scribe = new MeetingScribeConnection();
      scribeRef.current = scribe;
      engineUsedRef.current.add('elevenlabs');

      scribe.onCommit = (text) => saveChunk(sessionId, text, 'elevenlabs');
      scribe.onError = () => {
        console.warn('[MeetingRecorder] ElevenLabs error, switching to browser fallback');
        scribe.disconnect();
        scribeRef.current = null;
        startBrowserSTT(sessionId);
      };
      scribe.onDisconnect = () => {
        // If still recording, fallback to browser
        if (scribeRef.current) {
          scribeRef.current = null;
          startBrowserSTT(sessionId);
        }
      };

      await scribe.connect(data.token);
      setSession(prev => ({ ...prev, sttEngine: 'elevenlabs' }));
    } catch {
      console.warn('[MeetingRecorder] ElevenLabs failed, using browser fallback');
      startBrowserSTT(sessionId);
    }
  }, [saveChunk, startBrowserSTT]);

  const getEngineLabel = useCallback((): 'elevenlabs' | 'browser' | 'hybrid' => {
    if (engineUsedRef.current.size > 1) return 'hybrid';
    if (engineUsedRef.current.has('elevenlabs')) return 'elevenlabs';
    return 'browser';
  }, []);

  // Request consent
  const requestConsent = useCallback(() => {
    setSession(prev => ({ ...prev, status: 'consent' }));
  }, []);

  // Confirm consent and start recording
  const confirmConsentAndStart = useCallback(async (title?: string) => {
    if (!user || !tenantId) {
      toast.error('Bitte erst einloggen');
      return;
    }

    const meetingTitle = title || 'Meeting';
    const now = new Date().toISOString();

    // Create session in DB
    const { data, error } = await supabase.from('meeting_sessions').insert({
      tenant_id: tenantId,
      user_id: user.id,
      title: meetingTitle,
      started_at: now,
      consent_confirmed: true,
      status: 'recording',
    } as any).select('id').single();

    if (error || !data) {
      toast.error('Fehler beim Erstellen der Session');
      console.error('[MeetingRecorder] Session create error:', error);
      return;
    }

    chunkSeqRef.current = 0;
    engineUsedRef.current.clear();

    setSession({
      id: data.id,
      title: meetingTitle,
      status: 'recording',
      startedAt: now,
      durationSec: 0,
      sttEngine: null,
      countdownSec: COUNTDOWN_SEC,
      resultSessionId: null,
    });

    // Start STT
    await startElevenLabsSTT(data.id);
  }, [user, tenantId, startElevenLabsSTT]);

  // Trigger countdown (manual stop)
  const triggerCountdown = useCallback(() => {
    setSession(prev => ({ ...prev, status: 'countdown', countdownSec: COUNTDOWN_SEC }));
  }, []);

  // Resume recording from countdown
  const resumeRecording = useCallback(() => {
    setSession(prev => ({ ...prev, status: 'recording', countdownSec: COUNTDOWN_SEC }));
  }, []);

  // Stop STT and process
  const stopAndProcess = useCallback(async () => {
    // Stop all STT
    if (scribeRef.current) {
      scribeRef.current.disconnect();
      scribeRef.current = null;
    }
    if (browserRecRef.current) {
      try { browserRecRef.current.stop(); } catch { /* ignore */ }
      browserRecRef.current = null;
    }

    setSession(prev => ({ ...prev, status: 'processing' }));

    const sessionId = session.id;
    const engineLabel = getEngineLabel();

    // Update session in DB
    await supabase.from('meeting_sessions').update({
      ended_at: new Date().toISOString(),
      status: 'processing',
      total_duration_sec: session.durationSec,
      stt_engine_used: engineLabel,
    } as any).eq('id', sessionId);

    // Call summarize edge function
    try {
      const { data, error } = await supabase.functions.invoke('sot-meeting-summarize', {
        body: { session_id: sessionId },
      });

      if (error) throw error;

      // Update session status
      await supabase.from('meeting_sessions').update({
        status: 'ready',
      } as any).eq('id', sessionId);

      setSession(prev => ({ ...prev, status: 'ready', resultSessionId: sessionId }));
      toast.success('Meeting-Protokoll erstellt', {
        description: 'Die Zusammenfassung und Aufgaben wurden als Widget auf dem Dashboard abgelegt.',
      });
    } catch (e) {
      console.error('[MeetingRecorder] Summarize error:', e);
      toast.error('Fehler bei der Zusammenfassung');
      setSession(prev => ({ ...prev, status: 'idle' }));
    }
  }, [session.id, session.durationSec, getEngineLabel]);

  // Reset to idle
  const reset = useCallback(() => {
    setSession({
      id: '',
      title: 'Meeting',
      status: 'idle',
      startedAt: null,
      durationSec: 0,
      sttEngine: null,
      countdownSec: COUNTDOWN_SEC,
      resultSessionId: null,
    });
  }, []);

  // Update title
  const setTitle = useCallback((title: string) => {
    setSession(prev => ({ ...prev, title }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      scribeRef.current?.disconnect();
      try { browserRecRef.current?.stop(); } catch { /* ignore */ }
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  return {
    session,
    requestConsent,
    confirmConsentAndStart,
    triggerCountdown,
    resumeRecording,
    stopAndProcess,
    reset,
    setTitle,
  };
}
