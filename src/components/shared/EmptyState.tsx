import { LucideIcon, Inbox, FileText, Users, Building, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="rounded-full bg-muted p-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-medium">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Preset empty states for common scenarios
export function EmptyDocuments({ onUpload }: { onUpload?: () => void }) {
  return (
    <EmptyState
      icon={FileText}
      title="Keine Dokumente"
      description="Laden Sie Dokumente hoch oder erstellen Sie neue."
      action={onUpload ? { label: 'Dokument hochladen', onClick: onUpload } : undefined}
    />
  );
}

export function EmptyContacts({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="Keine Kontakte"
      description="Fügen Sie Ihren ersten Kontakt hinzu."
      action={onAdd ? { label: 'Kontakt erstellen', onClick: onAdd } : undefined}
    />
  );
}

export function EmptyProperties({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={Building}
      title="Keine Immobilien"
      description="Erstellen Sie Ihre erste Immobilie."
      action={onAdd ? { label: 'Immobilie anlegen', onClick: onAdd } : undefined}
    />
  );
}

export function EmptyFolder() {
  return (
    <EmptyState
      icon={FolderOpen}
      title="Ordner ist leer"
      description="Dieser Ordner enthält keine Dateien."
    />
  );
}
