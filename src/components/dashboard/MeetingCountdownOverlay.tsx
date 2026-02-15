/**
 * MeetingCountdownOverlay — 3-minute countdown with Continue/Stop buttons
 */

import { Button } from '@/components/ui/button';
import { Play, Square } from 'lucide-react';

interface MeetingCountdownOverlayProps {
  countdownSec: number;
  onResume: () => void;
  onStop: () => void;
}

export function MeetingCountdownOverlay({ countdownSec, onResume, onStop }: MeetingCountdownOverlayProps) {
  const minutes = Math.floor(countdownSec / 60);
  const seconds = countdownSec % 60;

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3">
      <p className="text-sm text-muted-foreground text-center">
        Meeting fortsetzen oder beenden?
      </p>
      <p className="text-3xl font-mono text-foreground tabular-nums">
        {minutes}:{String(seconds).padStart(2, '0')}
      </p>
      <div className="flex gap-3">
        <Button size="sm" variant="outline" onClick={onResume} className="gap-1">
          <Play className="h-3 w-3" />
          Weiter
        </Button>
        <Button size="sm" variant="destructive" onClick={onStop} className="gap-1">
          <Square className="h-3 w-3" />
          Beenden
        </Button>
      </div>
    </div>
  );
}
