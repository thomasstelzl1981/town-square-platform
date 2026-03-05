/**
 * R-5: Fixed save bar + submit confirmation dialog
 */
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Save, Loader2, Check, Send } from 'lucide-react';

interface AnfrageFormFooterProps {
  isDirty: boolean;
  canSubmit: boolean;
  completionScore: number;
  savePending: boolean;
  submitPending: boolean;
  showSubmitDialog: boolean;
  onSave: () => void;
  onSubmitClick: () => void;
  onSubmitConfirm: () => void;
  onSubmitDialogChange: (open: boolean) => void;
}

export function AnfrageFormFooter({
  isDirty, canSubmit, completionScore, savePending, submitPending,
  showSubmitDialog, onSave, onSubmitClick, onSubmitConfirm, onSubmitDialogChange,
}: AnfrageFormFooterProps) {
  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {isDirty ? (
              <span className="flex items-center gap-2 text-destructive">
                <span className="w-2 h-2 rounded-full bg-destructive" />
                Ungespeicherte Änderungen
              </span>
            ) : (
              <span className="flex items-center gap-2 text-primary">
                <Check className="h-4 w-4" />
                Alle Änderungen gespeichert
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onSave} disabled={!isDirty || savePending}>
              {savePending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Speichern
            </Button>
            <Button onClick={onSubmitClick} disabled={!canSubmit || isDirty || submitPending}
              title={!canSubmit ? `Selbstauskunft muss mind. 80% vollständig sein (aktuell: ${completionScore}%)` : ''}>
              {submitPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Zur Prüfung einreichen
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={showSubmitDialog} onOpenChange={onSubmitDialogChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anfrage einreichen?</AlertDialogTitle>
            <AlertDialogDescription>
              Ihre Finanzierungsanfrage wird zur Bearbeitung weitergeleitet. 
              Nach dem Einreichen können Sie die Daten nicht mehr selbst bearbeiten.
              <br /><br />
              <strong>Selbstauskunft:</strong> {completionScore}% vollständig
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={onSubmitConfirm}>Jetzt einreichen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
