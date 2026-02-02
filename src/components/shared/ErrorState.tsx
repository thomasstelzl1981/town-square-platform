import { AlertTriangle, RefreshCw, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  showSupport?: boolean;
  className?: string;
}

export function ErrorState({
  title = 'Etwas ist schiefgelaufen',
  description = 'Die Daten konnten nicht geladen werden. Bitte versuchen Sie es erneut.',
  onRetry,
  showSupport = true,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="mt-4 text-lg font-medium">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      <div className="mt-4 flex gap-2">
        {onRetry && (
          <Button onClick={onRetry} variant="default">
            <RefreshCw className="h-4 w-4 mr-2" />
            Erneut versuchen
          </Button>
        )}
        {showSupport && (
          <Button variant="outline" asChild>
            <a href="mailto:support@systemofatown.de">
              <Mail className="h-4 w-4 mr-2" />
              Support kontaktieren
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

// Pre-configured error states
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="Netzwerkfehler"
      description="Die Verbindung zum Server konnte nicht hergestellt werden. Bitte überprüfen Sie Ihre Internetverbindung."
      onRetry={onRetry}
    />
  );
}

export function NotFoundError({ entityName = 'Eintrag' }: { entityName?: string }) {
  return (
    <ErrorState
      title={`${entityName} nicht gefunden`}
      description={`Der angeforderte ${entityName} existiert nicht oder wurde gelöscht.`}
      showSupport={false}
    />
  );
}

export function PermissionError() {
  return (
    <ErrorState
      title="Keine Berechtigung"
      description="Sie haben keine Berechtigung, auf diese Ressource zuzugreifen."
      showSupport={false}
    />
  );
}
