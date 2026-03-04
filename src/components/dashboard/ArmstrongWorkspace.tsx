/**
 * ArmstrongWorkspace — 3-Column Workspace for Dashboard Section 2
 * Left: Projects & Threads | Center: Chat | Right: Context & Sources
 * Mobile: Chat only, sidebars as drawers
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useArmstrongAdvisor } from '@/hooks/useArmstrongAdvisor';
import { useArmstrongVoice } from '@/hooks/useArmstrongVoice';
import { useArmstrongDocUpload } from '@/hooks/useArmstrongDocUpload';
import { useArmstrongProjects, type ArmstrongProject } from '@/hooks/useArmstrongProjects';
import { MessageRenderer } from '@/components/chat/MessageRenderer';
import { ArmstrongChipBar } from '@/components/chat/ArmstrongChipBar';
import { ArmstrongOrb, type OrbState } from '@/components/chat/ArmstrongOrb';
import { VoiceButton } from '@/components/shared/VoiceButton';
import { ProjectsSidebar } from '@/components/dashboard/workspace/ProjectsSidebar';
import { ContextPanel } from '@/components/dashboard/workspace/ContextPanel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  Send,
  Loader2,
  Trash2,
  Paperclip,
  X,
  VolumeX,
  PanelLeftOpen,
  PanelRightOpen,
} from 'lucide-react';

export function ArmstrongWorkspace() {
  const isMobile = useIsMobile();
  const [input, setInput] = useState('');
  const [voiceMode, setVoiceMode] = useState(false);
  const [activeProject, setActiveProject] = useState<ArmstrongProject | null>(null);
  const [showLeftPanel, setShowLeftPanel] = useState(!isMobile);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [mobileLeftOpen, setMobileLeftOpen] = useState(false);
  const [mobileRightOpen, setMobileRightOpen] = useState(false);

  const advisor = useArmstrongAdvisor();
  const voice = useArmstrongVoice();
  const docUpload = useArmstrongDocUpload();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [advisor.messages]);

  const handleSend = useCallback(() => {
    if (!input.trim() || advisor.isLoading) return;
    setVoiceMode(false);
    advisor.sendMessage(input.trim(), docUpload.documentContext || undefined);
    if (docUpload.documentContext) docUpload.clearDocument();
    setInput('');
  }, [input, advisor, docUpload]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoicePressStart = useCallback(() => voice.startListening(), [voice]);
  const handleVoicePressEnd = useCallback(() => {
    const transcript = voice.stopListening();
    if (transcript?.trim()) {
      setVoiceMode(true);
      advisor.sendMessage(transcript.trim());
    }
  }, [voice, advisor]);

  const handleSpeak = useCallback((text: string) => {
    voice.isSpeaking ? voice.stopSpeaking() : voice.speakResponse(text);
  }, [voice]);

  const handleDocChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await docUpload.uploadAndParse(file);
    e.target.value = '';
  };

  const handleSelectProject = (project: ArmstrongProject | null) => {
    setActiveProject(project);
    if (isMobile) setMobileLeftOpen(false);
  };

  const handleNewChat = () => {
    setActiveProject(null);
    advisor.clearConversation();
    if (isMobile) setMobileLeftOpen(false);
  };

  const orbState: OrbState = (() => {
    if (voice.isSpeaking) return 'speaking';
    if (advisor.isLoading && docUpload.isParsing) return 'working';
    if (advisor.isLoading) return 'thinking';
    if (advisor.isExecuting) return 'working';
    return 'idle';
  })();

  const orbStepLabel = (() => {
    if (docUpload.isParsing) return 'Dokument analysieren...';
    if (advisor.isExecuting) return 'Aktion ausführen...';
    if (advisor.isLoading) return 'Antwort formulieren...';
    if (voice.isSpeaking) return 'Vorlesen...';
    return undefined;
  })();

  const hasMessages = advisor.messages.length > 0;

  // ── Chat Column (Center) ──
  const chatColumn = (
    <div className="flex flex-col h-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30 shrink-0">
        <div className="flex items-center gap-3">
          {/* Mobile: toggle left panel */}
          {isMobile ? (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setMobileLeftOpen(true)}>
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className={cn('h-8 w-8 p-0', showLeftPanel && 'text-primary')}
              onClick={() => setShowLeftPanel(!showLeftPanel)}
            >
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          )}
          <ArmstrongOrb state={orbState} size={24} />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold tracking-wide truncate">
              {activeProject ? activeProject.title : 'Armstrong'}
            </h3>
            {activeProject?.goal && (
              <p className="text-[10px] text-muted-foreground truncate">{activeProject.goal}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {voice.isSpeaking && (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary" onClick={() => voice.stopSpeaking()}>
              <VolumeX className="h-4 w-4" />
            </Button>
          )}
          {hasMessages && (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={advisor.clearConversation} title="Gespräch löschen">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {isMobile ? (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setMobileRightOpen(true)}>
              <PanelRightOpen className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className={cn('h-8 w-8 p-0', showRightPanel && 'text-primary')}
              onClick={() => setShowRightPanel(!showRightPanel)}
            >
              <PanelRightOpen className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Voice indicator */}
      {voice.isRecording && (
        <div className="px-4 py-1.5 border-b border-primary/20 bg-primary/5 shrink-0">
          <p className="text-xs text-primary animate-pulse">{voice.transcript || 'Höre zu...'}</p>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
          {!hasMessages && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ArmstrongOrb state="idle" size={48} />
              <h3 className="mt-4 text-lg font-semibold">Wie kann ich helfen?</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Frag mich etwas, starte ein Projekt oder nutze / für Aktionen.
              </p>
            </div>
          )}

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

          {(advisor.isLoading || advisor.isExecuting) && (
            <div className="flex items-center gap-3 py-2">
              <ArmstrongOrb state={orbState} size={24} stepLabel={orbStepLabel} />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Attached document */}
      {docUpload.attachedFile && !docUpload.isParsing && (
        <div className="px-4 py-2 border-t border-border/30 shrink-0">
          <div className="max-w-3xl mx-auto flex items-center gap-2 text-xs bg-primary/5 rounded-lg px-3 py-1.5">
            <Paperclip className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate flex-1 font-medium">{docUpload.attachedFile.name}</span>
            <button onClick={docUpload.clearDocument} className="shrink-0 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.doc,.csv,.xlsx,.xls"
        className="hidden"
        onChange={handleDocChange}
      />

      {/* Quick chips when empty */}
      {!hasMessages && (
        <div className="px-4 pb-2 shrink-0">
          <div className="max-w-3xl mx-auto">
            <ArmstrongChipBar
              moduleCode={advisor.currentModule}
              website={null}
              onChipClick={(actionCode, label) => {
                advisor.selectAction({
                  action_code: actionCode,
                  title_de: label,
                  execution_mode: 'execute_with_confirmation',
                  risk_level: 'low',
                  cost_model: 'free',
                  credits_estimate: 0,
                  cost_hint_cents: 0,
                  side_effects: [],
                  why: '',
                });
              }}
              disabled={advisor.isLoading}
              maxChips={4}
            />
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="p-3 border-t border-border/30 shrink-0">
        <div className="max-w-3xl mx-auto flex items-center gap-2 p-1.5 rounded-xl bg-muted/40 border border-border/20">
          <VoiceButton
            isRecording={voice.isRecording}
            isConnecting={voice.isConnecting}
            isSpeaking={voice.isSpeaking}
            error={voice.error}
            onPressStart={handleVoicePressStart}
            onPressEnd={handleVoicePressEnd}
            size="md"
          />
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-8 w-8 p-0 rounded-full shrink-0',
              docUpload.documentContext ? 'text-primary' : 'text-muted-foreground'
            )}
            onClick={() => docInputRef.current?.click()}
            disabled={advisor.isLoading || docUpload.isParsing}
            title="Dokument anhängen"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={docUpload.documentContext ? 'Frage zum Dokument...' : 'Nachricht an Armstrong...'}
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-9 text-sm"
            disabled={advisor.isLoading}
          />
          <Button
            size="sm"
            className={cn(
              'h-8 w-8 p-0 rounded-full transition-all shrink-0',
              input.trim() && !advisor.isLoading
                ? 'bg-primary hover:bg-primary/90'
                : 'bg-muted'
            )}
            onClick={handleSend}
            disabled={!input.trim() || advisor.isLoading}
          >
            {advisor.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Send className="h-4 w-4 text-primary-foreground" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  // ── Mobile: Drawers ──
  if (isMobile) {
    return (
      <Card className="flex flex-col h-[calc(100dvh-10rem)] overflow-hidden bg-card/80 backdrop-blur-sm border-border/40">
        {chatColumn}

        {/* Left drawer */}
        <Sheet open={mobileLeftOpen} onOpenChange={setMobileLeftOpen}>
          <SheetContent side="left" className="w-[280px] p-0">
            <ProjectsSidebar
              activeProjectId={activeProject?.id || null}
              onSelectProject={handleSelectProject}
              onNewChat={handleNewChat}
            />
          </SheetContent>
        </Sheet>

        {/* Right drawer */}
        <Sheet open={mobileRightOpen} onOpenChange={setMobileRightOpen}>
          <SheetContent side="right" className="w-[280px] p-0">
            <ContextPanel activeProject={activeProject} />
          </SheetContent>
        </Sheet>
      </Card>
    );
  }

  // ── Desktop: 3-Column ──
  return (
    <Card className="flex h-[calc(100dvh-10rem)] overflow-hidden bg-card/80 backdrop-blur-sm border-border/40">
      {/* Left: Projects */}
      {showLeftPanel && (
        <div className="w-[260px] shrink-0">
          <ProjectsSidebar
            activeProjectId={activeProject?.id || null}
            onSelectProject={handleSelectProject}
            onNewChat={handleNewChat}
          />
        </div>
      )}

      {/* Center: Chat */}
      <div className="flex-1 min-w-0">
        {chatColumn}
      </div>

      {/* Right: Context */}
      {showRightPanel && (
        <div className="w-[280px] shrink-0">
          <ContextPanel activeProject={activeProject} />
        </div>
      )}
    </Card>
  );
}
