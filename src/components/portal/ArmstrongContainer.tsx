/**
 * ARMSTRONG CONTAINER — Dual Mode: Orb (collapsed) + Floating Overlay (expanded)
 * 
 * Collapsed: Draggable orb with voice mic
 * Expanded: Compact floating overlay panel (380px, single-column)
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useArmstrongTriggerListener } from '@/hooks/useArmstrongTrigger';
import { useArmstrongProactiveHints } from '@/hooks/useArmstrongProactiveHints';
import { createPortal } from 'react-dom';
import { usePortalLayout } from '@/hooks/usePortalLayout';
import { useArmstrongAdvisor } from '@/hooks/useArmstrongAdvisor';
import { useArmstrongDocUpload } from '@/hooks/useArmstrongDocUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileUploader } from '@/components/shared/FileUploader';
import { UploadResultCard } from '@/components/shared/UploadResultCard';
import { VoiceButton } from '@/components/shared/VoiceButton';
import { MessageRenderer } from '@/components/chat/MessageRenderer';
import { ThinkingSteps, getStepsForAction, type ThinkingStep } from '@/components/chat/ThinkingSteps';
import { useUniversalUpload } from '@/hooks/useUniversalUpload';
import { 
  Minimize2, 
  X,
  Rocket,
  Mic,
  Volume2,
  VolumeX,
  Upload,
  Loader2,
  Send,
  Paperclip,
  FileText,
  Trash2
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
  const [input, setInput] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const prevListeningRef = useRef(false);
  const prevMessagesLenRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  
  // Thinking steps state
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const stepsTimerRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  
  // Voice integration
  const voice = useArmstrongVoice();
  
  // Advisor for conversation
  const advisor = useArmstrongAdvisor();

  // Document analysis hook
  const docUpload = useArmstrongDocUpload();

  // Universal upload
  const { upload: universalUpload, uploadedFiles, clearUploadedFiles, isUploading } = useUniversalUpload();

  // Simulate thinking steps during loading
  useEffect(() => {
    if (advisor.isLoading) {
      // Determine action type from last user message
      const lastUserMsg = [...advisor.messages].reverse().find(m => m.role === 'user');
      const actionHint = lastUserMsg?.content?.includes('📄') ? 'MAGIC_INTAKE' : 'EXPLAIN';
      const steps = getStepsForAction(actionHint);
      setThinkingSteps(steps);
      
      // Progressively activate steps
      stepsTimerRef.current = steps.map((_, i) => 
        setTimeout(() => {
          setThinkingSteps(prev => prev.map((s, j) => ({
            ...s,
            status: j < i ? 'completed' : j === i ? 'active' : 'pending',
          })));
        }, 800 + i * 1200)
      );
    } else {
      // Complete all steps
      stepsTimerRef.current.forEach(t => clearTimeout(t));
      stepsTimerRef.current = [];
      if (thinkingSteps.length > 0) {
        setThinkingSteps(prev => prev.map(s => ({ ...s, status: 'completed' as const })));
        // Clear after animation
        setTimeout(() => setThinkingSteps([]), 1500);
      }
    }
    return () => {
      stepsTimerRef.current.forEach(t => clearTimeout(t));
    };
  }, [advisor.isLoading]);

  // Orb mode: auto-send transcript when user stops speaking (collapsed only)
  useEffect(() => {
    if (!armstrongExpanded && prevListeningRef.current && !voice.isListening && voice.transcript.trim()) {
      advisor.sendMessage(voice.transcript.trim());
    }
    prevListeningRef.current = voice.isListening;
  }, [voice.isListening, voice.transcript, armstrongExpanded]);

  // Track message count (auto-speak removed — user must click to hear)
  useEffect(() => {
    prevMessagesLenRef.current = advisor.messages.length;
  }, [advisor.messages]);

  // Auto-scroll in expanded mode
  useEffect(() => {
    if (armstrongExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [advisor.messages, armstrongExpanded, thinkingSteps]);
  
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

  // ── "Frag Armstrong" trigger listener ────────────────────────────────────
  const { handler: triggerHandler } = useArmstrongTriggerListener((data) => {
    // Open Armstrong if collapsed
    if (!armstrongExpanded) {
      toggleArmstrongExpanded();
    }
    // Pre-fill and send the prompt
    setTimeout(() => {
      advisor.sendMessage(data.prompt);
    }, 300); // small delay so the panel opens first
  });

  useEffect(() => {
    window.addEventListener('armstrong:trigger', triggerHandler);
    return () => window.removeEventListener('armstrong:trigger', triggerHandler);
  }, [triggerHandler]);

  // ── Proactive hints listener ─────────────────────────────────────────────
  const { latestHint, dismissHint } = useArmstrongProactiveHints();

  useEffect(() => {
    if (latestHint && !armstrongExpanded) {
      // Show proactive hint as a new assistant message when Armstrong is opened
      const proactiveMsg = {
        id: latestHint.id,
        role: 'assistant' as const,
        content: latestHint.hint,
        timestamp: latestHint.timestamp,
      };
      advisor.addProactiveMessage(proactiveMsg);
      dismissHint(latestHint.id);
    }
  }, [latestHint?.id]);

  // Chat input handlers
  const handleSend = useCallback(() => {
    if (input.trim()) {
      advisor.sendMessage(input.trim(), docUpload.documentContext || undefined);
      if (docUpload.documentContext) {
        docUpload.clearDocument();
      }
      setInput('');
    }
  }, [input, advisor, docUpload]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleDocumentForAnalysis = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await docUpload.uploadAndParse(file);
    e.target.value = '';
  }, [docUpload]);

  // File drag handlers — disabled on mobile
  const handleFileDragOver = useCallback((e: React.DragEvent) => {
    if (isMobile) return;
    e.preventDefault();
    e.stopPropagation();
    setIsFileDragOver(true);
  }, [isMobile]);

  const handleFileDragLeave = useCallback((e: React.DragEvent) => {
    if (isMobile) return;
    e.preventDefault();
    e.stopPropagation();
    setIsFileDragOver(false);
  }, [isMobile]);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFileDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      if (!armstrongExpanded) {
        toggleArmstrongExpanded();
      }
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

  // Speak handler for TTS on individual messages
  const handleSpeak = useCallback((text: string) => {
    if (voice.isSpeaking) {
      voice.stopSpeaking();
    } else {
      voice.speakResponse(text);
    }
  }, [voice]);

  // All hooks called — early return now safe
  if (!armstrongVisible || isMobile || !mounted) {
    return null;
  }

  // ═══════════════════════════════════════════
  // EXPANDED: Floating Overlay Panel
  // ═══════════════════════════════════════════
  if (armstrongExpanded) {
    const panelContent = (
      <div className="fixed inset-0 z-[60] pointer-events-none">
        <div 
          ref={containerRef}
          className={cn(
            "pointer-events-auto flex flex-col",
            "fixed right-4 bottom-4",
            "w-[380px]",
            "h-[70vh] max-h-[700px] min-h-[400px]",
            "rounded-2xl overflow-hidden",
            "bg-background/70 backdrop-blur-2xl",
            "border border-white/15 dark:border-white/10",
            "shadow-2xl shadow-black/20 dark:shadow-black/40",
            "transition-all duration-300 ease-out",
            "animate-in slide-in-from-bottom-4 fade-in-0 duration-300",
          )}
          onDragOver={handleFileDragOver}
          onDragLeave={handleFileDragLeave}
          onDrop={handleFileDrop}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[hsl(200_85%_45%/0.2)] to-[hsl(140_45%_40%/0.2)] flex items-center justify-center">
                <Rocket className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <span className="font-sans font-semibold tracking-[0.15em] text-xs text-foreground/70 uppercase select-none">
                  Armstrong
                </span>
                <div className="flex items-center gap-1">
                  <span className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    advisor.isLoading ? "bg-status-warning animate-pulse" : "bg-status-success"
                  )} />
                  <span className="text-[10px] text-muted-foreground">
                    {advisor.isLoading ? "Arbeitet..." : "Online"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {voice.isSpeaking && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => voice.stopSpeaking()}
                  title="Sprachausgabe stoppen"
                >
                  <VolumeX className="h-3.5 w-3.5" />
                </Button>
              )}
              {advisor.messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                  onClick={advisor.clearConversation}
                  title="Gespräch löschen"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                onClick={toggleArmstrongExpanded}
                title="Minimieren"
              >
                <Minimize2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                onClick={hideArmstrong}
                title="Schließen"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Upload zone hint */}
          {isFileDragOver && (
            <div className="mx-4 mt-2 py-6 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center gap-2">
              <Upload className="h-6 w-6 text-primary/50" />
              <span className="text-xs text-primary/60 font-medium">Dateien loslassen</span>
            </div>
          )}

          {/* Chat area — single column */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            <div className="flex-1 flex flex-col min-w-0 min-h-0">
              <ScrollArea className="flex-1 px-4">
                <div className="space-y-4 py-4">
                {advisor.messages.length === 0 ? null : (
                    <>
                      {advisor.messages.map((message) => (
                        <MessageRenderer
                          key={message.id}
                          message={message}
                          onActionSelect={advisor.selectAction}
                          onConfirm={advisor.confirmAction}
                          onCancel={advisor.cancelAction}
                          isExecuting={advisor.isExecuting}
                          onSpeak={handleSpeak}
                          isSpeaking={voice.isSpeaking}
                          onSendEmail={advisor.sendEmail}
                        />
                      ))}
                      
                      {/* Loading with inline ThinkingSteps (single-column mode) */}
                      {advisor.isLoading && (
                        <div className="flex gap-3">
                          <div className="flex items-center justify-center h-7 w-7 rounded-full shrink-0 bg-gradient-to-br from-[hsl(200_85%_45%/0.2)] to-[hsl(140_45%_40%/0.2)]">
                            <Rocket className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="rounded-2xl px-3.5 py-2.5 text-sm armstrong-message-assistant">
                              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Armstrong arbeitet...</span>
                              </div>
                              {/* Inline thinking steps */}
                              {thinkingSteps.length > 0 && (
                                <ThinkingSteps steps={thinkingSteps} compact />
                              )}
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

              {/* Attached Document Preview */}
              {(docUpload.attachedFile || docUpload.isParsing || docUpload.parseError) && (
                <div className="px-4 py-2 border-t border-border/20">
                  {docUpload.isParsing && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      <span>Dokument wird gelesen...</span>
                    </div>
                  )}
                  {docUpload.parseError && (
                    <div className="flex items-center gap-2 text-xs text-destructive">
                      <X className="h-3.5 w-3.5" />
                      <span className="flex-1 truncate">{docUpload.parseError}</span>
                      <button onClick={docUpload.clearDocument} className="shrink-0 hover:text-foreground">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  {docUpload.attachedFile && !docUpload.isParsing && !docUpload.parseError && (
                    <div className="flex items-center gap-2 text-xs bg-primary/5 rounded-lg px-2.5 py-1.5">
                      <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate flex-1 text-foreground font-medium">
                        {docUpload.attachedFile.name}
                      </span>
                      <span className="text-muted-foreground shrink-0">
                        {(docUpload.attachedFile.size / 1024).toFixed(0)} KB
                      </span>
                      <button 
                        onClick={docUpload.clearDocument} 
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={docInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.doc,.csv,.xlsx,.xls"
                className="hidden"
                onChange={handleDocumentForAnalysis}
              />

              {/* Footer — Chat Input with Paperclip, Send, Voice */}
              <div className="p-3 border-t border-border/20">
                <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-muted/40 backdrop-blur-sm">
                  {/* Document attach */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 w-8 p-0 rounded-full shrink-0",
                      docUpload.documentContext ? "text-primary" : "text-muted-foreground"
                    )}
                    onClick={() => docInputRef.current?.click()}
                    disabled={advisor.isLoading || docUpload.isParsing}
                    title="Dokument anhängen"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  
                  {/* Text input */}
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={docUpload.documentContext 
                      ? "Frage zum Dokument..." 
                      : "Nachricht eingeben..."
                    }
                    className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 h-8 text-sm placeholder:text-muted-foreground/50"
                    disabled={advisor.isLoading}
                  />
                  
                  {/* Send button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 w-8 p-0 rounded-full shrink-0 transition-colors",
                      input.trim() 
                        ? "text-primary hover:bg-primary/10" 
                        : "text-muted-foreground/30"
                    )}
                    onClick={handleSend}
                    disabled={!input.trim() || advisor.isLoading}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                  
                  {/* Voice button */}
                  <VoiceButton
                    isListening={voice.isListening}
                    isProcessing={voice.isProcessing}
                    isSpeaking={voice.isSpeaking}
                    isConnected={voice.isConnected}
                    error={voice.error}
                    onToggle={handleVoiceToggle}
                    size="md"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    return createPortal(panelContent, document.body);
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
          aria-label={voice.isListening ? 'Mikrofon beenden' : 'Spracheingabe starten'}
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
