/**
 * SoT Armstrong Stripe — Fixed right-side panel (Portal-Clone)
 * ~200px wide, fixed position so main content centers independently.
 */
import { useState } from 'react';
import { Minus, X, ArrowUp } from 'lucide-react';
import { SotArmstrongChat } from './SotArmstrongChat';

export function SotArmstrongStripe() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  if (isMinimized) {
    return (
      <>
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
        <SotArmstrongChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      </>
    );
  }

  return (
    <>
      {/* Right stripe — desktop only, fixed */}
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

        {/* Empty center */}
        <div className="flex-1" />

        {/* Chat input at bottom */}
        <div className="px-3 py-3 border-t border-border/30">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Armstrong fragen..."
              className="flex-1 h-9 rounded-lg px-3 text-sm bg-muted/30 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsChatOpen(true);
              }}
              onFocus={() => setIsChatOpen(true)}
            />
            <button
              onClick={() => setIsChatOpen(true)}
              className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 nav-tab-glass border border-primary/20 hover:border-primary/50 transition-all"
              title="Senden"
            >
              <ArrowUp className="w-4 h-4 text-primary" />
            </button>
          </div>
        </div>
      </aside>

      {/* Chat Panel */}
      <SotArmstrongChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
}
