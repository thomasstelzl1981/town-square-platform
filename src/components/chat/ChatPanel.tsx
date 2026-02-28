import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VoiceButton } from "@/components/shared/VoiceButton";
import { useArmstrongVoice } from "@/hooks/useArmstrongVoice";
import { useArmstrongAdvisor } from "@/hooks/useArmstrongAdvisor";
import { useArmstrongDocUpload } from "@/hooks/useArmstrongDocUpload";
import { MessageRenderer } from "@/components/chat/MessageRenderer";
import { ArmstrongChipBar } from "@/components/chat/ArmstrongChipBar";
import { ArmstrongOrb, type OrbState } from "@/components/chat/ArmstrongOrb";
import { 
  Send, 
  X, 
  Minus,
  Loader2,
  Trash2,
  Paperclip,
  Volume2,
  VolumeX
} from "lucide-react";

export interface ChatContext {
  zone?: string;
  module?: string;
  entity?: string;
}

export interface QuickAction {
  label: string;
  action: string;
  icon?: React.ReactNode;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ChatPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  context?: ChatContext;
  quickActions?: QuickAction[];
  messages?: ChatMessage[];
  position?: "docked" | "drawer" | "bottomsheet" | "fullscreen" | "compact";
  onSend?: (message: string) => void;
  onQuickAction?: (action: string) => void;
  onFileUpload?: (files: File[]) => void;
  onClose?: () => void;
  onToggleSize?: () => void;
  isMinimized?: boolean;
}

const MODULE_MAP: Record<string, string> = {
  'Portfolio': 'MOD_04',
  'Immobilien': 'MOD_04',
  'Finanzierung': 'MOD_07',
  'Projekte': 'MOD_13',
  'Pv': 'MOD_14',
  'Services': 'MOD_16',
};

function detectWebsite(): string | null {
  const path = window.location.pathname.toLowerCase();
  if (path.startsWith('/website/kaufy') || path.startsWith('/kaufy')) return 'kaufy';
  if (path.startsWith('/website/futureroom') || path.startsWith('/futureroom')) return 'futureroom';
  if (path.startsWith('/website/sot') || path.startsWith('/sot')) return 'sot';
  return null;
}

const ChatPanel = React.forwardRef<HTMLDivElement, ChatPanelProps>(
  (
    {
      className,
      context,
      quickActions = [],
      messages: externalMessages,
      position = "compact",
      onSend: externalOnSend,
      onQuickAction,
      onFileUpload,
      onClose,
      onToggleSize,
      isMinimized = false,
      ...props
    },
    ref
  ) => {
    const [input, setInput] = React.useState("");
    const [voiceMode, setVoiceMode] = React.useState(false);
    const prevMessagesLenRef = React.useRef(0);
    const prevListeningRef = React.useRef(false);
    
    const docUpload = useArmstrongDocUpload();
    const advisor = useArmstrongAdvisor();
    const voice = useArmstrongVoice();

    // Auto-send transcript when user stops speaking
    React.useEffect(() => {
      if (prevListeningRef.current && !voice.isListening && voice.transcript.trim()) {
        setVoiceMode(true);
        advisor.sendMessage(voice.transcript.trim());
      }
      prevListeningRef.current = voice.isListening;
    }, [voice.isListening, voice.transcript]);

    React.useEffect(() => {
      prevMessagesLenRef.current = advisor.messages.length;
    }, [advisor.messages]);

    const handleVoiceToggle = React.useCallback(() => {
      if (voice.isListening) {
        voice.stopListening();
      } else {
        voice.startListening();
      }
    }, [voice]);

    const handleDocumentForAnalysis = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await docUpload.uploadAndParse(file);
      e.target.value = '';
    };
    
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);
    const docInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [advisor.messages]);

    const handleSend = () => {
      if (input.trim()) {
        setVoiceMode(false);
        if (externalOnSend) {
          externalOnSend(input.trim());
        } else {
          advisor.sendMessage(input.trim(), docUpload.documentContext || undefined);
          if (docUpload.documentContext) {
            docUpload.clearDocument();
          }
        }
        setInput("");
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };

    const handleSpeak = React.useCallback((text: string) => {
      if (voice.isSpeaking) {
        voice.stopSpeaking();
      } else {
        voice.speakResponse(text);
      }
    }, [voice]);

    // Derive orb state
    const orbState: OrbState = React.useMemo(() => {
      if (voice.isSpeaking) return 'speaking';
      if (advisor.isLoading && docUpload.isParsing) return 'working';
      if (advisor.isLoading) return 'thinking';
      if (advisor.isExecuting) return 'working';
      return 'idle';
    }, [voice.isSpeaking, advisor.isLoading, advisor.isExecuting, docUpload.isParsing]);

    const orbStepLabel = React.useMemo(() => {
      if (docUpload.isParsing) return 'Dokument analysieren...';
      if (advisor.isExecuting) return 'Aktion ausführen...';
      if (advisor.isLoading) return 'Antwort formulieren...';
      if (voice.isSpeaking) return 'Vorlesen...';
      return undefined;
    }, [docUpload.isParsing, advisor.isExecuting, advisor.isLoading, voice.isSpeaking]);

    const isCompact = position === 'compact';
    const displayMessages = externalMessages || advisor.messages;
    const contextPath = [context?.zone, context?.module, context?.entity].filter(Boolean).join(" > ");

    const positionClasses = {
      docked: "h-full w-[var(--chat-panel-width)] border-l",
      drawer: "fixed right-0 top-0 h-full w-[var(--chat-panel-width)] animate-slide-in-right shadow-elevated z-50",
      bottomsheet: "fixed bottom-0 left-0 right-0 h-[50vh] rounded-t-xl animate-slide-in-bottom shadow-elevated z-50",
      fullscreen: "fixed inset-0 z-50",
      compact: "fixed bottom-20 right-5 w-[380px] max-h-[420px] rounded-2xl shadow-elevated z-50 animate-fade-in",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col bg-sidebar border border-border/50",
          positionClasses[position],
          isCompact && "backdrop-blur-xl",
          className
        )}
        {...props}
      >
        {/* Minimal Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
          <div className="flex items-center gap-2.5">
            <ArmstrongOrb state={orbState} size={20} />
            <span className="text-sm font-semibold">Armstrong</span>
            {contextPath && (
              <span className="text-[10px] text-muted-foreground truncate max-w-[120px]" title={contextPath}>
                {context?.module || ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            {/* TTS global toggle */}
            {voice.isSpeaking && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-primary"
                onClick={() => voice.stopSpeaking()}
                title="Vorlesen stoppen"
              >
                <VolumeX className="h-3.5 w-3.5" />
              </Button>
            )}
            {displayMessages.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0"
                onClick={advisor.clearConversation}
                title="Gespräch löschen"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
            {onToggleSize && (
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onToggleSize}>
                <Minus className="h-3.5 w-3.5" />
              </Button>
            )}
            {onClose && (
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Voice transcript — compact */}
        {voice.isListening && (
          <div className="px-3 py-1.5 border-b border-primary/20 bg-primary/5">
            <p className="text-[11px] text-primary animate-pulse">
              {voice.transcript || 'Höre zu...'}
            </p>
          </div>
        )}

        {/* Messages */}
        <ScrollArea className={cn("flex-1 px-3 py-3", isCompact && "max-h-[280px]")} ref={scrollRef}>
          <div className="space-y-3">
            {displayMessages.length === 0 ? null : (
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
                
                {/* Working indicator with Orb */}
                {(advisor.isLoading || advisor.isExecuting) && (
                  <div className="flex items-center gap-3 py-2">
                    <ArmstrongOrb state={orbState} size={24} stepLabel={orbStepLabel} />
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </ScrollArea>

        {/* Attached Document — minimal */}
        {docUpload.attachedFile && !docUpload.isParsing && (
          <div className="px-3 py-1.5 border-t border-border/30">
            <div className="flex items-center gap-2 text-[11px] bg-primary/5 rounded-lg px-2 py-1">
              <Paperclip className="h-3 w-3 text-primary shrink-0" />
              <span className="truncate flex-1 font-medium">{docUpload.attachedFile.name}</span>
              <button onClick={docUpload.clearDocument} className="shrink-0 text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </div>
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

        {/* Quick Action Chips — only when chat empty */}
        {displayMessages.length === 0 && (
          <ArmstrongChipBar
            moduleCode={advisor.currentModule}
            website={detectWebsite()}
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
            maxChips={3}
          />
        )}

        {/* Input Bar */}
        <div className="p-2 border-t border-border/30">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/40">
            <VoiceButton
              isListening={voice.isListening}
              isProcessing={voice.isProcessing}
              isSpeaking={voice.isSpeaking}
              isConnected={voice.isConnected}
              error={voice.error}
              onToggle={handleVoiceToggle}
              size="md"
            />

            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 w-7 p-0 rounded-full shrink-0",
                docUpload.documentContext ? "text-primary" : "text-muted-foreground"
              )}
              onClick={() => docInputRef.current?.click()}
              disabled={advisor.isLoading || docUpload.isParsing}
              title="Dokument anhängen"
            >
              <Paperclip className="h-3.5 w-3.5" />
            </Button>
            
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={docUpload.documentContext ? "Frage zum Dokument..." : "Nachricht..."}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-8 text-sm"
              disabled={advisor.isLoading}
            />
            <Button
              size="sm"
              className={cn(
                "h-7 w-7 p-0 rounded-full transition-all shrink-0",
                input.trim() && !advisor.isLoading
                  ? "bg-gradient-to-br from-[hsl(200_85%_45%)] to-[hsl(210_90%_30%)] hover:opacity-90" 
                  : "bg-muted"
              )}
              onClick={handleSend}
              disabled={!input.trim() || advisor.isLoading}
            >
              {advisor.isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              ) : (
                <Send className="h-3.5 w-3.5 text-white" />
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }
);
ChatPanel.displayName = "ChatPanel";

export { ChatPanel };
