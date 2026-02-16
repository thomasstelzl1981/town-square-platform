/**
 * DictationButton — Reusable voice dictation for any text field
 * 
 * Uses ElevenLabs Scribe v2 Realtime (primary) with Browser Speech API fallback.
 * Drop next to any Textarea/Input for instant voice-to-text.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface DictationButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
  size?: 'sm' | 'md';
}

// Browser Speech API types
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onstart: ((ev: Event) => void) | null;
  onend: ((ev: Event) => void) | null;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null;
}

export function DictationButton({ onTranscript, className, size = 'sm' }: DictationButtonProps) {
  const [isActive, setIsActive] = useState(false);
  const [provider, setProvider] = useState<'elevenlabs' | 'browser' | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const browserRecRef = useRef<SpeechRecognitionInstance | null>(null);
  const isStoppingRef = useRef(false);

  const cleanup = useCallback(() => {
    sourceRef.current?.disconnect();
    processorRef.current?.disconnect();
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.close();
    wsRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    streamRef.current = null;
    sourceRef.current = null;
    processorRef.current = null;

    isStoppingRef.current = true;
    try { browserRecRef.current?.stop(); } catch { /* ignore */ }
    browserRecRef.current = null;
  }, []);

  const startBrowserFallback = useCallback(() => {
    const SpeechAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechAPI) return;

    setProvider('browser');
    const rec = new SpeechAPI() as SpeechRecognitionInstance;
    rec.lang = 'de-DE';
    rec.continuous = true;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => { isStoppingRef.current = false; setIsActive(true); };
    rec.onend = () => {
      if (!isStoppingRef.current && browserRecRef.current) {
        try { browserRecRef.current.start(); } catch { /* ignore */ }
        return;
      }
      setIsActive(false);
    };
    rec.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          onTranscript(event.results[i][0].transcript);
        }
      }
    };
    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'aborted') return;
      console.error('[Dictation] Browser error:', event.error);
      setIsActive(false);
    };

    browserRecRef.current = rec;
    isStoppingRef.current = false;
    try { rec.start(); } catch { /* ignore */ }
  }, [onTranscript]);

  const startElevenLabs = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('elevenlabs-scribe-token');
      if (error || !data?.token) throw new Error('No token');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      const audioCtx = new AudioContext({ sampleRate: 16000 });
      audioCtxRef.current = audioCtx;
      sourceRef.current = audioCtx.createMediaStreamSource(stream);

      const ws = new WebSocket(
        `wss://api.elevenlabs.io/v1/speech-to-text/stream?model_id=scribe_v2_realtime&token=${encodeURIComponent(data.token)}`
      );
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'configure', language_code: 'de', commit_strategy: 'vad' }));
        setProvider('elevenlabs');
        setIsActive(true);

        // Start audio capture
        const proc = audioCtx.createScriptProcessor(4096, 1, 1);
        proc.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return;
          const f32 = e.inputBuffer.getChannelData(0);
          const i16 = new Int16Array(f32.length);
          for (let i = 0; i < f32.length; i++) {
            const s = Math.max(-1, Math.min(1, f32[i]));
            i16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }
          const bytes = new Uint8Array(i16.buffer);
          let binary = '';
          const chunk = 0x8000;
          for (let j = 0; j < bytes.length; j += chunk) {
            binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(j, Math.min(j + chunk, bytes.length))));
          }
          ws.send(JSON.stringify({ type: 'audio', data: btoa(binary) }));
        };
        sourceRef.current!.connect(proc);
        proc.connect(audioCtx.destination);
        processorRef.current = proc;
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'committed_transcript' || msg.type === 'committed_transcript_with_timestamps') {
            if (msg.text) onTranscript(msg.text);
          }
        } catch { /* ignore */ }
      };

      ws.onerror = () => { throw new Error('WS failed'); };
      ws.onclose = () => { setIsActive(false); };
    } catch (e) {
      console.warn('[Dictation] ElevenLabs failed, falling back to browser:', e);
      cleanup();
      startBrowserFallback();
    }
  }, [onTranscript, cleanup, startBrowserFallback]);

  const toggle = useCallback(async () => {
    if (isActive) {
      cleanup();
      setIsActive(false);
      setProvider(null);
    } else {
      await startElevenLabs();
    }
  }, [isActive, startElevenLabs, cleanup]);

  // Cleanup on unmount
  useEffect(() => () => cleanup(), [cleanup]);

  const sizeClass = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8';
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              'relative rounded-full p-0 transition-all duration-300',
              sizeClass,
              isActive && 'bg-primary hover:bg-primary/90',
              className
            )}
            onClick={toggle}
          >
            {isActive && (
              <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" style={{ animationDuration: '1.5s' }} />
            )}
            <span className="relative z-10 flex items-center justify-center">
              <Mic className={cn(iconSize, isActive ? 'text-white' : 'text-muted-foreground')} />
            </span>
            {isActive && provider === 'browser' && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" title="Browser-Modus" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {isActive
            ? `Diktat aktiv${provider === 'browser' ? ' (Browser)' : ' (ElevenLabs)'} — Klicken zum Beenden`
            : 'Spracheingabe starten'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
