/**
 * VoiceButton — Push-to-talk microphone button with pulse animation
 * 
 * Modes:
 * - Push-to-talk (default): Hold to record, release to stop
 * - Toggle: Click to start/stop (legacy, via onToggle)
 * 
 * States:
 * - Idle: Static mic icon
 * - Connecting: Subtle pulse
 * - Recording: Pulsing rings animation
 * - Speaking: Wave animation
 */

import { Mic, MicOff, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VoiceButtonProps {
  /** Push-to-talk: currently recording */
  isRecording?: boolean;
  /** Push-to-talk: connecting to service */
  isConnecting?: boolean;
  /** Legacy: isListening (alias for isRecording) */
  isListening?: boolean;
  /** Legacy: isProcessing (alias for isConnecting) */
  isProcessing?: boolean;
  isSpeaking?: boolean;
  isConnected?: boolean;
  error?: string | null;
  useBrowserFallback?: boolean;
  /** Push-to-talk handlers */
  onPressStart?: () => void;
  onPressEnd?: () => void;
  /** Legacy toggle handler */
  onToggle?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'glass';
}

export function VoiceButton({
  isRecording: isRecordingProp,
  isConnecting: isConnectingProp,
  isListening,
  isProcessing,
  isSpeaking = false,
  isConnected,
  error = null,
  useBrowserFallback = false,
  onPressStart,
  onPressEnd,
  onToggle,
  className,
  size = 'md',
  variant = 'default',
}: VoiceButtonProps) {
  // Support both new (isRecording) and legacy (isListening) props
  const recording = isRecordingProp ?? isListening ?? false;
  const connecting = isConnectingProp ?? isProcessing ?? false;

  const isPushToTalk = !!(onPressStart && onPressEnd);

  const sizeClasses = {
    sm: 'h-7 w-7',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const getTooltipText = () => {
    if (error) return `Fehler: ${error}`;
    if (isSpeaking) return 'Armstrong spricht...';
    if (connecting) return 'Verbinde...';
    if (recording) return isPushToTalk ? 'Loslassen zum Senden' : 'Mikrofon aktiv — Klicken zum Beenden';
    return isPushToTalk ? 'Gedrückt halten zum Sprechen' : 'Spracheingabe starten';
  };

  const getIcon = () => {
    if (isSpeaking) {
      return <Volume2 className={cn(iconSizes[size], 'text-primary animate-pulse')} />;
    }
    if (recording) {
      return <Mic className={cn(iconSizes[size], 'text-white')} />;
    }
    return <Mic className={cn(iconSizes[size], error ? 'text-destructive' : 'text-muted-foreground')} />;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isSpeaking || connecting) return;
    e.preventDefault();
    // Capture pointer so pointerup fires even if cursor leaves button
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    onPressStart?.();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!recording && !connecting) return;
    e.preventDefault();
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    onPressEnd?.();
  };

  const handleClick = () => {
    if (!isPushToTalk && onToggle) {
      onToggle();
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant === 'glass' ? 'ghost' : 'ghost'}
            size="sm"
            className={cn(
              'relative rounded-full p-0 transition-all duration-300 touch-none',
              sizeClasses[size],
              variant === 'glass' && 'hover:bg-white/10',
              (recording || connecting) && 'bg-primary hover:bg-primary/90',
              error && 'border border-destructive/50',
              className
            )}
            onClick={handleClick}
            onPointerDown={isPushToTalk ? handlePointerDown : undefined}
            onPointerUp={isPushToTalk ? handlePointerUp : undefined}
            onPointerCancel={isPushToTalk ? handlePointerUp : undefined}
            disabled={isSpeaking}
            title={getTooltipText()}
          >
            {/* Pulse rings when recording */}
            {recording && !connecting && (
              <>
                <span
                  className="absolute inset-0 rounded-full bg-primary/30 animate-ping"
                  style={{ animationDuration: '1.5s' }}
                />
                <span
                  className="absolute inset-[-4px] rounded-full bg-primary/20 animate-pulse"
                  style={{ animationDuration: '2s' }}
                />
              </>
            )}

            {/* Connecting indicator */}
            {connecting && (
              <span
                className="absolute inset-0 rounded-full bg-primary/20 animate-pulse"
                style={{ animationDuration: '0.8s' }}
              />
            )}

            {/* Icon */}
            <span className="relative z-10 flex items-center justify-center">
              {getIcon()}
            </span>
            
            {/* Browser fallback indicator */}
            {useBrowserFallback && recording && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" title="Browser-Modus" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {getTooltipText()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
