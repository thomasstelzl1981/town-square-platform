import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileUploader } from "@/components/shared/FileUploader";
import { 
  Bot, 
  Send, 
  Mic, 
  X, 
  Minimize2, 
  Maximize2,
  Sparkles,
  Upload
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
      messages = [],
      position = "docked",
      onSend,
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

    const handleFilesSelected = (files: File[]) => {
      setUploadedFiles(prev => [...prev, ...files]);
      onFileUpload?.(files);
    };

    const removeFile = (index: number) => {
      setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const handleSend = () => {
      if (input.trim() && onSend) {
        onSend(input.trim());
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

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col bg-sidebar",
          positionClasses[position],
          className
        )}
        {...props}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Armstrong</h3>
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-status-success" />
                <span className="text-xs text-muted-foreground">Online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
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

        {/* Context Badge */}
        {contextPath && (
          <div className="px-4 py-2 border-b">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="truncate">{contextPath}</span>
            </div>
          </div>
        )}


        {/* Messages */}
        <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <Bot className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Wie kann ich Ihnen helfen?
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" && "flex-row-reverse"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center h-7 w-7 rounded-full shrink-0",
                      message.role === "assistant"
                        ? "bg-primary/10"
                        : "bg-muted"
                    )}
                  >
                    {message.role === "assistant" ? (
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <span className="text-xs font-medium">Du</span>
                    )}
                  </div>
                  <div
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm max-w-[85%]",
                      message.role === "assistant"
                        ? "bg-muted"
                        : "bg-primary text-primary-foreground"
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              ))
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

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nachricht eingeben..."
                className="pr-10"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                title="Spracheingabe (Whisperflow)"
              >
                <Mic className="h-4 w-4" />
              </Button>
            </div>
            <Button
              size="sm"
              className="h-9 w-9 p-0"
              onClick={handleSend}
              disabled={!input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }
);
ChatPanel.displayName = "ChatPanel";

export { ChatPanel };
