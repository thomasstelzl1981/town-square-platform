/**
 * WorkspaceChatMessages — Message list + onboarding + empty state + loading orb
 * Extracted from ArmstrongWorkspace R-28
 */
import { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageRenderer } from '@/components/chat/MessageRenderer';
import { ArmstrongChipBar } from '@/components/chat/ArmstrongChipBar';
import { MessageSquare } from 'lucide-react';
import { WorkspaceOnboarding } from './WorkspaceOnboarding';

import type { ChatMessage } from '@/hooks/useArmstrongAdvisor';

interface Props {
  messages: ChatMessage[];
  showOnboarding: boolean;
  orbStepLabel?: string;
  isLoading: boolean;
  isExecuting: boolean;
  isSpeaking: boolean;
  currentModule: string | null;
  onActionSelect: (action: any) => void;
  onConfirm: (actionCode: string, params?: Record<string, unknown>) => void;
  onCancel: () => void;
  onSpeak: (text: string) => void;
  onSendEmail: (params: any) => void;
  onOnboardingChat: (message: string) => void;
  onOnboardingNewProject: () => void;
}

export function WorkspaceChatMessages({
  messages, showOnboarding, orbStepLabel,
  isLoading, isExecuting, isSpeaking, currentModule,
  onActionSelect, onConfirm, onCancel, onSpeak, onSendEmail,
  onOnboardingChat, onOnboardingNewProject,
}: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasMessages = messages.length > 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <>
      {/* Voice recording indicator is rendered by parent */}

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
          {!hasMessages && showOnboarding && (
            <WorkspaceOnboarding
              onNewProject={onOnboardingNewProject}
              onStartChat={onOnboardingChat}
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

          {messages.map((message) => (
            <MessageRenderer
              key={message.id}
              message={message}
              onActionSelect={onActionSelect}
              onConfirm={onConfirm}
              onCancel={onCancel}
              isExecuting={isExecuting}
              onSpeak={onSpeak}
              isSpeaking={isSpeaking}
              onSendEmail={onSendEmail}
            />
          ))}

          {(isLoading || isExecuting) && (
            <div className="flex items-center gap-3 py-2">
              <ArmstrongOrb state={orbState} size={24} stepLabel={orbStepLabel} />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Quick chips when empty */}
      {!hasMessages && (
        <div className="px-4 pb-2 shrink-0">
          <div className="max-w-3xl mx-auto">
            <ArmstrongChipBar
              moduleCode={currentModule}
              website={null}
              onChipClick={(actionCode, label) => {
                onActionSelect({
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
              disabled={isLoading}
              maxChips={4}
            />
          </div>
        </div>
      )}
    </>
  );
}
