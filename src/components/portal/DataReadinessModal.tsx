/**
 * DataReadinessModal — Explains the two prerequisites for entering own data:
 * 1. Disable demo data
 * 2. Accept legal agreements (AGB + Privacy)
 */
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, Database, Scale } from 'lucide-react';

interface DataReadinessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDemoActive: boolean;
  isConsentGiven: boolean;
}

export function DataReadinessModal({
  open,
  onOpenChange,
  isDemoActive,
  isConsentGiven,
}: DataReadinessModalProps) {
  const navigate = useNavigate();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle>Eigene Daten eingeben</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            Bevor du eigene Verträge und Daten anlegen kannst, sind zwei Schritte nötig:
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-2">
          {/* Step 1: Demo Data */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
            {isDemoActive ? (
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            )}
            <div>
              <p className="text-sm font-medium flex items-center gap-2">
                <Database className="h-4 w-4" />
                Demo-Daten deaktivieren
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Unter Stammdaten → Demo-Daten die Musterdaten ausschalten, damit deine eigenen Einträge nicht vermischt werden.
              </p>
            </div>
          </div>

          {/* Step 2: Legal Consent */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
            {isConsentGiven ? (
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            )}
            <div>
              <p className="text-sm font-medium flex items-center gap-2">
                <Scale className="h-4 w-4" />
                Nutzungsvereinbarungen bestätigen
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Unter Stammdaten → Rechtliches die AGB und Datenschutzerklärung akzeptieren.
              </p>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          {isDemoActive && (
            <AlertDialogAction
              className="border border-input bg-background hover:bg-accent hover:text-accent-foreground"
              onClick={() => {
                onOpenChange(false);
                navigate('/portal/stammdaten/demo-daten');
              }}
            >
              Zu Demo-Daten
            </AlertDialogAction>
          )}
          {!isConsentGiven && (
            <AlertDialogAction
              onClick={() => {
                onOpenChange(false);
                navigate('/portal/stammdaten/rechtliches');
              }}
            >
              Zu Rechtliches
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
