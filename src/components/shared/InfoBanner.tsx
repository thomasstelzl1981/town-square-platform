/**
 * InfoBanner — Einheitliche Hinweis-/Premium-/Warnbanner
 * Verwendet INFO_BANNER aus dem Design Manifest
 */
import { memo } from 'react';
import { cn } from '@/lib/utils';
import { DESIGN } from '@/config/designManifest';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type BannerVariant = 'hint' | 'premium' | 'warning' | 'success';

export interface InfoBannerProps {
  variant?: BannerVariant;
  icon?: LucideIcon;
  title?: string;
  children?: ReactNode;
  className?: string;
  action?: ReactNode;
}

const variantMap: Record<BannerVariant, string> = {
  hint: DESIGN.INFO_BANNER.HINT,
  premium: DESIGN.INFO_BANNER.PREMIUM,
  warning: DESIGN.INFO_BANNER.WARNING,
  success: DESIGN.INFO_BANNER.SUCCESS,
};

export const InfoBanner = memo(function InfoBanner({ variant = 'hint', icon: Icon, title, children, className, action }: InfoBannerProps) {
  return (
    <div className={cn(DESIGN.INFO_BANNER.BASE, variantMap[variant], className)}>
      <div className="flex items-start gap-3">
        {Icon && <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />}
        <div className="flex-1 min-w-0">
          {title && <p className={cn(DESIGN.TYPOGRAPHY.CARD_TITLE, 'mb-1')}>{title}</p>}
          <div className={DESIGN.TYPOGRAPHY.MUTED}>{children}</div>
        </div>
        {action}
      </div>
    </div>
  );
});
