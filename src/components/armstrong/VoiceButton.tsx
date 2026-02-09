/**
 * VoiceButton — Microphone toggle with pulse animation
 * 
 * States:
 * - Idle: Static mic icon
 * - Listening: Pulsing rings animation
 * - Processing: Subtle pulse
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
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  isConnected: boolean;
  error: string | null;
  useBrowserFallback?: boolean;
  onToggle: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'glass';
}

export function VoiceButton({
  isListening,
  isProcessing,
  isSpeaking,
  isConnected,
  error,
  useBrowserFallback = false,
  onToggle,
  className,
  size = 'md',
  variant = 'default',
}: VoiceButtonProps) {
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
    if (isProcessing) return 'Verarbeite...';
    if (isListening) return `Mikrofon aktiv${useBrowserFallback ? ' (Browser)' : ''} — Klicken zum Beenden`;
    return `Spracheingabe starten${useBrowserFallback ? ' (Browser-Modus)' : ''}`;
  };

  const getIcon = () => {
    if (isSpeaking) {
      return <Volume2 className={cn(iconSizes[size], 'text-primary animate-pulse')} />;
    }
    if (isListening) {
      return <Mic className={cn(iconSizes[size], 'text-white')} />;
    }
    return <Mic className={cn(iconSizes[size], error ? 'text-destructive' : 'text-muted-foreground')} />;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant === 'glass' ? 'ghost' : 'ghost'}
            size="sm"
            className={cn(
              'relative rounded-full p-0 transition-all duration-300',
              sizeClasses[size],
              variant === 'glass' && 'hover:bg-white/10',
              isListening && 'bg-primary hover:bg-primary/90',
              error && 'border border-destructive/50',
              className
            )}
            onClick={onToggle}
            disabled={isProcessing || isSpeaking}
            title={getTooltipText()}
          >
            {/* Pulse rings when listening */}
            {isListening && !isProcessing && (
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

            {/* Processing indicator */}
            {isProcessing && (
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
            {useBrowserFallback && isListening && (
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
