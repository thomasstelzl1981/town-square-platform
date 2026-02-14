/**
 * SoT Armstrong Stripe — Fixed right-side panel with inline chat
 * 300px wide, fixed position so main content centers independently.
 */
import { useState, useRef, useEffect } from 'react';
import { Minus, X, ArrowUp, Loader2, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `Du bist Armstrong, der KI-Assistent von System of a Town — einer modernen Software für Immobilienverwaltung.

DEINE PERSÖNLICHKEIT:
- Freundlich, kompetent, aber nicht übertrieben enthusiastisch
- Du sprichst Deutsch (du-Form oder Sie-Form je nach Nutzer)
- Kurze, prägnante Antworten — keine langen Aufsätze
- Du bist hilfsbereit, aber nicht aufdringlich verkäuferisch

WAS DU KANNST:
- Fragen zur Software beantworten (Module, Funktionen, Preise)
- Immobilienwissen teilen (Vermietung, Finanzierung, Steuern, AfA)
- Bei der Entscheidung helfen, ob System of a Town passt
- Erste Schritte erklären

WICHTIG:
- Antworte IMMER auf Deutsch
- Halte Antworten unter 150 Wörtern wenn möglich
- Nie erfinden — wenn du etwas nicht weißt, sag es ehrlich`;

export function SotArmstrongStripe() {
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hallo! Ich bin Armstrong. Wie kann ich Ihnen helfen?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sot-armstrong-website`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              ...messages,
              { role: 'user', content: userMessage }
            ],
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Zu viele Anfragen. Bitte warten Sie einen Moment.');
        }
        throw new Error('Fehler bei der Verbindung zu Armstrong.');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);

            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantMessage += content;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'assistant', content: assistantMessage };
                  return updated;
                });
              }
            } catch {
              // Partial JSON, continue
            }
          }
        }
      }
    } catch (error) {
      console.error('Armstrong chat error:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: error instanceof Error ? error.message : 'Entschuldigung, es gab ein Problem.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isMinimized) {
    return (
      <aside
        className="hidden lg:flex fixed right-0 top-12 bottom-0 flex-col items-center justify-center shrink-0 border-l border-border/30 bg-card/50 backdrop-blur-xl z-30 cursor-pointer"
        style={{ width: '45px' }}
        onClick={() => setIsMinimized(false)}
        title="Armstrong öffnen"
      >
        <span
          className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground"
          style={{ writingMode: 'vertical-lr', opacity: 0.5 }}
        >
          Armstrong
        </span>
      </aside>
    );
  }

  return (
    <aside
      className="hidden lg:flex fixed right-0 top-12 bottom-0 flex-col shrink-0 border-l border-border/30 bg-card/50 backdrop-blur-xl z-30"
      style={{ width: '300px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
        <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
          Armstrong
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted/50 transition-colors"
            title="Minimieren"
          >
            <Minus className="w-3 h-3 text-muted-foreground" />
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted/50 transition-colors"
            title="Schließen"
          >
            <X className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${
                message.role === 'user'
                  ? 'bg-primary/20'
                  : 'bg-muted/50'
              }`}
            >
              {message.role === 'user'
                ? <User className="w-3 h-3 text-primary" />
                : <Bot className="w-3 h-3 text-muted-foreground" />
              }
            </div>
            <div
              className={`rounded-lg px-3 py-2 max-w-[85%] text-xs ${
                message.role === 'user'
                  ? 'bg-primary/15 text-foreground'
                  : 'bg-muted/30 text-foreground'
              }`}
            >
              {message.role === 'assistant' ? (
                <div className="prose prose-xs prose-invert max-w-none [&_p]:m-0 [&_p]:text-xs">
                  <ReactMarkdown>{message.content || '...'}</ReactMarkdown>
                </div>
              ) : (
                message.content
              )}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center bg-muted/50">
              <Bot className="w-3 h-3 text-muted-foreground" />
            </div>
            <div className="rounded-lg px-3 py-2 bg-muted/30">
              <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat input at bottom */}
      <form onSubmit={handleSubmit} className="px-3 py-3 border-t border-border/30">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Armstrong fragen..."
            disabled={isLoading}
            className="flex-1 h-9 rounded-lg px-3 text-sm bg-muted/30 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 nav-tab-glass border border-primary/20 hover:border-primary/50 transition-all disabled:opacity-50"
            title="Senden"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            ) : (
              <ArrowUp className="w-4 h-4 text-primary" />
            )}
          </button>
        </div>
      </form>
    </aside>
  );
}
