/**
 * WidgetDeleteOverlay — Hover trash icon + AlertDialog confirmation for widget cards.
 * Place inside any Card with `group` and `relative` classes.
 */
import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
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
import { cn } from '@/lib/utils';

interface WidgetDeleteOverlayProps {
  title: string;
  onConfirmDelete: () => void;
  isDeleting?: boolean;
  disabled?: boolean;
}

export function WidgetDeleteOverlay({
  title,
  onConfirmDelete,
  isDeleting,
  disabled,
}: WidgetDeleteOverlayProps) {
  const [open, setOpen] = useState(false);

  if (disabled) return null;

  return (
    <>
      <button
        type="button"
        className={cn(
          'absolute top-2 right-2 z-10 p-1.5 rounded-lg',
          'bg-destructive/10 text-destructive hover:bg-destructive/20',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          'focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-destructive/50',
        )}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label={`${title} löschen`}
      >
        {isDeleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Widget löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie „{title}" wirklich löschen? Der Vorgang wird archiviert und kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onConfirmDelete();
                setOpen(false);
              }}
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
