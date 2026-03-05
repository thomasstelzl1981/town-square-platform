/**
 * ProjectInfoTabs — Identity + Location tab content
 * Extracted from ProjectDetailPage R-31
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ProjectStatus } from '@/types/projekte';

const STATUS_CONFIG: Record<ProjectStatus, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  draft_intake: { label: 'KI-Import', variant: 'outline' },
  draft_ready: { label: 'Bereit', variant: 'outline' },
  in_sales_setup: { label: 'Vorbereitung', variant: 'secondary' },
  in_distribution: { label: 'Im Vertrieb', variant: 'default' },
  sellout_in_progress: { label: 'Abverkauf', variant: 'default' },
  sold_out: { label: 'Ausverkauft', variant: 'secondary' },
  closed: { label: 'Geschlossen', variant: 'outline' },
  draft: { label: 'Entwurf', variant: 'outline' },
  active: { label: 'Aktiv', variant: 'default' },
  paused: { label: 'Pausiert', variant: 'secondary' },
  completed: { label: 'Abgeschlossen', variant: 'secondary' },
  archived: { label: 'Archiviert', variant: 'outline' },
};

interface Props {
  project: any;
  context: any;
}

export function ProjectIdentityTab({ project, context }: Props) {
  const statusConfig = STATUS_CONFIG[project.status as ProjectStatus];
  return (
    <Card>
      <CardHeader><CardTitle>A. Identität & Status</CardTitle></CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div><label className="text-sm text-muted-foreground">Projekt-Code</label><p className="font-mono">{project.project_code}</p></div>
        <div><label className="text-sm text-muted-foreground">Status</label><p><Badge variant={statusConfig.variant}>{statusConfig.label}</Badge></p></div>
        <div><label className="text-sm text-muted-foreground">Verkäufer-Gesellschaft</label><p>{context.name}</p></div>
        <div><label className="text-sm text-muted-foreground">Rechtsform</label><p>{context.legal_form || '—'}</p></div>
        <div className="md:col-span-2"><label className="text-sm text-muted-foreground">Beschreibung</label><p>{project.description || 'Keine Beschreibung'}</p></div>
      </CardContent>
    </Card>
  );
}

export function ProjectLocationTab({ project }: { project: any }) {
  return (
    <Card>
      <CardHeader><CardTitle>B. Standort & Story</CardTitle></CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div><label className="text-sm text-muted-foreground">Adresse</label><p>{project.address || '—'}</p></div>
        <div><label className="text-sm text-muted-foreground">PLZ / Stadt</label><p>{project.postal_code} {project.city}</p></div>
        <div><label className="text-sm text-muted-foreground">Bundesland</label><p>{project.state || '—'}</p></div>
        <div><label className="text-sm text-muted-foreground">Land</label><p>{project.country}</p></div>
      </CardContent>
    </Card>
  );
}
