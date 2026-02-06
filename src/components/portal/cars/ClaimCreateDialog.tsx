import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ClaimCreateDialogProps {
  vehicleId: string;
  insuranceId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  damage_date: string;
  damage_type: 'accident' | 'theft' | 'glass' | 'vandalism' | 'storm' | 'animal' | 'fire' | 'other';
  fault_assessment?: 'own_fault' | 'partial_fault' | 'no_fault' | 'unclear';
  location_description?: string;
  description?: string;
  police_reference?: string;
  estimated_cost_cents?: number;
}

const damageTypeLabels: Record<string, string> = {
  accident: 'Unfall',
  theft: 'Diebstahl',
  glass: 'Glasschaden',
  vandalism: 'Vandalismus',
  storm: 'Sturm/Hagel',
  animal: 'Wildunfall',
  fire: 'Brand',
  other: 'Sonstiges',
};

const faultLabels: Record<string, string> = {
  own_fault: 'Eigenverschulden',
  partial_fault: 'Teilschuld',
  no_fault: 'Fremdverschulden',
  unclear: 'Unklar',
};

export function ClaimCreateDialog({ 
  vehicleId,
  insuranceId,
  open, 
  onOpenChange, 
  onSuccess 
}: ClaimCreateDialogProps) {
  const { activeTenantId } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      damage_type: 'accident',
      damage_date: new Date().toISOString().split('T')[0],
    }
  });

  const onSubmit = async (data: FormData) => {
    if (!activeTenantId) {
      toast({ title: 'Fehler', description: 'Kein aktiver Tenant', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('cars_claims').insert({
        tenant_id: activeTenantId,
        vehicle_id: vehicleId,
        insurance_id: insuranceId || null,
        damage_date: data.damage_date,
        damage_type: data.damage_type,
        fault_assessment: data.fault_assessment || null,
        location_description: data.location_description || null,
        description: data.description || null,
        police_reference: data.police_reference || null,
        estimated_cost_cents: data.estimated_cost_cents ? Math.round(data.estimated_cost_cents * 100) : null,
        status: 'draft',
      });

      if (error) throw error;

      toast({ title: 'Schaden erfasst', description: 'Der Schadenfall wurde angelegt.' });
      reset();
      onSuccess();
    } catch (error: any) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Schaden melden</DialogTitle>
          <DialogDescription>
            Erfassen Sie die Schadensdaten. Sie können später Fotos und Dokumente hinzufügen.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="damage_date">Schadendatum *</Label>
              <Input
                id="damage_date"
                type="date"
                {...register('damage_date', { required: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>Schadensart *</Label>
              <Select 
                defaultValue="accident"
                onValueChange={(v) => setValue('damage_type', v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(damageTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Verschulden</Label>
              <Select onValueChange={(v) => setValue('fault_assessment', v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(faultLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimated_cost_cents">Geschätzte Kosten (€)</Label>
              <Input
                id="estimated_cost_cents"
                type="number"
                step="0.01"
                placeholder="z.B. 1500.00"
                {...register('estimated_cost_cents', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location_description">Unfallort</Label>
            <Input
              id="location_description"
              placeholder="z.B. Kreuzung Hauptstraße / Bahnhofstraße, Berlin"
              {...register('location_description')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              placeholder="Was ist passiert?"
              rows={3}
              {...register('description')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="police_reference">Polizei-Aktenzeichen</Label>
            <Input
              id="police_reference"
              placeholder="Falls Polizei aufgenommen hat"
              {...register('police_reference')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Speichern...' : 'Schaden erfassen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
