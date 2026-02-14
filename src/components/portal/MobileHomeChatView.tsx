/**
 * MobileHomeChatView — Full-screen Armstrong chat for mobile home
 * 
 * Replaces the widget dashboard on mobile with a ChatGPT-style
 * full-page chat interface. Area navigation buttons sit above
 * the input bar. Voice + text input integrated.
 */

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { usePortalLayout } from '@/hooks/usePortalLayout';
import { useArmstrongAdvisor } from '@/hooks/useArmstrongAdvisor';
import { useArmstrongVoice } from '@/hooks/useArmstrongVoice';
import { MessageRenderer } from '@/components/chat/MessageRenderer';
import { VoiceButton } from '@/components/armstrong/VoiceButton';
import { areaConfig, type AreaKey } from '@/manifests/areaConfig';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Send, 
  Globe, 
  Loader2,
  Database, 
  Rocket, 
  Wrench, 
  LayoutGrid,
  Trash2
} from 'lucide-react';

const areaIcons: Record<AreaKey, React.ElementType> = {
  base: Database,
  missions: Rocket,
  operations: Wrench,
  services: LayoutGrid,
};

export function MobileHomeChatView() {
  const navigate = useNavigate();
  const { setActiveArea, setMobileNavView, setSelectedMobileModule } = usePortalLayout();
  const advisor = useArmstrongAdvisor();
  const voice = useArmstrongVoice();
  
  const [input, setInput] = React.useState('');
  const [voiceMode, setVoiceMode] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const prevListeningRef = React.useRef(false);
  const prevMessagesLenRef = React.useRef(0);

  // Auto-scroll on new messages
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [advisor.messages]);

  // Auto-send transcript when user stops speaking
  React.useEffect(() => {
    if (prevListeningRef.current && !voice.isListening && voice.transcript.trim()) {
      setVoiceMode(true);
      advisor.sendMessage(voice.transcript.trim());
    }
    prevListeningRef.current = voice.isListening;
  }, [voice.isListening, voice.transcript]);

  // Auto-speak new assistant messages in voice mode
  React.useEffect(() => {
    const msgs = advisor.messages;
    if (voiceMode && msgs.length > prevMessagesLenRef.current) {
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg?.role === 'assistant' && lastMsg.content) {
        voice.speakResponse(lastMsg.content);
      }
    }
    prevMessagesLenRef.current = msgs.length;
  }, [advisor.messages, voiceMode]);

  const handleSend = () => {
    if (input.trim() && !advisor.isLoading) {
      setVoiceMode(false);
      advisor.sendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceToggle = React.useCallback(() => {
    if (voice.isListening) {
      voice.stopListening();
    } else {
      voice.startListening();
    }
  }, [voice]);

  const handleAreaClick = (areaKey: AreaKey) => {
    setActiveArea(areaKey);
    setMobileNavView('modules');
    setSelectedMobileModule(null);
    navigate(`/portal/area/${areaKey}`);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Chat Messages — full available space */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {advisor.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="armstrong-planet h-16 w-16 flex items-center justify-center mb-4">
              <Globe className="h-7 w-7 text-white/80" />
            </div>
            <p className="text-lg font-medium text-foreground mb-1">Armstrong</p>
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

      {/* Area Navigation Buttons — glass pills above input */}
      <div className="px-3 pb-2 pt-1">
        <div className="flex items-center justify-around gap-1">
          {areaConfig.map((area) => {
            const Icon = areaIcons[area.key];
            return (
              <button
                key={area.key}
                onClick={() => handleAreaClick(area.key)}
                className={cn(
                  'flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all active:scale-95',
                  'nav-tab-glass text-muted-foreground hover:text-foreground',
                  'min-w-[60px]'
                )}
              >
                <Icon className="h-5 w-5 mb-0.5" />
                <span className="text-[10px] font-medium leading-tight">{area.labelShort}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Input Bar — [Mic] [Input] [Send] */}
      <div 
        className="px-3 pb-2"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-muted/50 backdrop-blur-sm border border-border/30">
          <VoiceButton
            isListening={voice.isListening}
            isProcessing={voice.isProcessing}
            isSpeaking={voice.isSpeaking}
            isConnected={voice.isConnected}
            error={voice.error}
            onToggle={handleVoiceToggle}
            size="md"
          />
          
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nachricht eingeben..."
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
}
