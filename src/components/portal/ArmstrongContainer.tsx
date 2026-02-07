/**
 * ARMSTRONG CONTAINER — Flying Copper/Bronze Orb Design
 * 
 * Collapsed State: Minimalist metallic orb (160px) with 4 interaction functions:
 *                  1. Microphone (center) → Direct voice input without expand
 *                  2. Click on orb → Expand for text chat
 *                  3. Drag → Reposition in browser
 *                  4. File drop → Expand + "What should I do with this?"
 * 
 * Expanded State: Clean professional panel (320x500px)
 * 
 * Design: Copper/bronze metallic orb with characteristic "smile" highlight
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePortalLayout } from '@/hooks/usePortalLayout';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { Button } from '@/components/ui/button';
import { 
  Minimize2, 
  X,
  Globe,
  Mic,
  Volume2,
  Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { useArmstrongVoice } from '@/hooks/useArmstrongVoice';
import { useDraggable } from '@/hooks/useDraggable';

export function ArmstrongContainer() {
  const location = useLocation();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { armstrongVisible, armstrongExpanded, toggleArmstrongExpanded, hideArmstrong, isMobile } = usePortalLayout();
  const [isFileDragOver, setIsFileDragOver] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  
  // Voice integration
  const voice = useArmstrongVoice();
  
  // Draggable integration for orb positioning
  const { 
    position, 
    isDragging, 
    dragHandleProps,
  } = useDraggable({
    storageKey: 'armstrong-orb-position',
    containerSize: { width: 160, height: 160 },
    boundaryPadding: 20,
    disabled: isMobile || voice.isListening || armstrongExpanded,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const getContext = () => {
    const path = location.pathname;
    const segments = path.split('/').filter(Boolean);
    return {
      zone: 'Portal',
      module: segments[1] ? segments[1].charAt(0).toUpperCase() + segments[1].slice(1) : 'Dashboard',
      entity: segments[2] || undefined,
    };
  };

  // File drag handlers
  const handleFileDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFileDragOver(true);
  }, []);

  const handleFileDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFileDragOver(false);
  }, []);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFileDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      toggleArmstrongExpanded();
      // Future: Pass dropped file to ChatPanel for context
    }
  }, [toggleArmstrongExpanded]);

  // Orb click handler - expands the panel
  const handleOrbClick = useCallback((e: React.MouseEvent) => {
    // Don't expand if we're dragging
    if (isDragging) {
      e.preventDefault();
      return;
    }
    toggleArmstrongExpanded();
  }, [isDragging, toggleArmstrongExpanded]);

  // Microphone click handler - starts voice without expanding
  const handleMicClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!voice.isProcessing && !voice.isSpeaking) {
      voice.toggleVoice();
    }
  }, [voice]);

  if (!armstrongVisible || isMobile || !mounted) {
    return null;
  }

  const armstrongContent = (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {armstrongExpanded ? (
        /* EXPANDED: Clean Professional Panel */
        <div 
          className="absolute pointer-events-auto"
          style={{
            right: 'calc(1.25rem + env(safe-area-inset-right, 0px))',
            bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <div 
            ref={containerRef}
            className={cn(
              'w-80 rounded-[20px] flex flex-col overflow-hidden',
              'armstrong-panel-shadow',
              isDarkMode ? 'armstrong-glass-dark' : 'armstrong-glass-light',
            )}
            style={{ height: 500 }}
            onDragOver={handleFileDragOver}
            onDragLeave={handleFileDragLeave}
            onDrop={handleFileDrop}
          >
            {/* Header - Clean Professional */}
            <div className="flex items-center justify-between p-3 armstrong-header-clean">
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center",
                  isDarkMode ? "bg-primary/20" : "bg-primary/10"
                )}>
                  <Globe className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm leading-tight text-foreground">Armstrong</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">AI Co-Pilot</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  onClick={toggleArmstrongExpanded}
                  title="Minimieren"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  onClick={hideArmstrong}
                  title="Schließen"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Chat Panel with transparent background */}
            <div className="flex-1 overflow-hidden">
              <ChatPanel 
                context={getContext()}
                position="docked"
                className="bg-transparent"
              />
            </div>
          </div>
        </div>
      ) : (
        /* COLLAPSED: Flying Copper/Bronze Orb */
        <div 
          ref={containerRef}
          className={cn(
            'h-40 w-40 rounded-full pointer-events-auto',
            'armstrong-orb',
            isFileDragOver ? 'armstrong-orb-dragover' : 'armstrong-orb-glow',
            'hover:scale-105 transition-all duration-300 ease-out',
            'flex items-center justify-center',
            'cursor-pointer relative',
            isDragging && 'scale-110 cursor-grabbing'
          )}
          style={{
            position: 'fixed',
            left: position.x,
            top: position.y,
          }}
          onDragOver={handleFileDragOver}
          onDragLeave={handleFileDragLeave}
          onDrop={handleFileDrop}
          onClick={handleOrbClick}
          {...dragHandleProps}
        >
          {/* Top-left glint highlight */}
          <div 
            className="absolute top-4 left-5 h-8 w-8 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 40% 40%, hsla(45, 90%, 85%, 0.7) 0%, transparent 70%)',
              filter: 'blur(3px)',
            }}
          />
          
          {/* Secondary glint */}
          <div 
            className="absolute top-6 left-8 h-3 w-3 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, hsla(0, 0%, 100%, 0.9) 0%, transparent 70%)',
              filter: 'blur(1px)',
            }}
          />
          
          {/* Smile highlight - curved reflection in lower half */}
          <div 
            className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none"
            style={{
              width: '70%',
              height: '20px',
              background: 'radial-gradient(ellipse 100% 100% at 50% 0%, hsla(45, 85%, 75%, 0.35) 0%, transparent 70%)',
              borderRadius: '0 0 50% 50%',
              filter: 'blur(2px)',
            }}
          />
          
          {/* Central Microphone Button */}
          <button 
            onClick={handleMicClick}
            disabled={voice.isProcessing || voice.isSpeaking}
            className={cn(
              'h-14 w-14 rounded-full flex items-center justify-center relative z-10',
              'transition-all duration-300',
              voice.isListening 
                ? 'armstrong-mic-active' 
                : 'armstrong-btn-glass hover:bg-white/35',
              (voice.isProcessing || voice.isSpeaking) && 'opacity-60 cursor-not-allowed'
            )}
            title={voice.isListening ? 'Mikrofon beenden' : 'Spracheingabe starten'}
          >
            {/* Pulse rings when listening */}
            {voice.isListening && !voice.isProcessing && (
              <>
                <span
                  className="absolute inset-0 rounded-full bg-white/30 animate-ping"
                  style={{ animationDuration: '1.5s' }}
                />
                <span
                  className="absolute inset-[-6px] rounded-full bg-white/15 animate-pulse"
                  style={{ animationDuration: '2s' }}
                />
              </>
            )}
            
            {/* Processing indicator */}
            {voice.isProcessing && (
              <span
                className="absolute inset-0 rounded-full bg-white/20 animate-pulse"
                style={{ animationDuration: '0.8s' }}
              />
            )}
            
            {/* Icon */}
            <span className="relative z-10 flex items-center justify-center">
              {voice.isSpeaking ? (
                <Volume2 className="h-6 w-6 text-primary-foreground animate-pulse" />
              ) : voice.isListening ? (
                <Mic className="h-6 w-6 text-primary-foreground" />
              ) : (
                <Mic className={cn(
                  'h-6 w-6',
                  voice.error ? 'text-destructive' : 'text-primary-foreground/90'
                )} />
              )}
            </span>
          </button>
          
          {/* File Drop Indicator */}
          {isFileDragOver && (
            <div className="absolute inset-0 rounded-full bg-white/20 flex items-center justify-center pointer-events-none z-20">
              <div className="h-16 w-16 rounded-full bg-white/30 flex items-center justify-center animate-pulse">
                <Upload className="h-8 w-8 text-white" />
              </div>
            </div>
          )}
          
          {/* Voice Error Tooltip */}
          {voice.error && (
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-xs text-destructive bg-background/90 px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap z-30 backdrop-blur-sm">
              {voice.error}
            </div>
          )}
          
          {/* Voice Transcript Overlay - floats above orb */}
          {(voice.transcript || voice.assistantTranscript) && (
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 text-xs bg-popover/90 backdrop-blur-md px-4 py-2.5 rounded-xl max-w-56 text-center z-30 shadow-xl border border-border">
              {voice.transcript && (
                <p className="text-muted-foreground truncate">{voice.transcript}</p>
              )}
              {voice.assistantTranscript && (
                <p className="text-foreground font-medium truncate">{voice.assistantTranscript}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return createPortal(armstrongContent, document.body);
}
