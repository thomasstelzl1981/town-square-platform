/**
 * ARMSTRONG POD — Mobile chat entry point
 * 
 * Planet-style sphere positioned above the bottom nav
 * Tap opens ArmstrongSheet
 */

import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ArmstrongPodProps {
  onOpenSheet: () => void;
}

export function ArmstrongPod({ onOpenSheet }: ArmstrongPodProps) {
  return (
    <div 
      className="fixed left-4 z-40"
      style={{ bottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
    >
      <button
        onClick={onOpenSheet}
        className={cn(
          'flex flex-col items-center gap-1 transition-transform active:scale-95'
        )}
      >
        {/* Planet Sphere */}
        <div className="armstrong-planet w-12 h-12 flex items-center justify-center shadow-lg">
          <MessageCircle className="h-5 w-5 text-white/80" />
        </div>
        
        {/* Label */}
        <span className="text-[9px] font-medium text-muted-foreground">Armstrong</span>
      </button>
    </div>
  );
}
