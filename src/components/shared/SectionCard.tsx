/**
 * SectionCard — Full-width Sektionskarte mit Icon, Titel und Beschreibung
 * Verwendet CARD.SECTION aus dem Design Manifest
 */
import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { DESIGN } from '@/config/designManifest';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
}

export const SectionCard = memo(function SectionCard({ title, description, icon: Icon, children, className, headerAction }: SectionCardProps) {
  return (
    <Card className={cn(DESIGN.CARD.SECTION, className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className={DESIGN.HEADER.WIDGET_ICON_BOX}>
              <Icon className="h-4 w-4 text-primary" />
            </div>
          )}
          <div>
            <h3 className={DESIGN.TYPOGRAPHY.SECTION_TITLE}>{title}</h3>
            {description && <p className={DESIGN.TYPOGRAPHY.HINT}>{description}</p>}
          </div>
        </div>
        {headerAction}
      </div>
      {children}
    </Card>
  );
});
