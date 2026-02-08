/**
 * SoT Input Bar — Armstrong Chat Trigger
 * Opens the full Armstrong chat panel when clicked
 */
import { useState } from 'react';
import { Sparkles, MessageCircle } from 'lucide-react';
import { SotArmstrongChat } from './SotArmstrongChat';

export function SotInputBar() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      {/* Fixed Input Bar */}
      <div className="sot-input-bar">
        <div 
          className="sot-input-container cursor-pointer"
          onClick={() => setIsChatOpen(true)}
        >
          <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: 'hsl(var(--z3-accent))' }} />
          <span 
            className="flex-1 text-sm"
            style={{ color: 'hsl(var(--z3-muted-foreground))' }}
          >
            Fragen Sie Armstrong...
          </span>
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'hsl(var(--z3-accent))' }}
          >
            <MessageCircle className="w-4 h-4" style={{ color: 'hsl(var(--z3-background))' }} />
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      <SotArmstrongChat 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
    </>
  );
}
