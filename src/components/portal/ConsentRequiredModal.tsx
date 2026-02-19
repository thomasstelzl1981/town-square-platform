/**
 * ConsentRequiredModal — Global blocking modal when user tries a write action
 * without having accepted required legal consents (AGB + Privacy).
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
import { Scale } from 'lucide-react';

interface ConsentRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConsentRequiredModal({ open, onOpenChange }: ConsentRequiredModalProps) {
  const navigate = useNavigate();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Scale className="h-5 w-5 text-yellow-600" />
            </div>
            <AlertDialogTitle>Nutzungsvereinbarungen erforderlich</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            Bitte bestätige zuerst unsere Nutzungsbedingungen und Datenschutzerklärung, 
            bevor du Daten speicherst oder Dokumente hochlädst.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onOpenChange(false);
              navigate('/portal/stammdaten/rechtliches');
            }}
          >
            Jetzt bestätigen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
