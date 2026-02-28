/**
 * KaufyArmstrongWidget — Floating AI Chat Widget for Kaufy2026
 * 
 * Modes:
 * - Orb: Small chrome orb (Zone 2 style) with mic button
 * - Expanded: Full chat panel
 * 
 * Features:
 * - Auto-greeting on first session visit
 * - Streaming chat via sot-armstrong-advisor
 * - Voice input (STT) + Voice output (TTS)
 * - Orb ↔ Expanded toggle with minimize button
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Send, Sparkles, ArrowRight, Volume2, VolumeX, Mic, Minus } from 'lucide-react';
import { KaufyInputBar } from '@/components/zone3/kaufy/KaufyInputBar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useArmstrongVoice } from '@/hooks/useArmstrongVoice';
import { VoiceButton } from '@/components/shared/VoiceButton';

// ============================================================================
// TYPES
// ============================================================================

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface KaufyArmstrongWidgetProps {
  enabled: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SESSION_KEY = 'kaufy_armstrong_greeted_session';

const GREETING = `Hi, ich bin Armstrong 👋 Dein Immobilien- und Investment-Berater.

Wenn du willst, erkläre ich dir ein Objekt, rechne Rendite & Cashflow durch oder zeige dir, wie du mit Mieteinnahmen Vermögen aufbaust. Was interessiert dich?

*Keine Sorge – ich rechne schneller als ein Taschenrechner nach dem zweiten Kaffee.* ☕`;

const QUICK_REPLIES = [
  { label: 'Objekt erklären', query: 'Erkläre mir ein typisches Kapitalanlage-Objekt und worauf ich achten sollte.' },
  { label: 'Rendite & Cashflow', query: 'Rechne mir ein Beispiel für Rendite und monatlichen Cashflow bei einer Kapitalanlage-Immobilie durch.' },
  { label: 'Immobilie vs ETF', query: 'Vergleiche Immobilie als Kapitalanlage mit ETF und Festgeld – was sind die Vor- und Nachteile?' },
  { label: 'Welche Risiken?', query: 'Welche Risiken gibt es bei einer Kapitalanlage-Immobilie und wie kann ich mich absichern?' },
  { label: 'Portal zeigen', query: 'Erkläre mir das Portal "System of a Town" – welche Module gibt es und was kann ich damit machen?' },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sot-armstrong-advisor`;

// ============================================================================
// COMPONENT
// ============================================================================

export function KaufyArmstrongWidget({ enabled }: KaufyArmstrongWidgetProps) {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<'orb' | 'expanded'>('orb');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasGreetedRef = useRef(false);
  const lastTranscriptRef = useRef('');
  const streamDoneRef = useRef(false);
  const latestAssistantContentRef = useRef('');

  // Voice hook
  const voice = useArmstrongVoice();

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-greeting on first session
  useEffect(() => {
    if (!enabled) return;
    const greeted = sessionStorage.getItem(SESSION_KEY);
    if (!greeted && !hasGreetedRef.current) {
      hasGreetedRef.current = true;
      sessionStorage.setItem(SESSION_KEY, 'true');
      setMessages([{
        id: 'greeting',
        role: 'assistant',
        content: GREETING,
      }]);
    }
  }, [enabled]);

  // Focus input when expanding
  useEffect(() => {
    if (mode === 'expanded' && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [mode]);

  // ========================================================================
  // VOICE: Auto-send when transcript changes and listening stops
  // ========================================================================
  useEffect(() => {
    if (voice.transcript && voice.transcript !== lastTranscriptRef.current) {
      setInput(voice.transcript);
    }
  }, [voice.transcript]);

  useEffect(() => {
    if (!voice.isListening && lastTranscriptRef.current !== voice.transcript && voice.transcript.trim()) {
      lastTranscriptRef.current = voice.transcript;
      const msg = voice.transcript.trim();
      setInput('');
      setVoiceActive(true);
      streamChat(msg);
    }
  }, [voice.isListening, voice.transcript]);

  useEffect(() => {
    if (mode === 'expanded' && voice.assistantTranscript) {
      setInput(voice.transcript + (voice.transcript ? ' ' : '') + voice.assistantTranscript);
    }
  }, [voice.assistantTranscript, mode]);

  // ========================================================================
  // STREAMING CHAT
  // ========================================================================

  const streamChat = useCallback(async (userMessage: string) => {
    setIsLoading(true);
    streamDoneRef.current = false;
    latestAssistantContentRef.current = '';

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: userMessage };
    const currentMessages = [...messages, userMsg];
    setMessages(currentMessages);

    let assistantContent = '';
    const assistantId = crypto.randomUUID();

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          action: 'chat',
          mode: 'zone3',
          messages: currentMessages.map(m => ({ role: m.role, content: m.content })),
          context: {
            zone: 'Z3',
            website: 'kaufy',
            persona: 'investor',
            current_path: window.location.pathname,
          },
        }),
      });

      if (!response.ok) {
        if (response.status === 429) throw new Error('Zu viele Anfragen. Bitte warten Sie einen Moment.');
        if (response.status === 402) throw new Error('AI-Service vorübergehend nicht verfügbar.');
        throw new Error('Chat fehlgeschlagen');
      }

      if (!response.body) throw new Error('Keine Antwort erhalten');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

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
              latestAssistantContentRef.current = assistantContent;
              setMessages(prev =>
                prev.map(m => m.id === assistantId ? { ...m, content: assistantContent } : m)
              );
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      streamDoneRef.current = true;
      if (voiceActive && assistantContent.trim()) {
        voice.speakResponse(assistantContent);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten';
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== assistantId || m.content !== '');
        return [...filtered, { id: crypto.randomUUID(), role: 'assistant', content: `⚠️ ${errorMessage}` }];
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, voiceActive, voice]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    const msg = input.trim();
    setInput('');
    setVoiceActive(false);
    streamChat(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceToggle = () => {
    if (voice.isSpeaking) {
      voice.stopSpeaking();
      return;
    }
    voice.toggleVoice();
  };

  const handleOrbMicClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setVoiceActive(true);
    voice.startListening();
  }, [voice]);

  if (!enabled) return null;

  // ========================================================================
  // RENDER — ORB MODE (Zone 2 Chrome Orb)
  // ========================================================================

  if (mode === 'orb') {
    // Mobile: Show InputBar instead of Orb
    if (isMobile) {
      return <KaufyInputBar onOpen={() => setMode('expanded')} />;
    }

    // Desktop: Original Orb
    return (
      <div className="fixed z-50 bottom-8 right-8">
        {/* Voice status tooltip */}
        {(voice.isListening || voice.isProcessing || voice.isSpeaking || voice.error) && (
          <div className={cn(
            'absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2',
            voice.error 
              ? 'bg-red-500/90 text-white' 
              : 'bg-[hsl(220,20%,10%)] text-white'
          )}>
            {voice.error 
              ? voice.error 
              : voice.isSpeaking 
                ? '🔊 Armstrong spricht...' 
                : voice.isListening 
                  ? '🎙️ Sprich jetzt...' 
                  : '⏳ Denke nach...'}
          </div>
        )}

        {/* Transcript floating above orb */}
        {voice.isListening && (voice.transcript || voice.assistantTranscript) && (
          <div className="absolute -top-16 right-0 max-w-[200px] bg-[hsl(220,20%,10%)] text-white text-xs px-3 py-2 rounded-xl shadow-lg animate-in fade-in">
            {voice.transcript}{voice.assistantTranscript && <span className="opacity-60"> {voice.assistantTranscript}</span>}
          </div>
        )}

        {/* The Orb */}
        <div
          className={cn(
            'rounded-full cursor-pointer pointer-events-auto',
            'armstrong-orb',
            'armstrong-orb-glow',
            'hover:scale-105 transition-all duration-300 ease-out',
            'flex items-center justify-center',
            'relative',
            'h-36 w-36'
          )}
          onClick={() => setMode('expanded')}
        >
          {/* Visor / Face area */}
          <div 
            className="absolute inset-5 rounded-full pointer-events-none armstrong-orb-visor"
            style={{
              background: `
                radial-gradient(
                  ellipse 100% 80% at 50% 30%,
                  hsl(var(--armstrong-orb-visor-deep)) 0%,
                  hsl(var(--armstrong-orb-visor)) 40%,
                  hsl(var(--armstrong-orb-visor-deep)) 100%
                )
              `,
              boxShadow: 'inset 0 4px 16px -4px hsla(0, 0%, 0%, 0.5)',
            }}
          />
          
          {/* Top-left frost glint */}
          <div 
            className="absolute top-3 left-4 h-6 w-6 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 40% 40%, hsla(210, 30%, 90%, 0.7) 0%, transparent 70%)',
              filter: 'blur(3px)',
            }}
          />
          
          {/* Secondary glint */}
          <div 
            className="absolute top-5 left-6 h-2.5 w-2.5 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, hsla(0, 0%, 100%, 0.8) 0%, transparent 70%)',
              filter: 'blur(1px)',
            }}
          />
          
          {/* Smile highlight */}
          <div 
            className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none"
            style={{
              width: '55%',
              height: '10px',
              background: `
                radial-gradient(
                  ellipse 100% 100% at 50% 0%,
                  hsla(210, 25%, 75%, 0.4) 0%,
                  hsla(220, 20%, 60%, 0.2) 50%,
                  transparent 100%
                )
              `,
              borderRadius: '0 0 50% 50%',
              filter: 'blur(2px)',
            }}
          />
          
          {/* Central Microphone Button */}
          <button 
            onClick={handleOrbMicClick}
            disabled={voice.isProcessing || voice.isSpeaking}
            className={cn(
              'h-12 w-12 rounded-full flex items-center justify-center relative z-10',
              'transition-all duration-300',
              voice.isListening 
                ? 'armstrong-mic-active' 
                : 'armstrong-btn-glass hover:bg-white/25',
              (voice.isProcessing || voice.isSpeaking) && 'opacity-60 cursor-not-allowed'
            )}
            title={voice.isListening ? 'Mikrofon beenden' : 'Spracheingabe starten'}
          >
            {voice.isListening && !voice.isProcessing && (
              <>
                <span className="absolute inset-0 rounded-full bg-white/30 animate-ping" style={{ animationDuration: '1.5s' }} />
                <span className="absolute inset-[-4px] rounded-full bg-white/15 animate-ping" style={{ animationDuration: '2s' }} />
              </>
            )}
            {voice.isSpeaking ? (
              <Volume2 className="h-5 w-5 text-white animate-pulse" />
            ) : (
              <Mic className={cn('h-5 w-5', voice.isListening ? 'text-[hsl(220,20%,10%)]' : 'text-white')} />
            )}
          </button>
        </div>
      </div>
    );
  }

  // ========================================================================
  // RENDER — EXPANDED CHAT PANEL
  // ========================================================================

  const showQuickReplies = messages.length <= 1;

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col',
        'bg-white border shadow-2xl',
        'transition-all duration-300 ease-out',
        isMobile
          ? 'inset-x-0 bottom-0 h-[85vh] rounded-t-2xl border-t border-x-0 border-b-0'
          : 'bottom-8 right-8 w-[420px] h-[640px] max-h-[80vh] rounded-2xl border-[hsl(210,20%,90%)]'
      )}
      style={{ 
        boxShadow: '0 25px 60px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)',
      }}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(210,20%,93%)] bg-gradient-to-r from-[hsl(220,20%,10%)] to-[hsl(220,25%,18%)] rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={cn(
              "h-10 w-10 rounded-full bg-gradient-to-br from-[hsl(210,80%,55%)] to-[hsl(200,85%,45%)] flex items-center justify-center",
              voice.isSpeaking && "ring-2 ring-[hsl(210,80%,55%)] ring-offset-2 ring-offset-[hsl(220,20%,10%)] animate-pulse"
            )}>
              {voice.isSpeaking ? (
                <Volume2 className="h-5 w-5 text-white animate-pulse" />
              ) : (
                <Sparkles className="h-5 w-5 text-white" />
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-[hsl(220,20%,10%)]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Armstrong</h3>
            <p className="text-xs text-white/60">
              {voice.isSpeaking ? 'Spricht...' : voice.isListening ? 'Hört zu...' : 'KI-Immobilienberater'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {voice.isSpeaking && (
            <button
              onClick={() => voice.stopSpeaking()}
              className="h-8 w-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Sprachausgabe stoppen"
            >
              <VolumeX className="h-4 w-4" />
            </button>
          )}
          {/* Minimize to Orb */}
          <button
            onClick={() => setMode('orb')}
            className="h-8 w-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Minimieren"
          >
            <Minus className="h-4 w-4" />
          </button>
          {/* Close (also goes to orb) */}
          <button
            onClick={() => setMode('orb')}
            className="h-8 w-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Schließen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* MESSAGES */}
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {msg.role === 'assistant' && (
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[hsl(210,80%,55%)] to-[hsl(200,85%,45%)] flex items-center justify-center shrink-0 mr-2 mt-1">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-[hsl(220,20%,10%)] text-white rounded-br-md'
                    : 'bg-[hsl(210,30%,96%)] text-[hsl(220,20%,15%)] rounded-bl-md'
                )}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none prose-p:my-1 prose-li:my-0.5 prose-headings:mb-2 prose-headings:mt-3">
                    <ReactMarkdown>{msg.content || '...'}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex justify-start">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[hsl(210,80%,55%)] to-[hsl(200,85%,45%)] flex items-center justify-center shrink-0 mr-2 mt-1">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="rounded-2xl rounded-bl-md bg-[hsl(210,30%,96%)] px-4 py-3">
                <div className="flex gap-1.5">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="w-2 h-2 rounded-full bg-[hsl(210,80%,55%)] animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* QUICK REPLIES */}
      {showQuickReplies && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-1.5">
            {QUICK_REPLIES.map((qr) => (
              <button
                key={qr.label}
                onClick={() => streamChat(qr.query)}
                disabled={isLoading}
                className={cn(
                  'text-xs font-medium px-3 py-1.5 rounded-full transition-all',
                  'bg-[hsl(210,80%,55%,0.08)] text-[hsl(210,80%,40%)]',
                  'hover:bg-[hsl(210,80%,55%,0.15)] active:scale-95',
                  'disabled:opacity-50'
                )}
              >
                {qr.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PORTAL CTA */}
      {messages.length > 2 && (
        <div className="mx-4 mb-2">
          <a
            href="/auth"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-[hsl(210,80%,55%,0.06)] to-[hsl(200,85%,45%,0.06)] text-xs text-[hsl(210,80%,40%)] hover:from-[hsl(210,80%,55%,0.12)] hover:to-[hsl(200,85%,45%,0.12)] transition-all"
          >
            <ArrowRight className="h-3 w-3" />
            <span>Im Portal weitermachen — Portfolio, Finanzierung & Investment</span>
          </a>
        </div>
      )}

      {/* INPUT */}
      <div className="p-3 border-t border-[hsl(210,20%,93%)]">
        <div className="flex items-center gap-2 bg-[hsl(210,30%,97%)] rounded-xl px-3 py-1.5">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={voice.isListening ? 'Sprich jetzt...' : 'Frag mich was...'}
            className="flex-1 bg-transparent text-sm text-[hsl(220,20%,15%)] placeholder:text-[hsl(215,16%,55%)] outline-none py-2"
            disabled={isLoading || voice.isListening}
          />
          <VoiceButton
            isListening={voice.isListening}
            isProcessing={voice.isProcessing}
            isSpeaking={voice.isSpeaking}
            isConnected={voice.isConnected}
            error={voice.error}
            useBrowserFallback={voice.useBrowserFallback}
            onToggle={handleVoiceToggle}
            size="sm"
            variant="default"
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!input.trim() || isLoading || voice.isListening}
            className={cn(
              'h-8 w-8 p-0 rounded-full transition-all shrink-0',
              input.trim() && !isLoading
                ? 'bg-[hsl(220,20%,10%)] hover:bg-[hsl(220,20%,20%)] text-white'
                : 'bg-[hsl(210,20%,88%)] text-[hsl(215,16%,55%)]'
            )}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
