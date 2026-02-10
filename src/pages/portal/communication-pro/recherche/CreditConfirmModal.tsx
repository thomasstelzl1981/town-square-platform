/**
 * CreditConfirmModal — Credit confirmation before contact import
 * MOD-14 Communication Pro > Recherche
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
import { Coins } from 'lucide-react';

interface CreditConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  onConfirm: () => void;
}

export function CreditConfirmModal({ open, onOpenChange, count, onConfirm }: CreditConfirmModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Kontakte übernehmen
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Du übernimmst <strong>{count} Kontakt{count !== 1 ? 'e' : ''}</strong> in dein Kontaktbuch.
            </p>
            <p className="text-sm font-medium text-foreground">
              Kosten: {count} Credit{count !== 1 ? 's' : ''}
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {count} Credit{count !== 1 ? 's' : ''} verbrauchen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
