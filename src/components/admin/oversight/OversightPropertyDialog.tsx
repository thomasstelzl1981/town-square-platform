/**
 * OversightPropertyDialog — Property detail dialog
 * R-24 sub-component
 */
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface PropertyOverview {
  id: string;
  name: string;
  street: string;
  city: string;
  tenant_name: string;
  unit_count: number;
  created_at: string;
}

interface Props {
  property: PropertyOverview | null;
  onClose: () => void;
}

export function OversightPropertyDialog({ property, onClose }: Props) {
  return (
    <Dialog open={!!property} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Immobilie: {property?.name}</DialogTitle></DialogHeader>
        {property && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm font-medium text-muted-foreground">Adresse</p><p className="mt-1">{property.street || '—'}<br />{property.city || '—'}</p></div>
              <div><p className="text-sm font-medium text-muted-foreground">Eigentümer</p><Badge variant="outline" className="mt-1">{property.tenant_name}</Badge></div>
              <div><p className="text-sm font-medium text-muted-foreground">Einheiten</p><p className="text-2xl font-bold mt-1">{property.unit_count}</p></div>
              <div><p className="text-sm font-medium text-muted-foreground">Erstellt</p><p className="mt-1">{format(new Date(property.created_at), 'dd.MM.yyyy', { locale: de })}</p></div>
            </div>
            <div><p className="text-sm font-medium text-muted-foreground">Property ID</p><p className="mt-1 font-mono text-xs text-muted-foreground">{property.id}</p></div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
