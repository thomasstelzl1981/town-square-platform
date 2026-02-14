/**
 * SoT Armstrong Stripe — Fixed right-side panel (Portal-Clone)
 * ~200px wide, fixed position so main content centers independently.
 */
import { useState } from 'react';
import { Sparkles, Minus, X, Upload } from 'lucide-react';
import { SotArmstrongChat } from './SotArmstrongChat';

export function SotArmstrongStripe() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  if (isMinimized) {
    return (
      <>
        <aside
          className="hidden lg:flex fixed right-0 top-[88px] bottom-0 flex-col items-center justify-center shrink-0 border-l border-border/30 bg-card/50 backdrop-blur-xl z-30 cursor-pointer"
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
        className="hidden lg:flex fixed right-0 top-[88px] bottom-0 flex-col shrink-0 border-l border-border/30 bg-card/50 backdrop-blur-xl z-30"
        style={{ width: '200px' }}
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

        {/* Center content — file drop zone */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
          <div className="w-full border border-dashed border-border/40 rounded-xl p-6 flex flex-col items-center gap-3 text-center">
            <Upload className="w-5 h-5 text-muted-foreground/50" />
            <span className="text-xs text-muted-foreground/60">
              Dateien hierher ziehen
            </span>
          </div>
        </div>

        {/* Chat trigger at bottom */}
        <div className="pb-4 pt-2 flex flex-col items-center gap-2 border-t border-border/30">
          <button
            onClick={() => setIsChatOpen(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 bg-primary/10 border border-primary/20"
            title="Armstrong fragen"
          >
            <Sparkles className="w-4 h-4 text-primary" />
          </button>
          <span className="text-[10px] text-muted-foreground/60">Fragen</span>
        </div>
      </aside>

      {/* Chat Panel */}
      <SotArmstrongChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
}
