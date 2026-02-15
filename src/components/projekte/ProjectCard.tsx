/**
 * Square Project Widget Card (like Kontexte-Widgets)
 * MOD-13 PROJEKTE
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { DESIGN, getActiveWidgetGlow } from '@/config/designManifest';
import type { ProjectPortfolioRow } from '@/types/projekte';

interface ProjectCardProps {
  project: ProjectPortfolioRow;
  isSelected?: boolean;
  isDemo?: boolean;
  onClick?: (id: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  draft_intake: 'bg-muted text-muted-foreground',
  draft_ready: 'bg-muted text-muted-foreground',
  draft: 'bg-muted text-muted-foreground',
  in_sales_setup: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  in_distribution: 'bg-primary/10 text-primary',
  active: 'bg-primary/10 text-primary',
  sellout_in_progress: 'bg-primary/10 text-primary',
  sold_out: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  closed: 'bg-muted text-muted-foreground',
  archived: 'bg-muted text-muted-foreground',
  paused: 'bg-muted text-muted-foreground',
};

const STATUS_LABELS: Record<string, string> = {
  draft_intake: 'Import',
  draft_ready: 'Bereit',
  draft: 'Entwurf',
  in_sales_setup: 'Vorbereitung',
  in_distribution: 'Im Vertrieb',
  active: 'Aktiv',
  sellout_in_progress: 'Abverkauf',
  sold_out: 'Ausverkauft',
  completed: 'Abgeschlossen',
  closed: 'Geschlossen',
  archived: 'Archiviert',
  paused: 'Pausiert',
};

export function ProjectCard({ project, isSelected, isDemo, onClick }: ProjectCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (isDemo) return;
    if (onClick) {
      onClick(project.id);
    } else {
      navigate(`/portal/projekte/${project.id}`);
    }
  };

  const progress = project.progress_percent || 0;

  return (
    <Card
      className={cn(
        'glass-card shadow-card cursor-pointer transition-all hover:shadow-elevated hover:scale-[1.02] group flex flex-col',
        'aspect-square',
        isSelected && 'ring-2 ring-primary shadow-glow',
        isDemo && DESIGN.DEMO_WIDGET.CARD,
        isDemo && DESIGN.DEMO_WIDGET.HOVER,
        !isDemo && getActiveWidgetGlow('amber'),
      )}
      onClick={handleClick}
    >
      <CardContent className="p-4 flex flex-col h-full justify-between">
        {/* Top: Status + Code */}
        <div className="flex items-start justify-between">
          <Badge className={cn('text-[10px] font-medium border-0', STATUS_COLORS[project.status] || 'bg-muted text-muted-foreground')}>
            {STATUS_LABELS[project.status] || project.status}
          </Badge>
          <span className="text-[10px] font-mono text-muted-foreground">{project.project_code}</span>
        </div>

        {/* Center: Name + Location */}
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-1 py-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-1">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <p className="font-semibold text-sm leading-tight line-clamp-2">{project.name}</p>
          {(project.city || project.postal_code) && (
            <p className="text-[11px] text-muted-foreground">
              {project.postal_code} {project.city}
            </p>
          )}
        </div>

        {/* Bottom: Progress + Units */}
        <div className="space-y-2">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>
              <span className="text-emerald-600 dark:text-emerald-400">{project.units_available}</span>
              {' / '}
              <span className="text-amber-600 dark:text-amber-400">{project.units_reserved}</span>
              {' / '}
              <span className="text-sky-600 dark:text-sky-400">{project.units_sold}</span>
            </span>
            <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Placeholder card shown when no projects exist */
export function ProjectCardPlaceholder({ onClick }: { onClick?: () => void }) {
  return (
    <Card
      className="glass-card border-dashed border-2 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all aspect-square flex flex-col items-center justify-center"
      onClick={onClick}
    >
      <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Demo-Projekt</p>
        <p className="text-[10px] text-muted-foreground">Laden Sie ein Exposé hoch oder erstellen Sie ein Projekt manuell</p>
      </CardContent>
    </Card>
  );
}
