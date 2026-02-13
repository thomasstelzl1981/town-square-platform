/**
 * PremiumLockBanner — Lock-UI für Premium-Features in MSV
 * 
 * Zeigt Lock-Icon + Nutzentext. Buttons disabled, aber sichtbar.
 * NICHT versteckt — nur gesperrt.
 */
import { Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PremiumLockBannerProps {
  title: string;
  description: string;
}

export function PremiumLockBanner({ title, description }: PremiumLockBannerProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/40 border border-border/30">
      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Lock className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{title}</span>
          <Badge variant="outline" className="text-[10px]">Premium</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}
