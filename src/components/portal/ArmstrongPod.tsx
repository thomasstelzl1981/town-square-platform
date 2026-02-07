/**
 * ARMSTRONG POD — Mobile chat entry point
 * 
 * Positioned above the bottom nav
 * Compact pill: Icon + "Armstrong"
 * Tap opens ArmstrongSheet
 */

import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

interface ArmstrongPodProps {
  onOpenSheet: () => void;
}

export function ArmstrongPod({ onOpenSheet }: ArmstrongPodProps) {
  return (
    <div 
      className="fixed left-4 z-40"
      style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom) + 0.5rem)' }}
    >
      <Button
        onClick={onOpenSheet}
        variant="secondary"
        size="sm"
        className="rounded-full shadow-lg gap-2 px-4"
      >
        <MessageCircle className="h-4 w-4" />
        <span className="text-xs font-medium">Armstrong</span>
      </Button>
    </div>
  );
}
