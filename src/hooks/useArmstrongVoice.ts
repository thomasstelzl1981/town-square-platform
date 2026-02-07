/**
 * useArmstrongVoice — WebSocket-based voice interaction with Armstrong
 * 
 * Handles:
 * - Microphone capture (PCM16 @ 24kHz)
 * - WebSocket connection to sot-armstrong-voice
 * - Audio playback of responses
 * - VAD-based turn detection
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface VoiceState {
  isConnected: boolean;
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  error: string | null;
  transcript: string;
  assistantTranscript: string;
}

interface UseArmstrongVoiceReturn extends VoiceState {
  startListening: () => Promise<void>;
  stopListening: () => void;
  disconnect: () => void;
}

// Audio utilities
const encodeAudioForAPI = (float32Array: Float32Array): string => {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  const uint8Array = new Uint8Array(int16Array.buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
};

const createWavFromPCM = (pcmData: Uint8Array): Uint8Array => {
  const int16Data = new Int16Array(pcmData.length / 2);
  for (let i = 0; i < pcmData.length; i += 2) {
    int16Data[i / 2] = (pcmData[i + 1] << 8) | pcmData[i];
  }

  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = int16Data.byteLength;

  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  const wavArray = new Uint8Array(wavHeader.byteLength + int16Data.byteLength);
  wavArray.set(new Uint8Array(wavHeader), 0);
  wavArray.set(new Uint8Array(int16Data.buffer), wavHeader.byteLength);

  return wavArray;
};

// Audio queue for sequential playback
class AudioQueue {
  private queue: Uint8Array[] = [];
  private isPlaying = false;
  private audioContext: AudioContext;
  private onPlaybackStart?: () => void;
  private onPlaybackEnd?: () => void;

  constructor(
    audioContext: AudioContext,
    onPlaybackStart?: () => void,
    onPlaybackEnd?: () => void
  ) {
    this.audioContext = audioContext;
    this.onPlaybackStart = onPlaybackStart;
    this.onPlaybackEnd = onPlaybackEnd;
  }

  async addToQueue(audioData: Uint8Array) {
    this.queue.push(audioData);
    if (!this.isPlaying) {
      await this.playNext();
    }
  }

  private async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      this.onPlaybackEnd?.();
      return;
    }

    if (!this.isPlaying) {
      this.onPlaybackStart?.();
    }
    this.isPlaying = true;
    const audioData = this.queue.shift()!;

    try {
      const wavData = createWavFromPCM(audioData);
      const arrayBufferCopy = wavData.buffer.slice(0) as ArrayBuffer;
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBufferCopy);

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);

      source.onended = () => this.playNext();
      source.start(0);
    } catch (error) {
      console.error('Error playing audio:', error);
      this.playNext();
    }
  }

  clear() {
    this.queue = [];
    this.isPlaying = false;
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
  });

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    audioQueueRef.current?.clear();
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    cleanup();
    setState(prev => ({
      ...prev,
      isConnected: false,
      isListening: false,
      isProcessing: false,
      isSpeaking: false,
    }));
  }, [cleanup]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setState(prev => ({ ...prev, isListening: false }));
  }, []);

  // Start listening
  const startListening = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));

      // Initialize audio context if needed
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      }

      // Initialize audio queue
      if (!audioQueueRef.current) {
        audioQueueRef.current = new AudioQueue(
          audioContextRef.current,
          () => setState(prev => ({ ...prev, isSpeaking: true })),
          () => setState(prev => ({ ...prev, isSpeaking: false }))
        );
      }

      // Connect WebSocket if not connected
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        const wsUrl = `wss://ktpvilzjtcaxyuufocrs.functions.supabase.co/functions/v1/sot-armstrong-voice`;
        
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log('Voice WebSocket connected');
          setState(prev => ({ ...prev, isConnected: true }));
        };

        wsRef.current.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Voice event:', data.type);

            switch (data.type) {
              case 'session.created':
              case 'session.updated':
                console.log('Voice session ready');
                break;

              case 'input_audio_buffer.speech_started':
                setState(prev => ({ ...prev, isProcessing: true }));
                break;

              case 'input_audio_buffer.speech_stopped':
                setState(prev => ({ ...prev, isProcessing: true }));
                break;

              case 'conversation.item.input_audio_transcription.completed':
                setState(prev => ({
                  ...prev,
                  transcript: data.transcript || prev.transcript,
                }));
                break;

              case 'response.audio_transcript.delta':
                setState(prev => ({
                  ...prev,
                  assistantTranscript: prev.assistantTranscript + (data.delta || ''),
                }));
                break;

              case 'response.audio_transcript.done':
                setState(prev => ({ ...prev, isProcessing: false }));
                break;

              case 'response.audio.delta':
                if (data.delta) {
                  const binaryString = atob(data.delta);
                  const bytes = new Uint8Array(binaryString.length);
                  for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                  }
                  await audioQueueRef.current?.addToQueue(bytes);
                }
                break;

              case 'response.done':
                setState(prev => ({
                  ...prev,
                  isProcessing: false,
                  assistantTranscript: '',
                }));
                break;

              case 'error':
                console.error('Voice error:', data.error);
                setState(prev => ({
                  ...prev,
                  error: data.error?.message || 'Voice error occurred',
                  isProcessing: false,
                }));
                break;
            }
          } catch (error) {
            console.error('Error processing voice message:', error);
          }
        };

        wsRef.current.onerror = (error) => {
          console.error('Voice WebSocket error:', error);
          setState(prev => ({
            ...prev,
            error: 'Verbindung zum Sprachdienst fehlgeschlagen',
            isConnected: false,
          }));
        };

        wsRef.current.onclose = () => {
          console.log('Voice WebSocket closed');
          setState(prev => ({
            ...prev,
            isConnected: false,
            isListening: false,
          }));
        };

        // Wait for connection
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Connection timeout')), 10000);
          wsRef.current!.addEventListener('open', () => {
            clearTimeout(timeout);
            resolve();
          }, { once: true });
          wsRef.current!.addEventListener('error', () => {
            clearTimeout(timeout);
            reject(new Error('Connection failed'));
          }, { once: true });
        });
      }

      // Request microphone access
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Set up audio processing
      const audioContext = audioContextRef.current;
      sourceRef.current = audioContext.createMediaStreamSource(streamRef.current);
      processorRef.current = audioContext.createScriptProcessor(4096, 1, 1);

      processorRef.current.onaudioprocess = (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const encodedAudio = encodeAudioForAPI(new Float32Array(inputData));
          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: encodedAudio,
          }));
        }
      };

      sourceRef.current.connect(processorRef.current);
      processorRef.current.connect(audioContext.destination);

      setState(prev => ({
        ...prev,
        isListening: true,
        transcript: '',
        assistantTranscript: '',
      }));
    } catch (error) {
      console.error('Failed to start listening:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Mikrofon-Zugriff verweigert',
        isListening: false,
      }));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [cleanup]);

  return {
    ...state,
    startListening,
    stopListening,
    disconnect,
  };
}
