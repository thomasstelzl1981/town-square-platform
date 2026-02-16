/**
 * ContentCard — Wrapper für große Inhaltskacheln
 * Verwendet CARD.CONTENT aus dem Design Manifest
 */
import { memo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { DESIGN } from '@/config/designManifest';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface ContentCardProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
}

export const ContentCard = memo(function ContentCard({ title, description, icon: Icon, children, className, headerAction }: ContentCardProps) {
  return (
    <Card className={cn(DESIGN.CARD.CONTENT, className)}>
      {(title || headerAction) && (
        <CardHeader className={DESIGN.CARD.SECTION_HEADER}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {Icon && (
                <div className={DESIGN.HEADER.WIDGET_ICON_BOX}>
                  <Icon className="h-4 w-4 text-primary" />
                </div>
              )}
              <div>
                <h3 className={DESIGN.TYPOGRAPHY.CARD_TITLE}>{title}</h3>
                {description && <p className={DESIGN.TYPOGRAPHY.HINT}>{description}</p>}
              </div>
            </div>
            {headerAction}
          </div>
        </CardHeader>
      )}
      <CardContent className="p-4">
        {children}
      </CardContent>
    </Card>
  );
});
