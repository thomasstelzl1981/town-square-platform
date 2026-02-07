/**
 * ARMSTRONG INPUT BAR — Full-width action bar at very bottom (mobile only)
 * 
 * Replaces the floating ArmstrongPod with a Revolut/Lovable-style input bar.
 * Sits at the absolute bottom with safe-area-inset handling.
 */

import { MessageCircle, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ArmstrongInputBarProps {
  onOpenSheet: () => void;
  className?: string;
}

export function ArmstrongInputBar({ onOpenSheet, className }: ArmstrongInputBarProps) {
  return (
    <div 
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border',
        className
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <button
        onClick={onOpenSheet}
        className="w-full h-12 flex items-center gap-3 px-4 text-left transition-colors hover:bg-accent/50 active:bg-accent"
        aria-label="Ask Armstrong"
      >
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <MessageCircle className="h-4 w-4 text-primary" />
        </div>
        <span className="flex-1 text-sm text-muted-foreground">
          Ask Armstrong...
        </span>
        <ArrowUp className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}
