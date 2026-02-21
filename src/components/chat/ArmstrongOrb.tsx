/**
 * ArmstrongOrb — Animated status orb for the Armstrong chatbot
 * 
 * States: idle, thinking, working, speaking, error
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

export type OrbState = 'idle' | 'thinking' | 'working' | 'speaking' | 'error';

interface ArmstrongOrbProps {
  state: OrbState;
  size?: number;
  stepLabel?: string;
  className?: string;
}

export const ArmstrongOrb: React.FC<ArmstrongOrbProps> = ({
  state,
  size = 24,
  stepLabel,
  className,
}) => {
  return (
    <div className={cn('relative flex flex-col items-center', className)}>
      {/* Orbital ring — visible in working state */}
      {state === 'working' && (
        <div
          className="absolute rounded-full border-2 border-transparent animate-[orb-orbit_1.5s_linear_infinite]"
          style={{
            width: size + 12,
            height: size + 12,
            top: -6,
            left: -6,
            borderTopColor: 'hsl(var(--primary))',
            borderRightColor: 'hsl(var(--primary) / 0.3)',
          }}
        />
      )}

      {/* Pulse ring — thinking */}
      {state === 'thinking' && (
        <div
          className="absolute rounded-full bg-primary/20 animate-ping"
          style={{ width: size + 8, height: size + 8, top: -4, left: -4 }}
        />
      )}

      {/* Core orb */}
      <div
        className={cn(
          'rounded-full relative z-10 transition-all duration-300',
          state === 'idle' && 'bg-gradient-to-br from-[hsl(200_85%_45%)] to-[hsl(160_55%_40%)]',
          state === 'thinking' && 'bg-gradient-to-br from-[hsl(200_85%_45%)] to-[hsl(160_55%_40%)] animate-[orb-spin_2s_linear_infinite]',
          state === 'working' && 'bg-gradient-to-br from-[hsl(200_85%_55%)] to-[hsl(270_60%_50%)] animate-pulse',
          state === 'speaking' && 'bg-gradient-to-br from-[hsl(200_85%_45%)] to-[hsl(160_55%_40%)] animate-[orb-breathe_2s_ease-in-out_infinite]',
          state === 'error' && 'bg-gradient-to-br from-[hsl(0_70%_50%)] to-[hsl(20_80%_45%)] animate-[orb-shake_0.3s_ease-in-out]',
        )}
        style={{ width: size, height: size }}
      >
        {/* Inner glow */}
        <div className="absolute inset-[3px] rounded-full bg-white/20" />
      </div>

      {/* Step label */}
      {stepLabel && (state === 'working' || state === 'thinking') && (
        <span className="mt-1.5 text-[10px] text-muted-foreground animate-pulse whitespace-nowrap">
          {stepLabel}
        </span>
      )}
    </div>
  );
};

export default ArmstrongOrb;
