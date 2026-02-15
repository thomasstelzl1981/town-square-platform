/**
 * MediaWidget — Einzelnes Media-Widget mit Primary-Glow
 * 
 * Visueller Platzhalter für Verkaufsmaterialien (Präsentation, Video).
 * CI-konform: aspect-square, glasiger Hintergrund, Primary-Shimmer.
 */
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface MediaWidgetProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  type: 'presentation' | 'video';
  onClick?: () => void;
  className?: string;
}

export function MediaWidget({ title, subtitle, icon: Icon, type, onClick, className }: MediaWidgetProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        // Base
        'relative flex flex-col items-center justify-center gap-3 rounded-xl border p-4 text-center',
        'overflow-hidden transition-all duration-300',
        // Glow styling (primary)
        'bg-primary/5 border-primary/30',
        'hover:shadow-lg hover:shadow-primary/20 hover:border-primary/50',
        // Shimmer stripe at top
        'before:absolute before:inset-x-0 before:top-0 before:h-1',
        'before:bg-gradient-to-r before:from-primary/40 before:via-primary/60 before:to-primary/40',
        'before:rounded-t-xl',
        className
      )}
    >
      {/* Icon */}
      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>

      {/* Text */}
      <div className="space-y-1">
        <p className="text-sm font-semibold leading-tight">{title}</p>
        <p className="text-xs text-muted-foreground leading-snug">{subtitle}</p>
      </div>

      {/* Type badge */}
      <span className="text-[10px] uppercase tracking-wider text-primary/70 font-medium">
        {type === 'presentation' ? 'Präsentation' : 'Video'}
      </span>
    </button>
  );
}
