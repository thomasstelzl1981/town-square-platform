/**
 * ModuleTilePage — Blueprint template for new module tiles
 * 
 * Provides consistent structure with:
 * - Header with title and actions
 * - Loading/Error/Empty states
 * - Optional workflow stepper
 */

import { ReactNode } from 'react';
import { LucideIcon, Plus, ArrowRight, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from './EmptyState';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';

export type PageStatus = 'loading' | 'error' | 'empty' | 'ready';

interface ModuleTilePageProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  moduleBase: string;
  status?: PageStatus;
  
  // Empty state props
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  primaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  
  // Error handling
  onRetry?: () => void;
  
  // Content
  children?: ReactNode;
  
  // Badge
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'outline' | 'destructive';
}

export function ModuleTilePage({
  title,
  description,
  icon: Icon,
  moduleBase,
  status = 'empty',
  emptyTitle,
  emptyDescription,
  emptyIcon,
  primaryAction,
  secondaryAction,
  onRetry,
  children,
  badge,
  badgeVariant = 'secondary',
}: ModuleTilePageProps) {
  
  // Loading state
  if (status === 'loading') {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold uppercase">{title}</h1>
            {description && <p className="text-muted-foreground mt-1">{description}</p>}
          </div>
        </div>
        <LoadingState variant="card" rows={3} />
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold uppercase">{title}</h1>
            {description && <p className="text-muted-foreground mt-1">{description}</p>}
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <ErrorState onRetry={onRetry} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state
  if (status === 'empty') {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="rounded-lg bg-primary/10 p-2">
                <Icon className="h-6 w-6 text-primary" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold uppercase">{title}</h1>
                {badge && <Badge variant={badgeVariant}>{badge}</Badge>}
              </div>
              {description && <p className="text-muted-foreground mt-1">{description}</p>}
            </div>
          </div>
        </div>

        <Card className="border-dashed">
          <CardContent className="pt-6">
            <EmptyState
              icon={emptyIcon || Icon}
              title={emptyTitle || `Noch keine ${title}`}
              description={emptyDescription || `Starten Sie jetzt mit Ihrem ersten Eintrag.`}
              action={primaryAction ? {
                label: primaryAction.label,
                onClick: primaryAction.onClick || (() => {}),
              } : undefined}
            />
            
            {/* Secondary CTA */}
            {secondaryAction && (
              <div className="mt-4 text-center">
                <Button variant="ghost" asChild>
                  <Link to={secondaryAction.href}>
                    <Info className="h-4 w-4 mr-2" />
                    {secondaryAction.label}
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Tips Card */}
        <Card className="bg-muted/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Erste Schritte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start gap-2 text-sm">
              <div className="rounded-full bg-primary text-primary-foreground w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">1</div>
              <span className="text-muted-foreground">Erkunden Sie die "So funktioniert's" Seite für eine Einführung.</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <div className="rounded-full bg-primary text-primary-foreground w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">2</div>
              <span className="text-muted-foreground">Legen Sie Ihren ersten Eintrag an.</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <div className="rounded-full bg-primary text-primary-foreground w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">3</div>
              <span className="text-muted-foreground">Nutzen Sie die intelligenten Automatisierungen.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Ready state (with children)
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="rounded-lg bg-primary/10 p-2">
              <Icon className="h-6 w-6 text-primary" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold uppercase">{title}</h1>
              {badge && <Badge variant={badgeVariant}>{badge}</Badge>}
            </div>
            {description && <p className="text-muted-foreground mt-1">{description}</p>}
          </div>
        </div>
        
        {primaryAction && (
          <Button asChild={!!primaryAction.href} onClick={primaryAction.onClick}>
            {primaryAction.href ? (
              <Link to={primaryAction.href}>
                {primaryAction.icon && <primaryAction.icon className="h-4 w-4 mr-2" />}
                {primaryAction.label}
              </Link>
            ) : (
              <>
                {primaryAction.icon && <primaryAction.icon className="h-4 w-4 mr-2" />}
                {primaryAction.label}
              </>
            )}
          </Button>
        )}
      </div>
      
      {children}
    </div>
  );
}
