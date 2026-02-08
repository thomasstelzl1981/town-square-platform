/**
 * SoT Input Bar — Armstrong Chat Integration
 */
import { useState } from 'react';
import { Sparkles, ArrowUp, X } from 'lucide-react';

interface SotInputBarProps {
  placeholder?: string;
  onSubmit?: (message: string) => void;
  disabled?: boolean;
}

export function SotInputBar({ 
  placeholder = 'Fragen Sie Armstrong...', 
  onSubmit,
  disabled = false 
}: SotInputBarProps) {
  const [message, setMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && onSubmit) {
      onSubmit(message.trim());
      setMessage('');
    }
  };

  // For demo/website, show a simple CTA instead of full chat
  if (!onSubmit) {
    return (
      <div className="sot-input-bar">
        <div className="sot-input-container">
          <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: 'hsl(var(--z3-accent))' }} />
          <input
            type="text"
            placeholder={placeholder}
            className="flex-1"
            onFocus={() => setIsExpanded(true)}
            readOnly
          />
          <button 
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'hsl(var(--z3-accent))' }}
            aria-label="Senden"
          >
            <ArrowUp className="w-4 h-4" style={{ color: 'hsl(var(--z3-background))' }} />
          </button>
        </div>
        
        {/* Expanded hint */}
        {isExpanded && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setIsExpanded(false)}>
            <div 
              className="max-w-md w-full rounded-2xl p-8 text-center"
              style={{ backgroundColor: 'hsl(var(--z3-card))' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setIsExpanded(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div 
                className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}
              >
                <Sparkles className="w-8 h-8" style={{ color: 'hsl(var(--z3-accent))' }} />
              </div>
              
              <h3 className="text-xl font-bold mb-2">Lernen Sie Armstrong kennen</h3>
              <p className="text-sm mb-6" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                Armstrong ist Ihr KI-Assistent für alle Fragen rund um Immobilien, Finanzierung und Verwaltung.
              </p>
              
              <a 
                href="/auth?mode=register&source=sot"
                className="sot-btn-primary w-full justify-center"
              >
                Kostenlos starten
              </a>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full interactive version
  return (
    <div className="sot-input-bar">
      <form onSubmit={handleSubmit} className="sot-input-container">
        <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: 'hsl(var(--z3-accent))' }} />
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1"
        />
        <button 
          type="submit"
          disabled={!message.trim() || disabled}
          className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-50 transition-opacity"
          style={{ backgroundColor: 'hsl(var(--z3-accent))' }}
          aria-label="Senden"
        >
          <ArrowUp className="w-4 h-4" style={{ color: 'hsl(var(--z3-background))' }} />
        </button>
      </form>
    </div>
  );
}