/**
 * ARMSTRONG CONTAINER — Dual Mode: Orb (collapsed) + Stripe (expanded)
 * 
 * Collapsed: Draggable orb with voice mic (unchanged)
 * Expanded: Full-height right-side milky glass stripe, no text input, voice + upload only
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePortalLayout } from '@/hooks/usePortalLayout';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { useArmstrongAdvisor } from '@/hooks/useArmstrongAdvisor';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileUploader } from '@/components/shared/FileUploader';
import { UploadResultCard } from '@/components/shared/UploadResultCard';
import { VoiceButton } from '@/components/armstrong/VoiceButton';
import { MessageRenderer } from '@/components/chat/MessageRenderer';
import { useUniversalUpload } from '@/hooks/useUniversalUpload';
import { 
  Minimize2, 
  X,
  Globe,
  Mic,
  Volume2,
  Upload,
  Loader2
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
  const prevListeningRef = useRef(false);
  const prevMessagesLenRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Voice integration
  const voice = useArmstrongVoice();
  
  // Advisor for conversation
  const advisor = useArmstrongAdvisor();

  // Universal upload
  const { upload: universalUpload, uploadedFiles, clearUploadedFiles, isUploading } = useUniversalUpload();

  // Orb mode: auto-send transcript when user stops speaking (collapsed only)
  useEffect(() => {
    if (!armstrongExpanded && prevListeningRef.current && !voice.isListening && voice.transcript.trim()) {
      advisor.sendMessage(voice.transcript.trim());
    }
    prevListeningRef.current = voice.isListening;
  }, [voice.isListening, voice.transcript, armstrongExpanded]);

  // Auto-speak when new assistant message arrives
  useEffect(() => {
    const msgs = advisor.messages;
    if (msgs.length > prevMessagesLenRef.current) {
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg?.role === 'assistant' && lastMsg.content) {
        voice.speakResponse(lastMsg.content);
      }
    }
    prevMessagesLenRef.current = msgs.length;
  }, [advisor.messages]);

  // Auto-scroll in stripe mode
  useEffect(() => {
    if (armstrongExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [advisor.messages, armstrongExpanded]);
  
  // Draggable integration for orb positioning
  const { 
    position, 
    isDragging, 
    dragHandleProps,
    dragStyle,
    dragState,
  } = useDraggable({
    storageKey: 'armstrong-orb-position-v2',
    containerSize: { width: 160, height: 160 },
    boundaryPadding: 20,
    bottomOffset: 20,
    dragThreshold: 5,
    disabled: isMobile || voice.isListening || armstrongExpanded,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

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
      if (!armstrongExpanded) {
        toggleArmstrongExpanded();
      }
      // Upload files
      Array.from(files).forEach(file => {
        universalUpload(file, { source: 'armstrong_chat', triggerAI: false });
      });
    }
  }, [armstrongExpanded, toggleArmstrongExpanded, universalUpload]);

  const handleOrbClick = useCallback((e: React.MouseEvent) => {
    if (dragState.consumeDidDrag() || isDragging) {
      e.preventDefault();
      return;
    }
    toggleArmstrongExpanded();
  }, [dragState, isDragging, toggleArmstrongExpanded]);

  const handleMicClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!voice.isProcessing && !voice.isSpeaking) {
      voice.toggleVoice();
    }
  }, [voice]);

  const handleMicMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleVoiceToggle = useCallback(() => {
    if (voice.isListening) {
      voice.stopListening();
    } else {
      voice.startListening();
    }
  }, [voice]);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    for (const file of files) {
      await universalUpload(file, { source: 'armstrong_chat', triggerAI: false });
    }
  }, [universalUpload]);

  // All hooks called — early return now safe
  if (!armstrongVisible || isMobile || !mounted) {
    return null;
  }

  // ═══════════════════════════════════════════
  // EXPANDED: Full-height right stripe (inline)
  // ═══════════════════════════════════════════
  if (armstrongExpanded) {
    return (
      <div 
        ref={containerRef}
        className={cn(
          "w-[304px] h-full flex flex-col shrink-0",
          "bg-white/60 dark:bg-card/40 backdrop-blur-xl",
          "border-l border-border/30",
          "transition-all duration-300",
        )}
        onDragOver={handleFileDragOver}
        onDragLeave={handleFileDragLeave}
        onDrop={handleFileDrop}
      >
        {/* Header — ARMSTRONG wordmark + close */}
        <div className="flex items-center justify-between px-4 py-3">
          <div /> {/* spacer */}
          <span className="font-sans font-semibold tracking-[0.2em] text-sm text-foreground/70 uppercase select-none">
            Armstrong
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              onClick={toggleArmstrongExpanded}
              title="Minimieren"
            >
              <Minimize2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              onClick={hideArmstrong}
              title="Schließen"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Upload zone hint */}
        {isFileDragOver && (
          <div className="mx-4 mb-2 py-6 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center gap-2 transition-all">
            <Upload className="h-6 w-6 text-primary/50" />
            <span className="text-xs text-primary/60 font-medium">Dateien loslassen</span>
          </div>
        )}

        {/* Messages area */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 py-4">
            {advisor.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <p className="text-xs text-muted-foreground/40">
                  Dateien hierher ziehen
                </p>
              </div>
            ) : (
              <>
                {advisor.messages.map((message) => (
                  <MessageRenderer
                    key={message.id}
                    message={message}
                    onActionSelect={advisor.selectAction}
                    onConfirm={advisor.confirmAction}
                    onCancel={advisor.cancelAction}
                    isExecuting={advisor.isExecuting}
                  />
                ))}
                
                {advisor.isLoading && (
                  <div className="flex gap-3">
                    <div className="flex items-center justify-center h-7 w-7 rounded-full shrink-0 bg-primary/10">
                      <Globe className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="rounded-2xl px-3.5 py-2.5 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Armstrong denkt nach...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </ScrollArea>

        {/* Uploaded files */}
        {uploadedFiles.length > 0 && (
          <div className="px-4 py-2 border-t border-border/20">
            <div className="space-y-1">
              {uploadedFiles.map((file) => (
                <UploadResultCard
                  key={file.documentId}
                  file={file}
                  status="uploaded"
                  compact
                />
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-6 w-full text-muted-foreground"
                onClick={clearUploadedFiles}
              >
                Liste leeren
              </Button>
            </div>
          </div>
        )}

        {/* Footer — Upload button + Mic button */}
        <div className="flex items-center justify-between px-4 py-4 border-t border-border/20">
          <FileUploader
            onFilesSelected={handleFilesSelected}
            accept=".pdf,.xlsx,.xls,.doc,.docx,.png,.jpg,.jpeg"
            multiple
            disabled={isUploading}
          >
            <button className="h-10 w-10 rounded-full flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted/40 transition-colors">
              {isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Upload className="h-5 w-5" />
              )}
            </button>
          </FileUploader>
          
          <VoiceButton
            isListening={voice.isListening}
            isProcessing={voice.isProcessing}
            isSpeaking={voice.isSpeaking}
            isConnected={voice.isConnected}
            error={voice.error}
            onToggle={handleVoiceToggle}
            size="lg"
          />
          
          <div className="w-10" /> {/* spacer for symmetry */}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // COLLAPSED: Frozen Dark Grey Orb (via portal)
  // ═══════════════════════════════════════════
  const orbContent = (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <div 
        ref={containerRef}
        className={cn(
          'h-40 w-40 rounded-full pointer-events-auto',
          'armstrong-orb',
          isFileDragOver ? 'armstrong-orb-dragover' : 'armstrong-orb-glow',
          'hover:scale-105 transition-all duration-300 ease-out',
          'flex items-center justify-center',
          'relative',
          isDragging && 'scale-110'
        )}
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          ...dragStyle,
        }}
        onDragOver={handleFileDragOver}
        onDragLeave={handleFileDragLeave}
        onDrop={handleFileDrop}
        onClick={handleOrbClick}
        onMouseDown={dragHandleProps.onMouseDown}
      >
        {/* Visor / Face area */}
        <div 
          className="absolute inset-6 rounded-full pointer-events-none armstrong-orb-visor"
          style={{
            background: `
              radial-gradient(
                ellipse 100% 80% at 50% 30%,
                hsl(var(--armstrong-orb-visor-deep)) 0%,
                hsl(var(--armstrong-orb-visor)) 40%,
                hsl(var(--armstrong-orb-visor-deep)) 100%
              )
            `,
            boxShadow: 'inset 0 4px 16px -4px hsla(0, 0%, 0%, 0.5)',
          }}
        />
        
        {/* Top-left frost glint */}
        <div 
          className="absolute top-4 left-5 h-8 w-8 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 40% 40%, hsla(210, 30%, 90%, 0.7) 0%, transparent 70%)',
            filter: 'blur(3px)',
          }}
        />
        
        <div 
          className="absolute top-6 left-8 h-3 w-3 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, hsla(0, 0%, 100%, 0.8) 0%, transparent 70%)',
            filter: 'blur(1px)',
          }}
        />
        
        {/* Smile highlight */}
        <div 
          className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            width: '55%',
            height: '12px',
            background: `
              radial-gradient(
                ellipse 100% 100% at 50% 0%,
                hsla(210, 25%, 75%, 0.4) 0%,
                hsla(220, 20%, 60%, 0.2) 50%,
                transparent 100%
              )
            `,
            borderRadius: '0 0 50% 50%',
            filter: 'blur(2px)',
          }}
        />
        
        <div 
          className="absolute bottom-9 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            width: '45%',
            height: '2px',
            background: 'linear-gradient(90deg, transparent 0%, hsla(210, 30%, 80%, 0.4) 30%, hsla(210, 30%, 80%, 0.4) 70%, transparent 100%)',
            borderRadius: '50%',
            filter: 'blur(1px)',
          }}
        />
        
        {/* Central Microphone Button */}
        <button 
          onClick={handleMicClick}
          onMouseDown={handleMicMouseDown}
          disabled={voice.isProcessing || voice.isSpeaking}
          className={cn(
            'h-14 w-14 rounded-full flex items-center justify-center relative z-10',
            'transition-all duration-300',
            voice.isListening 
              ? 'armstrong-mic-active' 
              : 'armstrong-btn-glass hover:bg-white/25',
            (voice.isProcessing || voice.isSpeaking) && 'opacity-60 cursor-not-allowed'
          )}
          title={voice.isListening ? 'Mikrofon beenden' : 'Spracheingabe starten'}
        >
          {voice.isListening && !voice.isProcessing && (
            <>
              <span className="absolute inset-0 rounded-full bg-white/30 animate-ping" style={{ animationDuration: '1.5s' }} />
              <span className="absolute inset-[-6px] rounded-full bg-white/15 animate-pulse" style={{ animationDuration: '2s' }} />
            </>
          )}
          
          {voice.isProcessing && (
            <span className="absolute inset-0 rounded-full bg-white/20 animate-pulse" style={{ animationDuration: '0.8s' }} />
          )}
          
          <span className="relative z-10 flex items-center justify-center">
            {voice.isSpeaking ? (
              <Volume2 className="h-6 w-6 text-primary-foreground animate-pulse" />
            ) : voice.isListening ? (
              <Mic className="h-6 w-6 text-primary-foreground" />
            ) : (
              <Mic className={cn('h-6 w-6', voice.error ? 'text-destructive' : 'text-primary-foreground/90')} />
            )}
          </span>
        </button>
        
        {/* File Drop Indicator */}
        {isFileDragOver && (
          <div className="absolute inset-0 rounded-full bg-white/20 flex flex-col items-center justify-center pointer-events-none z-20 gap-2">
            <div className="h-14 w-14 rounded-full bg-white/30 flex items-center justify-center animate-pulse">
              <Upload className="h-7 w-7 text-white" />
            </div>
            <span className="text-xs font-medium text-white/90">Datei loslassen</span>
          </div>
        )}
        
        {/* Voice Error Tooltip */}
        {voice.error && (
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-xs text-destructive bg-background/90 px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap z-30 backdrop-blur-sm">
            {voice.error}
          </div>
        )}
        
        {/* Voice Transcript Overlay */}
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
    </div>
  );

  return createPortal(orbContent, document.body);
}
