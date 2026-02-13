/**
 * PropertySelectDialog — Quick property + unit selector for creating a new renovation case
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface PropertySelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (propertyId: string, unitId: string | null) => void;
  isCreating?: boolean;
}

export function PropertySelectDialog({ open, onOpenChange, onSelect, isCreating }: PropertySelectDialogProps) {
  const { activeTenantId } = useAuth();
  const [propertyId, setPropertyId] = useState('');
  const [unitId, setUnitId] = useState('__whole__');

  const { data: properties, isLoading: propertiesLoading } = useQuery({
    queryKey: ['properties_for_sanierung', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('properties')
        .select('id, address, city, code')
        .eq('tenant_id', activeTenantId)
        .eq('status', 'active')
        .order('address');
      if (error) throw error;
      return data as { id: string; address: string; city: string; code: string | null }[];
    },
    enabled: !!activeTenantId && open,
  });

  const { data: units } = useQuery({
    queryKey: ['units_for_sanierung', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];
      const { data, error } = await supabase
        .from('units')
        .select('id, unit_number, code')
        .eq('property_id', propertyId)
        .order('unit_number');
      if (error) throw error;
      return data as { id: string; unit_number: string; code: string | null }[];
    },
    enabled: !!propertyId,
  });

  const handleConfirm = () => {
    if (!propertyId) return;
    onSelect(propertyId, unitId === '__whole__' ? null : unitId || null);
    setPropertyId('');
    setUnitId('__whole__');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Objekt auswählen</DialogTitle>
          <DialogDescription>
            Für welches Objekt soll die Sanierung angelegt werden?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Objekt</Label>
            <Select value={propertyId} onValueChange={(val) => { setPropertyId(val); setUnitId('__whole__'); }}>
              <SelectTrigger>
                <SelectValue placeholder="Objekt auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {propertiesLoading ? (
                  <SelectItem value="_loading" disabled>Laden...</SelectItem>
                ) : properties?.length === 0 ? (
                  <SelectItem value="_empty" disabled>Keine Objekte</SelectItem>
                ) : (
                  properties?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.code ? `${p.code} — ` : ''}{p.address}, {p.city}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {propertyId && (units?.length ?? 0) > 0 && (
            <div className="space-y-1.5">
              <Label>Einheit</Label>
              <Select value={unitId} onValueChange={setUnitId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__whole__">Gesamtes Objekt</SelectItem>
                  {units?.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.code || u.unit_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={handleConfirm} disabled={!propertyId || isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird angelegt...
              </>
            ) : (
              'Akte erstellen'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
