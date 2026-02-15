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
import { Loader2 } from 'lucide-react';

interface VehicleCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  onVehicleCreated?: (vehicleId: string, searchQuery: string) => void;
}

interface FormData {
  license_plate: string;
  hsn: string;
  tsn: string;
  make: string;
  model: string;
  first_registration_date: string;
  holder_name: string;
  current_mileage_km: string;
  hu_valid_until: string;
}

export function VehicleCreateDialog({ open, onOpenChange, onSuccess, onVehicleCreated }: VehicleCreateDialogProps) {
  const { activeTenantId } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      license_plate: '',
      hsn: '',
      tsn: '',
      make: '',
      model: '',
      first_registration_date: '',
      holder_name: '',
      current_mileage_km: '',
      hu_valid_until: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!activeTenantId) {
      toast({ title: 'Fehler', description: 'Kein aktiver Tenant', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: newVehicle, error } = await supabase.from('cars_vehicles').insert({
        tenant_id: activeTenantId,
        license_plate: data.license_plate.toUpperCase().trim(),
        hsn: data.hsn || null,
        tsn: data.tsn || null,
        make: data.make || null,
        model: data.model || null,
        first_registration_date: data.first_registration_date || null,
        holder_name: data.holder_name || null,
        current_mileage_km: data.current_mileage_km ? parseInt(data.current_mileage_km) : null,
        hu_valid_until: data.hu_valid_until || null,
      }).select('id, make, model').single();
      if (error) throw error;

      // Trigger Armstrong dossier auto-research
      if (newVehicle && onVehicleCreated) {
        onVehicleCreated(newVehicle.id, [data.make, data.model].filter(Boolean).join(' ') || data.license_plate);
      }

      toast({ title: 'Erfolg', description: 'Fahrzeug wurde angelegt.' });
      reset();
      setStep(1);
      onSuccess();
    } catch (error: any) {
      if (error.code === '23505') {
        toast({
          title: 'Fehler',
          description: 'Ein Fahrzeug mit diesem Kennzeichen existiert bereits.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Fehler',
          description: error.message || 'Fahrzeug konnte nicht angelegt werden.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setStep(1);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Neues Fahrzeug anlegen</DialogTitle>
          <DialogDescription>
            {step === 1 
              ? 'Geben Sie die Grunddaten des Fahrzeugs ein.' 
              : 'Ergänzen Sie optionale Details.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="license_plate">Kennzeichen *</Label>
                <Input
                  id="license_plate"
                  placeholder="B-XY 1234"
                  {...register('license_plate', { required: 'Kennzeichen ist erforderlich' })}
                  className={errors.license_plate ? 'border-destructive' : ''}
                />
                {errors.license_plate && (
                  <p className="text-sm text-destructive">{errors.license_plate.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hsn">HSN</Label>
                  <Input
                    id="hsn"
                    placeholder="0603"
                    maxLength={4}
                    {...register('hsn')}
                  />
                  <p className="text-xs text-muted-foreground">Herstellerschlüssel (4 Zeichen)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tsn">TSN</Label>
                  <Input
                    id="tsn"
                    placeholder="BNH"
                    maxLength={3}
                    {...register('tsn')}
                  />
                  <p className="text-xs text-muted-foreground">Typschlüssel (3 Zeichen)</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="make">Hersteller</Label>
                  <Input
                    id="make"
                    placeholder="Volkswagen"
                    {...register('make')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Modell</Label>
                  <Input
                    id="model"
                    placeholder="Golf"
                    {...register('model')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="first_registration_date">Erstzulassung</Label>
                <Input
                  id="first_registration_date"
                  type="date"
                  {...register('first_registration_date')}
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="holder_name">Halter Name</Label>
                <Input
                  id="holder_name"
                  placeholder="Max Mustermann"
                  {...register('holder_name')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_mileage_km">Aktueller Kilometerstand</Label>
                <Input
                  id="current_mileage_km"
                  type="number"
                  placeholder="45000"
                  {...register('current_mileage_km')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hu_valid_until">HU gültig bis</Label>
                <Input
                  id="hu_valid_until"
                  type="date"
                  {...register('hu_valid_until')}
                />
              </div>
            </>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {step === 2 && (
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Zurück
              </Button>
            )}
            {step === 1 && (
              <Button type="button" onClick={() => setStep(2)}>
                Weiter
              </Button>
            )}
            {step === 2 && (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Fahrzeug anlegen
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
