/**
 * ArmstrongWorkspace — 3-Column Workspace for Dashboard Section 2
 * Left: Projects & Threads | Center: Chat | Right: Context & Sources
 * Mobile: Chat only, sidebars as drawers
 * 
 * v2: Project-chat isolation, data_mode toggle, multi-file upload, fixed onboarding
 */
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
import { WorkspaceOnboarding } from '@/components/dashboard/workspace/WorkspaceOnboarding';
import { SlashCommandPicker } from '@/components/dashboard/workspace/SlashCommandPicker';
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
  Database,
  Globe,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function ArmstrongWorkspace() {
  const isMobile = useIsMobile();
  const [input, setInput] = useState('');
  const [voiceMode, setVoiceMode] = useState(false);
  const [activeProject, setActiveProject] = useState<ArmstrongProject | null>(null);
  const [showLeftPanel, setShowLeftPanel] = useState(!isMobile);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [mobileLeftOpen, setMobileLeftOpen] = useState(false);
  const [mobileRightOpen, setMobileRightOpen] = useState(false);
  const [useMyData, setUseMyData] = useState(true);
  const [showSlashPicker, setShowSlashPicker] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');

  // Pass projectId + dataMode to advisor for isolation + data mode
  const advisor = useArmstrongAdvisor({
    projectId: activeProject?.id ?? null,
    dataMode: useMyData,
  });
  const voice = useArmstrongVoice();
  const docUpload = useArmstrongDocUpload();
  const { activeProjects } = useArmstrongProjects();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [advisor.messages]);

  const handleSend = useCallback(() => {
    if (!input.trim() || advisor.isLoading) return;
    setVoiceMode(false);
    setShowSlashPicker(false);
    setSlashQuery('');
    advisor.sendMessage(input.trim(), docUpload.documentContext || undefined);
    if (docUpload.documentContext) docUpload.clearDocument();
    setInput('');
  }, [input, advisor, docUpload]);

  const handleInputChange = useCallback((value: string) => {
    setInput(value);
    if (value.startsWith('/')) {
      setShowSlashPicker(true);
      setSlashQuery(value.slice(1));
    } else {
      setShowSlashPicker(false);
      setSlashQuery('');
    }
  }, []);

  const handleSlashSelect = useCallback((action: any) => {
    setShowSlashPicker(false);
    setSlashQuery('');
    setInput('');
    advisor.selectAction({
      action_code: action.action_code,
      title_de: action.title_de,
      execution_mode: action.execution_mode,
      risk_level: action.risk_level,
      cost_model: action.cost_model,
      credits_estimate: 0,
      cost_hint_cents: action.cost_hint_cents || 0,
      side_effects: action.side_effects || [],
      why: '',
    });
  }, [advisor]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSlashPicker) return;
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
    if (voice.isSpeaking) {
      voice.stopSpeaking();
    } else {
      voice.speakResponse(text);
    }
  }, [voice]);

  // Multi-file upload handler
  const handleDocChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    // Upload first file (sequential parsing, first file becomes context)
    // Future: queue all files
    await docUpload.uploadAndParse(files[0]);
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

  const handleOnboardingChat = (message: string) => {
    setInput('');
    advisor.sendMessage(message);
  };

  const handleOnboardingNewProject = () => {
    if (isMobile) setMobileLeftOpen(true);
    else setShowLeftPanel(true);
  };

  const hasMessages = advisor.messages.length > 0;
  // Fixed: Show onboarding when no messages AND no active project selected (not based on project count)
  const showOnboarding = !hasMessages && !activeProject;

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

  // Expanded file accept list — maximum coverage
  const FILE_ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,.gif,.bmp,.tiff,.tif,.docx,.doc,.csv,.xlsx,.xls,.pptx,.ppt,.txt,.md,.json,.xml,.yaml,.yml,.rtf,.odt,.ods,.odp,.html,.htm,.svg,.mp3,.wav,.m4a,.ogg,.mp4,.mov,.avi,.mkv,.zip,.rar,.7z';

  // ── Chat Column (Center) ──
  const chatColumn = (
    <div className="flex flex-col h-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30 shrink-0">
        <div className="flex items-center gap-3">
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
          {!hasMessages && showOnboarding && (
            <WorkspaceOnboarding
              onNewProject={handleOnboardingNewProject}
              onStartChat={handleOnboardingChat}
            />
          )}

          {!hasMessages && !showOnboarding && (
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
        accept={FILE_ACCEPT}
        multiple
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
        <div className="max-w-3xl mx-auto relative">
          {/* Slash command picker */}
          {showSlashPicker && (
            <SlashCommandPicker
              query={slashQuery}
              currentModule={advisor.currentModule}
              onSelect={handleSlashSelect}
              onClose={() => { setShowSlashPicker(false); setSlashQuery(''); }}
            />
          )}

          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-muted/40 border border-border/20">
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
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={docUpload.documentContext ? 'Frage zum Dokument...' : 'Nachricht an Armstrong... (/ für Aktionen)'}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-9 text-sm"
              disabled={advisor.isLoading}
            />

            {/* Data mode toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={cn(
                      'shrink-0 p-1.5 rounded-full transition-colors',
                      useMyData ? 'text-primary bg-primary/10' : 'text-muted-foreground'
                    )}
                    onClick={() => setUseMyData(!useMyData)}
                  >
                    {useMyData ? <Database className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {useMyData ? 'Mit deinen Daten arbeiten (aktiv)' : 'Allgemeiner Modus (ohne Daten)'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

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
    </div>
  );

  // ── Mobile: Drawers ──
  if (isMobile) {
    return (
      <Card className="flex flex-col h-[calc(100dvh-10rem)] overflow-hidden bg-card/80 backdrop-blur-sm border-border/40">
        {chatColumn}

        <Sheet open={mobileLeftOpen} onOpenChange={setMobileLeftOpen}>
          <SheetContent side="left" className="w-[280px] p-0">
            <ProjectsSidebar
              activeProjectId={activeProject?.id || null}
              onSelectProject={handleSelectProject}
              onNewChat={handleNewChat}
            />
          </SheetContent>
        </Sheet>

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
      {showLeftPanel && (
        <div className="w-[260px] shrink-0">
          <ProjectsSidebar
            activeProjectId={activeProject?.id || null}
            onSelectProject={handleSelectProject}
            onNewChat={handleNewChat}
          />
        </div>
      )}

      <div className="flex-1 min-w-0">
        {chatColumn}
      </div>

      {showRightPanel && (
        <div className="w-[280px] shrink-0">
          <ContextPanel activeProject={activeProject} />
        </div>
      )}
    </Card>
  );
}
