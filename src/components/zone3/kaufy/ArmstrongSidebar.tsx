import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Bot, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';

interface ListingContext {
  public_id?: string;
  title?: string;
  asking_price?: number;
  monthly_rent?: number;
  property_type?: string;
  location?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ArmstrongSidebarProps {
  context?: ListingContext;
  isOpen: boolean;
  onToggle: () => void;
}

const QUICK_QUESTIONS = [
  { label: 'Was ist Netto-Belastung?', query: 'Was bedeutet Netto-Belastung bei einer Kapitalanlage-Immobilie?' },
  { label: 'Rendite erklären', query: 'Erkläre mir den Unterschied zwischen Bruttomietrendite und Nettomietrendite.' },
  { label: 'Steuervorteile', query: 'Welche Steuervorteile habe ich bei einer Kapitalanlage-Immobilie?' },
  { label: 'Eigenkapital?', query: 'Wie viel Eigenkapital brauche ich für eine Immobilie als Kapitalanlage?' },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sot-armstrong-advisor`;

export function ArmstrongSidebar({ context, isOpen, onToggle }: ArmstrongSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = useCallback(async (userMessage: string) => {
    setIsLoading(true);
    setShowQuickActions(false);

    const userMsg: Message = { role: 'user', content: userMessage };
    setMessages(prev => [...prev, userMsg]);

    let assistantContent = '';

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          action: 'chat',
          messages: [...messages, userMsg],
          context,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Chat fehlgeschlagen');
      }

      if (!response.body) {
        throw new Error('Keine Antwort erhalten');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      // Add empty assistant message to start
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg?.role === 'assistant') {
                  lastMsg.content = assistantContent;
                }
                return newMessages;
              });
            }
          } catch {
            // Partial JSON, re-buffer
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error('Armstrong chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten';
      setMessages(prev => [
        ...prev.filter(m => m.content !== ''),
        { role: 'assistant', content: `⚠️ ${errorMessage}` }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, context]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');
    streamChat(message);
  };

  const handleQuickQuestion = (query: string) => {
    streamChat(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Mobile: Bottom sheet style
  // Desktop: Fixed right sidebar
  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={onToggle}
        className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105"
        style={{ 
          backgroundColor: 'hsl(var(--z3-primary))', 
          color: 'hsl(var(--z3-primary-foreground))' 
        }}
        aria-label="Armstrong öffnen"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Sidebar / Bottom Sheet */}
      <aside
        className={`
          fixed z-40 transition-transform duration-300 ease-in-out
          lg:right-0 lg:top-0 lg:h-full lg:w-[320px] lg:translate-x-0
          ${isOpen ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}
          bottom-0 left-0 right-0 h-[70vh] lg:h-full
          rounded-t-2xl lg:rounded-none
          shadow-2xl lg:shadow-none
          border-t lg:border-l lg:border-t-0
        `}
        style={{
          backgroundColor: 'hsl(var(--z3-foreground))',
          borderColor: 'hsl(var(--z3-border))',
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: 'hsl(var(--z3-border) / 0.3)' }}
        >
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'hsl(var(--z3-primary))' }}
            >
              <Bot className="w-4 h-4" style={{ color: 'hsl(var(--z3-primary-foreground))' }} />
            </div>
            <div>
              <h3 
                className="font-semibold text-sm"
                style={{ color: 'hsl(var(--z3-background))' }}
              >
                Armstrong
              </h3>
              <p 
                className="text-xs"
                style={{ color: 'hsl(var(--z3-background) / 0.6)' }}
              >
                KI-Immobilienberater
              </p>
            </div>
          </div>
          
          {/* Close button (mobile only) */}
          <button
            onClick={onToggle}
            className="lg:hidden p-2 rounded-full hover:bg-white/10"
            aria-label="Schließen"
          >
            <ChevronDown 
              className="w-5 h-5"
              style={{ color: 'hsl(var(--z3-background))' }}
            />
          </button>
        </div>

        {/* Context Badge */}
        {context?.title && (
          <div 
            className="mx-4 mt-4 p-3 rounded-lg"
            style={{ backgroundColor: 'hsl(var(--z3-primary) / 0.1)' }}
          >
            <p 
              className="text-xs font-medium mb-1"
              style={{ color: 'hsl(var(--z3-primary))' }}
            >
              Aktuelles Objekt
            </p>
            <p 
              className="text-sm font-semibold truncate"
              style={{ color: 'hsl(var(--z3-background))' }}
            >
              {context.title}
            </p>
            {context.asking_price && (
              <p 
                className="text-xs mt-1"
                style={{ color: 'hsl(var(--z3-background) / 0.7)' }}
              >
                {context.asking_price.toLocaleString('de-DE')} €
              </p>
            )}
          </div>
        )}

        {/* Chat Messages */}
        <ScrollArea 
          className="flex-1 h-[calc(100%-200px)] lg:h-[calc(100%-240px)]"
          ref={scrollRef}
        >
          <div className="p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Sparkles 
                  className="w-10 h-10 mx-auto mb-3"
                  style={{ color: 'hsl(var(--z3-primary))' }}
                />
                <p 
                  className="text-sm font-medium mb-2"
                  style={{ color: 'hsl(var(--z3-background))' }}
                >
                  Hallo! Ich bin Armstrong.
                </p>
                <p 
                  className="text-xs"
                  style={{ color: 'hsl(var(--z3-background) / 0.6)' }}
                >
                  Frag mich alles über Kapitalanlage-Immobilien.
                </p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    msg.role === 'user' 
                      ? 'rounded-br-sm' 
                      : 'rounded-bl-sm'
                  }`}
                  style={{
                    backgroundColor: msg.role === 'user'
                      ? 'hsl(var(--z3-primary))'
                      : 'hsl(var(--z3-background) / 0.1)',
                    color: msg.role === 'user'
                      ? 'hsl(var(--z3-primary-foreground))'
                      : 'hsl(var(--z3-background))',
                  }}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown>{msg.content || '...'}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex justify-start">
                <div
                  className="rounded-2xl rounded-bl-sm px-4 py-2.5"
                  style={{ backgroundColor: 'hsl(var(--z3-background) / 0.1)' }}
                >
                  <div className="flex gap-1">
                    <span 
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: 'hsl(var(--z3-background) / 0.5)', animationDelay: '0ms' }}
                    />
                    <span 
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: 'hsl(var(--z3-background) / 0.5)', animationDelay: '150ms' }}
                    />
                    <span 
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: 'hsl(var(--z3-background) / 0.5)', animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        {showQuickActions && messages.length === 0 && (
          <div className="px-4 pb-2">
            <button
              onClick={() => setShowQuickActions(false)}
              className="flex items-center gap-1 text-xs mb-2"
              style={{ color: 'hsl(var(--z3-background) / 0.5)' }}
            >
              Schnellfragen
              <ChevronUp className="w-3 h-3" />
            </button>
            <div className="flex flex-wrap gap-2">
              {QUICK_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickQuestion(q.query)}
                  className="text-xs px-3 py-1.5 rounded-full transition-colors hover:opacity-80"
                  style={{
                    backgroundColor: 'hsl(var(--z3-primary) / 0.15)',
                    color: 'hsl(var(--z3-primary))',
                  }}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <form 
          onSubmit={handleSubmit}
          className="p-4 border-t"
          style={{ borderColor: 'hsl(var(--z3-border) / 0.3)' }}
        >
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Frage stellen..."
              className="flex-1 min-h-[44px] max-h-[120px] resize-none text-sm border-0"
              style={{
                backgroundColor: 'hsl(var(--z3-background) / 0.1)',
                color: 'hsl(var(--z3-background))',
              }}
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="h-11 w-11 rounded-full shrink-0"
              style={{
                backgroundColor: 'hsl(var(--z3-primary))',
                color: 'hsl(var(--z3-primary-foreground))',
              }}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </aside>
    </>
  );
}
