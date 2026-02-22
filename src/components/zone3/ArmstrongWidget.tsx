/**
 * ArmstrongWidget — Zone 3 Embedded Chat Bubble
 * 
 * Lightweight chat widget for public websites (KAUFY, MIETY, SoT, FutureRoom).
 * Limited to FAQ, public knowledge, and lead capture — no tenant data access.
 * 
 * Mobile: Fixed InputBar at bottom + Drawer (Bottom-Sheet) for chat
 * Desktop: Floating bubble + panel (unchanged)
 */
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  MessageCircle, 
  X, 
  Send, 
  Minimize2,
  Bot,
  Calculator,
  HelpCircle,
  Mail,
  ArrowUp
} from "lucide-react";

export type WebsiteBrand = 'kaufy' | 'miety' | 'sot' | 'futureroom';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface QuickAction {
  id: string;
  label: string;
  action: string;
  icon: React.ReactNode;
}

export interface ArmstrongWidgetProps {
  website: WebsiteBrand;
  listingId?: string;
  className?: string;
  onLeadCapture?: (data: { email: string; message: string }) => void;
}

const brandConfig: Record<WebsiteBrand, { 
  name: string; 
  greeting: string; 
  primaryColor: string;
  quickActions: QuickAction[];
}> = {
  kaufy: {
    name: "KAUFY",
    greeting: "Willkommen bei KAUFY! Ich helfe Ihnen bei Fragen zu Kapitalanlageimmobilien.",
    primaryColor: "hsl(var(--primary))",
    quickActions: [
      { id: 'rendite', label: 'Rendite berechnen', action: 'ARM.PUBLIC.RENDITE_RECHNER', icon: <Calculator className="h-3 w-3" /> },
      { id: 'afa', label: 'Was ist AfA?', action: 'ARM.GLOBAL.EXPLAIN_TERM', icon: <HelpCircle className="h-3 w-3" /> },
      { id: 'kontakt', label: 'Kontakt', action: 'ARM.PUBLIC.CONTACT_REQUEST', icon: <Mail className="h-3 w-3" /> },
    ],
  },
  miety: {
    name: "MIETY",
    greeting: "Hallo! Ich bin Ihr MIETY-Assistent für Mietfragen.",
    primaryColor: "hsl(var(--primary))",
    quickActions: [
      { id: 'nebenkosten', label: 'Nebenkosten erklärt', action: 'ARM.GLOBAL.EXPLAIN_TERM', icon: <HelpCircle className="h-3 w-3" /> },
      { id: 'besichtigung', label: 'Besichtigung anfragen', action: 'ARM.PUBLIC.CONTACT_REQUEST', icon: <Mail className="h-3 w-3" /> },
    ],
  },
  sot: {
    name: "SoT",
    greeting: "Willkommen bei Schild of Trust! Wie kann ich Ihnen helfen?",
    primaryColor: "hsl(var(--primary))",
    quickActions: [
      { id: 'services', label: 'Unsere Services', action: 'ARM.GLOBAL.FAQ', icon: <HelpCircle className="h-3 w-3" /> },
      { id: 'kontakt', label: 'Kontakt aufnehmen', action: 'ARM.PUBLIC.CONTACT_REQUEST', icon: <Mail className="h-3 w-3" /> },
    ],
  },
  futureroom: {
    name: "FutureRoom",
    greeting: "Willkommen im FutureRoom! Ich beantworte Ihre Finanzierungsfragen.",
    primaryColor: "hsl(var(--primary))",
    quickActions: [
      { id: 'tilgung', label: 'Tilgung berechnen', action: 'ARM.PUBLIC.TILGUNG_RECHNER', icon: <Calculator className="h-3 w-3" /> },
      { id: 'eigenkapital', label: 'Eigenkapital erklärt', action: 'ARM.GLOBAL.EXPLAIN_TERM', icon: <HelpCircle className="h-3 w-3" /> },
      { id: 'beratung', label: 'Beratung anfragen', action: 'ARM.PUBLIC.CONTACT_REQUEST', icon: <Mail className="h-3 w-3" /> },
    ],
  },
};

export const ArmstrongWidget: React.FC<ArmstrongWidgetProps> = ({
  website,
  listingId,
  className,
  onLeadCapture,
}) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [sessionId] = React.useState(() => crypto.randomUUID());
  
  const config = brandConfig[website];
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Add initial greeting on first open
  React.useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'greeting',
        role: 'assistant',
        content: config.greeting,
        timestamp: new Date(),
      }]);
    }
  }, [isOpen, messages.length, config.greeting]);

  // Auto-scroll to bottom
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sot-armstrong-advisor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          mode: 'zone3',
          message: input.trim(),
          conversation_id: sessionId,
          context: {
            zone: 'Z3',
            website,
            listing_id: listingId,
            session_id: sessionId,
          },
        }),
      });

      if (!response.ok) throw new Error('API request failed');

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message || "Entschuldigung, ich konnte Ihre Anfrage nicht verarbeiten.",
        timestamp: new Date(),
      }]);
    } catch (error) {
      console.error('Armstrong Widget error:', error);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "Entschuldigung, es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    setInput(action.label);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ========================================================================
  // CHAT CONTENT (shared between Desktop panel and Mobile drawer)
  // ========================================================================
  const chatContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-primary/5 rounded-t-xl shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">{config.name} Assistent</h3>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-status-success" />
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
          </div>
        </div>
        {!isMobile && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsOpen(false)}>
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn("flex gap-2", message.role === "user" && "flex-row-reverse")}
            >
              <div className={cn(
                "flex items-center justify-center h-6 w-6 rounded-full shrink-0",
                message.role === "assistant" ? "bg-primary/10" : "bg-muted"
              )}>
                {message.role === "assistant" ? (
                  <Bot className="h-3 w-3 text-primary" />
                ) : (
                  <span className="text-xs font-medium">Sie</span>
                )}
              </div>
              <div className={cn(
                "rounded-lg px-3 py-2 text-sm max-w-[80%]",
                message.role === "assistant" ? "bg-muted" : "bg-primary text-primary-foreground"
              )}>
                {message.content}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-2">
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10">
                <Bot className="h-3 w-3 text-primary" />
              </div>
              <div className="rounded-lg px-3 py-2 text-sm bg-muted">
                <span className="animate-pulse">Schreibt...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <div className="px-4 py-2 border-t shrink-0">
          <p className="text-xs text-muted-foreground mb-2">Schnellaktionen:</p>
          <div className="flex flex-wrap gap-1">
            {config.quickActions.map((action) => (
              <Badge
                key={action.id}
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80 transition-colors text-xs"
                onClick={() => handleQuickAction(action)}
              >
                {action.icon}
                <span className="ml-1">{action.label}</span>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t shrink-0">
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ihre Frage..."
            className="flex-1 text-sm"
            disabled={isLoading}
          />
          <Button
            size="sm"
            className="h-9 w-9 p-0"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          Powered by Armstrong • Datenschutz beachten
        </p>
      </div>
    </>
  );

  // ========================================================================
  // MOBILE: InputBar + Drawer
  // ========================================================================
  if (isMobile) {
    return (
      <>
        {/* Fixed InputBar at bottom */}
        {!isOpen && (
          <div 
            className="fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-md bg-background/95"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <button
              onClick={() => setIsOpen(true)}
              className="w-full h-12 flex items-center gap-3 px-4 text-left transition-colors hover:bg-accent/50 active:bg-accent active:scale-[0.99]"
              aria-label="Armstrong öffnen"
            >
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <span className="flex-1 text-sm text-muted-foreground">
                Frag Armstrong...
              </span>
              <ArrowUp className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Bottom-Sheet Drawer */}
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerContent className="h-[50vh] max-h-[50vh] flex flex-col">
            {chatContent}
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // ========================================================================
  // DESKTOP: Floating bubble + panel (unchanged)
  // ========================================================================
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-5 right-5 z-50",
          "flex items-center gap-2 px-4 py-3 rounded-full",
          "bg-primary text-primary-foreground shadow-elevated",
          "hover:scale-105 transition-transform duration-200",
          "animate-in slide-in-from-bottom-4 fade-in duration-300",
          className
        )}
      >
        <MessageCircle className="h-5 w-5" />
        <span className="text-sm font-medium">Fragen?</span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-5 right-5 z-50",
        "w-[350px] h-[450px] max-h-[80vh]",
        "flex flex-col",
        "bg-background border rounded-xl shadow-elevated",
        "animate-in slide-in-from-bottom-4 fade-in duration-300",
        className
      )}
    >
      {chatContent}
    </div>
  );
};

export default ArmstrongWidget;
