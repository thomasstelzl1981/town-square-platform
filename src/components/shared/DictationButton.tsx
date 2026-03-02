/**
 * DictationButton — Push-to-talk voice dictation for any text field
 * 
 * Uses usePushToTalk hook: hold to record, release to append text.
 * Primary: ElevenLabs Scribe v2 Realtime
 * Fallback: Browser Speech API
 */

import { useCallback } from 'react';
import { Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { usePushToTalk } from '@/hooks/usePushToTalk';

interface DictationButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function DictationButton({ onTranscript, className, size = 'sm' }: DictationButtonProps) {
  const ptt = usePushToTalk({
    onTranscript,
  });

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (ptt.isRecording || ptt.isConnecting) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    ptt.startRecording();
  }, [ptt]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!ptt.isRecording && !ptt.isConnecting) return;
    e.preventDefault();
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    ptt.stopRecording();
  }, [ptt]);

  const sizeClass = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8';
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const isActive = ptt.isRecording || ptt.isConnecting;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              'relative rounded-full p-0 transition-all duration-300 touch-none',
              sizeClass,
              isActive && 'bg-primary hover:bg-primary/90',
              ptt.error && 'border border-destructive/50',
              className
            )}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {ptt.isRecording && (
              <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" style={{ animationDuration: '1.5s' }} />
            )}
            {ptt.isConnecting && (
              <span className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" style={{ animationDuration: '0.8s' }} />
            )}
            <span className="relative z-10 flex items-center justify-center">
              <Mic className={cn(iconSize, isActive ? 'text-white' : ptt.error ? 'text-destructive' : 'text-muted-foreground')} />
            </span>
            {isActive && ptt.provider === 'browser' && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" title="Browser-Modus" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {ptt.error
            ? `Fehler: ${ptt.error}`
            : isActive
              ? `Diktat aktiv${ptt.provider === 'browser' ? ' (Browser)' : ''} — Loslassen zum Senden`
              : 'Gedrückt halten zum Diktieren'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
