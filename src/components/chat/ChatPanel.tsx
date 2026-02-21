import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileUploader } from "@/components/shared/FileUploader";
import { UploadResultCard } from "@/components/shared/UploadResultCard";
import { VoiceButton } from "@/components/armstrong/VoiceButton";
import { useArmstrongVoice } from "@/hooks/useArmstrongVoice";
import { useArmstrongAdvisor } from "@/hooks/useArmstrongAdvisor";
import { useArmstrongDocUpload } from "@/hooks/useArmstrongDocUpload";
import { MessageRenderer } from "@/components/chat/MessageRenderer";
import { ArmstrongChipBar } from "@/components/chat/ArmstrongChipBar";
import { useUniversalUpload } from "@/hooks/useUniversalUpload";
import type { UploadedFileInfo } from "@/hooks/useUniversalUpload";
import { 
  Send, 
  X, 
  Minimize2, 
  Maximize2,
  Sparkles,
  Upload,
  Rocket,
  Loader2,
  Trash2,
  FileText,
  Paperclip
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
  position?: "docked" | "drawer" | "bottomsheet" | "fullscreen";
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

/** Detect Zone 3 website from current pathname */
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
      position = "docked",
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
    
    // Universal upload hook (for DMS storage uploads)
    const { upload: universalUpload, uploadedFiles, clearUploadedFiles, isUploading } = useUniversalUpload();
    
    // Document analysis hook (for Armstrong chat context)
    const docUpload = useArmstrongDocUpload();
    
    // Armstrong Advisor integration
    const advisor = useArmstrongAdvisor();
    
    // Voice integration
    const voice = useArmstrongVoice();

    // Auto-send transcript when user stops speaking
    React.useEffect(() => {
      if (prevListeningRef.current && !voice.isListening && voice.transcript.trim()) {
        setVoiceMode(true);
        advisor.sendMessage(voice.transcript.trim());
      }
      prevListeningRef.current = voice.isListening;
    }, [voice.isListening, voice.transcript]);

    // Track message count (auto-speak removed — user must click to hear)
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

    const handleFilesSelected = async (files: File[]) => {
      const moduleCode = context?.module ? MODULE_MAP[context.module] : undefined;
      
      for (const file of files) {
        await universalUpload(file, {
          moduleCode,
          source: 'armstrong_chat',
          triggerAI: false,
        });
      }
      
      onFileUpload?.(files);
    };

    /** Handle document upload for Armstrong analysis */
    const handleDocumentForAnalysis = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await docUpload.uploadAndParse(file);
      // Reset input
      e.target.value = '';
    };
    
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);
    const docInputRef = React.useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom when new messages arrive
    React.useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [advisor.messages]);

    const handleSend = () => {
      if (input.trim()) {
        setVoiceMode(false);
        if (externalOnSend) {
          externalOnSend(input.trim());
        } else {
          // Send with document context if attached
          advisor.sendMessage(input.trim(), docUpload.documentContext || undefined);
          // Clear document after sending
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

    const positionClasses = {
      docked: "h-full w-[var(--chat-panel-width)] border-l",
      drawer: "fixed right-0 top-0 h-full w-[var(--chat-panel-width)] animate-slide-in-right shadow-elevated z-50",
      bottomsheet: "fixed bottom-0 left-0 right-0 h-[70vh] rounded-t-xl animate-slide-in-bottom shadow-elevated z-50",
      fullscreen: "fixed inset-0 z-50",
    };

    const contextPath = [context?.zone, context?.module, context?.entity]
      .filter(Boolean)
      .join(" > ");

    const displayMessages = externalMessages || advisor.messages;

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col",
          position !== "docked" && "bg-sidebar",
          positionClasses[position],
          className
        )}
        {...props}
      >
        {/* Header - Only show when NOT docked */}
        {position !== "docked" && (
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
                <Rocket className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Armstrong</h3>
                <div className="flex items-center gap-1">
                  <span className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    advisor.isLoading ? "bg-status-warning animate-pulse" : "bg-status-success"
                  )} />
                  <span className="text-xs text-muted-foreground">
                    {advisor.isLoading ? "Denkt nach..." : "Online"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {displayMessages.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={advisor.clearConversation}
                  title="Gespräch löschen"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              {onToggleSize && (
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onToggleSize}>
                  {isMinimized ? (
                    <Maximize2 className="h-4 w-4" />
                  ) : (
                    <Minimize2 className="h-4 w-4" />
                  )}
                </Button>
              )}
              {onClose && (
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Context Badge */}
        {contextPath && (
          <div className="px-4 py-2 border-b">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="truncate">{contextPath}</span>
              {advisor.currentModule && (
                <span className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded">
                  {advisor.currentModule}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Voice transcript display */}
        {(voice.isListening || voice.transcript || voice.assistantTranscript) && (
          <div className="px-4 py-2 border-b bg-primary/5">
            {voice.transcript && (
              <p className="text-xs text-muted-foreground mb-1">
                <span className="font-medium">Du:</span> {voice.transcript}
              </p>
            )}
            {voice.assistantTranscript && (
              <p className="text-xs text-primary">
                <span className="font-medium">Armstrong:</span> {voice.assistantTranscript}
              </p>
            )}
            {voice.isListening && !voice.transcript && (
              <p className="text-xs text-muted-foreground animate-pulse">
                Höre zu...
              </p>
            )}
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef}>
          <div className="space-y-4">
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
                  />
                ))}
                
                {/* Loading indicator */}
                {advisor.isLoading && (
                  <div className="flex gap-3">
                    <div className="flex items-center justify-center h-7 w-7 rounded-full shrink-0 bg-gradient-to-br from-[hsl(200_85%_45%/0.2)] to-[hsl(140_45%_40%/0.2)]">
                      <Rocket className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="rounded-2xl px-3.5 py-2.5 text-sm armstrong-message-assistant">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{docUpload.isParsing ? "Dokument wird analysiert..." : "Armstrong denkt nach..."}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </ScrollArea>

        {/* Upload Zone - Compact */}
        <div className="px-4 py-2 border-t">
          <FileUploader
            onFilesSelected={handleFilesSelected}
            accept=".pdf,.xlsx,.xls,.doc,.docx,.png,.jpg,.jpeg"
            multiple
            className="text-xs"
            disabled={isUploading}
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer py-1">
              {isUploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Wird hochgeladen...</span>
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload (DMS)</span>
                </>
              )}
            </div>
          </FileUploader>
          {uploadedFiles.length > 0 && (
            <div className="mt-2 space-y-1">
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
                className="text-xs h-6 w-full"
                onClick={clearUploadedFiles}
              >
                Liste leeren
              </Button>
            </div>
          )}
        </div>

        {/* Attached Document Preview */}
        {(docUpload.attachedFile || docUpload.isParsing || docUpload.parseError) && (
          <div className="px-4 py-2 border-t">
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
              <div className="space-y-1.5">
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
                {/* Proactive Magic Intake suggestion */}
                {docUpload.documentContext?.suggestedIntake && (
                  <button
                    onClick={() => {
                      const intake = docUpload.documentContext!.suggestedIntake!;
                      advisor.selectAction({
                        action_code: intake.action_code,
                        title_de: intake.label,
                        execution_mode: 'execute_with_confirmation',
                        risk_level: 'medium',
                        cost_model: 'metered',
                        credits_estimate: 2,
                        cost_hint_cents: 50,
                        side_effects: ['credits_consumed'],
                        why: 'Automatisch erkannter Dokumenttyp',
                      });
                    }}
                    disabled={advisor.isLoading}
                    className="w-full flex items-center gap-2 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-lg px-2.5 py-2 transition-colors text-left"
                  >
                    <Sparkles className="h-3.5 w-3.5 shrink-0" />
                    <span className="font-medium">{docUpload.documentContext.suggestedIntake.label}</span>
                    <span className="ml-auto text-[10px] text-primary/60">Vorschlag</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Hidden file input for document analysis */}
        <input
          ref={docInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.doc,.csv,.xlsx,.xls"
          className="hidden"
          onChange={handleDocumentForAnalysis}
        />

        {/* Quick Action Chips */}
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
        />

        {/* Input - Floating iOS Style with Voice Button + Document Attach */}
        <div className="p-3">
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-muted/50 backdrop-blur-sm">
            <VoiceButton
              isListening={voice.isListening}
              isProcessing={voice.isProcessing}
              isSpeaking={voice.isSpeaking}
              isConnected={voice.isConnected}
              error={voice.error}
              onToggle={handleVoiceToggle}
              size="md"
            />

            {/* Document attach button */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0 rounded-full shrink-0",
                docUpload.documentContext ? "text-primary" : "text-muted-foreground"
              )}
              onClick={() => docInputRef.current?.click()}
              disabled={advisor.isLoading || docUpload.isParsing}
              title="Dokument für Analyse anhängen"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            
            <div className="relative flex-1">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={docUpload.documentContext 
                  ? "Frage zum Dokument stellen..." 
                  : "Nachricht eingeben..."
                }
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                disabled={advisor.isLoading}
              />
            </div>
            <Button
              size="sm"
              className={cn(
                "h-8 w-8 p-0 rounded-full transition-all",
                input.trim() && !advisor.isLoading
                  ? "bg-gradient-to-br from-[hsl(200_85%_45%)] to-[hsl(210_90%_30%)] hover:opacity-90" 
                  : "bg-muted"
              )}
              onClick={handleSend}
              disabled={!input.trim() || advisor.isLoading}
            >
              {advisor.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <Send className="h-4 w-4 text-white" />
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
