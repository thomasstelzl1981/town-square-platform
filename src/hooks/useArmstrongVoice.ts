/**
 * useArmstrongVoice — Push-to-Talk STT + ElevenLabs TTS
 * 
 * STT: usePushToTalk hook (ElevenLabs Scribe primary, Browser fallback)
 * TTS: ElevenLabs via edge function with browser fallback
 * 
 * The push-to-talk model ensures getUserMedia is called synchronously
 * in the user gesture context, preventing "Permission Denied" errors.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePushToTalk } from './usePushToTalk';

interface VoiceState {
  isConnected: boolean;
  isListening: boolean;
  isRecording: boolean;
  isConnecting: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  error: string | null;
  transcript: string;
  assistantTranscript: string;
  useBrowserFallback: boolean;
}

interface UseArmstrongVoiceReturn extends VoiceState {
  startListening: () => void;
  stopListening: () => string;
  toggleVoice: () => void;
  disconnect: () => void;
  speakResponse: (text: string) => Promise<void>;
  stopSpeaking: () => void;
}

export function useArmstrongVoice(): UseArmstrongVoiceReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const ptt = usePushToTalk({
    language: 'de',
  });

  // ── TTS ──
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
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  const speakWithBrowser = useCallback((text: string) => {
    if (!window.speechSynthesis) {
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const germanVoice = voices.find(v => v.lang === 'de-DE' && v.localService) 
      || voices.find(v => v.lang === 'de-DE')
      || voices.find(v => v.lang.startsWith('de'));
    if (germanVoice) utterance.voice = germanVoice;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
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
    setIsSpeaking(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({ text: cleanText }),
        }
      );

      if (!response.ok) {
        speakWithBrowser(cleanText);
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        audioUrlRef.current = null;
        audioRef.current = null;
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        audioUrlRef.current = null;
        audioRef.current = null;
        speakWithBrowser(cleanText);
      };
      
      await audio.play();
    } catch {
      speakWithBrowser(cleanText);
    }
  }, [stopSpeaking, speakWithBrowser]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
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

  // Map to legacy interface for backward compatibility
  const startListening = ptt.startRecording;
  const stopListening = ptt.stopRecording;
  
  const toggleVoice = useCallback(() => {
    if (ptt.isRecording) {
      ptt.stopRecording();
    } else {
      ptt.startRecording();
    }
  }, [ptt]);

  const disconnect = useCallback(() => {
    ptt.cancelRecording();
  }, [ptt]);

  return {
    isConnected: ptt.isRecording,
    isListening: ptt.isRecording,
    isRecording: ptt.isRecording,
    isConnecting: ptt.isConnecting,
    isProcessing: ptt.isConnecting,
    isSpeaking,
    error: ptt.error,
    transcript: ptt.transcript,
    assistantTranscript: ptt.partialTranscript,
    useBrowserFallback: ptt.provider === 'browser',
    startListening,
    stopListening,
    toggleVoice,
    disconnect,
    speakResponse,
    stopSpeaking,
  };
}
