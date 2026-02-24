/**
 * ARMSTRONG INPUT BAR — Full-width action bar at very bottom (mobile only)
 * 
 * Replaces the floating ArmstrongPod with a Revolut/Lovable-style input bar.
 * Sits at the absolute bottom with safe-area-inset handling.
 */

import { Rocket, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Brand } from '@/components/ui/brand';

interface ArmstrongInputBarProps {
  onOpenSheet: () => void;
  className?: string;
}

export function ArmstrongInputBar({ onOpenSheet, className }: ArmstrongInputBarProps) {
  return (
    <div 
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 nav-ios-floating border-t-0',
        className
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <button
        onClick={onOpenSheet}
        className="w-full h-12 flex items-center gap-3 px-4 text-left transition-colors hover:bg-accent/50 active:bg-accent active:scale-[0.99]"
        aria-label="Ask Armstrong"
      >
        <div className="armstrong-planet h-9 w-9 flex items-center justify-center shrink-0">
          <Rocket className="h-4 w-4 text-white/80" />
        </div>
        <span className="flex-1 text-sm text-muted-foreground">
          Ask <Brand>Armstrong</Brand>...
        </span>
        <ArrowUp className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}
