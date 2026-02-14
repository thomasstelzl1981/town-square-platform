/**
 * SoT Armstrong Stripe — Right-side transparent stripe (Portal-Clone)
 * Matches ArmstrongContainer collapsed style: narrow, glassy, on the right.
 */
import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { SotArmstrongChat } from './SotArmstrongChat';

export function SotArmstrongStripe() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      {/* Right stripe — desktop only */}
      <aside
        className="hidden lg:flex flex-col justify-end shrink-0 border-l"
        style={{
          width: isHovered ? '58px' : '45px',
          transition: 'width 0.3s ease',
          background: 'hsl(var(--z3-card) / 0.4)',
          borderColor: 'hsl(var(--z3-border) / 0.3)',
          backdropFilter: 'blur(16px)',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Armstrong branding — very subtle */}
        <div className="flex-1 flex flex-col items-center justify-start pt-6 opacity-20 hover:opacity-60 transition-opacity duration-500">
          <div
            className="w-px flex-1 max-h-32"
            style={{ background: 'linear-gradient(180deg, hsl(var(--z3-accent)/0.3), transparent)' }}
          />
        </div>

        {/* Chat trigger */}
        <div className="pb-6 flex flex-col items-center gap-3">
          <button
            onClick={() => setIsChatOpen(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
            style={{
              backgroundColor: 'hsl(var(--z3-accent)/0.1)',
              border: '1px solid hsl(var(--z3-accent)/0.2)',
            }}
            title="Armstrong fragen"
          >
            <Sparkles className="w-4 h-4" style={{ color: 'hsl(var(--z3-accent))' }} />
          </button>
          <span
            className="text-[10px] font-medium tracking-wider uppercase"
            style={{
              color: 'hsl(var(--z3-muted-foreground))',
              writingMode: 'vertical-lr',
              opacity: isHovered ? 0.8 : 0.3,
              transition: 'opacity 0.3s ease',
            }}
          >
            Armstrong
          </span>
        </div>
      </aside>

      {/* Chat Panel */}
      <SotArmstrongChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
}
