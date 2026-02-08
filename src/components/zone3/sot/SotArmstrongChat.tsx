/**
 * SoT Armstrong Chat — Real AI Chat for Website Visitors
 * Uses Lovable AI (Gemini) for intelligent responses about the product
 */
import { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowUp, X, Loader2, User, Bot, Minimize2, Maximize2 } from 'lucide-react';
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

MODULE DIE WIR ANBIETEN:
- Stammdaten: Kontaktmanagement mit Gmail/Outlook-Sync
- KI Office: E-Mails, Briefe, Kalender, Aufgaben mit KI
- DMS: Dokumentenmanagement mit OCR und Volltextsuche
- Immobilien: Portfolio-Verwaltung, Objektakten
- Mietverwaltung: Mieteingang, NK-Abrechnung, Vermietung
- Projekte: Bauprojekt-Management
- Buchhaltung: SKR04, DATEV-Export
- Verkauf: Inserate, Interessenten, Verkaufsprozess
- Finanzierung: Selbstauskunft, Bankunterlagen
- Investment-Suche: Objekte finden, Rendite berechnen
- Kommunikation Pro: E-Mail-Automatisierung
- Fahrzeuge: Fuhrparkverwaltung
- Miety: Mieterportal

PREISMODELL:
- Starter: Kostenlos (3 Objekte, Basis-Funktionen)
- Professional: Auf Anfrage (unbegrenzt, alle Module)
- Enterprise: Individuell (Onboarding, Support)

WICHTIG:
- Antworte IMMER auf Deutsch
- Halte Antworten unter 150 Wörtern wenn möglich
- Bei komplexen Themen: kurz anreißen, dann "Soll ich mehr dazu erklären?"
- Nie erfinden — wenn du etwas nicht weißt, sag es ehrlich`;

interface SotArmstrongChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SotArmstrongChat({ isOpen, onClose }: SotArmstrongChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hallo! Ich bin Armstrong, Ihr KI-Assistent. Wie kann ich Ihnen bei Ihrer Immobilienverwaltung helfen?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

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

      // Streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      // Add empty assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          
          // Process SSE lines
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
          content: error instanceof Error ? error.message : 'Entschuldigung, es gab ein Problem. Bitte versuchen Sie es erneut.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed z-50 transition-all duration-300 ${
        isMinimized 
          ? 'bottom-20 right-4 w-72' 
          : 'bottom-20 right-4 w-[380px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-8rem)]'
      }`}
    >
      <div 
        className="h-full rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        style={{ 
          backgroundColor: 'hsl(var(--z3-card))',
          border: '1px solid hsl(var(--z3-border))',
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between px-4 py-3 border-b cursor-pointer"
          style={{ borderColor: 'hsl(var(--z3-border))' }}
          onClick={() => setIsMinimized(!isMinimized)}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.15)' }}
            >
              <Sparkles className="w-5 h-5" style={{ color: 'hsl(var(--z3-accent))' }} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Armstrong</h3>
              <p className="text-xs" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                KI-Assistent
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages - hidden when minimized */}
        {!isMinimized && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div 
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user' 
                        ? 'bg-[hsl(var(--z3-accent))]' 
                        : 'bg-[hsl(var(--z3-secondary))]'
                    }`}
                  >
                    {message.role === 'user' 
                      ? <User className="w-4 h-4" style={{ color: 'hsl(var(--z3-background))' }} />
                      : <Bot className="w-4 h-4" />
                    }
                  </div>
                  <div 
                    className={`rounded-xl px-4 py-2.5 max-w-[80%] text-sm ${
                      message.role === 'user' 
                        ? 'bg-[hsl(var(--z3-accent))] text-[hsl(var(--z3-background))]' 
                        : 'bg-[hsl(var(--z3-secondary))]'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm prose-invert max-w-none">
                        <ReactMarkdown>{message.content || '...'}</ReactMarkdown>
                      </div>
                    ) : (
                      message.content
                    )}
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[hsl(var(--z3-secondary))]">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="rounded-xl px-4 py-2.5 bg-[hsl(var(--z3-secondary))]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t" style={{ borderColor: 'hsl(var(--z3-border))' }}>
              <div 
                className="flex items-center gap-2 rounded-xl px-4 py-2"
                style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Fragen Sie Armstrong..."
                  disabled={isLoading}
                  className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-[hsl(var(--z3-muted-foreground))]"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-50 transition-all"
                  style={{ backgroundColor: 'hsl(var(--z3-accent))' }}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'hsl(var(--z3-background))' }} />
                  ) : (
                    <ArrowUp className="w-4 h-4" style={{ color: 'hsl(var(--z3-background))' }} />
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
