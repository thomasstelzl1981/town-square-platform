/**
 * PropertyDeleteDialog — Delete confirmation for property
 * R-15 sub-component
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLegalConsent } from '@/hooks/useLegalConsent';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
}

export function PropertyDeleteDialog({ open, onOpenChange, propertyId }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const consentGuard = useLegalConsent();

  const handleDelete = async () => {
    if (!consentGuard.requireConsent()) return;
    setIsDeleting(true);
    try {
      const { data: units } = await supabase.from('units').select('id').eq('property_id', propertyId);
      if (units?.length) {
        const unitIds = units.map(u => u.id);
        await supabase.from('leases').delete().in('unit_id', unitIds);
        await supabase.from('units').delete().eq('property_id', propertyId);
      }
      const { error } = await supabase.from('properties').delete().eq('id', propertyId);
      if (error) throw error;
      toast({ title: 'Immobilie gelöscht' });
      queryClient.invalidateQueries({ queryKey: ['portfolio-units-annual'] });
      navigate('/portal/immobilien/portfolio');
    } catch (err: unknown) {
      toast({ title: 'Fehler', description: err instanceof Error ? err.message : String(err), variant: 'destructive' });
    }
    setIsDeleting(false);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Immobilie löschen?</AlertDialogTitle>
          <AlertDialogDescription>
            Alle verknüpften Einheiten, Mietverträge und Dokumente werden ebenfalls entfernt. Dieser Vorgang kann nicht rückgängig gemacht werden.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Löschen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
