/**
 * MobileHomeChatView — Full-screen Armstrong chat messages for mobile home
 * 
 * Only renders the chat message list. The input bar and area buttons
 * are now in MobileBottomBar (always visible across all mobile views).
 */

import * as React from 'react';
import { useArmstrongAdvisor } from '@/hooks/useArmstrongAdvisor';
import { useArmstrongVoice } from '@/hooks/useArmstrongVoice'; // kept for future manual TTS button
import { MessageRenderer } from '@/components/chat/MessageRenderer';
import { 
  Globe, 
  Loader2,
  Trash2,
  ArrowLeft
} from 'lucide-react';

interface MobileHomeChatViewProps {
  onBackToModules?: () => void;
}

export function MobileHomeChatView({ onBackToModules }: MobileHomeChatViewProps) {
  const advisor = useArmstrongAdvisor();
  const voice = useArmstrongVoice();
  
  // voiceMode removed — auto-speak disabled
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const prevMessagesLenRef = React.useRef(0);

  // Auto-scroll on new messages
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [advisor.messages]);

  // Track message count (auto-speak removed — user must click to hear)
  React.useEffect(() => {
    prevMessagesLenRef.current = advisor.messages.length;
  }, [advisor.messages]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Back to modules button */}
      {onBackToModules && (
        <div className="px-4 pt-2 pb-1">
          <button
            onClick={onBackToModules}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Zurück</span>
          </button>
        </div>
      )}

      {/* Chat Messages — full available space */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {advisor.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-sm text-muted-foreground">
              Wie kann ich Ihnen helfen?
            </p>
          </div>
        ) : (
          <div className="space-y-4">
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
                <div className="flex items-center justify-center h-7 w-7 rounded-full shrink-0 bg-gradient-to-br from-[hsl(var(--primary)/0.2)] to-[hsl(var(--primary)/0.1)]">
                  <Globe className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="rounded-2xl px-3.5 py-2.5 text-sm armstrong-message-assistant">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Armstrong denkt nach...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Clear conversation button — only when messages exist */}
      {advisor.messages.length > 0 && (
        <div className="flex justify-center pb-1">
          <button
            onClick={advisor.clearConversation}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1 rounded-full bg-muted/30"
          >
            <Trash2 className="h-3 w-3" />
            Neues Gespräch
          </button>
        </div>
      )}
    </div>
  );
}
