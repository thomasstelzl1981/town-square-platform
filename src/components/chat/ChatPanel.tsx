import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileUploader } from "@/components/shared/FileUploader";
import { VoiceButton } from "@/components/armstrong/VoiceButton";
import { useArmstrongVoice } from "@/hooks/useArmstrongVoice";
import { useArmstrongAdvisor } from "@/hooks/useArmstrongAdvisor";
import { MessageRenderer } from "@/components/chat/MessageRenderer";
import { 
  Send, 
  X, 
  Minimize2, 
  Maximize2,
  Sparkles,
  Upload,
  Globe,
  Loader2,
  Trash2
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
    const [uploadedFiles, setUploadedFiles] = React.useState<File[]>([]);
    
    // Armstrong Advisor integration
    const advisor = useArmstrongAdvisor();
    
    // Voice integration
    const voice = useArmstrongVoice();

    const handleVoiceToggle = React.useCallback(() => {
      if (voice.isListening) {
        voice.stopListening();
      } else {
        voice.startListening();
      }
    }, [voice]);

    const handleFilesSelected = (files: File[]) => {
      setUploadedFiles(prev => [...prev, ...files]);
      onFileUpload?.(files);
    };

    const removeFile = (index: number) => {
      setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };
    
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    React.useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [advisor.messages]);

    const handleSend = () => {
      if (input.trim()) {
        // Use advisor if no external handler provided
        if (externalOnSend) {
          externalOnSend(input.trim());
        } else {
          advisor.sendMessage(input.trim());
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

    // Context breadcrumb
    const contextPath = [context?.zone, context?.module, context?.entity]
      .filter(Boolean)
      .join(" > ");

    // Use internal messages from advisor, or external if provided
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
                <Globe className="h-4 w-4 text-primary" />
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
              {/* Clear conversation button */}
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
            {displayMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[hsl(200_85%_45%)] via-[hsl(140_45%_40%)] to-[hsl(210_90%_30%)] opacity-60 flex items-center justify-center mb-3">
                  <Globe className="h-5 w-5 text-white" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Wie kann ich Ihnen helfen?
                </p>
                {!advisor.isInMvpScope && context?.module && (
                  <p className="text-xs text-muted-foreground/60 mt-2">
                    Modul {context.module} – nur Erklärungen verfügbar
                  </p>
                )}
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
                
                {/* Loading indicator */}
                {advisor.isLoading && (
                  <div className="flex gap-3">
                    <div className="flex items-center justify-center h-7 w-7 rounded-full shrink-0 bg-gradient-to-br from-[hsl(200_85%_45%/0.2)] to-[hsl(140_45%_40%/0.2)]">
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
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer py-1">
              <Upload className="h-3.5 w-3.5" />
              <span>Upload</span>
            </div>
          </FileUploader>
          {uploadedFiles.length > 0 && (
            <div className="mt-2 space-y-1">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between text-xs bg-muted rounded px-2 py-1">
                  <span className="truncate max-w-[100px]">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input - Floating iOS Style with Voice Button */}
        <div className="p-3">
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-muted/50 backdrop-blur-sm">
            {/* Voice Button - Prominent Left Position */}
            <VoiceButton
              isListening={voice.isListening}
              isProcessing={voice.isProcessing}
              isSpeaking={voice.isSpeaking}
              isConnected={voice.isConnected}
              error={voice.error}
              onToggle={handleVoiceToggle}
              size="md"
            />
            
            <div className="relative flex-1">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nachricht eingeben..."
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
