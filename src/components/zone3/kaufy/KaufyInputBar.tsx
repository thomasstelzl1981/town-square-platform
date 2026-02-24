/**
 * KaufyInputBar — Fixierte Chat-Bar am unteren Bildschirmrand (Mobile)
 * 
 * Analog zur Portal ArmstrongInputBar, aber im Zone 3 Styling.
 * Immer sichtbar am unteren Bildschirmrand für sofortigen KI-Zugriff.
 */
import { MessageCircle, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Brand } from '@/components/ui/brand';

interface KaufyInputBarProps {
  onOpen: () => void;
  className?: string;
}

export function KaufyInputBar({ onOpen, className }: KaufyInputBarProps) {
  return (
    <div 
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 lg:hidden',
        'border-t backdrop-blur-md',
        className
      )}
      style={{ 
        backgroundColor: 'hsl(var(--z3-card) / 0.95)',
        borderColor: 'hsl(var(--z3-border))',
        paddingBottom: 'env(safe-area-inset-bottom)' 
      }}
    >
      <button
        onClick={onOpen}
        className="w-full h-14 flex items-center gap-3 px-4 text-left transition-colors active:scale-[0.99]"
        style={{ color: 'hsl(var(--z3-foreground))' }}
        aria-label="Armstrong öffnen"
      >
        {/* Armstrong Avatar */}
        <div 
          className="h-9 w-9 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: 'hsl(var(--z3-primary))' }}
        >
          <MessageCircle className="h-4 w-4" style={{ color: 'hsl(var(--z3-primary-foreground))' }} />
        </div>
        
        {/* Placeholder Text */}
        <span 
          className="flex-1 text-sm"
          style={{ color: 'hsl(var(--z3-muted-foreground))' }}
        >
          Frag <Brand>Armstrong</Brand>...
        </span>
        
        {/* Submit Arrow */}
        <ArrowUp 
          className="h-4 w-4" 
          style={{ color: 'hsl(var(--z3-muted-foreground))' }} 
        />
      </button>
    </div>
  );
}
