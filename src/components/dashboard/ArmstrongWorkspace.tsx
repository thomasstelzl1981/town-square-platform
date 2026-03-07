/**
 * ArmstrongWorkspace — Orchestrator
 * R-28: 479 → ~180 lines
 */
import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useArmstrongAdvisor } from '@/hooks/useArmstrongAdvisor';
import { useArmstrongVoice } from '@/hooks/useArmstrongVoice';
import { useArmstrongDocUpload } from '@/hooks/useArmstrongDocUpload';
import { useArmstrongProjects, type ArmstrongProject } from '@/hooks/useArmstrongProjects';
import { WorkspaceChatHeader } from '@/components/dashboard/workspace/WorkspaceChatHeader';
import { WorkspaceChatMessages } from '@/components/dashboard/workspace/WorkspaceChatMessages';
import { WorkspaceChatInput } from '@/components/dashboard/workspace/WorkspaceChatInput';
import { ProjectsSidebar } from '@/components/dashboard/workspace/ProjectsSidebar';
import { ContextPanel } from '@/components/dashboard/workspace/ContextPanel';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import type { OrbState } from '@/components/chat/ArmstrongOrb';

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

  const advisor = useArmstrongAdvisor({ projectId: activeProject?.id ?? null, dataMode: useMyData });
  const voice = useArmstrongVoice();
  const docUpload = useArmstrongDocUpload();

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
    if (value.startsWith('/')) { setShowSlashPicker(true); setSlashQuery(value.slice(1)); }
    else { setShowSlashPicker(false); setSlashQuery(''); }
  }, []);

  const handleSlashSelect = useCallback((action: any) => {
    setShowSlashPicker(false); setSlashQuery(''); setInput('');
    advisor.selectAction({
      action_code: action.action_code, title_de: action.title_de,
      execution_mode: action.execution_mode, risk_level: action.risk_level,
      cost_model: action.cost_model, credits_estimate: 0,
      cost_hint_cents: action.cost_hint_cents || 0, side_effects: action.side_effects || [], why: '',
    });
  }, [advisor]);

  const handleVoicePressStart = useCallback(() => voice.startListening(), [voice]);
  const handleVoicePressEnd = useCallback(() => {
    const transcript = voice.stopListening();
    if (transcript?.trim()) { setVoiceMode(true); advisor.sendMessage(transcript.trim()); }
  }, [voice, advisor]);
  const handleSpeak = useCallback((text: string) => {
    voice.isSpeaking ? voice.stopSpeaking() : voice.speakResponse(text);
  }, [voice]);

  const handleDocChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) { await docUpload.uploadAndParse(files[0]); e.target.value = ''; }
  };

  const handleSelectProject = (project: ArmstrongProject | null) => {
    setActiveProject(project);
    if (isMobile) setMobileLeftOpen(false);
  };
  const handleNewChat = () => {
    setActiveProject(null); advisor.clearConversation();
    if (isMobile) setMobileLeftOpen(false);
  };

  const hasMessages = advisor.messages.length > 0;
  const showOnboarding = !hasMessages && !activeProject;

  const orbState: OrbState = (() => {
    if (voice.isSpeaking) return 'speaking';
    if (advisor.isLoading && docUpload.isParsing) return 'working';
    if (advisor.isLoading) return 'thinking';
    if (advisor.isExecuting) return 'working';
    return 'idle';
  })();

  const orbStepLabel = docUpload.isParsing ? 'Dokument analysieren...'
    : advisor.isExecuting ? 'Aktion ausführen...'
    : advisor.isLoading ? 'Antwort formulieren...'
    : voice.isSpeaking ? 'Vorlesen...'
    : undefined;

  // ── Chat Column ──
  const chatColumn = (
    <div className="flex flex-col h-full min-w-0">
      <WorkspaceChatHeader
        activeProject={activeProject} hasMessages={hasMessages}
        showLeftPanel={showLeftPanel} showRightPanel={showRightPanel}
        isSpeaking={voice.isSpeaking}
        onToggleLeft={() => isMobile ? setMobileLeftOpen(true) : setShowLeftPanel(!showLeftPanel)}
        onToggleRight={() => isMobile ? setMobileRightOpen(true) : setShowRightPanel(!showRightPanel)}
        onStopSpeaking={() => voice.stopSpeaking()} onClear={advisor.clearConversation}
      />

      {voice.isRecording && (
        <div className="px-4 py-1.5 border-b border-primary/20 bg-primary/5 shrink-0">
          <p className="text-xs text-primary animate-pulse">{voice.transcript || 'Höre zu...'}</p>
        </div>
      )}

      <WorkspaceChatMessages
        messages={advisor.messages} showOnboarding={showOnboarding}
        orbState={orbState} orbStepLabel={orbStepLabel}
        isLoading={advisor.isLoading} isExecuting={advisor.isExecuting}
        isSpeaking={voice.isSpeaking} currentModule={advisor.currentModule}
        onActionSelect={advisor.selectAction} onConfirm={advisor.confirmAction}
        onCancel={advisor.cancelAction} onSpeak={handleSpeak} onSendEmail={advisor.sendEmail}
        onOnboardingChat={(msg) => { setInput(''); advisor.sendMessage(msg); }}
        onOnboardingNewProject={() => isMobile ? setMobileLeftOpen(true) : setShowLeftPanel(true)}
      />

      <WorkspaceChatInput
        input={input} isLoading={advisor.isLoading} isParsing={docUpload.isParsing}
        useMyData={useMyData} showSlashPicker={showSlashPicker} slashQuery={slashQuery}
        currentModule={advisor.currentModule} documentContext={docUpload.documentContext}
        attachedFile={docUpload.attachedFile}
        voice={{ isRecording: voice.isRecording, isConnecting: voice.isConnecting, isSpeaking: voice.isSpeaking, error: voice.error }}
        onInputChange={handleInputChange} onSend={handleSend}
        onSlashSelect={handleSlashSelect} onSlashClose={() => { setShowSlashPicker(false); setSlashQuery(''); }}
        onToggleData={() => setUseMyData(!useMyData)}
        onVoicePressStart={handleVoicePressStart} onVoicePressEnd={handleVoicePressEnd}
        onFileUpload={handleDocChange} onClearDocument={docUpload.clearDocument}
      />
    </div>
  );

  // ── Mobile: Drawers ──
  if (isMobile) {
    return (
      <Card className="flex flex-col h-[calc(100dvh-10rem)] overflow-hidden bg-card/80 backdrop-blur-sm border-border/40">
        {chatColumn}
        <Sheet open={mobileLeftOpen} onOpenChange={setMobileLeftOpen}>
          <SheetContent side="left" className="w-[280px] p-0">
            <ProjectsSidebar activeProjectId={activeProject?.id || null} onSelectProject={handleSelectProject} onNewChat={handleNewChat} />
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
          <ProjectsSidebar activeProjectId={activeProject?.id || null} onSelectProject={handleSelectProject} onNewChat={handleNewChat} />
        </div>
      )}
      <div className="flex-1 min-w-0">{chatColumn}</div>
      {showRightPanel && (
        <div className="w-[300px] shrink-0">
          <ContextPanel activeProject={activeProject} />
        </div>
      )}
    </Card>
  );
}
